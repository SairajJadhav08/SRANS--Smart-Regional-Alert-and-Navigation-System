// Tiny sessionStorage cache for AI responses so revisiting a page doesn't
// spend another LLM call. Entries expire after `ttlMs`.
export function readCache<T>(key: string, ttlMs: number): T | null {
  try {
    const raw = sessionStorage.getItem(`srans_ai:${key}`)
    if (!raw) return null
    const { at, value } = JSON.parse(raw) as { at: number; value: T }
    return Date.now() - at < ttlMs ? value : null
  } catch {
    return null
  }
}

export function writeCache<T>(key: string, value: T): void {
  try {
    sessionStorage.setItem(`srans_ai:${key}`, JSON.stringify({ at: Date.now(), value }))
  } catch {
    // storage full or blocked — caching is best-effort
  }
}

export function clearCache(key: string): void {
  try {
    sessionStorage.removeItem(`srans_ai:${key}`)
  } catch {
    // ignore
  }
}

// Haversine distance in km between two coordinates.
export function distanceKm(a: { lat: number; lng: number }, b: { lat: number; lng: number }): number {
  const R = 6371
  const dLat = ((b.lat - a.lat) * Math.PI) / 180
  const dLng = ((b.lng - a.lng) * Math.PI) / 180
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((a.lat * Math.PI) / 180) * Math.cos((b.lat * Math.PI) / 180) * Math.sin(dLng / 2) ** 2
  return 2 * R * Math.asin(Math.sqrt(s))
}
