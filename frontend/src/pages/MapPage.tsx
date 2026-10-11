import { useState, useEffect, useRef, useMemo } from 'react'
import type { FormEvent, KeyboardEvent } from 'react'
import { Link } from 'react-router-dom'
import { getAlerts, createRoute, getAiNavigationChat, getAiDetectAlerts, getRoutes } from '../api'
import type { Alert, SavedRoute } from '../types'
import { useAuth } from '../context/AuthContext'
import { geocode } from '../lib/geocode'
import { createMap, createRouter, isLeafletReady } from '../lib/mapConfig'
import { ALERT_TYPES, timeAgo, typeMeta } from '../lib/alertMeta'
import Seo from '../components/Seo'
import { EmptyState, TypeIcon } from '../components/ui'
import RichText from '../components/ai/RichText'
import '../styles/pages/map.css'

declare const L: any

type LatLng = [number, number]
type Tab = 'route' | 'alerts' | 'layers'

interface NavMessage {
  id: number
  role: 'user' | 'assistant'
  content: string
  loading?: boolean
}

// ── Map helpers ──────────────────────────────────────────────────────────────

// How far (metres) each alert type's impact zone reaches
const ALERT_RADIUS: Record<string, number> = { Traffic: 300, Emergency: 500, Construction: 200, Weather: 800 }
const HAZARD_RADIUS_M = 500

const NAV_SUGGESTIONS = ['Is my route safe right now?', 'Any incidents ahead?', 'Suggest an alternate route', 'How long will it take?']

// Alert text comes from users (citizen reports), so escape before it goes into Leaflet's HTML popups
const esc = (s: string) =>
  s.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!))

function alertIcon(type: string) {
  const m = typeMeta(type)
  return L.divIcon({
    className: '',
    html: `<div class="mp-marker" style="--c:${m.color}"><i class="fas ${m.icon}"></i></div>`,
    iconSize: [34, 42],
    iconAnchor: [17, 42],
    popupAnchor: [0, -40],
  })
}

function pinIcon(kind: 'start' | 'end' | 'me') {
  const cfg = {
    start: { c: '#059669', i: 'fa-circle-dot' },
    end: { c: '#F07A1E', i: 'fa-flag-checkered' },
    me: { c: '#2563EB', i: 'fa-location-arrow' },
  }[kind]
  return L.divIcon({
    className: '',
    html: `<div class="mp-pin${kind === 'me' ? ' is-me' : ''}" style="--c:${cfg.c}"><i class="fas ${cfg.i}"></i></div>`,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
    popupAnchor: [0, -16],
  })
}

function popupHtml(a: Alert) {
  const m = typeMeta(a.alert_type)
  return `<div class="mp-popup">
    <span class="mp-popup-type" style="--c:${m.color}"><i class="fas ${m.icon}"></i> ${esc(m.label)}</span>
    <div class="mp-popup-title">${esc(a.title)}</div>
    <div class="mp-popup-desc">${esc(a.description)}</div>
    <div class="mp-popup-meta">${esc(timeAgo(a.created_at))}</div>
  </div>`
}

const parseCoords = (str: string): LatLng | null => {
  const parts = str.split(',').map(p => parseFloat(p.trim()))
  return parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1]) ? [parts[0], parts[1]] : null
}

const fmtCoords = (lat: number, lng: number) => `${lat.toFixed(5)}, ${lng.toFixed(5)}`

const formatDuration = (seconds: number) => {
  const h = Math.floor(seconds / 3600)
  const m = Math.round((seconds % 3600) / 60)
  return h > 0 ? `${h} hr ${m} min` : `${m} min`
}

const formatDistance = (meters: number) => (meters >= 1000 ? `${(meters / 1000).toFixed(1)} km` : `${Math.round(meters)} m`)

// Distance (m) from point P to segment AB, equirectangular — fine at city scale
function pointToSegmentM(p: LatLng, a: LatLng, b: LatLng): number {
  const kx = 111320 * Math.cos((p[0] * Math.PI) / 180)
  const ky = 110574
  const ax = a[1] * kx, ay = a[0] * ky, bx = b[1] * kx, by = b[0] * ky, px = p[1] * kx, py = p[0] * ky
  const dx = bx - ax, dy = by - ay
  const len = dx * dx + dy * dy
  const t = len === 0 ? 0 : Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / len))
  return Math.hypot(px - (ax + t * dx), py - (ay + t * dy))
}

// ── Component ────────────────────────────────────────────────────────────────

export default function MapPage() {
  const { isLoggedIn, isGovUser } = useAuth()

  // Alerts
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<string>('all')

  // Saved routes (quick start in the Route tab)
  const [savedRoutes, setSavedRoutes] = useState<SavedRoute[]>([])
  useEffect(() => {
    if (!isLoggedIn) return
    getRoutes().then(r => setSavedRoutes(Array.isArray(r.data) ? r.data : [])).catch(() => {})
  }, [isLoggedIn])

  // Panel
  const [tab, setTab] = useState<Tab>('route')
  const [sheetOpen, setSheetOpen] = useState(false)

  // Route planner
  const [startText, setStartText] = useState('')
  const [endText, setEndText] = useState('')
  const [startCoords, setStartCoords] = useState<LatLng | null>(null)
  const [endCoords, setEndCoords] = useState<LatLng | null>(null)
  const [geocoding, setGeocoding] = useState<'start' | 'end' | null>(null)
  const [routeError, setRouteError] = useState<string | null>(null)
  const [routing, setRouting] = useState(false)
  const [routeDistance, setRouteDistance] = useState<string | null>(null)
  const [routeTime, setRouteTime] = useState<string | null>(null)
  const [routeSteps, setRouteSteps] = useState<string[]>([])
  const [routeLine, setRouteLine] = useState<LatLng[]>([])
  const [currentStepIdx, setCurrentStepIdx] = useState(0)
  const [showSteps, setShowSteps] = useState(false)
  const [shareCopied, setShareCopied] = useState(false)

  // Save route
  const [saveOpen, setSaveOpen] = useState(false)
  const [routeName, setRouteName] = useState('')
  const [saving, setSaving] = useState(false)

  // Search + location + AI scan
  const [searchQuery, setSearchQuery] = useState('')
  const [searching, setSearching] = useState(false)
  const [locating, setLocating] = useState(false)
  const [status, setStatus] = useState<{ kind: 'info' | 'success' | 'error'; text: string; busy?: boolean } | null>(null)

  // Layers
  const [heatmapOn, setHeatmapOn] = useState(false)
  const [radiusOn, setRadiusOn] = useState(true)

  // In-journey AI chat
  const [chatOpen, setChatOpen] = useState(false)
  const [navMessages, setNavMessages] = useState<NavMessage[]>([
    { id: 0, role: 'assistant', content: "Hi! I'm your navigation co-pilot. Ask me about your route, road conditions or nearby alerts." },
  ])
  const [chatInput, setChatInput] = useState('')
  const [chatLoading, setChatLoading] = useState(false)
  const chatScrollRef = useRef<HTMLDivElement>(null)

  // Leaflet refs
  const mapEl = useRef<HTMLDivElement>(null)
  const mapRef = useRef<any>(null)
  const markersRef = useRef<Map<number, any>>(new Map())
  const circlesRef = useRef<any[]>([])
  const heatRef = useRef<any>(null)
  const pulseRef = useRef<any[]>([])
  const meMarkerRef = useRef<any>(null)
  const startMarkerRef = useRef<any>(null)
  const endMarkerRef = useRef<any>(null)
  const routingRef = useRef<any>(null)
  const focusRef = useRef<LatLng | null>(null)

  // Stale-closure-safe mirrors for Leaflet event handlers
  const tabRef = useRef<Tab>('route')
  const startRef = useRef<LatLng | null>(null)
  const endRef = useRef<LatLng | null>(null)
  useEffect(() => { tabRef.current = tab }, [tab])
  useEffect(() => { startRef.current = startCoords }, [startCoords])
  useEffect(() => { endRef.current = endCoords }, [endCoords])

  const routeActive = routeLine.length > 1

  const toast = (message: string, type: 'success' | 'danger' | 'info' | 'warning' = 'info') =>
    window.dispatchEvent(new CustomEvent('toast:show', { detail: { message, type } }))

  // The map page owns the viewport: stop the document behind it from scrolling
  useEffect(() => {
    document.documentElement.classList.add('map-lock')
    return () => document.documentElement.classList.remove('map-lock')
  }, [])

  // ── Pins ───────────────────────────────────────────────────────────────────
  const setPin = (kind: 'start' | 'end', at: LatLng | null) => {
    const ref = kind === 'start' ? startMarkerRef : endMarkerRef
    if (!at) { ref.current?.remove(); ref.current = null; return }
    if (!mapRef.current) return
    if (ref.current) ref.current.setLatLng(at)
    else ref.current = L.marker(at, { icon: pinIcon(kind) }).addTo(mapRef.current).bindPopup(kind === 'start' ? 'Start' : 'Destination')
  }

  const setPoint = (kind: 'start' | 'end', at: LatLng, label?: string) => {
    if (kind === 'start') { setStartCoords(at); setStartText(label ?? fmtCoords(at[0], at[1])) }
    else { setEndCoords(at); setEndText(label ?? fmtCoords(at[0], at[1])) }
    if (!routingRef.current) setPin(kind, at)
  }

  // ── Routing (single implementation used by the planner and by URL params) ──
  const clearRouteLayer = () => {
    routingRef.current?.remove()
    routingRef.current = null
    setRouteLine([])
    setRouteSteps([])
    setRouteDistance(null)
    setRouteTime(null)
    setCurrentStepIdx(0)
  }

  const startRouting = (start: LatLng, end: LatLng) => {
    if (!mapRef.current || !isLeafletReady() || !L.Routing) {
      setRouteError('Routing is still loading. Please try again in a moment.')
      return
    }
    clearRouteLayer()
    setPin('start', null)
    setPin('end', null)
    setRouteError(null)
    setRouting(true)

    const control = L.Routing.control({
      waypoints: [L.latLng(start[0], start[1]), L.latLng(end[0], end[1])],
      router: createRouter(),
      lineOptions: {
        styles: [
          { color: '#073B33', weight: 9, opacity: 0.25 },
          { color: '#10B981', weight: 5, opacity: 0.95 },
        ],
        extendToWaypoints: true,
        missingRouteTolerance: 0,
      },
      createMarker: (i: number, wp: any) => L.marker(wp.latLng, { icon: pinIcon(i === 0 ? 'start' : 'end'), draggable: true }),
      show: false,
      collapsible: false,
      fitSelectedRoutes: true,
      showAlternatives: false,
      addWaypoints: false,
    })

    control.on('routesfound', (e: any) => {
      const route = e.routes[0]
      setRouteDistance(formatDistance(route.summary.totalDistance))
      setRouteTime(formatDuration(route.summary.totalTime))
      setRouteSteps(route.instructions ? route.instructions.map((s: any) => s.text) : [])
      setRouteLine(route.coordinates.map((c: any) => [c.lat, c.lng] as LatLng))
      setCurrentStepIdx(0)
      setRouting(false)
      // Pins may have been dragged — keep the planner inputs in sync
      const wps = e.waypoints ?? control.getWaypoints()
      if (wps?.[0]?.latLng && wps?.[1]?.latLng) {
        const s: LatLng = [wps[0].latLng.lat, wps[0].latLng.lng]
        const t: LatLng = [wps[1].latLng.lat, wps[1].latLng.lng]
        setStartCoords(prev => (prev && prev[0] === s[0] && prev[1] === s[1] ? prev : s))
        setEndCoords(prev => (prev && prev[0] === t[0] && prev[1] === t[1] ? prev : t))
      }
    })

    control.on('routingerror', () => {
      setRouting(false)
      setRouteError('No drivable route found between these points. Try moving a pin.')
    })

    control.addTo(mapRef.current)
    routingRef.current = control
  }

  const handleGetRoute = () => {
    if (!startCoords || !endCoords) {
      setRouteError('Set both a start point and a destination first.')
      return
    }
    startRouting(startCoords, endCoords)
  }

  const handleClearRoute = () => {
    clearRouteLayer()
    setStartCoords(null); setEndCoords(null)
    setStartText(''); setEndText('')
    setPin('start', null); setPin('end', null)
    setRouteError(null)
    setShowSteps(false)
  }

  const swapPoints = () => {
    const s = startCoords, e = endCoords, st = startText, et = endText
    setStartCoords(e); setEndCoords(s); setStartText(et); setEndText(st)
    if (routingRef.current && s && e) startRouting(e, s)
    else { setPin('start', e); setPin('end', s) }
  }

  const geocodeField = async (kind: 'start' | 'end') => {
    const text = (kind === 'start' ? startText : endText).trim()
    if (!text) return
    // Already coordinates? Use them directly.
    const direct = parseCoords(text)
    if (direct) { setPoint(kind, direct); mapRef.current?.setView(direct, 14); return }
    setGeocoding(kind)
    setRouteError(null)
    const result = await geocode(text)
    setGeocoding(null)
    if (!result) { setRouteError(`Could not find "${text}". Try a more specific place name.`); return }
    const at: LatLng = [result.lat, result.lng]
    setPoint(kind, at, result.displayName.split(',').slice(0, 2).join(', '))
    mapRef.current?.setView(at, 14)
  }

  // ── Location + AI hazard scan ──────────────────────────────────────────────
  const handleMyLocation = () => {
    if (!navigator.geolocation) { setStatus({ kind: 'error', text: 'Geolocation is not supported by this browser.' }); return }
    setLocating(true)
    navigator.geolocation.getCurrentPosition(
      pos => {
        setLocating(false)
        const at: LatLng = [pos.coords.latitude, pos.coords.longitude]
        if (!mapRef.current) return
        mapRef.current.setView(at, 15)
        meMarkerRef.current?.remove()
        meMarkerRef.current = L.marker(at, { icon: pinIcon('me') }).addTo(mapRef.current).bindPopup('You are here')
        if (!startRef.current) setPoint('start', at, 'My location')

        if (isLoggedIn) {
          setStatus({ kind: 'info', text: 'AI is scanning your area for unreported hazards…', busy: true })
          getAiDetectAlerts(at[0], at[1])
            .then(res => {
              const { created } = res.data
              if (created > 0) {
                setStatus({ kind: 'success', text: `AI flagged ${created} new likely hazard${created > 1 ? 's' : ''} near you` })
                getAlerts().then(r => Array.isArray(r.data) && setAlerts(r.data)).catch(() => {})
              } else {
                setStatus({ kind: 'success', text: 'AI scan complete — no new hazards near you' })
              }
            })
            .catch(() => setStatus({ kind: 'error', text: 'AI scan failed — try again later' }))
            .finally(() => setTimeout(() => setStatus(null), 6000))
        }
      },
      err => {
        setLocating(false)
        const text = err.code === err.PERMISSION_DENIED ? 'Location access denied.'
          : err.code === err.TIMEOUT ? 'Location request timed out.' : 'Could not get your location.'
        setStatus({ kind: 'error', text })
        setTimeout(() => setStatus(null), 5000)
      },
      { timeout: 10000, maximumAge: 60000 }
    )
  }

  const handleSearch = async (e: FormEvent) => {
    e.preventDefault()
    if (!searchQuery.trim()) return
    setSearching(true)
    const result = await geocode(searchQuery)
    setSearching(false)
    if (!result) { toast(`Could not find "${searchQuery}"`, 'warning'); return }
    mapRef.current?.setView([result.lat, result.lng], 14)
  }

  // ── Alerts: initial load, polling, refetch on tab focus ────────────────────
  useEffect(() => {
    const load = () =>
      getAlerts()
        .then(res => {
          if (!Array.isArray(res.data)) return
          setAlerts(prev => {
            const same = prev.length === res.data.length && prev.every((a, i) => a.id === res.data[i].id && a.updated_at === res.data[i].updated_at)
            return same ? prev : res.data
          })
        })
        .catch(() => {})
        .finally(() => setLoading(false))

    load()
    const poll = setInterval(load, 30000)
    const onVisible = () => { if (document.visibilityState === 'visible') load() }
    document.addEventListener('visibilitychange', onVisible)
    return () => { clearInterval(poll); document.removeEventListener('visibilitychange', onVisible) }
  }, [])

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: alerts.length }
    alerts.forEach(a => { c[a.alert_type] = (c[a.alert_type] ?? 0) + 1 })
    return c
  }, [alerts])

  const filteredAlerts = useMemo(
    () => (filter === 'all' ? alerts : alerts.filter(a => a.alert_type === filter)),
    [alerts, filter]
  )

  const focusAlert = (a: Alert) => {
    if (!mapRef.current) return
    mapRef.current.setView([a.location_lat, a.location_lng], 16)
    markersRef.current.get(a.id)?.openPopup()
    setSheetOpen(false)
  }

  const routeTo = (a: Alert) => {
    setPoint('end', [a.location_lat, a.location_lng], a.title)
    setTab('route')
    setSheetOpen(true)
  }

  // ── Init map (once) ────────────────────────────────────────────────────────
  useEffect(() => {
    if (mapRef.current || !mapEl.current || !isLeafletReady()) return
    const map = createMap(mapEl.current)
    mapRef.current = map

    // Clicking the map drops start, then destination, while the Route tab is open
    map.on('click', (e: any) => {
      if (tabRef.current !== 'route' || routingRef.current) return
      const at: LatLng = [e.latlng.lat, e.latlng.lng]
      if (!startRef.current) setPoint('start', at)
      else if (!endRef.current) setPoint('end', at)
    })

    // Keep tiles correct when the container resizes (sidebar, sheet, window)
    const ro = new ResizeObserver(() => map.invalidateSize())
    ro.observe(mapEl.current)

    // Deep links: ?start_lat&start_lng&end_lat&end_lng (saved routes, shared links) or ?lat&lng (focus an alert)
    const params = new URLSearchParams(window.location.search)
    const num = (k: string) => parseFloat(params.get(k) ?? '')
    const s: LatLng = [num('start_lat'), num('start_lng')]
    const t: LatLng = [num('end_lat'), num('end_lng')]
    const f: LatLng = [num('lat'), num('lng')]
    if (s.every(v => !isNaN(v)) && t.every(v => !isNaN(v))) {
      setStartCoords(s); setStartText(fmtCoords(s[0], s[1]))
      setEndCoords(t); setEndText(fmtCoords(t[0], t[1]))
      setTab('route')
      setTimeout(() => startRouting(s, t), 250)
    } else if (f.every(v => !isNaN(v))) {
      focusRef.current = f
      map.setView(f, 16)
      setTab('alerts')
    }

    return () => {
      ro.disconnect()
      map.remove()
      mapRef.current = null
      routingRef.current = null
      startMarkerRef.current = null
      endMarkerRef.current = null
      meMarkerRef.current = null
      markersRef.current.clear()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ── Alert markers ──────────────────────────────────────────────────────────
  useEffect(() => {
    const map = mapRef.current
    if (!map) return
    markersRef.current.forEach(m => m.remove())
    markersRef.current.clear()
    filteredAlerts.forEach(a => {
      const marker = L.marker([a.location_lat, a.location_lng], { icon: alertIcon(a.alert_type) })
        .addTo(map)
        .bindPopup(popupHtml(a), { maxWidth: 280 })
      markersRef.current.set(a.id, marker)
    })

    // Open the alert requested via ?lat&lng once markers exist
    const f = focusRef.current
    if (f && filteredAlerts.length) {
      const hit = filteredAlerts.find(a => Math.abs(a.location_lat - f[0]) < 1e-4 && Math.abs(a.location_lng - f[1]) < 1e-4)
      if (hit) markersRef.current.get(hit.id)?.openPopup()
      focusRef.current = null
    }
  }, [filteredAlerts])

  // ── Impact radius circles ──────────────────────────────────────────────────
  useEffect(() => {
    const map = mapRef.current
    circlesRef.current.forEach(c => c.remove())
    circlesRef.current = []
    if (!map || !radiusOn) return
    filteredAlerts.forEach(a => {
      const color = typeMeta(a.alert_type).color
      circlesRef.current.push(
        L.circle([a.location_lat, a.location_lng], {
          radius: ALERT_RADIUS[a.alert_type] ?? 300,
          color, fillColor: color, fillOpacity: 0.08, weight: 1.5, opacity: 0.4, dashArray: '4 4',
          interactive: false,
        }).addTo(map)
      )
    })
  }, [filteredAlerts, radiusOn])

  // ── Heatmap (verified officials) ───────────────────────────────────────────
  useEffect(() => {
    const map = mapRef.current
    heatRef.current?.remove()
    heatRef.current = null
    if (!map || !heatmapOn || !isGovUser || alerts.length === 0 || !L.heatLayer) return
    const weight: Record<string, number> = { Emergency: 1, Traffic: 0.7, Weather: 0.6, Construction: 0.5 }
    heatRef.current = L.heatLayer(
      alerts.map(a => [a.location_lat, a.location_lng, weight[a.alert_type] ?? 0.5]),
      { radius: 80, blur: 60, maxZoom: 18, minOpacity: 0.5, gradient: { 0.2: '#2563EB', 0.45: '#10B981', 0.65: '#D97706', 0.85: '#DC2626', 1: '#7C3AED' } }
    ).addTo(map)
  }, [heatmapOn, isGovUser, alerts])

  // ── Hazards along the actual road geometry ─────────────────────────────────
  const routeHazards = useMemo(() => {
    if (!routeActive) return [] as Alert[]
    // Sample the polyline so long routes stay cheap
    const stride = Math.max(1, Math.floor(routeLine.length / 400))
    const pts = routeLine.filter((_, i) => i % stride === 0 || i === routeLine.length - 1)
    return alerts.filter(a => {
      const p: LatLng = [a.location_lat, a.location_lng]
      for (let i = 0; i < pts.length - 1; i++) {
        if (pointToSegmentM(p, pts[i], pts[i + 1]) <= HAZARD_RADIUS_M) return true
      }
      return false
    })
  }, [routeActive, routeLine, alerts])

  useEffect(() => {
    const map = mapRef.current
    pulseRef.current.forEach(m => m.remove())
    pulseRef.current = []
    if (!map || !isLoggedIn) return
    routeHazards.forEach(a => {
      const color = typeMeta(a.alert_type).color
      pulseRef.current.push(
        L.marker([a.location_lat, a.location_lng], {
          icon: L.divIcon({
            className: '',
            html: `<div class="alert-pulse-ring" style="--pulse-color:${color}"><div class="alert-pulse-dot" style="background:${color}"></div></div>`,
            iconSize: [48, 48],
            iconAnchor: [24, 24],
          }),
          zIndexOffset: -100,
          interactive: false,
        }).addTo(map)
      )
    })
  }, [routeHazards, isLoggedIn])

  // ── Share + save ───────────────────────────────────────────────────────────
  const handleShare = () => {
    if (!startCoords || !endCoords) return
    const url = new URL(window.location.origin + '/map')
    url.search = `?start_lat=${startCoords[0]}&start_lng=${startCoords[1]}&end_lat=${endCoords[0]}&end_lng=${endCoords[1]}`
    navigator.clipboard.writeText(url.toString())
      .then(() => { setShareCopied(true); setTimeout(() => setShareCopied(false), 2500) })
      .catch(() => toast('Could not copy the link. Copy it from the address bar instead.', 'warning'))
  }

  const confirmSave = async () => {
    if (!routeName.trim() || !startCoords || !endCoords) return
    setSaving(true)
    try {
      await createRoute({ name: routeName.trim(), start_lat: startCoords[0], start_lng: startCoords[1], end_lat: endCoords[0], end_lng: endCoords[1] })
      toast(`Saved “${routeName.trim()}” to My Routes`, 'success')
      setSaveOpen(false)
      setRouteName('')
    } catch (err: any) {
      toast(err?.response?.data?.message || 'Failed to save route', 'danger')
    } finally {
      setSaving(false)
    }
  }

  // ── In-journey AI chat ─────────────────────────────────────────────────────
  useEffect(() => {
    chatScrollRef.current?.scrollTo({ top: chatScrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [navMessages, chatOpen])

  const sendNavMessage = async (text: string) => {
    const trimmed = text.trim()
    if (!trimmed || chatLoading) return
    const now = Date.now()
    setNavMessages(prev => [...prev, { id: now, role: 'user', content: trimmed }, { id: now + 1, role: 'assistant', content: '', loading: true }])
    setChatInput('')
    setChatLoading(true)
    try {
      const res = await getAiNavigationChat({
        message: trimmed,
        ...(startCoords ? { start_lat: startCoords[0], start_lng: startCoords[1] } : {}),
        ...(endCoords ? { end_lat: endCoords[0], end_lng: endCoords[1] } : {}),
        ...(routeSteps[currentStepIdx] ? { current_step: routeSteps[currentStepIdx] } : {}),
        ...(routeDistance ? { total_distance: routeDistance } : {}),
        ...(routeTime ? { total_time: routeTime } : {}),
      })
      setNavMessages(prev => prev.map(m => (m.loading ? { ...m, content: res.data.reply, loading: false } : m)))
    } catch {
      setNavMessages(prev => prev.map(m => (m.loading ? { ...m, content: 'Sorry, I could not reach the AI right now. Please try again.', loading: false } : m)))
    } finally {
      setChatLoading(false)
    }
  }

  const onChatKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendNavMessage(chatInput) }
  }

  // ── Render ─────────────────────────────────────────────────────────────────
  const statusCls = status?.kind === 'error' ? 'is-error' : status?.kind === 'success' ? 'is-success' : ''

  return (
    <div className="mp">
      <Seo
        title="Live Traffic & Disruption Map"
        description="Live map of road construction, utility work, diversions, flooding and emergencies with turn-by-turn routing that shows hazards along your route."
        path="/map"
      />
      <h1 className="sr-only">Live disruption map</h1>

      {/* ── Control panel (sidebar on desktop, bottom sheet on mobile) ── */}
      <aside className={`mp-panel${sheetOpen ? ' is-open' : ''}`} aria-label="Map controls">
        <button type="button" className="mp-sheet-handle" onClick={() => setSheetOpen(o => !o)} aria-expanded={sheetOpen}>
          <span className="mp-sheet-grip" aria-hidden="true" />
          <span className="sr-only">{sheetOpen ? 'Collapse panel' : 'Expand panel'}</span>
        </button>

        <div className="mp-tabs" role="tablist" aria-label="Map panel">
          {([
            ['route', 'fa-route', 'Route'],
            ['alerts', 'fa-bell', `Alerts${filteredAlerts.length ? ` · ${filteredAlerts.length}` : ''}`],
            ['layers', 'fa-layer-group', 'Layers'],
          ] as Array<[Tab, string, string]>).map(([id, icon, label]) => (
            <button
              key={id}
              type="button"
              role="tab"
              id={`mp-tab-${id}`}
              aria-selected={tab === id}
              aria-controls={`mp-pane-${id}`}
              className={`mp-tab${tab === id ? ' active' : ''}`}
              onClick={() => { setTab(id); setSheetOpen(true) }}
            >
              <i className={`fas ${icon}`} aria-hidden="true"></i> {label}
            </button>
          ))}
        </div>

        <div className="mp-pane" role="tabpanel" id={`mp-pane-${tab}`} aria-labelledby={`mp-tab-${tab}`}>
          {/* ── Route tab ── */}
          {tab === 'route' && (
            <div className="mp-route">
              <div className="mp-od">
                <div className="mp-od-rail" aria-hidden="true">
                  <span className="dot start" /><span className="line" /><span className="dot end" />
                </div>
                <div className="mp-od-fields">
                  <div className="mp-od-field">
                    <label htmlFor="mp-start" className="sr-only">Start</label>
                    <input
                      id="mp-start"
                      className="input"
                      placeholder="Start point"
                      value={startText}
                      onChange={e => { setStartText(e.target.value); setStartCoords(null) }}
                      onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); geocodeField('start') } }}
                      onBlur={() => { if (startText && !startCoords) geocodeField('start') }}
                    />
                    {geocoding === 'start'
                      ? <span className="spinner mp-od-spin" />
                      : startCoords && <i className="fas fa-circle-check mp-od-ok" aria-label="Start set"></i>}
                  </div>
                  <div className="mp-od-field">
                    <label htmlFor="mp-end" className="sr-only">Destination</label>
                    <input
                      id="mp-end"
                      className="input"
                      placeholder="Destination"
                      value={endText}
                      onChange={e => { setEndText(e.target.value); setEndCoords(null) }}
                      onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); geocodeField('end') } }}
                      onBlur={() => { if (endText && !endCoords) geocodeField('end') }}
                    />
                    {geocoding === 'end'
                      ? <span className="spinner mp-od-spin" />
                      : endCoords && <i className="fas fa-circle-check mp-od-ok" aria-label="Destination set"></i>}
                  </div>
                </div>
                <button type="button" className="btn btn-ghost btn-icon btn-sm mp-swap" onClick={swapPoints} aria-label="Swap start and destination" title="Swap">
                  <i className="fas fa-arrow-right-arrow-left fa-rotate-90"></i>
                </button>
              </div>

              <div className="mp-row">
                <button type="button" className="btn btn-secondary btn-sm" onClick={handleMyLocation} disabled={locating}>
                  {locating ? <span className="spinner" /> : <i className="fas fa-location-crosshairs" aria-hidden="true"></i>} My location
                </button>
                <span className="text-xs text-muted">or click the map to drop pins</span>
              </div>

              {routeError && (
                <div className="alert-banner is-danger" role="alert">
                  <i className="fas fa-circle-exclamation" aria-hidden="true"></i><span>{routeError}</span>
                </div>
              )}

              <div className="mp-row">
                <button type="button" className="btn btn-primary flex-1" onClick={handleGetRoute} disabled={routing || !startCoords || !endCoords}>
                  {routing ? <span className="spinner" /> : <><i className="fas fa-diamond-turn-right" aria-hidden="true"></i> Get route</>}
                </button>
                {(startCoords || endCoords || routeActive) && (
                  <button type="button" className="btn btn-ghost" onClick={handleClearRoute}>Clear</button>
                )}
              </div>

              {!routeActive && !routing && (
                <div className="mp-quick">
                  {isLoggedIn && savedRoutes.length > 0 && (
                    <section aria-labelledby="mp-saved-title">
                      <h2 id="mp-saved-title" className="mp-quick-title">Your saved routes</h2>
                      <ul className="mp-quick-list">
                        {savedRoutes.slice(0, 5).map(r => (
                          <li key={r.id}>
                            <button
                              type="button"
                              onClick={() => {
                                const s: LatLng = [r.start_lat, r.start_lng]
                                const t: LatLng = [r.end_lat, r.end_lng]
                                setStartCoords(s); setStartText(r.name.split('→')[0]?.trim() || fmtCoords(s[0], s[1]))
                                setEndCoords(t); setEndText(r.name.split('→')[1]?.trim() || fmtCoords(t[0], t[1]))
                                startRouting(s, t)
                              }}
                            >
                              <span className="mp-quick-icon" aria-hidden="true"><i className="fas fa-route"></i></span>
                              <span className="truncate">{r.name}</span>
                              <i className="fas fa-chevron-right" aria-hidden="true"></i>
                            </button>
                          </li>
                        ))}
                      </ul>
                    </section>
                  )}

                  <section aria-labelledby="mp-latest-title">
                    <div className="flex-between mb-2">
                      <h2 id="mp-latest-title" className="mp-quick-title mb-0">Latest alerts</h2>
                      <button type="button" className="btn btn-ghost btn-sm" onClick={() => setTab('alerts')}>See all</button>
                    </div>
                    <ul className="mp-feed">
                      {alerts.slice(0, 3).map(a => (
                        <li key={a.id} className="mp-feed-item">
                          <button type="button" className="mp-feed-main" onClick={() => focusAlert(a)}>
                            <TypeIcon type={a.alert_type} size={30} />
                            <span className="mp-feed-text">
                              <span className="mp-feed-title">{a.title}</span>
                              <span className="mp-feed-meta">{typeMeta(a.alert_type).label} · {timeAgo(a.created_at)}</span>
                            </span>
                          </button>
                        </li>
                      ))}
                      {!loading && alerts.length === 0 && <li className="text-sm text-muted">No active alerts right now.</li>}
                    </ul>
                  </section>

                  {!isLoggedIn && (
                    <div className="mp-quick-cta">
                      <i className="fas fa-wand-magic-sparkles" aria-hidden="true"></i>
                      <p><strong>Save routes and get AI risk scores.</strong> <Link to="/register">Create a free account</Link></p>
                    </div>
                  )}
                </div>
              )}

              {routeActive && (
                <section className="mp-summary" aria-label="Route summary">
                  <div className="mp-summary-stats">
                    <div><span className="mp-stat-value">{routeTime}</span><span className="mp-stat-label">Drive time</span></div>
                    <div><span className="mp-stat-value">{routeDistance}</span><span className="mp-stat-label">Distance</span></div>
                    <div>
                      <span className={`mp-stat-value${isLoggedIn && routeHazards.length ? ' is-warn' : ''}`}>
                        {isLoggedIn ? routeHazards.length : '—'}
                      </span>
                      <span className="mp-stat-label">Hazards on route</span>
                    </div>
                  </div>

                  {isLoggedIn ? (
                    routeHazards.length > 0 ? (
                      <ul className="mp-hazards">
                        {routeHazards.slice(0, 4).map(a => (
                          <li key={a.id}>
                            <button type="button" onClick={() => focusAlert(a)}>
                              <TypeIcon type={a.alert_type} size={26} />
                              <span className="truncate">{a.title}</span>
                              <i className="fas fa-chevron-right" aria-hidden="true"></i>
                            </button>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="mp-clear"><i className="fas fa-circle-check" aria-hidden="true"></i> No active alerts within 500 m of this route.</p>
                    )
                  ) : (
                    <p className="mp-clear is-guest">
                      <i className="fas fa-lock" aria-hidden="true"></i>
                      <span><Link to="/login">Sign in</Link> to see hazards on your route, save it and ask the AI co-pilot.</span>
                    </p>
                  )}

                  <div className="mp-row">
                    {isLoggedIn && (
                      <button type="button" className="btn btn-secondary btn-sm flex-1" onClick={() => setSaveOpen(true)}>
                        <i className="fas fa-bookmark" aria-hidden="true"></i> Save
                      </button>
                    )}
                    <button type="button" className="btn btn-secondary btn-sm flex-1" onClick={handleShare}>
                      <i className={`fas ${shareCopied ? 'fa-check' : 'fa-link'}`} aria-hidden="true"></i> {shareCopied ? 'Copied' : 'Share'}
                    </button>
                    {routeSteps.length > 0 && (
                      <button type="button" className="btn btn-secondary btn-sm flex-1" onClick={() => setShowSteps(s => !s)} aria-expanded={showSteps}>
                        <i className="fas fa-list-ol" aria-hidden="true"></i> Steps
                      </button>
                    )}
                  </div>

                  {showSteps && (
                    <ol className="mp-steps">
                      {routeSteps.map((s, i) => (
                        <li key={i}>
                          <button type="button" className={i === currentStepIdx ? 'active' : ''} onClick={() => setCurrentStepIdx(i)}>
                            <span className="mp-step-n">{i + 1}</span>{s}
                          </button>
                        </li>
                      ))}
                    </ol>
                  )}
                </section>
              )}
            </div>
          )}

          {/* ── Alerts tab (the only alert list on this page) ── */}
          {tab === 'alerts' && (
            <div>
              <p className="mp-pane-note">
                <span className="live-dot" aria-hidden="true"></span>
                {filter === 'all' ? 'All alerts' : `${filter} alerts`} · refreshes every 30 s
              </p>
              {loading ? (
                <div className="flex-col gap-2">
                  {[0, 1, 2, 3].map(i => <div key={i} className="skeleton" style={{ height: 58 }} />)}
                </div>
              ) : filteredAlerts.length === 0 ? (
                <EmptyState icon="fa-circle-check" title="All clear">No alerts match this filter.</EmptyState>
              ) : (
                <ul className="mp-feed">
                  {filteredAlerts.map(a => (
                    <li key={a.id} className="mp-feed-item">
                      <button type="button" className="mp-feed-main" onClick={() => focusAlert(a)}>
                        <TypeIcon type={a.alert_type} size={32} />
                        <span className="mp-feed-text">
                          <span className="mp-feed-title">{a.title}</span>
                          <span className="mp-feed-meta">{typeMeta(a.alert_type).label} · {timeAgo(a.created_at)}</span>
                        </span>
                      </button>
                      <button type="button" className="btn btn-ghost btn-icon btn-sm" onClick={() => routeTo(a)} aria-label={`Route to ${a.title}`} title="Route here">
                        <i className="fas fa-diamond-turn-right"></i>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          {/* ── Layers tab ── */}
          {tab === 'layers' && (
            <div className="mp-layers">
              <button type="button" className="mp-toggle" role="switch" aria-checked={radiusOn} onClick={() => setRadiusOn(v => !v)}>
                <span className="kpi-icon info" aria-hidden="true"><i className="fas fa-circle-notch"></i></span>
                <span className="mp-toggle-text"><strong>Impact radius</strong><small>Show the affected area around each alert</small></span>
                <span className={`toggle-pill${radiusOn ? ' is-on' : ''}`} aria-hidden="true" />
              </button>

              <button
                type="button"
                className="mp-toggle"
                role="switch"
                aria-checked={heatmapOn && isGovUser}
                onClick={() => isGovUser && setHeatmapOn(v => !v)}
                disabled={!isGovUser}
              >
                <span className="kpi-icon danger" aria-hidden="true"><i className="fas fa-fire"></i></span>
                <span className="mp-toggle-text">
                  <strong>Incident heatmap</strong>
                  <small>{isGovUser ? 'Density of incidents across the region' : 'Available to verified officials'}</small>
                </span>
                {isGovUser
                  ? <span className={`toggle-pill${heatmapOn ? ' is-on' : ''}`} aria-hidden="true" />
                  : <i className="fas fa-lock text-muted" aria-hidden="true"></i>}
              </button>

              <div className="mp-legend">
                <h2 className="mp-legend-title">Legend</h2>
                {ALERT_TYPES.map(t => (
                  <div key={t} className="mp-legend-row">
                    <span className="type-dot" style={{ background: typeMeta(t).color }} aria-hidden="true"></span>
                    {typeMeta(t).label}
                    <span className="mono text-muted ml-auto">{(ALERT_RADIUS[t] / 1000).toFixed(1)} km zone</span>
                  </div>
                ))}
              </div>

              {isLoggedIn && (
                <button type="button" className="btn btn-ai btn-full" onClick={handleMyLocation} disabled={locating}>
                  <i className="fas fa-satellite-dish" aria-hidden="true"></i> Scan my area with AI
                </button>
              )}
            </div>
          )}
        </div>
      </aside>

      {/* ── Map ── */}
      <section className="mp-map" aria-label="Map">
        <div ref={mapEl} className="mp-canvas" />

        {/* Search + the one set of type filters (drives both the map and the Alerts tab) */}
        <div className="mp-overlay-top">
          <form className="mp-search" onSubmit={handleSearch} role="search">
            <i className="fas fa-magnifying-glass" aria-hidden="true"></i>
            <label htmlFor="mp-search" className="sr-only">Search the map</label>
            <input id="mp-search" type="search" placeholder="Search a place" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
            {searching && <span className="spinner" />}
          </form>
          <div className="mp-chips" role="group" aria-label="Filter alerts by type">
            <button type="button" className={`mp-chip${filter === 'all' ? ' active' : ''}`} aria-pressed={filter === 'all'} onClick={() => setFilter('all')}>
              All <span>{counts.all ?? 0}</span>
            </button>
            {ALERT_TYPES.map(t => (
              <button key={t} type="button" className={`mp-chip${filter === t ? ' active' : ''}`} aria-pressed={filter === t} onClick={() => setFilter(t)}>
                <span className="type-dot" style={{ background: typeMeta(t).color }} aria-hidden="true"></span>
                {t} <span>{counts[t] ?? 0}</span>
              </button>
            ))}
          </div>
        </div>

        {status && (
          <div className={`mp-status ${statusCls}`} role="status">
            {status.busy ? <span className="spinner" /> : <i className={`fas ${status.kind === 'error' ? 'fa-circle-exclamation' : status.kind === 'success' ? 'fa-wand-magic-sparkles' : 'fa-circle-info'}`} aria-hidden="true"></i>}
            <span>{status.text}</span>
            <button type="button" onClick={() => setStatus(null)} aria-label="Dismiss"><i className="fas fa-xmark"></i></button>
          </div>
        )}

        <button type="button" className="mp-locate" onClick={handleMyLocation} disabled={locating} aria-label="Go to my location" title="My location">
          {locating ? <span className="spinner" /> : <i className="fas fa-location-crosshairs"></i>}
        </button>

        {/* Turn-by-turn step bar */}
        {routeActive && routeSteps.length > 0 && (
          <div className="mp-stepbar" aria-live="polite">
            <span className="mp-stepbar-icon" aria-hidden="true"><i className="fas fa-arrow-turn-up"></i></span>
            <span className="mp-stepbar-text">
              <span className="mp-stepbar-instr">{routeSteps[currentStepIdx]}</span>
              <span className="mp-stepbar-meta">Step {currentStepIdx + 1} of {routeSteps.length} · {routeDistance} · {routeTime}</span>
            </span>
            <button type="button" onClick={() => setCurrentStepIdx(i => Math.max(0, i - 1))} disabled={currentStepIdx === 0} aria-label="Previous step">
              <i className="fas fa-chevron-left"></i>
            </button>
            <button type="button" onClick={() => setCurrentStepIdx(i => Math.min(routeSteps.length - 1, i + 1))} disabled={currentStepIdx === routeSteps.length - 1} aria-label="Next step">
              <i className="fas fa-chevron-right"></i>
            </button>
          </div>
        )}

        {/* AI co-pilot */}
        {isLoggedIn && (
          <button
            type="button"
            className={`mp-copilot-fab${chatOpen ? ' is-open' : ''}`}
            onClick={() => setChatOpen(o => !o)}
            aria-expanded={chatOpen}
            aria-label={chatOpen ? 'Close AI co-pilot' : 'Open AI co-pilot'}
          >
            {chatOpen ? <i className="fas fa-xmark"></i> : <><i className="fas fa-wand-magic-sparkles"></i><span>AI co-pilot</span></>}
          </button>
        )}

        {isLoggedIn && chatOpen && (
          <div className="mp-copilot" role="dialog" aria-label="AI navigation co-pilot">
            <header className="mp-copilot-head">
              <span className="msg-avatar" aria-hidden="true"><i className="fas fa-wand-magic-sparkles"></i></span>
              <div style={{ minWidth: 0 }}>
                <div className="mp-copilot-title">Navigation co-pilot</div>
                <div className="mp-copilot-sub">{routeActive ? `${routeDistance} · ${routeTime} · ${routeHazards.length} hazard${routeHazards.length === 1 ? '' : 's'}` : 'Plan a route for route-aware answers'}</div>
              </div>
            </header>
            <div className="mp-copilot-msgs" ref={chatScrollRef}>
              {navMessages.map(m => (
                <div key={m.id} className={`mp-copilot-msg ${m.role}`}>
                  {m.loading ? <span className="typing"><span /><span /><span /></span> : m.role === 'assistant' ? <RichText text={m.content} /> : m.content}
                </div>
              ))}
            </div>
            <div className="mp-copilot-chips">
              {NAV_SUGGESTIONS.map(s => (
                <button key={s} type="button" onClick={() => sendNavMessage(s)} disabled={chatLoading}>{s}</button>
              ))}
            </div>
            <form className="mp-copilot-input" onSubmit={e => { e.preventDefault(); sendNavMessage(chatInput) }}>
              <label htmlFor="mp-chat" className="sr-only">Ask the co-pilot</label>
              <textarea id="mp-chat" rows={1} placeholder="Ask about your route…" value={chatInput}
                onChange={e => setChatInput(e.target.value)} onKeyDown={onChatKeyDown} disabled={chatLoading} />
              <button type="submit" disabled={chatLoading || !chatInput.trim()} aria-label="Send">
                {chatLoading ? <span className="spinner" /> : <i className="fas fa-arrow-up"></i>}
              </button>
            </form>
          </div>
        )}
      </section>

      {/* ── Save route modal ── */}
      {saveOpen && (
        <div className="modal-overlay" style={{ zIndex: 1000 }} role="dialog" aria-modal="true" aria-labelledby="save-route-title">
          <form className="modal-card" onSubmit={e => { e.preventDefault(); confirmSave() }}>
            <div className="modal-card-header">
              <h3 id="save-route-title">Save route</h3>
              <button type="button" className="close-btn" onClick={() => setSaveOpen(false)} aria-label="Close"><i className="fas fa-xmark"></i></button>
            </div>
            <div className="modal-card-body">
              <p className="text-secondary text-sm mb-4">Saved routes get an AI risk score every time you open SRANS.</p>
              <label className="label" htmlFor="route-name">Route name</label>
              <input id="route-name" className="input" placeholder="e.g. Home to Office" value={routeName} onChange={e => setRouteName(e.target.value)} maxLength={50} autoFocus required />
            </div>
            <div className="modal-card-footer">
              <button type="button" className="btn btn-ghost" onClick={() => setSaveOpen(false)}>Cancel</button>
              <button type="submit" className="btn btn-primary" disabled={saving || !routeName.trim()}>
                {saving ? <span className="spinner" /> : 'Save route'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}
