import { useState, useEffect, useRef } from 'react'
import { getAlerts, createRoute, getAiNavigationChat, getAiDetectAlerts } from '../api'
import type { Alert } from '../types'
import { useAuth } from '../context/AuthContext'
import { geocode } from '../lib/geocode'

declare const L: any

// ── Icon helpers ──────────────────────────────────────────────────────────────
const ICON_COLORS: Record<string, string> = {
  Traffic: '#EF4444',
  Emergency: '#8B5CF6',
  Construction: '#F59E0B',
  Weather: '#3B82F6',
}

const ICON_FA: Record<string, string> = {
  Traffic: 'fa-car-crash',
  Emergency: 'fa-exclamation-triangle',
  Construction: 'fa-hard-hat',
  Weather: 'fa-cloud-rain',
}

function makeIcon(type: string) {
  const color = ICON_COLORS[type] || '#94A3B8'
  const icon = ICON_FA[type] || 'fa-bell'
  // Total rendered height: 36px circle + 9px triangle = 45px
  // iconAnchor: horizontal centre (18px), bottom of triangle (45px)
  // popupAnchor: open popup 4px above the top of the circle
  return L.divIcon({
    className: '',
    html: `
      <div style="
        width:36px;height:36px;border-radius:50%;
        background:${color};
        display:flex;align-items:center;justify-content:center;
        box-shadow:0 4px 12px rgba(0,0,0,0.25);
        border:2.5px solid white;
      ">
        <i class="fas ${icon}" style="color:white;font-size:14px;"></i>
      </div>
      <div style="
        width:0;height:0;
        border-left:7px solid transparent;
        border-right:7px solid transparent;
        border-top:9px solid ${color};
        margin:0 auto;
      "></div>
    `,
    iconSize: [36, 45],
    iconAnchor: [18, 45],
    popupAnchor: [0, -48],
  })
}

// ── Nav chat message type ─────────────────────────────────────────────────────
interface NavMessage {
  id: number
  role: 'user' | 'assistant'
  content: string
  loading?: boolean
}

// ── Component ─────────────────────────────────────────────────────────────────
export default function MapPage() {
  const { isLoggedIn, isGovUser } = useAuth()

  // Alert state
  const [filter, setFilter] = useState('all')
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [loading, setLoading] = useState(true)

  // Directions panel state
  const [directionsVisible, setDirectionsVisible] = useState(false)
  const [startLocation, setStartLocation] = useState('')
  const [endLocation, setEndLocation] = useState('')
  const [startPlaceName, setStartPlaceName] = useState('')
  const [endPlaceName, setEndPlaceName] = useState('')
  const [geocodingStart, setGeocodingStart] = useState(false)
  const [geocodingEnd, setGeocodingEnd] = useState(false)
  const [geocodeError, setGeocodeError] = useState<string | null>(null)
  const [mapSearchQuery, setMapSearchQuery] = useState('')
  const [mapSearching, setMapSearching] = useState(false)
  const [locating, setLocating] = useState(false)
  const [locError, setLocError] = useState<string | null>(null)

  // Route info from OSRM
  const [routeDistance, setRouteDistance] = useState<string | null>(null)
  const [routeTime, setRouteTime] = useState<string | null>(null)
  const [routeSteps, setRouteSteps] = useState<string[]>([])
  const [currentStepIdx, setCurrentStepIdx] = useState(0)
  const [routeActive, setRouteActive] = useState(false)

  // Save route modal
  const [saveModalActive, setSaveModalActive] = useState(false)
  const [routeName, setRouteName] = useState('')
  const [isSavingRoute, setIsSavingRoute] = useState(false)

  // AI alert detection state
  const [detectingAlerts, setDetectingAlerts] = useState(false)
  const [aiAlertMsg, setAiAlertMsg] = useState<string | null>(null)

  // Mobile panel toggles
  const [leftPanelOpen, setLeftPanelOpen] = useState(false)
  const [rightPanelOpen, setRightPanelOpen] = useState(false)

  // In-journey AI chat state
  const [chatOpen, setChatOpen] = useState(false)
  const [navMessages, setNavMessages] = useState<NavMessage[]>([
    {
      id: 0,
      role: 'assistant',
      content: "Hi! I'm your navigation co-pilot. Ask me anything about your route, road conditions, or nearby alerts.",
    },
  ])
  const [chatInput, setChatInput] = useState('')
  const [chatLoading, setChatLoading] = useState(false)
  const chatBottomRef = useRef<HTMLDivElement>(null)
  const chatInputRef = useRef<HTMLTextAreaElement>(null)

  // Layer toggle state
  const [heatmapOn, setHeatmapOn] = useState(false)
  const [radiusOn, setRadiusOn] = useState(true)
  const [shareCopied, setShareCopied] = useState(false)
  const [routeHazardCount, setRouteHazardCount] = useState(0)

  // Map refs
  const mapRef = useRef<any>(null)
  const markersRef = useRef<any[]>([])
  const radiusCirclesRef = useRef<any[]>([])
  const heatLayerRef = useRef<any>(null)
  const pulseMarkersRef = useRef<any[]>([])
  const userMarkerRef = useRef<any>(null)
  const startMarkerRef = useRef<any>(null)
  const endMarkerRef = useRef<any>(null)
  const routingControlRef = useRef<any>(null)

  // Stale-closure-safe refs for Leaflet event handlers
  const startLocRef = useRef('')
  const endLocRef = useRef('')
  const dirVisibleRef = useRef(false)

  useEffect(() => { startLocRef.current = startLocation }, [startLocation])
  useEffect(() => { endLocRef.current = endLocation }, [endLocation])
  useEffect(() => { dirVisibleRef.current = directionsVisible }, [directionsVisible])

  // Auto-scroll chat to bottom
  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [navMessages])

  // ── Marker helpers ──────────────────────────────────────────────────────────
  const placeStartMarker = (lat: number, lng: number) => {
    if (!mapRef.current) return
    const icon = L.divIcon({
      className: '',
      html: `<div style="width:28px;height:28px;border-radius:50%;background:#10B981;display:flex;align-items:center;justify-content:center;box-shadow:0 2px 5px rgba(0,0,0,0.3);border:2px solid white;"><i class="fas fa-flag-checkered" style="color:white;font-size:11px;"></i></div>`,
      iconSize: [28, 28], iconAnchor: [14, 14],
    })
    if (startMarkerRef.current) {
      startMarkerRef.current.setLatLng([lat, lng])
    } else {
      startMarkerRef.current = L.marker([lat, lng], { icon }).addTo(mapRef.current).bindPopup('Start Point')
    }
  }

  const placeEndMarker = (lat: number, lng: number) => {
    if (!mapRef.current) return
    const icon = L.divIcon({
      className: '',
      html: `<div style="width:28px;height:28px;border-radius:50%;background:#EF4444;display:flex;align-items:center;justify-content:center;box-shadow:0 2px 5px rgba(0,0,0,0.3);border:2px solid white;"><i class="fas fa-map-marker-alt" style="color:white;font-size:11px;"></i></div>`,
      iconSize: [28, 28], iconAnchor: [14, 14],
    })
    if (endMarkerRef.current) {
      endMarkerRef.current.setLatLng([lat, lng])
    } else {
      endMarkerRef.current = L.marker([lat, lng], { icon }).addTo(mapRef.current).bindPopup('Destination')
    }
  }

  const parseCoords = (str: string): [number, number] | null => {
    if (!str) return null
    const parts = str.split(',').map(p => parseFloat(p.trim()))
    if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) return [parts[0], parts[1]]
    return null
  }

  // Format seconds to "X min" or "X hr Y min"
  const formatDuration = (seconds: number): string => {
    const h = Math.floor(seconds / 3600)
    const m = Math.floor((seconds % 3600) / 60)
    if (h > 0) return `${h} hr ${m} min`
    return `${m} min`
  }

  // Format meters to "X.X km" or "X m"
  const formatDistance = (meters: number): string => {
    if (meters >= 1000) return `${(meters / 1000).toFixed(1)} km`
    return `${Math.round(meters)} m`
  }

  // ── Geocode handlers ────────────────────────────────────────────────────────
  const handleGeocodeStart = async () => {
    if (!startPlaceName.trim()) return
    setGeocodingStart(true); setGeocodeError(null)
    const result = await geocode(startPlaceName)
    setGeocodingStart(false)
    if (!result) { setGeocodeError(`Could not find "${startPlaceName}". Try a more specific name.`); return }
    setStartLocation(`${result.lat.toFixed(6)}, ${result.lng.toFixed(6)}`)
    setStartPlaceName(result.displayName.split(',').slice(0, 2).join(', '))
    placeStartMarker(result.lat, result.lng)
    if (mapRef.current) mapRef.current.setView([result.lat, result.lng], 14)
  }

  const handleGeocodeEnd = async () => {
    if (!endPlaceName.trim()) return
    setGeocodingEnd(true); setGeocodeError(null)
    const result = await geocode(endPlaceName)
    setGeocodingEnd(false)
    if (!result) { setGeocodeError(`Could not find "${endPlaceName}". Try a more specific name.`); return }
    setEndLocation(`${result.lat.toFixed(6)}, ${result.lng.toFixed(6)}`)
    setEndPlaceName(result.displayName.split(',').slice(0, 2).join(', '))
    placeEndMarker(result.lat, result.lng)
    if (mapRef.current) mapRef.current.setView([result.lat, result.lng], 14)
  }

  const handleMapSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!mapSearchQuery.trim()) return
    setMapSearching(true)
    const result = await geocode(mapSearchQuery)
    setMapSearching(false)
    if (!result) return
    if (mapRef.current) mapRef.current.setView([result.lat, result.lng], 14)
    setMapSearchQuery('')
  }

  // ── OSRM Routing via Leaflet Routing Machine ───────────────────────────────
  const handleGetRoute = () => {
    const start = parseCoords(startLocation)
    const end = parseCoords(endLocation)
    if (!start || !end) {
      alert('Please select both a valid starting point and a destination.')
      return
    }
    if (!mapRef.current) return

    // Remove previous routing control
    if (routingControlRef.current) {
      routingControlRef.current.remove()
      routingControlRef.current = null
    }

    // Remove plain start/end markers — LRM will draw its own
    if (startMarkerRef.current) { startMarkerRef.current.remove(); startMarkerRef.current = null }
    if (endMarkerRef.current) { endMarkerRef.current.remove(); endMarkerRef.current = null }

    setRouteSteps([])
    setRouteDistance(null)
    setRouteTime(null)
    setCurrentStepIdx(0)

    // Build custom plan icon so LRM markers match our theme
    const startIcon = L.divIcon({
      className: '',
      html: `<div style="width:32px;height:32px;border-radius:50%;background:#10B981;display:flex;align-items:center;justify-content:center;box-shadow:0 3px 8px rgba(0,0,0,0.3);border:3px solid white;"><i class="fas fa-flag-checkered" style="color:white;font-size:12px;"></i></div>`,
      iconSize: [32, 32], iconAnchor: [16, 16],
    })
    const endIcon = L.divIcon({
      className: '',
      html: `<div style="width:32px;height:32px;border-radius:50%;background:#EF4444;display:flex;align-items:center;justify-content:center;box-shadow:0 3px 8px rgba(0,0,0,0.3);border:3px solid white;"><i class="fas fa-map-marker-alt" style="color:white;font-size:12px;"></i></div>`,
      iconSize: [32, 32], iconAnchor: [16, 32],
    })

    routingControlRef.current = L.Routing.control({
      waypoints: [
        L.latLng(start[0], start[1]),
        L.latLng(end[0], end[1]),
      ],
      router: L.Routing.osrmv1({
        serviceUrl: 'https://router.project-osrm.org/route/v1',
        profile: 'driving',
      }),
      lineOptions: {
        styles: [{ color: '#10B981', weight: 6, opacity: 0.9 }],
        extendToWaypoints: true,
        missingRouteTolerance: 0,
      },
      createMarker: (i: number, waypoint: any) => {
        return L.marker(waypoint.latLng, { icon: i === 0 ? startIcon : endIcon, draggable: true })
      },
      // Hide default itinerary panel — we render our own steps UI
      show: false,
      collapsible: false,
      fitSelectedRoutes: true,
      showAlternatives: false,
      addWaypoints: false,
    }).addTo(mapRef.current)

    // Listen for route found — extract steps, distance, time
    routingControlRef.current.on('routesfound', (e: any) => {
      const route = e.routes[0]
      const dist = formatDistance(route.summary.totalDistance)
      const time = formatDuration(route.summary.totalTime)
      setRouteDistance(dist)
      setRouteTime(time)
      setRouteActive(true)

      // Extract step-by-step instructions
      const steps: string[] = route.instructions
        ? route.instructions.map((instr: any) => instr.text)
        : []
      setRouteSteps(steps)
      setCurrentStepIdx(0)
    })

    routingControlRef.current.on('routingerror', () => {
      alert('Could not find a route between these locations. Try different points.')
    })
  }

  const handleClearRoute = () => {
    setStartLocation(''); setEndLocation('')
    setStartPlaceName(''); setEndPlaceName('')
    setRouteDistance(null); setRouteTime(null)
    setRouteSteps([]); setCurrentStepIdx(0)
    setRouteActive(false)
    if (startMarkerRef.current) { startMarkerRef.current.remove(); startMarkerRef.current = null }
    if (endMarkerRef.current) { endMarkerRef.current.remove(); endMarkerRef.current = null }
    if (routingControlRef.current) { routingControlRef.current.remove(); routingControlRef.current = null }
  }

  // ── Save route ──────────────────────────────────────────────────────────────
  const confirmSaveRoute = async () => {
    if (!routeName.trim()) { alert('Please enter a route name.'); return }
    const start = parseCoords(startLocation)
    const end = parseCoords(endLocation)
    if (!start || !end) { alert('Please set a starting point and destination first.'); return }
    setIsSavingRoute(true)
    try {
      await createRoute({ name: routeName, start_lat: start[0], start_lng: start[1], end_lat: end[0], end_lng: end[1] })
      alert('Route saved successfully!')
      setSaveModalActive(false); setRouteName('')
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to save route. Please try again.')
    } finally {
      setIsSavingRoute(false)
    }
  }

  // ── My location ─────────────────────────────────────────────────────────────
  const handleMyLocation = () => {
    if (!navigator.geolocation) { setLocError('Geolocation is not supported by your browser.'); return }
    setLocating(true); setLocError(null)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords
        setLocating(false)
        if (!mapRef.current) return
        mapRef.current.setView([latitude, longitude], 15)
        if (userMarkerRef.current) userMarkerRef.current.remove()
        const userIcon = L.divIcon({
          className: '',
          html: `<div style="width:36px;height:36px;border-radius:50%;background:var(--color-info);display:flex;align-items:center;justify-content:center;box-shadow:0 0 0 6px rgba(59,130,246,0.2);border:2px solid white;"><i class="fas fa-location-arrow" style="color:white;font-size:14px;transform:rotate(-45deg);"></i></div>`,
          iconSize: [36, 36], iconAnchor: [18, 18], popupAnchor: [0, -18],
        })
        userMarkerRef.current = L.marker([latitude, longitude], { icon: userIcon })
          .addTo(mapRef.current)
          .bindPopup('<div style="padding:4px"><strong>Current Location</strong><br/><span style="color:var(--text-muted);font-size:12px">Your estimated location</span></div>')
          .openPopup()
        setStartLocation(`${latitude.toFixed(4)}, ${longitude.toFixed(4)}`)
        setStartPlaceName('My Current Location')
        placeStartMarker(latitude, longitude)
        setLeftPanelOpen(false)

        // AI alert detection — runs for logged-in users after getting location
        if (isLoggedIn) {
          setDetectingAlerts(true)
          setAiAlertMsg(null)
          getAiDetectAlerts(latitude, longitude)
            .then(res => {
              const { created } = res.data
              if (created > 0) {
                setAiAlertMsg(`AI detected ${created} new alert${created > 1 ? 's' : ''} near you`)
                // Refresh alerts to include new ones
                getAlerts().then(r => {
                  if (Array.isArray(r.data)) setAlerts(r.data)
                })
                // Auto-clear the message after 6 seconds
                setTimeout(() => setAiAlertMsg(null), 6000)
              } else {
                // No new hazards found
                setAiAlertMsg('No new hazards detected in your area')
                setTimeout(() => setAiAlertMsg(null), 4000)
              }
            })
            .catch((err) => {
              console.error('AI detection failed:', err)
              setAiAlertMsg('AI scan failed — try again later')
              setTimeout(() => setAiAlertMsg(null), 4000)
            })
            .finally(() => setDetectingAlerts(false))
        }
      },
      (err) => {
        setLocating(false)
        if (err.code === err.PERMISSION_DENIED) setLocError('Location access denied.')
        else if (err.code === err.POSITION_UNAVAILABLE) setLocError('Location unavailable.')
        else if (err.code === err.TIMEOUT) setLocError('Location request timed out.')
        else setLocError('Could not get location.')
      },
      { timeout: 10000, maximumAge: 60000 }
    )
  }

  // ── Fetch alerts + real-time polling ────────────────────────────────────────
  // Initial load
  useEffect(() => {
    getAlerts()
      .then(res => setAlerts(Array.isArray(res.data) ? res.data : []))
      .catch(() => setAlerts([]))
      .finally(() => setLoading(false))
  }, [])

  // Poll every 30s — only update state if alerts actually changed
  useEffect(() => {
    const poll = setInterval(async () => {
      try {
        const res = await getAlerts()
        if (!Array.isArray(res.data)) return
        setAlerts(prev => {
          // Compare by stringifying sorted IDs — cheap change detection
          const prevIds = prev.map(a => a.id).sort().join(',')
          const nextIds = res.data.map((a: Alert) => a.id).sort().join(',')
          if (prevIds === nextIds) return prev   // no change, skip re-render
          return res.data
        })
      } catch {
        // silently ignore poll failures
      }
    }, 30000)
    return () => clearInterval(poll)
  }, [])

  // Re-fetch immediately when the tab becomes visible again
  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === 'visible') {
        getAlerts()
          .then(res => {
            if (Array.isArray(res.data)) setAlerts(res.data)
          })
          .catch(() => {})
      }
    }
    document.addEventListener('visibilitychange', onVisible)
    return () => document.removeEventListener('visibilitychange', onVisible)
  }, [])

  const filteredAlerts = filter === 'all' ? alerts : alerts.filter(a => a.alert_type === filter)

  const focusAlert = (lat: number, lng: number) => {
    setEndLocation(`${lat}, ${lng}`)
    setDirectionsVisible(true)
    placeEndMarker(lat, lng)
    if (mapRef.current) {
      mapRef.current.setView([lat, lng], 15)
      const found = markersRef.current.find(m => {
        const pos = m.getLatLng()
        return Math.abs(pos.lat - lat) < 0.0001 && Math.abs(pos.lng - lng) < 0.0001
      })
      if (found) found.openPopup()
    }
    setRightPanelOpen(false)
  }

  // ── Init map ────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (mapRef.current) return
    mapRef.current = L.map('map', { zoomControl: false }).setView([18.5204, 73.8567], 13)
    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
      subdomains: 'abcd', maxZoom: 20,
    }).addTo(mapRef.current)
    L.control.zoom({ position: 'bottomright' }).addTo(mapRef.current)

    mapRef.current.on('click', (e: any) => {
      if (!dirVisibleRef.current) return
      const { lat, lng } = e.latlng
      const coordStr = `${lat.toFixed(4)}, ${lng.toFixed(4)}`
      if (!startLocRef.current) {
        setStartLocation(coordStr); placeStartMarker(lat, lng)
      } else if (!endLocRef.current) {
        setEndLocation(coordStr); placeEndMarker(lat, lng)
      }
    })

    // Load route from query params (from My Routes "Navigate" button)
    const params = new URLSearchParams(window.location.search)
    const sLat = parseFloat(params.get('start_lat') || '')
    const sLng = parseFloat(params.get('start_lng') || '')
    const eLat = parseFloat(params.get('end_lat') || '')
    const eLng = parseFloat(params.get('end_lng') || '')

    if (!isNaN(sLat) && !isNaN(sLng) && !isNaN(eLat) && !isNaN(eLng)) {
      setDirectionsVisible(true)
      setStartLocation(`${sLat.toFixed(4)}, ${sLng.toFixed(4)}`)
      setEndLocation(`${eLat.toFixed(4)}, ${eLng.toFixed(4)}`)

      // Small delay so map is ready
      setTimeout(() => {
        const startIcon = L.divIcon({
          className: '',
          html: `<div style="width:32px;height:32px;border-radius:50%;background:#10B981;display:flex;align-items:center;justify-content:center;box-shadow:0 3px 8px rgba(0,0,0,0.3);border:3px solid white;"><i class="fas fa-flag-checkered" style="color:white;font-size:12px;"></i></div>`,
          iconSize: [32, 32], iconAnchor: [16, 16],
        })
        const endIcon = L.divIcon({
          className: '',
          html: `<div style="width:32px;height:32px;border-radius:50%;background:#EF4444;display:flex;align-items:center;justify-content:center;box-shadow:0 3px 8px rgba(0,0,0,0.3);border:3px solid white;"><i class="fas fa-map-marker-alt" style="color:white;font-size:12px;"></i></div>`,
          iconSize: [32, 32], iconAnchor: [16, 32],
        })
        routingControlRef.current = L.Routing.control({
          waypoints: [L.latLng(sLat, sLng), L.latLng(eLat, eLng)],
          router: L.Routing.osrmv1({ serviceUrl: 'https://router.project-osrm.org/route/v1', profile: 'driving' }),
          lineOptions: { styles: [{ color: '#10B981', weight: 6, opacity: 0.9 }], extendToWaypoints: true, missingRouteTolerance: 0 },
          createMarker: (i: number, waypoint: any) => L.marker(waypoint.latLng, { icon: i === 0 ? startIcon : endIcon, draggable: true }),
          show: false, collapsible: false, fitSelectedRoutes: true, showAlternatives: false, addWaypoints: false,
        }).addTo(mapRef.current)

        routingControlRef.current.on('routesfound', (e: any) => {
          const route = e.routes[0]
          setRouteDistance(formatDistance(route.summary.totalDistance))
          setRouteTime(formatDuration(route.summary.totalTime))
          setRouteActive(true)
          const steps: string[] = route.instructions ? route.instructions.map((s: any) => s.text) : []
          setRouteSteps(steps)
          setCurrentStepIdx(0)
        })
      }, 300)
    }
  }, [])

  // ── Alert markers ───────────────────────────────────────────────────────────
  useEffect(() => {
    if (!mapRef.current) return
    markersRef.current.forEach(m => m.remove())
    markersRef.current = []
    filteredAlerts.forEach(alert => {
      const marker = L.marker([alert.location_lat, alert.location_lng], { icon: makeIcon(alert.alert_type) })
        .addTo(mapRef.current)
        .bindPopup(`
          <div style="min-width:180px">
            <div style="font-weight:600;margin-bottom:4px;font-size:14px;">${alert.title}</div>
            <span class="badge badge-${alert.alert_type === 'Traffic' ? 'danger' : alert.alert_type === 'Emergency' ? 'purple' : alert.alert_type === 'Construction' ? 'warning' : 'info'}" style="margin-bottom:8px;display:inline-flex;">${alert.alert_type}</span>
            <div style="color:var(--text-secondary);font-size:13px;">${alert.description}</div>
          </div>
        `)
      markersRef.current.push(marker)
    })
  }, [filteredAlerts])

  // ── Heatmap layer (gov officials only) ──────────────────────────────────────
  useEffect(() => {
    if (!mapRef.current) return
    if (heatLayerRef.current) {
      heatLayerRef.current.remove()
      heatLayerRef.current = null
    }
    // Only render for verified government users
    if (!heatmapOn || !isGovUser || alerts.length === 0) return

    // Build [lat, lng, intensity] points — Emergency gets higher weight
    const INTENSITY: Record<string, number> = {
      Emergency: 1.0,
      Traffic: 0.7,
      Weather: 0.6,
      Construction: 0.5,
    }
    const points = alerts.map(a => [
      a.location_lat,
      a.location_lng,
      INTENSITY[a.alert_type] ?? 0.5,
    ])

    heatLayerRef.current = (L as any).heatLayer(points, {
      radius: 80,
      blur: 60,
      maxZoom: 18,
      minOpacity: 0.5,
      gradient: { 0.2: '#3B82F6', 0.45: '#10B981', 0.65: '#F59E0B', 0.85: '#EF4444', 1.0: '#7C3AED' },
    }).addTo(mapRef.current)
  }, [heatmapOn, isGovUser, alerts])

  // ── Alert radius circles ─────────────────────────────────────────────────────
  const ALERT_RADIUS: Record<string, number> = {
    Traffic: 300,
    Emergency: 500,
    Construction: 200,
    Weather: 800,
  }
  const ALERT_CIRCLE_COLOR: Record<string, string> = {
    Traffic: '#EF4444',
    Emergency: '#8B5CF6',
    Construction: '#F59E0B',
    Weather: '#3B82F6',
  }

  useEffect(() => {
    if (!mapRef.current) return
    // Remove old circles
    radiusCirclesRef.current.forEach(c => c.remove())
    radiusCirclesRef.current = []
    if (!radiusOn) return

    filteredAlerts.forEach(alert => {
      const color = ALERT_CIRCLE_COLOR[alert.alert_type] || '#94A3B8'
      const radius = ALERT_RADIUS[alert.alert_type] || 300
      const circle = L.circle([alert.location_lat, alert.location_lng], {
        radius,
        color,
        fillColor: color,
        fillOpacity: 0.08,
        weight: 1.5,
        opacity: 0.35,
        dashArray: '4 4',
      }).addTo(mapRef.current)
      radiusCirclesRef.current.push(circle)
    })
  }, [filteredAlerts, radiusOn])

  // ── Route hazard overlay (pulsing ring on alerts near active route) ──────────
  // Haversine distance in metres between two lat/lng points
  const haversineDistance = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
    const R = 6371000
    const dLat = (lat2 - lat1) * Math.PI / 180
    const dLng = (lng2 - lng1) * Math.PI / 180
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  }

  // Point-to-segment distance (for checking against each route segment)
  const pointToSegmentDistance = (
    pLat: number, pLng: number,
    aLat: number, aLng: number,
    bLat: number, bLng: number
  ): number => {
    const dx = bLat - aLat, dy = bLng - aLng
    if (dx === 0 && dy === 0) return haversineDistance(pLat, pLng, aLat, aLng)
    const t = Math.max(0, Math.min(1, ((pLat - aLat) * dx + (pLng - aLng) * dy) / (dx * dx + dy * dy)))
    return haversineDistance(pLat, pLng, aLat + t * dx, aLng + t * dy)
  }

  useEffect(() => {
    // Clear previous pulse markers
    pulseMarkersRef.current.forEach(m => m.remove())
    pulseMarkersRef.current = []
    setRouteHazardCount(0)

    // Hazard overlay only shown to logged-in users
    if (!routeActive || !isLoggedIn || !mapRef.current) return

    // Get the actual route polyline coords from LRM
    const lrm = routingControlRef.current
    if (!lrm) return
    const routes = lrm.getRouter ? null : lrm._routes
    // Use waypoints as a fallback segment if detailed coords unavailable
    const waypoints = lrm.getWaypoints ? lrm.getWaypoints() : []
    const segments: Array<[number, number]> = waypoints.map((wp: any) => [wp.latLng.lat, wp.latLng.lng])

    if (segments.length < 2) return

    const HAZARD_RADIUS_M = 500
    let hazards = 0

    alerts.forEach(alert => {
      // Check distance from alert to each segment of the route
      let minDist = Infinity
      for (let i = 0; i < segments.length - 1; i++) {
        const d = pointToSegmentDistance(
          alert.location_lat, alert.location_lng,
          segments[i][0], segments[i][1],
          segments[i + 1][0], segments[i + 1][1]
        )
        if (d < minDist) minDist = d
      }

      if (minDist <= HAZARD_RADIUS_M) {
        hazards++
        const color = ALERT_CIRCLE_COLOR[alert.alert_type] || '#EF4444'
        // Pulsing ring marker using a divIcon with CSS animation
        const pulseIcon = L.divIcon({
          className: '',
          html: `
            <div class="alert-pulse-ring" style="--pulse-color:${color};">
              <div class="alert-pulse-dot" style="background:${color};"></div>
            </div>
          `,
          iconSize: [48, 48],
          iconAnchor: [24, 24],
        })
        const pm = L.marker([alert.location_lat, alert.location_lng], { icon: pulseIcon, zIndexOffset: -100 })
          .addTo(mapRef.current)
          .bindPopup(`<div style="min-width:160px"><strong style="color:${color}">⚠ Hazard on Route</strong><br/><b>${alert.title}</b><br/><span style="font-size:12px;color:#6b7280">${alert.description}</span></div>`)
        pulseMarkersRef.current.push(pm)
      }
    })

    setRouteHazardCount(hazards)
  }, [routeActive, isLoggedIn, alerts])

  // ── Share route ──────────────────────────────────────────────────────────────
  const handleShareRoute = () => {
    const start = parseCoords(startLocation)
    const end = parseCoords(endLocation)
    if (!start || !end) {
      alert('Please set a route first before sharing.')
      return
    }
    const url = new URL(window.location.href)
    url.pathname = '/map'
    url.search = `?start_lat=${start[0]}&start_lng=${start[1]}&end_lat=${end[0]}&end_lng=${end[1]}`
    navigator.clipboard.writeText(url.toString()).then(() => {
      setShareCopied(true)
      setTimeout(() => setShareCopied(false), 2500)
    }).catch(() => {
      // Fallback for non-secure contexts
      prompt('Copy this route link:', url.toString())
    })
  }

  // ── In-journey AI chat ──────────────────────────────────────────────────────
  const sendNavMessage = async (text: string) => {
    const trimmed = text.trim()
    if (!trimmed || chatLoading) return

    const userMsg: NavMessage = { id: Date.now(), role: 'user', content: trimmed }
    const loadingMsg: NavMessage = { id: Date.now() + 1, role: 'assistant', content: '', loading: true }
    setNavMessages(prev => [...prev, userMsg, loadingMsg])
    setChatInput('')
    setChatLoading(true)

    try {
      const start = parseCoords(startLocation)
      const end = parseCoords(endLocation)
      const res = await getAiNavigationChat({
        message: trimmed,
        ...(start ? { start_lat: start[0], start_lng: start[1] } : {}),
        ...(end ? { end_lat: end[0], end_lng: end[1] } : {}),
        ...(routeSteps[currentStepIdx] ? { current_step: routeSteps[currentStepIdx] } : {}),
        ...(routeDistance ? { total_distance: routeDistance } : {}),
        ...(routeTime ? { total_time: routeTime } : {}),
      })
      setNavMessages(prev =>
        prev.map(m => m.loading ? { ...m, content: res.data.reply, loading: false } : m)
      )
    } catch {
      setNavMessages(prev =>
        prev.map(m => m.loading ? { ...m, content: 'Sorry, could not reach the AI right now. Please try again.', loading: false } : m)
      )
    } finally {
      setChatLoading(false)
      chatInputRef.current?.focus()
    }
  }

  const handleChatSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    sendNavMessage(chatInput)
  }

  const handleChatKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendNavMessage(chatInput)
    }
  }

  const NAV_SUGGESTIONS = [
    'Is my route safe right now?',
    'Any incidents ahead?',
    'Suggest an alternate route',
    'How long will it take?',
  ]

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="map-layout">

      {/* ── Left Panel: Controls ── */}
      <aside className={`map-panel map-panel-left ${leftPanelOpen ? 'is-open' : ''}`}>
        <div className="map-panel-header">
          <span>Map Controls</span>
          <button className="btn-icon hide-desktop" onClick={() => setLeftPanelOpen(false)}>
            <i className="fas fa-times"></i>
          </button>
        </div>
        <div className="map-panel-content">

          {/* Map search */}
          <form className="field mb-4" onSubmit={handleMapSearch}>
            <div className="input-icon">
              <i className="fas fa-search icon-left"></i>
              <input className="input" type="text" placeholder="Search any location..." value={mapSearchQuery} onChange={e => setMapSearchQuery(e.target.value)} />
              {mapSearching && <span className="spinner" style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', width: '14px', height: '14px', borderWidth: '2px' }}></span>}
            </div>
          </form>

          {/* My location */}
          <button className="btn btn-primary btn-full mb-2" onClick={handleMyLocation} disabled={locating}>
            {locating ? <span className="spinner"></span> : <i className="fas fa-location-arrow"></i>}
            <span>Find My Location</span>
          </button>
          {locError && <p className="help-text is-danger mb-4">{locError}</p>}

          {/* AI detection status */}
          {detectingAlerts && (
            <div className="ai-detect-banner mb-3">
              <span className="spinner" style={{ width: '12px', height: '12px', borderWidth: '2px', flexShrink: 0 }}></span>
              <span>AI scanning for nearby hazards...</span>
            </div>
          )}
          {aiAlertMsg && !detectingAlerts && (
            <div className={`ai-detect-banner mb-3 ${
              aiAlertMsg.startsWith('AI detected') ? 'is-success' :
              aiAlertMsg.startsWith('No new') ? 'is-clear' : 'is-error'
            }`}>
              <i className={`fas ${
                aiAlertMsg.startsWith('AI detected') ? 'fa-robot' :
                aiAlertMsg.startsWith('No new') ? 'fa-check-circle' : 'fa-exclamation-circle'
              }`} style={{ flexShrink: 0 }}></i>
              <span>{aiAlertMsg}</span>
              <button className="btn-icon btn-sm btn-ghost ml-auto" style={{ flexShrink: 0 }} onClick={() => setAiAlertMsg(null)}>
                <i className="fas fa-times" style={{ fontSize: '10px' }}></i>
              </button>
            </div>
          )}

          {/* Toggle route planner */}
          <button className={`btn btn-full mb-2 ${directionsVisible ? 'btn-secondary' : 'btn-white'}`} onClick={() => setDirectionsVisible(!directionsVisible)}>
            <i className="fas fa-directions text-primary"></i>
            <span>{directionsVisible ? 'Hide Route Planner' : 'Plan a Route'}</span>
          </button>

          {directionsVisible && (
            <div className="card mt-2 mb-4">
              <div className="card-header" style={{ padding: 'var(--space-3)' }}>
                <span className="font-semibold text-sm"><i className="fas fa-directions text-primary mr-2"></i> Directions</span>
                <button className="btn-icon btn-sm btn-ghost" onClick={() => setDirectionsVisible(false)}><i className="fas fa-times"></i></button>
              </div>
              <div className="card-body" style={{ padding: 'var(--space-3)' }}>
                {geocodeError && (
                  <div className="alert-banner is-danger mb-3" style={{ padding: 'var(--space-2) var(--space-3)', fontSize: 'var(--text-xs)' }}>
                    <i className="fas fa-exclamation-circle"></i>
                    <span>{geocodeError}</span>
                    <button className="btn-icon btn-sm btn-ghost ml-auto" onClick={() => setGeocodeError(null)}><i className="fas fa-times"></i></button>
                  </div>
                )}

                {/* Start */}
                <div className="field mb-3">
                  <label className="label text-xs text-muted" style={{ marginBottom: '4px' }}>Starting Point</label>
                  <div className="flex gap-2">
                    <div className="input-icon flex-1">
                      <i className="fas fa-map-marker-alt icon-left text-primary"></i>
                      <input className="input" type="text" placeholder="e.g. Pune Station" value={startPlaceName} onChange={e => setStartPlaceName(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleGeocodeStart()} />
                    </div>
                    <button className="btn btn-primary btn-sm" style={{ flexShrink: 0 }} onClick={handleGeocodeStart} disabled={geocodingStart || !startPlaceName.trim()}>
                      {geocodingStart ? <span className="spinner" style={{ width: '12px', height: '12px', borderWidth: '2px' }}></span> : <i className="fas fa-search"></i>}
                    </button>
                  </div>
                  {startLocation && <p className="help-text mt-1" style={{ fontSize: '10px' }}><i className="fas fa-check-circle text-primary mr-1"></i>Located · or click map to adjust</p>}
                </div>

                {/* End */}
                <div className="field mb-3">
                  <label className="label text-xs text-muted" style={{ marginBottom: '4px' }}>Destination</label>
                  <div className="flex gap-2">
                    <div className="input-icon flex-1">
                      <i className="fas fa-flag-checkered icon-left text-danger"></i>
                      <input className="input" type="text" placeholder="e.g. Bandra, Mumbai" value={endPlaceName} onChange={e => setEndPlaceName(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleGeocodeEnd()} />
                    </div>
                    <button className="btn btn-primary btn-sm" style={{ flexShrink: 0 }} onClick={handleGeocodeEnd} disabled={geocodingEnd || !endPlaceName.trim()}>
                      {geocodingEnd ? <span className="spinner" style={{ width: '12px', height: '12px', borderWidth: '2px' }}></span> : <i className="fas fa-search"></i>}
                    </button>
                  </div>
                  {endLocation && <p className="help-text mt-1" style={{ fontSize: '10px' }}><i className="fas fa-check-circle text-primary mr-1"></i>Located · or click map to adjust</p>}
                </div>

                {/* Route info bar */}
                {routeActive && routeDistance && routeTime && (
                  <div className="nav-route-info-bar mb-3">
                    <div className="nav-route-stat"><i className="fas fa-road"></i><span>{routeDistance}</span></div>
                    <div className="nav-route-divider"></div>
                    <div className="nav-route-stat"><i className="fas fa-clock"></i><span>{routeTime}</span></div>
                  </div>
                )}

                <div className="flex gap-2">
                  <button className="btn btn-primary flex-1" onClick={handleGetRoute}>Get Route</button>
                  <button className="btn btn-white" onClick={handleClearRoute} title="Clear Route"><i className="fas fa-undo"></i> Clear</button>
                </div>

                {/* Share route button */}
                {routeActive && (
                  <button
                    className={`btn btn-full mt-2 ${shareCopied ? 'btn-primary' : 'btn-ghost'}`}
                    onClick={handleShareRoute}
                    style={{ border: '1px solid var(--border-color)' }}
                  >
                    <i className={`fas ${shareCopied ? 'fa-check' : 'fa-share-alt'} mr-2`}></i>
                    {shareCopied ? 'Link Copied!' : 'Share Route'}
                  </button>
                )}

                {/* Route hazard warning — logged-in users only */}
                {routeActive && isLoggedIn && routeHazardCount > 0 && (
                  <div className="route-hazard-banner mt-2">
                    <i className="fas fa-exclamation-triangle"></i>
                    <span>
                      <strong>{routeHazardCount} hazard{routeHazardCount > 1 ? 's' : ''}</strong> detected within 500 m of your route
                    </span>
                  </div>
                )}
                {routeActive && !isLoggedIn && (
                  <div className="route-hazard-banner mt-2" style={{ background: '#f0fdf4', borderColor: '#bbf7d0', color: '#166534' }}>
                    <i className="fas fa-info-circle" style={{ color: '#10B981' }}></i>
                    <span><a href="/login" style={{ color: '#10B981', fontWeight: 600 }}>Sign in</a> to see hazards on your route</span>
                  </div>
                )}

                {isLoggedIn && (
                  <button className="btn btn-secondary btn-full mt-2" onClick={() => {
                    if (!parseCoords(startLocation) || !parseCoords(endLocation)) { alert('Please set a starting point and destination first.'); return }
                    setSaveModalActive(true)
                  }}>
                    <i className="fas fa-save mr-2"></i> Save Route
                  </button>
                )}

                <p className="text-xs text-muted mt-3" style={{ lineHeight: '1.4' }}>
                  <i className="fas fa-info-circle mr-1 text-primary"></i>
                  Type a place name and press Search, or click the map to drop pins directly.
                </p>
              </div>
            </div>
          )}

          <hr className="separator" />

          {/* Map layer toggles */}
          <h3 className="font-semibold text-sm mb-3 text-secondary">MAP LAYERS</h3>
          <div className="flex-col gap-2 mb-4">
            {/* Heatmap — gov officials only */}
            {isGovUser ? (
              <button
                className={`btn btn-full flex-between ${heatmapOn ? 'btn-secondary' : 'btn-ghost'}`}
                onClick={() => setHeatmapOn(v => !v)}
                style={{ justifyContent: 'flex-start' }}
              >
                <div className={`icon-box-sm ${heatmapOn ? 'danger' : 'bg-muted'}`}>
                  <i className="fas fa-fire"></i>
                </div>
                <span className="flex-1 text-left ml-2">Alert Heatmap</span>
                <div className={`toggle-pill ${heatmapOn ? 'is-on' : ''}`}></div>
              </button>
            ) : (
              <div className="btn btn-full btn-ghost layer-locked" style={{ justifyContent: 'flex-start', opacity: 0.5, cursor: 'not-allowed' }} title="Available to verified government officials only">
                <div className="icon-box-sm bg-muted"><i className="fas fa-fire"></i></div>
                <span className="flex-1 text-left ml-2">Alert Heatmap</span>
                <i className="fas fa-lock text-muted" style={{ fontSize: '11px' }}></i>
              </div>
            )}

            {/* Radius circles — all users */}
            <button
              className={`btn btn-full flex-between ${radiusOn ? 'btn-secondary' : 'btn-ghost'}`}
              onClick={() => setRadiusOn(v => !v)}
              style={{ justifyContent: 'flex-start' }}
            >
              <div className={`icon-box-sm ${radiusOn ? 'info' : 'bg-muted'}`}>
                <i className="fas fa-circle-notch"></i>
              </div>
              <span className="flex-1 text-left ml-2">Affected Radius</span>
              <div className={`toggle-pill ${radiusOn ? 'is-on' : ''}`}></div>
            </button>
          </div>

          <hr className="separator" />

          {/* Alert filters */}
          <h3 className="font-semibold text-sm mb-3 text-secondary">FILTER ALERTS</h3>
          <div className="flex-col gap-2">
            {[
              { key: 'all', label: 'All Alerts', icon: 'fa-globe', cls: 'bg-muted' },
              { key: 'Traffic', label: 'Traffic', icon: 'fa-car-crash', cls: 'danger' },
              { key: 'Emergency', label: 'Emergency', icon: 'fa-exclamation-triangle', cls: 'purple' },
              { key: 'Construction', label: 'Construction', icon: 'fa-hard-hat', cls: 'warning' },
              { key: 'Weather', label: 'Weather', icon: 'fa-cloud-rain', cls: 'info' },
            ].map(f => (
              <button key={f.key} className={`btn btn-full flex-between ${filter === f.key ? 'btn-secondary' : 'btn-ghost'}`} onClick={() => setFilter(f.key)} style={{ justifyContent: 'flex-start' }}>
                <div className={`icon-box-sm ${f.cls}`}><i className={`fas ${f.icon}`}></i></div>
                <span className="flex-1 text-left ml-2">{f.label}</span>
                {filter === f.key && <i className="fas fa-check text-primary"></i>}
              </button>
            ))}
          </div>
        </div>
      </aside>

      {/* ── Map Center ── */}
      <main className="map-center" style={{ position: 'relative' }}>
        <div id="map" className="map-full"></div>

        {/* Active navigation bar — shows current step */}
        {routeActive && routeSteps.length > 0 && (
          <div className="nav-active-bar">
            <div className="nav-active-bar-inner">
              <div className="nav-step-icon">
                <i className="fas fa-arrow-right"></i>
              </div>
              <div className="nav-step-text">
                <div className="nav-step-instruction">{routeSteps[currentStepIdx]}</div>
                <div className="nav-step-meta">Step {currentStepIdx + 1} of {routeSteps.length}</div>
              </div>
              <div className="nav-step-controls">
                <button
                  className="nav-step-btn"
                  onClick={() => setCurrentStepIdx(i => Math.max(0, i - 1))}
                  disabled={currentStepIdx === 0}
                  title="Previous step"
                >
                  <i className="fas fa-chevron-up"></i>
                </button>
                <button
                  className="nav-step-btn"
                  onClick={() => setCurrentStepIdx(i => Math.min(routeSteps.length - 1, i + 1))}
                  disabled={currentStepIdx === routeSteps.length - 1}
                  title="Next step"
                >
                  <i className="fas fa-chevron-down"></i>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* AI Chat FAB — only when logged in and route is active */}
        {isLoggedIn && (
          <button
            className={`nav-chat-fab ${chatOpen ? 'is-open' : ''}`}
            onClick={() => setChatOpen(o => !o)}
            title="Chat with AI co-pilot"
            aria-label="Open navigation AI chat"
          >
            {chatOpen
              ? <i className="fas fa-times"></i>
              : <><i className="fas fa-robot"></i><span className="nav-chat-fab-label">AI Co-pilot</span></>
            }
          </button>
        )}

        {/* In-journey AI chat panel */}
        {isLoggedIn && chatOpen && (
          <div className="nav-chat-panel">
            <div className="nav-chat-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div className="nav-chat-avatar"><i className="fas fa-robot"></i></div>
                <div>
                  <div style={{ fontWeight: 600, fontSize: '14px', color: 'var(--text-primary)' }}>Navigation Co-pilot</div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                    {routeActive ? `${routeDistance} · ${routeTime}` : 'Ask me about road conditions'}
                  </div>
                </div>
              </div>
              <button className="btn-icon btn-sm btn-ghost" onClick={() => setChatOpen(false)}><i className="fas fa-chevron-down"></i></button>
            </div>

            {/* Messages */}
            <div className="nav-chat-messages">
              {navMessages.map(msg => (
                <div key={msg.id} className={`nav-chat-msg ${msg.role === 'user' ? 'is-user' : 'is-ai'}`}>
                  {msg.role === 'assistant' && (
                    <div className="nav-chat-msg-avatar ai"><i className="fas fa-robot"></i></div>
                  )}
                  <div className={`nav-chat-bubble ${msg.role === 'user' ? 'is-user' : 'is-ai'}`}>
                    {msg.loading ? (
                      <div style={{ display: 'flex', gap: '4px', alignItems: 'center', padding: '4px 0' }}>
                        <span className="nav-chat-dot"></span>
                        <span className="nav-chat-dot" style={{ animationDelay: '0.2s' }}></span>
                        <span className="nav-chat-dot" style={{ animationDelay: '0.4s' }}></span>
                      </div>
                    ) : msg.content}
                  </div>
                  {msg.role === 'user' && (
                    <div className="nav-chat-msg-avatar user"><i className="fas fa-user"></i></div>
                  )}
                </div>
              ))}
              <div ref={chatBottomRef} />
            </div>

            {/* Quick suggestions */}
            <div className="nav-chat-suggestions">
              {NAV_SUGGESTIONS.map((s, i) => (
                <button key={i} className="nav-chat-chip" onClick={() => sendNavMessage(s)} disabled={chatLoading}>{s}</button>
              ))}
            </div>

            {/* Input */}
            <form className="nav-chat-input-bar" onSubmit={handleChatSubmit}>
              <textarea
                ref={chatInputRef}
                className="nav-chat-textarea"
                placeholder="Ask about your route..."
                value={chatInput}
                onChange={e => setChatInput(e.target.value)}
                onKeyDown={handleChatKeyDown}
                rows={1}
                disabled={chatLoading}
              />
              <button type="submit" className="nav-chat-send" disabled={chatLoading || !chatInput.trim()} title="Send">
                {chatLoading
                  ? <span className="spinner" style={{ width: '14px', height: '14px', borderWidth: '2px' }}></span>
                  : <i className="fas fa-paper-plane"></i>
                }
              </button>
            </form>
          </div>
        )}

        {/* Mobile FABs */}
        <div className="hide-desktop" style={{ position: 'absolute', bottom: '24px', left: '0', right: '0', display: 'flex', justifyContent: 'center', gap: 'var(--space-4)', zIndex: 5 }}>
          <button className="btn btn-primary shadow-lg" style={{ borderRadius: 'var(--radius-full)' }} onClick={() => { setLeftPanelOpen(true); setRightPanelOpen(false) }}>
            <i className="fas fa-sliders-h"></i> Filters
          </button>
          <button className="btn btn-white shadow-lg" style={{ borderRadius: 'var(--radius-full)' }} onClick={() => { setRightPanelOpen(true); setLeftPanelOpen(false) }}>
            <i className="fas fa-list-ul text-primary"></i> Alerts
          </button>
        </div>
      </main>

      {/* ── Right Panel: Live Feed ── */}
      <aside className={`map-panel map-panel-right ${rightPanelOpen ? 'is-open' : ''}`}>
        <div className="map-panel-header">
          <div className="flex-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-pulse absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" style={{ backgroundColor: 'var(--color-primary)' }}></span>
              <span className="relative inline-flex rounded-full" style={{ width: '8px', height: '8px', backgroundColor: 'var(--color-primary)' }}></span>
            </span>
            <span>Live Feed {filteredAlerts.length > 0 && `(${filteredAlerts.length})`}</span>
            <span style={{ fontSize: '10px', color: 'var(--text-muted)', marginLeft: '4px' }}>· updates every 30s</span>
          </div>
          <button className="btn-icon hide-desktop" onClick={() => setRightPanelOpen(false)}>
            <i className="fas fa-times"></i>
          </button>
        </div>
        <div className="map-panel-content" style={{ padding: 'var(--space-3)' }}>

          {/* Pill filters */}
          <div className="pill-filters mb-4" style={{ flexWrap: 'wrap', display: 'flex', gap: '8px' }}>
            {['all', 'Traffic', 'Emergency', 'Construction', 'Weather'].map(f => (
              <button key={f} className={`pill ${filter === f ? 'active' : ''}`} onClick={() => setFilter(f)}>
                {f !== 'all' && <i className={`fas ${ICON_FA[f] || 'fa-bell'}`}></i>} {f === 'all' ? 'All' : f}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="flex-center flex-col gap-3 py-10 text-muted">
              <span className="spinner" style={{ width: '24px', height: '24px', borderWidth: '3px' }}></span>
              <span className="text-sm">Loading area intel...</span>
            </div>
          ) : filteredAlerts.length > 0 ? (
            filteredAlerts.map(alert => (
              <div key={alert.id} className="feed-card" onClick={() => focusAlert(alert.location_lat, alert.location_lng)} style={{
                borderLeft: `3px solid ${alert.alert_type === 'Traffic' ? 'var(--color-danger)' : alert.alert_type === 'Emergency' ? 'var(--color-purple)' : alert.alert_type === 'Construction' ? 'var(--color-warning)' : 'var(--color-info)'}`
              }}>
                <div className="feed-icon" style={{
                  background: alert.alert_type === 'Traffic' ? 'var(--color-danger-light)' : alert.alert_type === 'Emergency' ? 'var(--color-purple-light)' : alert.alert_type === 'Construction' ? 'var(--color-warning-light)' : 'var(--color-info-light)',
                  color: alert.alert_type === 'Traffic' ? 'var(--color-danger)' : alert.alert_type === 'Emergency' ? 'var(--color-purple)' : alert.alert_type === 'Construction' ? 'var(--color-warning)' : 'var(--color-info)'
                }}>
                  <i className={`fas ${ICON_FA[alert.alert_type] || 'fa-bell'}`}></i>
                </div>
                <div className="feed-content">
                  <div className="feed-title">{alert.title}</div>
                  <div className="feed-meta">
                    <span>{alert.alert_type}</span>
                    <span>•</span>
                    <span>{new Date(alert.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="flex-center flex-col py-10 text-center px-4">
              <div className="icon-box bg-subtle text-muted mb-4 text-2xl"><i className="fas fa-check-circle"></i></div>
              <h4 className="font-semibold mb-1">All Clear</h4>
              <p className="text-sm text-secondary">No alerts active for the selected filters in this region.</p>
            </div>
          )}
        </div>
      </aside>

      {/* ── Save Route Modal ── */}
      {saveModalActive && (
        <div className="modal-overlay" style={{ zIndex: 1000 }}>
          <div className="modal-card">
            <div className="modal-card-header">
              <h3 className="font-semibold text-lg"><i className="fas fa-save text-primary mr-2"></i> Save Route</h3>
              <button className="close-btn" onClick={() => setSaveModalActive(false)}><i className="fas fa-times"></i></button>
            </div>
            <div className="modal-card-body">
              <p className="text-secondary text-sm mb-4">Give your route a name so you can quickly navigate it later.</p>
              <div className="field">
                <label className="label">Route Name</label>
                <input className="input" type="text" placeholder="e.g. Home to Work" value={routeName} onChange={e => setRouteName(e.target.value)} maxLength={50} autoFocus />
              </div>
            </div>
            <div className="modal-card-footer">
              <button className="btn btn-ghost" onClick={() => setSaveModalActive(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={confirmSaveRoute} disabled={isSavingRoute}>
                {isSavingRoute ? <span className="spinner"></span> : 'Save Route'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
