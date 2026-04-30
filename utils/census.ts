/**
 * US Census Bureau Geocoding API — no API key required.
 *
 * Docs: https://geocoding.geo.census.gov/geocoder/Geocoding_Services_API.html
 * Free, reliable, and authoritative for US addresses.
 */

const CENSUS_GEOCODER_URL = 'https://geocoding.geo.census.gov/geocoder/locations/address'

export interface GeocodeResult {
  lat: number | null
  lng: number | null
  matchedAddress: string | null
}

/**
 * Convert a US street address to latitude/longitude using the Census geocoder.
 * Returns null coords if the address cannot be matched.
 */
export async function geocodeAddress(
  address: string,
  city: string,
  state: string,
  zip?: string
): Promise<GeocodeResult> {
  const params = new URLSearchParams({
    street: address,
    city,
    state,
    benchmark: 'Public_AR_Current',
    format: 'json',
  })
  if (zip) params.set('zip', zip)

  const url = `${CENSUS_GEOCODER_URL}?${params.toString()}`
  console.log('[Census] GET', url)

  try {
    const res = await fetch(url, {
      headers: { Accept: 'application/json' },
    })

    const body = await res.json().catch(() => ({}))
    console.log('[Census] Status:', res.status)

    if (!res.ok) {
      console.error('[Census] Error response:', JSON.stringify(body, null, 2))
      return { lat: null, lng: null, matchedAddress: null }
    }

    const matches: any[] = body?.result?.addressMatches ?? []
    if (matches.length === 0) {
      console.log('[Census] No address match found')
      return { lat: null, lng: null, matchedAddress: null }
    }

    const match = matches[0]
    const coords = match?.coordinates ?? {}
    const lat = coords.y != null ? parseFloat(coords.y) : null
    const lng = coords.x != null ? parseFloat(coords.x) : null
    const matchedAddress = match?.matchedAddress ?? null

    console.log('[Census] Matched:', matchedAddress, '→', { lat, lng })
    return { lat, lng, matchedAddress }
  } catch (err) {
    console.error('[Census] Fetch error:', err)
    return { lat: null, lng: null, matchedAddress: null }
  }
}
