/**
 * Geocoding utilities using Nominatim OpenStreetMap API (free, no key required).
 * Converts place names to coordinates and coordinates back to place names.
 */

export interface GeoResult {
  lat: number
  lng: number
  displayName: string
}

const NOMINATIM_BASE = 'https://nominatim.openstreetmap.org'
const HEADERS = { 'Accept-Language': 'en', 'User-Agent': 'SRANS-App/1.0' }

/**
 * Convert a place name / address to lat/lng coordinates.
 * Returns the best match or null if nothing found.
 */
export async function geocode(query: string): Promise<GeoResult | null> {
  if (!query.trim()) return null
  try {
    const url = `${NOMINATIM_BASE}/search?q=${encodeURIComponent(query)}&format=json&limit=1&addressdetails=1`
    const res = await fetch(url, { headers: HEADERS })
    if (!res.ok) return null
    const data = await res.json()
    if (!data.length) return null
    const top = data[0]
    return {
      lat: parseFloat(top.lat),
      lng: parseFloat(top.lon),
      displayName: top.display_name,
    }
  } catch {
    return null
  }
}

/**
 * Convert lat/lng back to a human-readable city/area name.
 * Used to auto-detect the user's city from browser geolocation.
 */
export async function reverseGeocode(lat: number, lng: number): Promise<string | null> {
  try {
    const url = `${NOMINATIM_BASE}/reverse?lat=${lat}&lon=${lng}&format=json`
    const res = await fetch(url, { headers: HEADERS })
    if (!res.ok) return null
    const data = await res.json()
    // Return city > town > county > state — whatever is available
    const addr = data.address || {}
    return (
      addr.city ||
      addr.town ||
      addr.suburb ||
      addr.county ||
      addr.state_district ||
      addr.state ||
      null
    )
  } catch {
    return null
  }
}

/**
 * Get multiple place suggestions for autocomplete.
 * Returns up to 5 results.
 */
export async function geocodeSuggestions(query: string): Promise<GeoResult[]> {
  if (!query.trim() || query.length < 3) return []
  try {
    const url = `${NOMINATIM_BASE}/search?q=${encodeURIComponent(query)}&format=json&limit=5&addressdetails=1`
    const res = await fetch(url, { headers: HEADERS })
    if (!res.ok) return []
    const data = await res.json()
    return data.map((item: any) => ({
      lat: parseFloat(item.lat),
      lng: parseFloat(item.lon),
      displayName: item.display_name,
    }))
  } catch {
    return []
  }
}
