export interface PropertyReport {
  id?: string
  requestedAt: string

  // Property Identity
  apn: string
  address: string
  city: string
  state: string
  zip: string
  county: string

  // Land Details
  acreage: number | null
  zoning: string | null
  landUse: string | null

  // Ownership
  ownerName: string | null

  // Location
  latitude: number | null
  longitude: number | null
  parcelBoundary: any | null // GeoJSON

  // Risk
  floodZone: string | null
  floodZoneDescription: string | null

  // Data Sources
  sources: string[]

  // Raw data for future use
  rawRegrid?: any
  rawFema?: any
}
