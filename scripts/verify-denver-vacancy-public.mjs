import fs from 'node:fs'

const DATA_PATH = 'data/attom-denver-vacant-lots.json'
const OUT_PATH = 'data/attom-denver-vacant-lots.json'
const SNAPSHOT_PATH = 'exports/denver-land-intel/public-vacancy-verification-snapshot.json'
const SOCRATA = 'https://data.colorado.gov/resource/tsdg-z9uy.json'

function normalizeSched(apn) {
  return String(apn || '').replace(/\D/g, '').replace(/^0+/, '')
}

function chunk(arr, size) {
  const out = []
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size))
  return out
}

function num(v) {
  if (v === undefined || v === null || v === '') return null
  const n = Number(v)
  return Number.isFinite(n) ? n : null
}

function vacancyStatus(row) {
  if (!row) return { status: 'unverified', reasons: ['No Denver public parcel match'] }
  const reasons = []
  const dclass = String(row.d_class_cn || '').toUpperCase()
  const imp = num(row.appraised_imp_value ?? row.assessed_bldg_value_sch)
  const resYear = row.res_orig_year_built || ''
  const comYear = row.com_orig_year_built || ''
  const resArea = num(row.res_above_grade_area)
  const comArea = num(row.com_gross_area)
  const units = num(row.tot_units)

  if (dclass.includes('VACANT')) reasons.push(`Public class: ${row.d_class_cn}`)
  else reasons.push(`Public class is not vacant: ${row.d_class_cn || 'blank'}`)

  if ((imp ?? 0) > 0) reasons.push(`Improvement value present: ${imp}`)
  else reasons.push('No public improvement value')

  if (resYear || comYear) reasons.push(`Year built present: ${resYear || comYear}`)
  if ((resArea ?? 0) > 0) reasons.push(`Residential building area present: ${resArea}`)
  if ((comArea ?? 0) > 0) reasons.push(`Commercial building area present: ${comArea}`)
  if ((units ?? 0) > 0 && !dclass.includes('VACANT')) reasons.push(`Units present: ${units}`)

  const hasBuildingSignal = (imp ?? 0) > 0 || Boolean(resYear || comYear) || (resArea ?? 0) > 0 || (comArea ?? 0) > 0
  const vacantClass = dclass.includes('VACANT') || dclass.includes('OPEN SPACE')

  if (vacantClass && !hasBuildingSignal) return { status: 'verified_vacant_by_public_record', reasons }
  if (vacantClass && hasBuildingSignal) return { status: 'conflicting_public_record', reasons }
  if (!vacantClass && hasBuildingSignal) return { status: 'likely_improved_not_vacant', reasons }
  return { status: 'needs_review', reasons }
}

async function fetchPublicRows(schednums) {
  const fields = [
    'schednum','owner_name','owner_address_line1','owner_city','owner_state','owner_zip',
    'situs_address_line1','situs_city','situs_state','situs_zip','prop_class','d_class_cn','zone_10',
    'appraised_land_value','appraised_imp_value','appraised_total_value','land_area',
    'res_orig_year_built','res_above_grade_area','com_orig_year_built','com_gross_area','tot_units','legal_desc','sale_year','sale_price',
    'assessed_bldg_value_sch','assessed_land_value_sch','assessed_total_value_sch'
  ]
  const map = new Map()
  let completed = 0
  for (const group of chunk(schednums, 80)) {
    const url = new URL(SOCRATA)
    url.searchParams.set('$select', fields.join(','))
    url.searchParams.set('$limit', '50000')
    url.searchParams.set('$where', `schednum in(${group.map(s => `'${s}'`).join(',')})`)
    const res = await fetch(url, { headers: { accept: 'application/json' }, signal: AbortSignal.timeout(30000) })
    if (!res.ok) throw new Error(`Denver public parcels failed ${res.status}: ${await res.text()}`)
    const rows = await res.json()
    for (const row of rows) map.set(String(row.schednum).replace(/^0+/, ''), row)
    completed += group.length
    console.log(`public verification ${completed}/${schednums.length}; matched ${map.size}`)
  }
  return map
}

const data = JSON.parse(fs.readFileSync(DATA_PATH, 'utf8'))
const schednums = [...new Set(data.lots.map(l => normalizeSched(l.apn)).filter(Boolean))]
const publicRows = await fetchPublicRows(schednums)

let verified = 0, conflict = 0, improved = 0, unverified = 0, review = 0
for (const lot of data.lots) {
  const sched = normalizeSched(lot.apn)
  const publicRow = publicRows.get(sched)
  const result = vacancyStatus(publicRow)
  if (result.status === 'verified_vacant_by_public_record') verified++
  else if (result.status === 'conflicting_public_record') conflict++
  else if (result.status === 'likely_improved_not_vacant') improved++
  else if (result.status === 'unverified') unverified++
  else review++

  lot.publicVerification = {
    source: 'Colorado Information Marketplace / Denver Parcels public dataset',
    schednum: sched,
    status: result.status,
    reasons: result.reasons,
    checkedAt: new Date().toISOString(),
  }

  if (publicRow) {
    lot.publicOwnerName = publicRow.owner_name || ''
    lot.publicOwnerMailingAddress = [publicRow.owner_address_line1, publicRow.owner_city, publicRow.owner_state, publicRow.owner_zip].filter(Boolean).join(', ')
    lot.publicPropertyClass = publicRow.d_class_cn || ''
    lot.publicZoning = publicRow.zone_10 || ''
    lot.publicLotSqft = num(publicRow.land_area)
    lot.publicImprovementValue = num(publicRow.appraised_imp_value ?? publicRow.assessed_bldg_value_sch)
    lot.publicLandValue = num(publicRow.appraised_land_value ?? publicRow.assessed_land_value_sch)
    lot.publicTotalValue = num(publicRow.appraised_total_value ?? publicRow.assessed_total_value_sch)
    lot.publicResidentialYearBuilt = publicRow.res_orig_year_built || ''
    lot.publicCommercialYearBuilt = publicRow.com_orig_year_built || ''
    lot.publicResidentialArea = num(publicRow.res_above_grade_area)
    lot.publicCommercialArea = num(publicRow.com_gross_area)
    lot.publicSaleYear = publicRow.sale_year ? num(publicRow.sale_year) : null
    lot.publicSalePrice = publicRow.sale_price ? num(publicRow.sale_price) : null
    if (lot.publicSaleYear && !lot.lastSaleDate) lot.lastSaleDate = String(lot.publicSaleYear)
    if (lot.publicSalePrice !== null && !lot.lastSalePrice) lot.lastSalePrice = lot.publicSalePrice

    // Use public fields to fill blanks, without overwriting existing enriched ATTOM/cache fields.
    lot.ownerName ||= publicRow.owner_name || ''
    lot.ownerMailingAddress ||= lot.publicOwnerMailingAddress
    lot.zoning ||= publicRow.zone_10 || ''
    lot.lotSqft ||= num(publicRow.land_area)
    if (lot.lotSqft && !lot.lotAcres) lot.lotAcres = Math.round((Number(lot.lotSqft) / 43560) * 10000) / 10000
    lot.assessedTotal ||= lot.publicTotalValue
    lot.assessedLand ||= lot.publicLandValue
    lot.landUse ||= publicRow.d_class_cn || ''
  }
}

data.publicVacancyVerification = {
  source: 'Colorado Information Marketplace / Denver Parcels public dataset',
  checkedAt: new Date().toISOString(),
  total: data.lots.length,
  matchedPublicParcels: publicRows.size,
  verifiedVacant: verified,
  conflictingPublicRecord: conflict,
  likelyImprovedNotVacant: improved,
  needsReview: review,
  unverified,
}
data.enrichedCount = data.lots.filter(l => Boolean(l.ownerName || l.lotSqft || l.lotAcres || l.zoning || l.assessedTotal || l.lastSaleDate)).length

data.source = `${data.source || 'ATTOM'} + Denver public parcel vacancy verification`
fs.mkdirSync('exports/denver-land-intel', { recursive: true })
fs.writeFileSync(OUT_PATH, JSON.stringify(data, null, 2))
fs.writeFileSync(SNAPSHOT_PATH, JSON.stringify(data.publicVacancyVerification, null, 2))
console.log(JSON.stringify(data.publicVacancyVerification, null, 2))
