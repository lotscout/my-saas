/**
 * FEMA National Flood Hazard Layer (NFHL) lookup — no API key required.
 *
 * Docs: https://www.fema.gov/flood-maps/national-flood-hazard-layer
 * Service: NFHL MapServer layer 28 (Flood Hazard Zones)
 */

const FEMA_NFHL_URL =
  'https://hazards.fema.gov/gis/nfhl/rest/services/public/NFHL/MapServer/28/query'

export interface FloodZoneResult {
  floodZone: string | null           // e.g. "AE", "X", "VE"
  floodZoneDescription: string | null // e.g. "1% Annual Chance Flood Hazard"
  panelNumber: string | null          // FIRM panel number
}

/** Well-known flood zone designations mapped to human descriptions */
const ZONE_DESCRIPTIONS: Record<string, string> = {
  A: '1% Annual Chance Flood Hazard (no BFE)',
  AE: '1% Annual Chance Flood Hazard (BFE shown)',
  AH: '1% Annual Chance Shallow Flooding (ponding)',
  AO: '1% Annual Chance Sheet Flow Flooding',
  AR: 'Temporary Increased Risk (levee restoration)',
  'A99': '1% Annual Chance Protected by Federal Flood Control System',
  V: 'Coastal High Hazard (no BFE)',
  VE: 'Coastal High Hazard (BFE shown)',
  X: 'Minimal Flood Hazard (0.2% or less)',
  D: 'Undetermined Flood Hazard',
}

function describeZone(zone: string | null): string | null {
  if (!zone) return null
  const upper = zone.toUpperCase().trim()
  return ZONE_DESCRIPTIONS[upper] ?? `Flood Zone ${upper}`
}

/**
 * Query the FEMA NFHL service for the flood zone at a given lat/lng.
 * Returns null fields if the query fails or no data is available.
 */
export async function getFloodZone(lat: number, lng: number): Promise<FloodZoneResult> {
  const params = new URLSearchParams({
    geometry: `${lng},${lat}`,
    geometryType: 'esriGeometryPoint',
    inSR: '4326',
    spatialRel: 'esriSpatialRelIntersects',
    outFields: 'FLD_ZONE,ZONE_SUBTY,DFIRM_ID,MAP_MDY',
    returnGeometry: 'false',
    f: 'json',
  })

  const url = `${FEMA_NFHL_URL}?${params.toString()}`
  console.log('[FEMA] GET', url)

  try {
    const res = await fetch(url, {
      headers: { Accept: 'application/json' },
    })

    const body = await res.json().catch(() => ({}))
    console.log('[FEMA] Status:', res.status)

    if (!res.ok || body?.error) {
      console.error('[FEMA] Error response:', JSON.stringify(body, null, 2))
      return { floodZone: null, floodZoneDescription: null, panelNumber: null }
    }

    const features: any[] = body?.features ?? []
    if (features.length === 0) {
      console.log('[FEMA] No flood zone features at this location')
      return { floodZone: null, floodZoneDescription: null, panelNumber: null }
    }

    const attrs = features[0]?.attributes ?? {}
    const zone = attrs.FLD_ZONE ?? null
    const subtype = attrs.ZONE_SUBTY ?? null
    const panelNumber = attrs.DFIRM_ID ?? null

    // Combine zone + subtype when present (e.g. "X" + "0.2 PCT ANNUAL CHANCE FLOOD HAZARD")
    const effectiveZone = zone ?? subtype

    return {
      floodZone: effectiveZone,
      floodZoneDescription: describeZone(effectiveZone),
      panelNumber,
    }
  } catch (err) {
    console.error('[FEMA] Fetch error:', err)
    return { floodZone: null, floodZoneDescription: null, panelNumber: null }
  }
}
