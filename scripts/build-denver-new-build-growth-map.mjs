import fs from 'node:fs'

const PERMITS_PATH = '../lennar-intel/data/colorado_denver_new_building_permits.csv'
const OUT_PATH = 'data/attom-denver-vacant-lots.json'
const EXPORT_CSV = 'exports/denver-land-intel/denver-2024-2026-new-build-growth-map.csv'

function csvParse(text) {
  const rows = []
  let row = [], cell = '', q = false
  for (let i = 0; i < text.length; i++) {
    const ch = text[i], next = text[i + 1]
    if (q && ch === '"' && next === '"') { cell += '"'; i++; continue }
    if (ch === '"') { q = !q; continue }
    if (!q && ch === ',') { row.push(cell); cell = ''; continue }
    if (!q && (ch === '\n' || ch === '\r')) {
      if (ch === '\r' && next === '\n') i++
      row.push(cell); cell = ''
      if (row.some(v => v !== '')) rows.push(row)
      row = []
      continue
    }
    cell += ch
  }
  if (cell || row.length) { row.push(cell); rows.push(row) }
  const [head, ...body] = rows
  return body.map(r => Object.fromEntries(head.map((h, i) => [h, r[i] ?? ''])))
}
function num(v) { const n = Number(String(v ?? '').replace(/[$,]/g, '')); return Number.isFinite(n) ? n : null }
function clean(s) { return String(s || '').replace(/\s+/g, ' ').trim() }
function normAddress(s) { return clean(s).toUpperCase().replace(/\b(EXCAVATION|FOUNDATION|BLDG|BUILDING|UNIT)\b/g, '').replace(/\s+/g, ' ').trim() }
function inferBuildType(r) {
  const addr = clean(r.address)
  const units = num(r.units) || 0
  if (/\bUNIT\b|\bBLDG\b|\b#|\b\d+[A-Z]?\s+UNIT\b/i.test(addr)) return 'townhome_or_attached'
  if (units > 1) return 'townhome_or_attached'
  return 'single_family_or_duplex'
}
function includePermit(r) {
  const issued = clean(r.issued_date)
  if (issued < '2024-01-01' || issued > '2026-12-31') return false
  const cls = clean(r.permit_class).toUpperCase()
  if (!cls.includes('NEW BUILDING') && !cls.includes('PHASED CONSTRUCTION')) return false
  const lat = num(r.latitude), lng = num(r.longitude)
  if (!lat || !lng) return false
  const valuation = num(r.valuation) || 0
  const hay = `${r.address} ${r.contractor} ${r.permit_number}`.toUpperCase()
  if (/GARAGE|CARPORT|SHED|ACCESSORY|ADU|DETACHED STRUCTURE/.test(hay)) return false
  if (/EXCAVATION|FOUNDATION/.test(hay) && valuation < 200000) return false
  // Practical filter: keep substantive residential new builds. This removes most garage/low-value misc permits.
  if (valuation < 200000) return false
  return true
}

const rows = csvParse(fs.readFileSync(PERMITS_PATH, 'utf8'))
const filtered = rows.filter(includePermit)

// De-dupe obvious repeated phase/unit rows by permit number first, but keep distinct unit addresses.
const seen = new Set()
const lots = []
for (const r of filtered) {
  const key = `${r.permit_number}|${normAddress(r.address)}|${r.schedule_number}`
  if (seen.has(key)) continue
  seen.add(key)
  const valuation = num(r.valuation)
  const issuedYear = clean(r.issued_date).slice(0, 4)
  const buildType = inferBuildType(r)
  lots.push({
    attomId: `denver-new-build-${clean(r.permit_number)}`,
    apn: clean(r.schedule_number),
    address: `${clean(r.address)}, DENVER, CO`,
    city: 'DENVER',
    state: 'CO',
    zip: '',
    lat: num(r.latitude),
    lng: num(r.longitude),
    opportunityType: 'new_build_growth_signal',
    propertyType: buildType === 'townhome_or_attached' ? 'New townhome/attached build' : 'New single-family/duplex build',
    landUse: 'New residential build permit',
    permitNumber: clean(r.permit_number),
    issuedDate: clean(r.issued_date),
    issuedYear,
    permitClass: clean(r.permit_class),
    units: num(r.units),
    valuation,
    contractor: clean(r.contractor),
    neighborhood: clean(r.neighborhood),
    growthNeighborhood: clean(r.neighborhood),
    buildType,
    growthScore: Math.round((valuation || 0) / 100000) + (buildType === 'townhome_or_attached' ? 4 : 2),
    publicVerification: {
      status: 'new_build_growth_signal',
      source: 'Denver new-building permit export / local Lennar Intel data',
      reasons: [`Issued ${clean(r.issued_date)}`, clean(r.permit_class), valuation ? `Valuation $${valuation.toLocaleString()}` : 'Valuation unavailable'].filter(Boolean),
      checkedAt: new Date().toISOString(),
    },
    flags: ['new_build', issuedYear, buildType],
  })
}

const byNeighborhood = new Map()
for (const l of lots) {
  const n = l.neighborhood || 'Unknown'
  const stat = byNeighborhood.get(n) || { neighborhood: n, count: 0, totalValuation: 0, townhomeOrAttached: 0, singleFamilyOrDuplex: 0, byYear: {} }
  stat.count++
  stat.totalValuation += l.valuation || 0
  if (l.buildType === 'townhome_or_attached') stat.townhomeOrAttached++
  else stat.singleFamilyOrDuplex++
  stat.byYear[l.issuedYear] = (stat.byYear[l.issuedYear] || 0) + 1
  byNeighborhood.set(n, stat)
}
const neighborhoodStats = [...byNeighborhood.values()].sort((a,b) => b.count - a.count).map(s => ({
  ...s,
  avgValuation: s.count ? Math.round(s.totalValuation / s.count) : 0,
}))

lots.sort((a,b) => {
  const na = neighborhoodStats.findIndex(n => n.neighborhood === a.neighborhood)
  const nb = neighborhoodStats.findIndex(n => n.neighborhood === b.neighborhood)
  return na - nb || String(b.issuedDate).localeCompare(String(a.issuedDate))
})

const output = {
  generatedAt: new Date().toISOString(),
  source: 'Denver new-building permit export / local Lennar Intel data; filtered to substantive 2024-2026 residential new builds',
  count: lots.length,
  lots,
  newBuildGrowthLayer: {
    rule: 'Denver residential new-building/phased-construction permits issued 2024-2026, valuation >= $200k, excluding obvious garage/accessory/low-value excavation permits. Used as proof-of-growth layer before searching nearby vacant parcels/old houses.',
    sourceFile: PERMITS_PATH,
    totalPermitsInSource: rows.length,
    includedNewBuildSignals: lots.length,
    neighborhoods: neighborhoodStats,
    topNeighborhoods: neighborhoodStats.slice(0, 25),
  },
}
fs.writeFileSync(OUT_PATH, JSON.stringify(output, null, 2))
fs.mkdirSync('exports/denver-land-intel', { recursive: true })
const headers = ['neighborhood','address','issuedDate','issuedYear','buildType','permitClass','units','valuation','contractor','permitNumber','apn','lat','lng']
const esc = v => `"${String(v ?? '').replaceAll('"','""')}"`
fs.writeFileSync(EXPORT_CSV, [headers.join(','), ...lots.map(l => headers.map(h => esc(l[h])).join(','))].join('\n'))
console.log(JSON.stringify({ count: lots.length, topNeighborhoods: neighborhoodStats.slice(0, 15) }, null, 2))
console.log(`Wrote ${OUT_PATH}`)
console.log(`Wrote ${EXPORT_CSV}`)
