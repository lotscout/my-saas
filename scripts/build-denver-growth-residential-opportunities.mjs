import fs from 'node:fs'

const VACANT_PATH = 'data/attom-denver-vacant-lots.json'
const OUT_PATH = 'data/attom-denver-vacant-lots.json'
const EXPORT_CSV = 'exports/denver-land-intel/denver-growth-residential-opportunities.csv'
const PERMITS_PATH = '../lennar-intel/data/colorado_denver_new_building_permits.csv'
const SOCRATA = 'https://data.colorado.gov/resource/tsdg-z9uy.json'
const MAX_OLD_HOME_ROWS = 2500

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

function num(v) { const n = Number(v); return Number.isFinite(n) ? n : null }
function clean(s) { return String(s || '').replace(/\s+/g, ' ').trim() }
function ownerClean(s) { return clean(s).toUpperCase() }
function normSched(v) { return String(v || '').replace(/\D/g, '').replace(/^0+/, '') }
function sqMilesDistance(lat1, lon1, lat2, lon2) {
  const R = 3958.8
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLon = (lon2 - lon1) * Math.PI / 180
  const a = Math.sin(dLat/2)**2 + Math.cos(lat1*Math.PI/180)*Math.cos(lat2*Math.PI/180)*Math.sin(dLon/2)**2
  return 2 * R * Math.asin(Math.sqrt(a))
}
function centroid(geom) {
  const pts = []
  function walk(x) {
    if (!Array.isArray(x)) return
    if (typeof x[0] === 'number' && typeof x[1] === 'number') pts.push([x[1], x[0]])
    else x.forEach(walk)
  }
  walk(geom?.coordinates)
  if (!pts.length) return [null, null]
  const lat = pts.reduce((s,p)=>s+p[0],0)/pts.length
  const lng = pts.reduce((s,p)=>s+p[1],0)/pts.length
  return [lat,lng]
}

const entityTerms = ['LLC','INC','CORP','CORPORATION','COMPANY','LTD',' LP','LLP','HOLDING','HOLDINGS','INVEST','PROPERTIES','PROPERTY','DEVELOPMENT','HOMES','BUILDERS','CONSTRUCTION','REALTY','GROUP','VENTURES','CAPITAL','BANK','AUTHORITY','DISTRICT','DEPARTMENT','STATE OF','COUNTY','CITY','TOWN','SCHOOL','CHURCH','FOUNDATION','ASSOCIATION','HOMEOWNERS','CONDOMINIUM','TOWNHOMES','TRUST','TRUSTEE','UNKNOWN','ENTERPRISE','CONNECTIONS','SERVICES','CENTER','STADIUM']
function likelyIndividual(owner) {
  const o = ownerClean(owner)
  if (!o || o === 'UNKNOWN' || o === 'UNKNOWN OWNER') return false
  for (const t of entityTerms) if (new RegExp(`(^|\\s)${t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(\\s|$)`).test(o)) return false
  const toks = o.replace(/[^A-Z, ]/g, ' ').replace(',', ' ').split(/\s+/).filter(Boolean)
  if (o.includes(',')) return toks.length >= 2
  return toks.length >= 2 && toks.length <= 4
}
function residentialZoning(z) {
  const u = ownerClean(z)
  if (!u) return true
  if (u.startsWith('I-') || u.startsWith('C-') || u.startsWith('OS-') || u.startsWith('D-') || u.startsWith('CPV') || u.startsWith('CMP') || u.startsWith('B-') || u.startsWith('O-')) return false
  if (/^[ESUG]-MX/.test(u) || /^[ESUG]-MU/.test(u) || /^[ESUG]-MS/.test(u) || /^[ESUG]-CC/.test(u)) return false
  return true
}
function opportunityType(row) {
  const cls = ownerClean(row.d_class_cn)
  const yr = num(row.res_orig_year_built)
  const imp = num(row.appraised_imp_value ?? row.assessed_bldg_value_sch) ?? 0
  if (cls.includes('VACANT') && imp <= 0) return 'vacant_lot'
  if (yr && yr <= 1955) return 'old_house_teardown_candidate'
  return 'other'
}
function scoreGrowth(lat, lng, permits) {
  let near05 = 0, near1 = 0, weight = 0
  const neighborhoods = new Map()
  for (const p of permits) {
    const d = sqMilesDistance(lat,lng,p.lat,p.lng)
    if (d <= 1) {
      near1++
      weight += p.weight * (d <= 0.5 ? 1.5 : 1)
      neighborhoods.set(p.neighborhood, (neighborhoods.get(p.neighborhood) || 0) + 1)
      if (d <= 0.5) near05++
    }
  }
  const topNeighborhood = [...neighborhoods.entries()].sort((a,b)=>b[1]-a[1])[0]?.[0] || ''
  return { near05, near1, score: Math.round(weight), topNeighborhood }
}

const permits = csvParse(fs.readFileSync(PERMITS_PATH, 'utf8'))
  .map(r => ({ lat: num(r.latitude), lng: num(r.longitude), neighborhood: r.neighborhood || '', weight: num(r.heat_weight) || 1, date: r.issued_date || '' }))
  .filter(p => p.lat && p.lng && p.date >= '2022-01-01')

const fields = [
  'the_geom','schednum','owner_name','owner_address_line1','owner_city','owner_state','owner_zip',
  'situs_address_line1','situs_city','situs_state','situs_zip','d_class_cn','zone_10','land_area',
  'appraised_land_value','appraised_imp_value','appraised_total_value','res_orig_year_built','res_above_grade_area',
  'tot_units','sale_year','sale_price'
]
const where = [
  "situs_city='DENVER'",
  "res_orig_year_built <= '1955'",
  "res_orig_year_built IS NOT NULL",
  "land_area >= 6000",
  "(sale_year IS NULL OR sale_year <= '2022')"
].join(' AND ')
const url = new URL(SOCRATA)
url.searchParams.set('$select', fields.join(','))
url.searchParams.set('$where', where)
url.searchParams.set('$limit', String(MAX_OLD_HOME_ROWS))
url.searchParams.set('$order', 'res_orig_year_built ASC')
console.log(`Fetching Denver old-house candidates from public parcels...`)
const res = await fetch(url, { headers: { accept: 'application/json' }, signal: AbortSignal.timeout(60000) })
if (!res.ok) throw new Error(`Public parcel fetch failed ${res.status}: ${await res.text()}`)
const rows = await res.json()

const existing = JSON.parse(fs.readFileSync(VACANT_PATH, 'utf8'))
const existingSched = new Set(existing.lots.map(l => normSched(l.apn)).filter(Boolean))
const oldHomes = []
for (const row of rows) {
  const apn = normSched(row.schednum)
  if (!apn || existingSched.has(apn)) continue
  if (!likelyIndividual(row.owner_name)) continue
  if (!residentialZoning(row.zone_10)) continue
  const [lat,lng] = centroid(row.the_geom)
  if (!lat || !lng) continue
  const g = scoreGrowth(lat,lng,permits)
  if (g.near1 < 3 && g.score < 18) continue
  const lotSqft = num(row.land_area)
  const yearBuilt = String(row.res_orig_year_built || '')
  oldHomes.push({
    attomId: `denver-public-${apn}`,
    apn,
    address: `${clean(row.situs_address_line1)}, DENVER, CO ${clean(row.situs_zip)}`,
    city: 'DENVER',
    state: 'CO',
    zip: clean(row.situs_zip),
    lat, lng,
    propertyType: 'Old house / teardown candidate',
    opportunityType: 'old_house_teardown_candidate',
    landUse: row.d_class_cn || 'Residential',
    zoning: row.zone_10 || '',
    lotSqft,
    lotAcres: lotSqft ? Math.round(lotSqft / 43560 * 10000) / 10000 : null,
    ownerName: clean(row.owner_name),
    ownerMailingAddress: [row.owner_address_line1,row.owner_city,row.owner_state,row.owner_zip].filter(Boolean).join(', '),
    ownerType: 'Individual',
    publicPropertyClass: row.d_class_cn || '',
    publicImprovementValue: num(row.appraised_imp_value),
    publicResidentialYearBuilt: yearBuilt,
    publicResidentialArea: num(row.res_above_grade_area),
    assessedTotal: num(row.appraised_total_value),
    assessedLand: num(row.appraised_land_value),
    lastSaleDate: row.sale_year || '',
    lastSalePrice: num(row.sale_price),
    growthScore: g.score,
    nearbyPermitsHalfMile: g.near05,
    nearbyPermitsOneMile: g.near1,
    growthNeighborhood: g.topNeighborhood,
    publicVerification: {
      status: 'old_house_growth_candidate',
      source: 'Colorado Information Marketplace / Denver Parcels + local Denver new-building permits',
      reasons: [`Residential year built: ${yearBuilt}`, `${g.near1} recent new-building permits within 1 mile`, `${g.near05} within 0.5 mile`],
      checkedAt: new Date().toISOString(),
    },
    flags: ['old_house', 'growth_area', yearBuilt ? `built_${yearBuilt}` : 'built_unknown'],
  })
}
oldHomes.sort((a,b) => (b.growthScore - a.growthScore) || ((a.publicResidentialYearBuilt||'9999').localeCompare(b.publicResidentialYearBuilt||'9999')))
const selectedOldHomes = oldHomes.slice(0, 250)

for (const lot of existing.lots) {
  lot.opportunityType ||= 'vacant_lot'
  lot.growthScore ||= scoreGrowth(lot.lat, lot.lng, permits).score
  const g = scoreGrowth(lot.lat, lot.lng, permits)
  lot.nearbyPermitsHalfMile ??= g.near05
  lot.nearbyPermitsOneMile ??= g.near1
  lot.growthNeighborhood ||= g.topNeighborhood
}

const lots = [...existing.lots, ...selectedOldHomes]
const output = {
  ...existing,
  generatedAt: new Date().toISOString(),
  source: `${existing.source || 'ATTOM/public'} + Denver public old-house teardown candidates + recent permit growth scoring`,
  count: lots.length,
  lots,
  growthResidentialLayer: {
    vacantLots: existing.lots.length,
    oldHouseCandidates: selectedOldHomes.length,
    oldHouseCandidatePool: oldHomes.length,
    oldHouseRule: 'Denver public residential parcels: individual owner, built <= 1955, lot >= 6,000 sqft, sale_year missing or <= 2022, residential zoning, and near recent new-building permit activity.',
    permitSource: PERMITS_PATH,
    permitCountSince2022: permits.length,
  },
}
output.publicVacancyVerification = { ...(output.publicVacancyVerification || {}), total: lots.length }
output.enrichedCount = lots.filter(l => Boolean(l.ownerName || l.lotSqft || l.lotAcres || l.zoning || l.assessedTotal || l.lastSaleDate)).length
fs.writeFileSync(OUT_PATH, JSON.stringify(output, null, 2))
fs.mkdirSync('exports/denver-land-intel', { recursive: true })
const headers = ['opportunityType','address','zip','ownerName','zoning','lotSqft','publicResidentialYearBuilt','publicResidentialArea','publicImprovementValue','assessedTotal','lastSaleDate','lastSalePrice','growthScore','nearbyPermitsHalfMile','nearbyPermitsOneMile','growthNeighborhood','apn','lat','lng']
const esc = v => `"${String(v ?? '').replaceAll('"','""')}"`
fs.writeFileSync(EXPORT_CSV, [headers.join(','), ...lots.sort((a,b)=>(b.growthScore||0)-(a.growthScore||0)).map(l => headers.map(h => esc(l[h])).join(','))].join('\n'))
console.log(JSON.stringify(output.growthResidentialLayer, null, 2))
console.log(`Wrote ${OUT_PATH} and ${EXPORT_CSV}`)
