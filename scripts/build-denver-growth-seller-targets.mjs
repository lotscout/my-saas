import fs from 'node:fs'

const NEW_BUILD_CSV = 'exports/denver-land-intel/denver-2024-2026-new-build-growth-map.csv'
const OUT_PATH = 'data/attom-denver-vacant-lots.json'
const EXPORT_CSV = 'exports/denver-land-intel/denver-growth-seller-targets.csv'
const SOCRATA = 'https://data.colorado.gov/resource/tsdg-z9uy.json'

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
function upper(s) { return clean(s).toUpperCase() }
function normSched(v) { return String(v || '').replace(/\D/g, '').replace(/^0+/, '') }
function normAddr(s) {
  return upper(s).split(',')[0]
    .replace(/[^A-Z0-9 ]/g, ' ')
    .replace(/\bNORTH\b/g, 'N').replace(/\bSOUTH\b/g, 'S').replace(/\bEAST\b/g, 'E').replace(/\bWEST\b/g, 'W')
    .replace(/\bSTREET\b/g, 'ST').replace(/\bAVENUE\b/g, 'AVE').replace(/\bBOULEVARD\b/g, 'BLVD').replace(/\bROAD\b/g, 'RD')
    .replace(/\bDRIVE\b/g, 'DR').replace(/\bCOURT\b/g, 'CT').replace(/\bPLACE\b/g, 'PL').replace(/\s+/g, ' ').trim()
}
function miles(lat1, lon1, lat2, lon2) {
  const R = 3958.8
  const dLat = (lat2-lat1)*Math.PI/180, dLon = (lon2-lon1)*Math.PI/180
  const a = Math.sin(dLat/2)**2 + Math.cos(lat1*Math.PI/180)*Math.cos(lat2*Math.PI/180)*Math.sin(dLon/2)**2
  return 2*R*Math.asin(Math.sqrt(a))
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
  return [pts.reduce((s,p)=>s+p[0],0)/pts.length, pts.reduce((s,p)=>s+p[1],0)/pts.length]
}

const disqualifiedOwnerTerms = [
  'CITY', 'CITY OF', 'CITY & COUNTY', 'CITY AND COUNTY', 'COUNTY', 'STATE OF', 'DEPARTMENT', 'GOVERNMENT',
  'AUTHORITY', 'DISTRICT', 'METROPOLITAN DISTRICT', 'METRO DISTRICT', 'SCHOOL', 'UNIVERSITY', 'COLLEGE',
  'RAILROAD', 'RAILWAY', 'RR', 'UNION PACIFIC', 'BURLINGTON NORTHERN', 'BNSF',
  'PUBLIC SERVICE', 'XCEL', 'WATER', 'SANITATION', 'DITCH',
  'HOMEOWNERS', 'HOMEOWNER', 'HOA', 'ASSOCIATION', 'ASSN', 'CONDOMINIUM',
  'CHURCH', 'MINISTRIES', 'MINISTRY', 'DIOCESE', 'PARISH', 'FOUNDATION',
  'DENVER URBAN GARDENS', 'PARKS AND RECREATION', 'REGIONAL TRANSPORTATION DISTRICT'
]
function allowedOwner(owner) {
  const o = upper(owner)
  // Bobby okayed LLCs and missing owner data. Keep unknowns as enrichment targets.
  if (!o || o === 'UNKNOWN' || o === 'UNKNOWN OWNER') return true
  for (const t of disqualifiedOwnerTerms) {
    if (new RegExp(`(^|\\s)${t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(\\s|$)`).test(o)) return false
  }
  return true
}
function residentialZoning(z) {
  const u = upper(z)
  if (!u) return true
  if (u.startsWith('I-') || u.startsWith('C-') || u.startsWith('OS-') || u.startsWith('D-') || u.startsWith('CPV') || u.startsWith('CMP') || u.startsWith('B-') || u.startsWith('O-')) return false
  if (/^[ESUG]-MX/.test(u) || /^[ESUG]-MU/.test(u) || /^[ESUG]-MS/.test(u) || /^[ESUG]-CC/.test(u)) return false
  if (u.includes('INDUSTRIAL') || u.includes('COMMERCIAL') || u.includes('OPEN SPACE')) return false
  return true
}
function loadLocalActiveKeys() {
  const files = ['../../all_active_listings.csv', '../../denver_scraped_listings.csv']
  const keys = new Set()
  for (const f of files) {
    try {
      const rows = csvParse(fs.readFileSync(f, 'utf8'))
      for (const r of rows) {
        const status = upper(r.status || r.Status || '')
        if (status && !status.includes('ACTIVE')) continue
        const addr = r.street_address || r.Address || r.address || ''
        const zip = String(r.zip_code || r.Zip || r.zip || '').slice(0,5)
        if (addr) keys.add(`${normAddr(addr)}|${zip}`)
      }
    } catch {}
  }
  return keys
}

const permits = csvParse(fs.readFileSync(NEW_BUILD_CSV, 'utf8')).map(r => ({
  lat: num(r.lat), lng: num(r.lng), neighborhood: clean(r.neighborhood), buildType: clean(r.buildType), valuation: num(r.valuation), issuedDate: clean(r.issuedDate),
})).filter(p => p.lat && p.lng)

const neighborhoodCounts = new Map()
for (const p of permits) neighborhoodCounts.set(p.neighborhood || 'Unknown', (neighborhoodCounts.get(p.neighborhood || 'Unknown') || 0) + 1)
const topNeighborhoods = [...neighborhoodCounts.entries()].sort((a,b)=>b[1]-a[1]).slice(0, 25).map(([name, count]) => ({ name, count }))
const activeKeys = loadLocalActiveKeys()

const fields = [
  'the_geom','schednum','owner_name','owner_address_line1','owner_city','owner_state','owner_zip',
  'situs_address_line1','situs_city','situs_state','situs_zip','d_class_cn','zone_10','land_area',
  'appraised_land_value','appraised_imp_value','appraised_total_value','res_orig_year_built','res_above_grade_area',
  'tot_units','sale_year','sale_price'
]
const where = [
  "situs_city='DENVER'",
  "land_area >= 7000",
  "(sale_year IS NULL OR sale_year <= '2021')",
  "((upper(d_class_cn) like '%VACANT%' AND (appraised_imp_value IS NULL OR appraised_imp_value <= 0)) OR (res_orig_year_built IS NOT NULL AND res_orig_year_built <= '1949'))"
].join(' AND ')
const url = new URL(SOCRATA)
url.searchParams.set('$select', fields.join(','))
url.searchParams.set('$where', where)
url.searchParams.set('$limit', '50000')
url.searchParams.set('$order', 'sale_year ASC')
console.log('Fetching public Denver parcels for growth seller targets...')
const res = await fetch(url, { headers: { accept: 'application/json' }, signal: AbortSignal.timeout(90000) })
if (!res.ok) throw new Error(`Public parcel fetch failed ${res.status}: ${await res.text()}`)
const rows = await res.json()

const candidates = []
for (const row of rows) {
  const owner = clean(row.owner_name)
  if (!allowedOwner(owner)) continue
  if (!residentialZoning(row.zone_10)) continue
  const zip = clean(row.situs_zip).slice(0,5)
  const addressLine = clean(row.situs_address_line1)
  if (activeKeys.has(`${normAddr(addressLine)}|${zip}`)) continue
  const [lat, lng] = centroid(row.the_geom)
  if (!lat || !lng) continue
  let near05 = 0, near1 = 0, near2 = 0, weight = 0
  const nearNeighborhoods = new Map()
  for (const p of permits) {
    const d = miles(lat,lng,p.lat,p.lng)
    if (d <= 2) {
      near2++
      const dWeight = d <= 0.5 ? 3 : d <= 1 ? 2 : 1
      weight += dWeight + ((p.valuation || 0) / 500000)
      nearNeighborhoods.set(p.neighborhood || 'Unknown', (nearNeighborhoods.get(p.neighborhood || 'Unknown') || 0) + 1)
      if (d <= 0.5) near05++
      if (d <= 1) near1++
    }
  }
  if (near1 < 5 && near2 < 15) continue
  const cls = upper(row.d_class_cn)
  const imp = num(row.appraised_imp_value) || 0
  const yearBuilt = num(row.res_orig_year_built)
  const opportunityType = cls.includes('VACANT') && imp <= 0 ? 'priority_vacant_lot' : 'secondary_old_house'
  if (opportunityType === 'secondary_old_house' && (!yearBuilt || yearBuilt >= 1950)) continue
  const growthNeighborhood = [...nearNeighborhoods.entries()].sort((a,b)=>b[1]-a[1])[0]?.[0] || ''
  const saleYear = num(row.sale_year)
  const lotSqft = num(row.land_area)
  const priorityScore = (opportunityType === 'priority_vacant_lot' ? 10000 : 0) + Math.round(weight) + (near1 * 4) + Math.min(50, Math.floor((lotSqft || 0) / 1000)) + (saleYear ? Math.min(40, 2026 - saleYear) : 0)
  candidates.push({
    attomId: `denver-target-${normSched(row.schednum)}`,
    apn: normSched(row.schednum),
    address: `${addressLine}, DENVER, CO ${zip}`,
    city: 'DENVER', state: 'CO', zip,
    lat, lng,
    opportunityType,
    propertyType: opportunityType === 'priority_vacant_lot' ? 'Priority vacant lot' : 'Secondary old-house target',
    landUse: row.d_class_cn || '',
    zoning: row.zone_10 || '',
    lotSqft,
    lotAcres: lotSqft ? Math.round(lotSqft / 43560 * 10000) / 10000 : null,
    ownerName: owner,
    ownerMailingAddress: [row.owner_address_line1,row.owner_city,row.owner_state,row.owner_zip].filter(Boolean).join(', '),
    ownerType: owner ? (upper(owner).includes('LLC') ? 'LLC' : 'Allowed owner') : 'Unknown / needs enrichment',
    publicPropertyClass: row.d_class_cn || '',
    publicImprovementValue: imp,
    publicResidentialYearBuilt: yearBuilt ? String(yearBuilt) : '',
    publicResidentialArea: num(row.res_above_grade_area),
    assessedTotal: num(row.appraised_total_value),
    assessedLand: num(row.appraised_land_value),
    lastSaleDate: String(row.sale_year || ''),
    lastSalePrice: num(row.sale_price),
    yearsOwned: saleYear ? 2026 - saleYear : null,
    growthScore: Math.round(weight),
    priorityScore,
    nearbyPermitsHalfMile: near05,
    nearbyPermitsOneMile: near1,
    nearbyPermitsTwoMiles: near2,
    growthNeighborhood,
    offMarketStatus: 'No exact match in local active-listing exports; public-record/off-market best effort',
    publicVerification: {
      status: opportunityType,
      source: 'Colorado Information Marketplace / Denver Parcels + 2024-2026 Denver new-build permit growth layer',
      reasons: [
        opportunityType === 'priority_vacant_lot' ? 'Vacant class with no improvement value' : `House built ${yearBuilt}`,
        `${lotSqft?.toLocaleString?.() || lotSqft} sqft lot`,
        row.sale_year ? `Sale year ${row.sale_year} / ${saleYear ? 2026 - saleYear : '?'} years owned` : 'Sale year unknown — needs enrichment',
        `${near1} new-build signals within 1 mile; ${near2} within 2 miles`,
      ],
      checkedAt: new Date().toISOString(),
    },
    flags: [opportunityType === 'priority_vacant_lot' ? 'priority_vacant_lot' : 'secondary_old_house', owner ? 'owner_available' : 'owner_missing_needs_enrichment', upper(owner).includes('LLC') ? 'llc_owner' : 'owner_allowed', 'off_market_best_effort', '7000_plus_sqft', saleYear ? 'owned_5_plus_years' : 'sale_year_unknown_needs_enrichment'],
  })
}

candidates.sort((a,b) => (b.priorityScore - a.priorityScore) || (a.opportunityType.localeCompare(b.opportunityType)))
const output = {
  generatedAt: new Date().toISOString(),
  source: 'Denver public parcels + 2024-2026 new-build growth neighborhoods; individual-owned off-market seller targets',
  count: candidates.length,
  lots: candidates,
  growthSellerTargetLayer: {
    rule: 'Priority vacant lots, secondary pre-1950 houses; LLCs and missing-owner records allowed; excludes obvious public/utility/rail/HOA/institutional owners; Denver; lot >= 7,000 sqft; sale_year <= 2021 or unknown; residential/non-commercial zoning; no exact local active-listing match; near 2024-2026 new-build activity.',
    priorityVacantLots: candidates.filter(c => c.opportunityType === 'priority_vacant_lot').length,
    secondaryOldHouses: candidates.filter(c => c.opportunityType === 'secondary_old_house').length,
    publicRowsFetched: rows.length,
    activeListingExactMatchesExcluded: 'Applied using local active-listing CSV address+ZIP keys where available.',
    topGrowthNeighborhoods: topNeighborhoods,
  },
}
fs.writeFileSync(OUT_PATH, JSON.stringify(output, null, 2))
fs.mkdirSync('exports/denver-land-intel', { recursive: true })
const headers = ['opportunityType','priorityScore','growthNeighborhood','address','zip','ownerName','ownerMailingAddress','zoning','landUse','lotSqft','lotAcres','publicResidentialYearBuilt','publicResidentialArea','publicImprovementValue','assessedTotal','lastSaleDate','lastSalePrice','yearsOwned','growthScore','nearbyPermitsHalfMile','nearbyPermitsOneMile','nearbyPermitsTwoMiles','offMarketStatus','apn','lat','lng']
const esc = v => `"${String(v ?? '').replaceAll('"','""')}"`
fs.writeFileSync(EXPORT_CSV, [headers.join(','), ...candidates.map(l => headers.map(h => esc(l[h])).join(','))].join('\n'))
console.log(JSON.stringify(output.growthSellerTargetLayer, null, 2))
console.log(`Wrote ${OUT_PATH}`)
console.log(`Wrote ${EXPORT_CSV}`)
