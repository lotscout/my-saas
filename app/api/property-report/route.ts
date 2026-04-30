import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getParcelByAPN, getParcelByAddress, getParcelByLatLng } from '@/utils/regrid'
import { getFloodZone } from '@/utils/fema'
import { geocodeAddress } from '@/utils/census'
import type { PropertyReport } from '@/types/property-report'

// ── Supabase (service role — bypasses RLS) ────────────────────────────────────
function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY!
  return createClient(url, key)
}

// ── Request body type ─────────────────────────────────────────────────────────
interface ReportRequest {
  apn?: string
  address?: string
  city?: string
  state?: string
  zip?: string
}

// ── POST /api/property-report ─────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  // 1. Parse & validate input
  let body: ReportRequest
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const { apn, address, city, state, zip } = body

  const hasAPN = Boolean(apn?.trim())
  const hasAddress = Boolean(address?.trim() && city?.trim() && state?.trim())

  if (!hasAPN && !hasAddress) {
    return NextResponse.json(
      { error: 'Provide either apn, or address + city + state' },
      { status: 400 }
    )
  }

  const sources: string[] = []
  let rawRegrid: any = null
  let rawFema: any = null

  // ── 2. Regrid parcel lookup ──────────────────────────────────────────────────
  let regridResult = await (async () => {
    try {
      if (hasAPN) {
        console.log('[report] Looking up APN:', apn, state ?? '')
        return await getParcelByAPN(apn!.trim(), state?.trim())
      } else {
        console.log('[report] Looking up address:', address, city, state)
        return await getParcelByAddress(address!.trim(), city!.trim(), state!.trim())
      }
    } catch (err) {
      console.error('[report] Regrid error:', err)
      return null
    }
  })()

  if (regridResult?.parcel) {
    sources.push('regrid')
    rawRegrid = regridResult.raw
  }

  const parcel = regridResult?.parcel ?? null

  // ── 3. Determine lat/lng ─────────────────────────────────────────────────────
  let latitude = parcel?.latitude ?? null
  let longitude = parcel?.longitude ?? null

  // If Regrid didn't return coords but we have an address, fall back to Census
  if ((latitude == null || longitude == null) && hasAddress) {
    console.log('[report] Falling back to Census geocoder for coordinates')
    const geo = await geocodeAddress(address!.trim(), city!.trim(), state!.trim(), zip?.trim()).catch(
      (err) => {
        console.error('[report] Census error:', err)
        return null
      }
    )
    if (geo?.lat != null) {
      latitude = geo.lat
      longitude = geo.lng
      sources.push('census')
    }
  }

  // If we have coords but no parcel yet, try Regrid spatial lookup
  if (!parcel && latitude != null && longitude != null) {
    console.log('[report] Trying Regrid lat/lng lookup:', latitude, longitude)
    const spatial = await getParcelByLatLng(latitude, longitude).catch((err) => {
      console.error('[report] Regrid spatial error:', err)
      return null
    })
    if (spatial?.parcel) {
      sources.push('regrid')
      rawRegrid = spatial.raw
    }
  }

  // ── 4. FEMA flood zone ───────────────────────────────────────────────────────
  let floodZone: string | null = null
  let floodZoneDescription: string | null = null

  if (latitude != null && longitude != null) {
    const fema = await getFloodZone(latitude, longitude).catch((err) => {
      console.error('[report] FEMA error:', err)
      return null
    })
    if (fema) {
      floodZone = fema.floodZone
      floodZoneDescription = fema.floodZoneDescription
      rawFema = fema
      if (fema.floodZone) sources.push('fema')
    }
  }

  // ── 5. Assemble report ───────────────────────────────────────────────────────
  const report: PropertyReport = {
    requestedAt: new Date().toISOString(),

    // Identity — prefer Regrid data; fall back to request inputs
    apn: parcel?.apn ?? apn ?? '',
    address: parcel?.address ?? address ?? '',
    city: parcel?.city ?? city ?? '',
    state: parcel?.state ?? state ?? '',
    zip: parcel?.zip ?? zip ?? '',
    county: parcel?.county ?? '',

    // Land details
    acreage: parcel?.acreage ?? null,
    zoning: parcel?.zoning ?? null,
    landUse: parcel?.landUse ?? null,

    // Ownership
    ownerName: parcel?.ownerName ?? null,

    // Location
    latitude,
    longitude,
    parcelBoundary: parcel?.parcelBoundary ?? null,

    // Risk
    floodZone,
    floodZoneDescription,

    // Provenance
    sources,
    rawRegrid,
    rawFema,
  }

  console.log('[report] Assembled report for:', report.address, report.city, report.state)

  // ── 6. Persist to Supabase ───────────────────────────────────────────────────
  try {
    const supabase = getSupabase()
    const { data, error } = await supabase
      .from('property_reports')
      .insert(report)
      .select('id')
      .single()

    if (error) {
      // Non-fatal: log but still return the report
      console.error('[report] Supabase insert error:', error.message)
    } else {
      report.id = data?.id
      console.log('[report] Saved to Supabase, id:', report.id)
    }
  } catch (err) {
    console.error('[report] Supabase unexpected error:', err)
  }

  return NextResponse.json(report)
}
