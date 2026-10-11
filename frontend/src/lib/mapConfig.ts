// Map stack shared by every map in the app. Everything here is free and needs
// no account or API key:
//   • Leaflet (loaded globally from index.html)
//   • Tiles: CARTO Voyager (OpenStreetMap data), falling back to the standard
//     OpenStreetMap tiles if CARTO stops responding
//   • Routing: FOSSGIS OSRM (the router behind openstreetmap.org), falling back
//     to the public OSRM demo server
// Both providers ask for light, non-bulk use and visible attribution, which the
// tile layers below include.

declare const L: any

export type LatLng = [number, number]

export const DEFAULT_CENTER: LatLng = [18.5204, 73.8567] // Pune

// Note: CARTO basemaps now require an API key (tiles come back watermarked
// "API KEY REQUIRED" with a 200 status), so they are no longer used.
const TILE_PROVIDERS = [
  {
    url: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
    options: {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19,
      className: 'srans-tiles',
    },
  },
  {
    url: 'https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png',
    options: {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, tiles by <a href="https://www.hotosm.org/">HOT</a> / OSM France',
      subdomains: 'abc',
      maxZoom: 19,
      className: 'srans-tiles',
    },
  },
]

const ROUTERS = [
  'https://routing.openstreetmap.de/routed-car/route/v1',
  'https://router.project-osrm.org/route/v1',
]

export function isLeafletReady(): boolean {
  return typeof L !== 'undefined'
}

// Adds the base map. If the primary provider fails repeatedly before any tile
// loads, swaps to the fallback provider once.
export function addBaseLayer(map: any) {
  let index = 0
  let errors = 0
  let loadedAny = false
  let layer = L.tileLayer(TILE_PROVIDERS[0].url, TILE_PROVIDERS[0].options).addTo(map)

  const attach = () => {
    layer.on('tileload', () => { loadedAny = true })
    layer.on('tileerror', () => {
      errors++
      if (!loadedAny && errors >= 4 && index < TILE_PROVIDERS.length - 1) {
        map.removeLayer(layer)
        index++
        errors = 0
        layer = L.tileLayer(TILE_PROVIDERS[index].url, TILE_PROVIDERS[index].options).addTo(map)
        attach()
      }
    })
  }
  attach()
  return layer
}

// Creates a Leaflet map with the shared base layer.
export function createMap(el: HTMLElement, opts: { center?: LatLng; zoom?: number; zoomControl?: 'bottomright' | 'topleft' | false } = {}) {
  const map = L.map(el, { zoomControl: false }).setView(opts.center ?? DEFAULT_CENTER, opts.zoom ?? 13)
  addBaseLayer(map)
  if (opts.zoomControl !== false) L.control.zoom({ position: opts.zoomControl ?? 'bottomright' }).addTo(map)
  return map
}

// Leaflet Routing Machine router that tries each OSRM server in turn.
export function createRouter() {
  const routers = ROUTERS.map(serviceUrl => L.Routing.osrmv1({ serviceUrl, profile: 'driving', timeout: 15000 }))
  return {
    route(waypoints: any, callback: (err: any, routes?: any) => void, context: any, options: any) {
      const attempt = (i: number) => {
        routers[i].route(waypoints, (err: any, routes: any) => {
          if (err && i < routers.length - 1) attempt(i + 1)
          else callback.call(context, err, routes)
        }, context, options)
      }
      attempt(0)
    },
    // Lets Routing Machine re-request finer geometry after zooming in
    requiresMoreDetail(route: any, zoom: number, bounds: any) {
      return routers[0].requiresMoreDetail?.(route, zoom, bounds) ?? false
    },
  }
}
