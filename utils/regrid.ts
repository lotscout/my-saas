/**
 * Regrid Parcel API v2 client
 *
 * Rate limits (free/starter tier):
 *   - Varies by plan — check https://app.regrid.com/plans
 *   - Free tier typically 1,000–5,000 parcel lookups/month
 *   - Respect 429 responses and retry with backoff
 *
 * Docs: https://support.regrid.com/api/section/parcel-api
 *
 * Auth note: Regrid v2 accepts the token as a `token=` query parameter
 * (preferred per docs) OR as `Authorization: Bearer <token>` header.
 * We use the query param approach to match all documented examples.
 */

const REGRID_BASE = 'https://app.regrid.com/api/v2'

function getToken(): string {
  const token = process.env.REGRID_API_KEY
  if (!token) throw new Error('REGRID_API_KEY is not set in environment variables')
  return token
}

// ── Typed parcel shape ────────────────────────────────────────────────────────

export interface RegridParcel {
  apn: string | null
  address: string | null
  city: string | null
  state: string | null
  zip: string | null
  county: string | null
  acreage: number | null
  zoning: string | null
  landUse: string | null
  ownerName: string | null
  latitude: number | null
  longitude: number | null
  parcelBoundary: any | null // GeoJSON Feature
}

export interface RegridResponse {
  parcel: RegridParcel | null
  raw: any
}

// ── Field mapping helper ──────────────────────────────────────────────────────

/**
 * Normalise a raw Regrid GeoJSON feature into our typed RegridParcel shape.
 * Regrid schema: https://regrid.com/resources/parcel-schema
 */
function parseFeature(feature: any): RegridParcel {
  const f = feature?.properties?.fields ?? {}
  const geo = feature?.geometry ?? null

  // Regrid supplies explicit lat/lon fields in the schema
  let lat: number | null = f.lat ? parseFloat(f.lat) : null
  let lng: number | null = f.lon ? parseFloat(f.lon) : null

  // Fall back to computing from geometry if not present
  if ((lat == null || lng == null) && geo) {
    if (geo.type === 'Point' && Array.isArray(geo.coordinates)) {
      ;[lng, lat] = geo.coordinates
    } else if (geo.type === 'Polygon' && Array.isArray(geo.coordinates?.[0])) {
      const ring: [number, number][] = geo.coordinates[0]
      lng = ring.reduce((s, c) => s + c[0], 0) / ring.length
      lat = ring.reduce((s, c) => s + c[1], 0) / ring.length
    }
  }

  return {
    apn: f.parcelnumb ?? f.parcelnumb_no_formatting ?? null,
    address: f.address ?? f.saddno != null ? `${f.saddno ?? ''} ${f.saddstr ?? ''} ${f.saddsttyp ?? ''}`.trim() || f.address || null : null,
    city: f.scity ?? f.city ?? null,
    state: f.state2 ?? null,
    zip: f.szip5 ?? f.szip ?? null,
    county: f.county ?? null,
    acreage: f.ll_gisacre ? parseFloat(f.ll_gisacre) : f.gisacre ? parseFloat(f.gisacre) : null,
    zoning: f.zoning ?? null,
    landUse: f.usedesc ?? f.lbcs_activity_desc ?? null,
    ownerName: f.owner ?? f.ownername ?? null,
    latitude: lat,
    longitude: lng,
    parcelBoundary: feature ?? null,
  }
}

// ── Shared response parser ────────────────────────────────────────────────────

function parseResponse(body: any, status: number): RegridResponse {
  console.log('[Regrid] Status:', status, '| Top-level keys:', Object.keys(body))

  if (status !== 200) {
    console.error('[Regrid] Error body:', JSON.stringify(body, null, 2))
    return { parcel: null, raw: body }
  }

  // Regrid v2 wraps results in { parcels: GeoJSON FeatureCollection }
  const features: any[] = body?.parcels?.features ?? body?.features ?? []

  if (features.length === 0) {
    console.log('[Regrid] No parcel features returned')
    return { parcel: null, raw: body }
  }

  console.log('[Regrid] Feature count:', features.length)
  const parcel = parseFeature(features[0])
  return { parcel, raw: body }
}

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Look up a parcel by Assessor's Parcel Number (APN).
 * Pass `state` as a 2-letter code (e.g. "CO") to scope the search.
 *
 * Uses /api/v2/parcels/query with fields[parcelnumb][eq]=<apn>
 */
export async function getParcelByAPN(apn: string, state?: string): Promise<RegridResponse> {
  const params = new URLSearchParams({
    'fields[parcelnumb][eq]': apn.trim(),
    token: getToken(),
    limit: '1',
  })
  if (state) params.set('fields[state2][eq]', state.toUpperCase())

  const url = `${REGRID_BASE}/parcels/query?${params.toString()}`
  console.log('[Regrid] getParcelByAPN →', url.replace(getToken(), '<token>'))

  const res = await fetch(url, { headers: { Accept: 'application/json' } })
  const body = await res.json().catch(() => ({}))
  return parseResponse(body, res.status)
}

/**
 * Look up a parcel by street address + city + state.
 *
 * Uses /api/v2/parcels/query with address and state filters.
 * Note: address matching is fuzzy (ilike). If the address has no parcel,
 * the result may be empty — combine with Census geocoding + point lookup.
 */
export async function getParcelByAddress(
  address: string,
  city: string,
  state: string
): Promise<RegridResponse> {
  const params = new URLSearchParams({
    'fields[address][ilike]': address.trim(),
    'fields[scity][eq]': city.trim(),
    'fields[state2][eq]': state.toUpperCase(),
    token: getToken(),
    limit: '1',
  })

  const url = `${REGRID_BASE}/parcels/query?${params.toString()}`
  console.log('[Regrid] getParcelByAddress →', url.replace(getToken(), '<token>'))

  const res = await fetch(url, { headers: { Accept: 'application/json' } })
  const body = await res.json().catch(() => ({}))
  return parseResponse(body, res.status)
}

/**
 * Look up the parcel at a specific lat/lng coordinate.
 *
 * Uses /api/v2/parcels/point — the reverse-geocoding endpoint.
 * A small radius (10m) is added to handle points that land on parcel edges.
 */
export async function getParcelByLatLng(lat: number, lng: number): Promise<RegridResponse> {
  const params = new URLSearchParams({
    lat: String(lat),
    lon: String(lng),
    radius: '10',
    token: getToken(),
    limit: '1',
  })

  const url = `${REGRID_BASE}/parcels/point?${params.toString()}`
  console.log('[Regrid] getParcelByLatLng →', url.replace(getToken(), '<token>'))

  const res = await fetch(url, { headers: { Accept: 'application/json' } })
  const body = await res.json().catch(() => ({}))
  return parseResponse(body, res.status)
}
