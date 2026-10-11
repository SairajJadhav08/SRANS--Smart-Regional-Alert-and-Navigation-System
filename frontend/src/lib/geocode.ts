/**
 * Geocoding with free, key-less OpenStreetMap services:
 *   • Photon (photon.komoot.io) — fast, typo-tolerant, good for autocomplete
 *   • Nominatim (nominatim.openstreetmap.org) — fallback
 * Results are biased towards the default map area so local names win.
 */
import { DEFAULT_CENTER } from './mapConfig'

export interface GeoResult {
  lat: number
  lng: number
  displayName: string
}

const PHOTON = 'https://photon.komoot.io'
const NOMINATIM = 'https://nominatim.openstreetmap.org'

function photonName(p: Record<string, string | undefined>): string {
  const parts = [p.name, p.street && p.housenumber ? `${p.street} ${p.housenumber}` : p.street, p.district, p.city ?? p.county, p.state, p.country]
  return [...new Set(parts.filter(Boolean))].join(', ')
}

async function photonSearch(query: string, limit: number): Promise<GeoResult[]> {
  const [lat, lon] = DEFAULT_CENTER
  const res = await fetch(`${PHOTON}/api/?q=${encodeURIComponent(query)}&limit=${limit}&lang=en&lat=${lat}&lon=${lon}`)
  if (!res.ok) throw new Error(`photon ${res.status}`)
  const data = await res.json()
  return (data.features ?? []).map((f: any) => ({
    lat: f.geometry.coordinates[1],
    lng: f.geometry.coordinates[0],
    displayName: photonName(f.properties ?? {}),
  }))
}

async function nominatimSearch(query: string, limit: number): Promise<GeoResult[]> {
  const res = await fetch(`${NOMINATIM}/search?q=${encodeURIComponent(query)}&format=json&limit=${limit}&accept-language=en`)
  if (!res.ok) throw new Error(`nominatim ${res.status}`)
  const data = await res.json()
  return data.map((item: any) => ({
    lat: parseFloat(item.lat),
    lng: parseFloat(item.lon),
    displayName: item.display_name,
  }))
}

async function search(query: string, limit: number): Promise<GeoResult[]> {
  try {
    const r = await photonSearch(query, limit)
    if (r.length) return r
  } catch { /* fall through */ }
  try {
    return await nominatimSearch(query, limit)
  } catch {
    return []
  }
}

/** Best match for a place name / address, or null. */
export async function geocode(query: string): Promise<GeoResult | null> {
  if (!query.trim()) return null
  const results = await search(query.trim(), 1)
  return results[0] ?? null
}

/** Up to 5 suggestions for autocomplete. */
export async function geocodeSuggestions(query: string): Promise<GeoResult[]> {
  if (query.trim().length < 3) return []
  return search(query.trim(), 5)
}

/** City / area name for coordinates (used to label the user's location). */
export async function reverseGeocode(lat: number, lng: number): Promise<string | null> {
  try {
    const res = await fetch(`${PHOTON}/reverse?lat=${lat}&lon=${lng}&lang=en`)
    if (res.ok) {
      const p = (await res.json()).features?.[0]?.properties
      const name = p?.city ?? p?.town ?? p?.district ?? p?.county ?? p?.state
      if (name) return name
    }
  } catch { /* fall through */ }
  try {
    const res = await fetch(`${NOMINATIM}/reverse?lat=${lat}&lon=${lng}&format=json&accept-language=en`)
    if (!res.ok) return null
    const a = (await res.json()).address ?? {}
    return a.city || a.town || a.suburb || a.county || a.state_district || a.state || null
  } catch {
    return null
  }
}
