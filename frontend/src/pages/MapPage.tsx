import { useState, useEffect, useRef } from 'react'
import { getAlerts, createRoute } from '../api'
import type { Alert } from '../types'
import { useAuth } from '../context/AuthContext'

declare const L: any

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
  return L.divIcon({
    className: '',
    html: `
      <div style="
        width: 36px; height: 36px; border-radius: 50%;
        background: ${color};
        display: flex; align-items: center; justify-content: center;
        box-shadow: 0 4px 10px rgba(0,0,0,0.2);
        border: 2px solid white;
      ">
        <i class="fas ${icon}" style="color:white;font-size:14px;"></i>
      </div>
      <div style="
        width: 0; height: 0;
        border-left: 6px solid transparent;
        border-right: 6px solid transparent;
        border-top: 8px solid ${color};
        margin: 0 auto;
        transform: translateY(-1px);
      "></div>
    `,
    iconSize: [36, 44],
    iconAnchor: [18, 44],
    popupAnchor: [0, -46],
  })
}

export default function MapPage() {
  const { isLoggedIn } = useAuth()
  const [filter, setFilter] = useState('all')
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [loading, setLoading] = useState(true)
  const [directionsVisible, setDirectionsVisible] = useState(false)
  const [startLocation, setStartLocation] = useState('')
  const [endLocation, setEndLocation] = useState('')
  const [locating, setLocating] = useState(false)
  const [locError, setLocError] = useState<string | null>(null)

  // Route saving state
  const [saveModalActive, setSaveModalActive] = useState(false)
  const [routeName, setRouteName] = useState('')
  const [isSavingRoute, setIsSavingRoute] = useState(false)

  // Mobile panel toggles
  const [leftPanelOpen, setLeftPanelOpen] = useState(false)
  const [rightPanelOpen, setRightPanelOpen] = useState(false)

  const mapRef = useRef<any>(null)
  const markersRef = useRef<any[]>([])
  const userMarkerRef = useRef<any>(null)

  // Route & marker refs
  const startMarkerRef = useRef<any>(null)
  const endMarkerRef = useRef<any>(null)
  const routeLineRef = useRef<any>(null)

  // Refs for leaflet callbacks to avoid stale closures
  const startLocRef = useRef('')
  const endLocRef = useRef('')
  const dirVisibleRef = useRef(false)

  useEffect(() => {
    startLocRef.current = startLocation
  }, [startLocation])

  useEffect(() => {
    endLocRef.current = endLocation
  }, [endLocation])

  useEffect(() => {
    dirVisibleRef.current = directionsVisible
  }, [directionsVisible])

  // Helper: place/update start marker
  const placeStartMarker = (lat: number, lng: number) => {
    if (!mapRef.current) return
    if (startMarkerRef.current) {
      startMarkerRef.current.setLatLng([lat, lng])
    } else {
      startMarkerRef.current = L.marker([lat, lng], {
        icon: L.divIcon({
          className: '',
          html: `
            <div style="
              width: 28px; height: 28px; border-radius: 50%;
              background: #10B981;
              display: flex; align-items: center; justify-content: center;
              box-shadow: 0 2px 5px rgba(0,0,0,0.3);
              border: 2px solid white;
            ">
              <i class="fas fa-flag-checkered" style="color:white;font-size:11px;"></i>
            </div>
          `,
          iconSize: [28, 28],
          iconAnchor: [14, 14]
        })
      }).addTo(mapRef.current).bindPopup('Start Point')
    }
  }

  // Helper: place/update end marker
  const placeEndMarker = (lat: number, lng: number) => {
    if (!mapRef.current) return
    if (endMarkerRef.current) {
      endMarkerRef.current.setLatLng([lat, lng])
    } else {
      endMarkerRef.current = L.marker([lat, lng], {
        icon: L.divIcon({
          className: '',
          html: `
            <div style="
              width: 28px; height: 28px; border-radius: 50%;
              background: #EF4444;
              display: flex; align-items: center; justify-content: center;
              box-shadow: 0 2px 5px rgba(0,0,0,0.3);
              border: 2px solid white;
            ">
              <i class="fas fa-map-marker-alt" style="color:white;font-size:11px;"></i>
            </div>
          `,
          iconSize: [28, 28],
          iconAnchor: [14, 14]
        })
      }).addTo(mapRef.current).bindPopup('Destination')
    }
  }

  const parseCoords = (str: string): [number, number] | null => {
    if (!str) return null
    const parts = str.split(',').map(p => parseFloat(p.trim()))
    if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
      return [parts[0], parts[1]]
    }
    return null
  }

  const handleGetRoute = () => {
    const start = parseCoords(startLocation)
    const end = parseCoords(endLocation)
    if (!start || !end) {
      alert('Please select both a valid starting point and a destination. You can click on the map to place markers.')
      return
    }

    if (!mapRef.current) return

    // Clean up old route line if exists
    if (routeLineRef.current) {
      routeLineRef.current.remove()
    }

    // Place/update markers
    placeStartMarker(start[0], start[1])
    placeEndMarker(end[0], end[1])

    // Draw dashed route polyline
    routeLineRef.current = L.polyline([start, end], {
      color: '#10B981',
      weight: 5,
      dashArray: '8, 8'
    }).addTo(mapRef.current)

    // Center map on route bounds
    mapRef.current.fitBounds([start, end], { padding: [50, 50] })
  }

  const handleClearRoute = () => {
    setStartLocation('')
    setEndLocation('')
    if (startMarkerRef.current) {
      startMarkerRef.current.remove()
      startMarkerRef.current = null
    }
    if (endMarkerRef.current) {
      endMarkerRef.current.remove()
      endMarkerRef.current = null
    }
    if (routeLineRef.current) {
      routeLineRef.current.remove()
      routeLineRef.current = null
    }
  }

  const confirmSaveRoute = async () => {
    if (!routeName.trim()) {
      alert('Please enter a route name.')
      return
    }

    const start = parseCoords(startLocation)
    const end = parseCoords(endLocation)

    if (!start || !end) {
      alert('Please select both a valid starting point and destination first.')
      return
    }

    setIsSavingRoute(true)
    try {
      await createRoute({
        name: routeName,
        start_lat: start[0],
        start_lng: start[1],
        end_lat: end[0],
        end_lng: end[1]
      })
      alert('Route saved successfully!')
      setSaveModalActive(false)
      setRouteName('')
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to save route. Please try again.')
    } finally {
      setIsSavingRoute(false)
    }
  }

  // Fetch all alerts from API on mount
  useEffect(() => {
    getAlerts()
      .then(res => setAlerts(res.data))
      .catch(() => setAlerts([]))
      .finally(() => setLoading(false))
  }, [])

  const filteredAlerts = filter === 'all' ? alerts : alerts.filter(a => a.alert_type === filter)

  // Init map once
  useEffect(() => {
    if (mapRef.current) return
    mapRef.current = L.map('map', { zoomControl: false }).setView([18.5204, 73.8567], 13)

    // Using a more premium-looking tile style (CartoDB Voyager)
    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
      subdomains: 'abcd',
      maxZoom: 20
    }).addTo(mapRef.current)

    // Add zoom control to bottom right
    L.control.zoom({ position: 'bottomright' }).addTo(mapRef.current)

    // Click listener on map to set start/end coordinates
    mapRef.current.on('click', (e: any) => {
      if (!dirVisibleRef.current) return

      const { lat, lng } = e.latlng
      const coordStr = `${lat.toFixed(4)}, ${lng.toFixed(4)}`

      if (!startLocRef.current) {
        setStartLocation(coordStr)
        placeStartMarker(lat, lng)
      } else {
        setEndLocation(coordStr)
        placeEndMarker(lat, lng)
      }
    })

    // Check for query parameters for saved route
    const params = new URLSearchParams(window.location.search)
    const startLat = parseFloat(params.get('start_lat') || '')
    const startLng = parseFloat(params.get('start_lng') || '')
    const endLat = parseFloat(params.get('end_lat') || '')
    const endLng = parseFloat(params.get('end_lng') || '')

    if (!isNaN(startLat) && !isNaN(startLng) && !isNaN(endLat) && !isNaN(endLng)) {
      setDirectionsVisible(true)
      setStartLocation(`${startLat.toFixed(4)}, ${startLng.toFixed(4)}`)
      setEndLocation(`${endLat.toFixed(4)}, ${endLng.toFixed(4)}`)

      // Draw dashed route polyline
      routeLineRef.current = L.polyline([[startLat, startLng], [endLat, endLng]], {
        color: '#10B981',
        weight: 5,
        dashArray: '8, 8'
      }).addTo(mapRef.current)

      // Start flag marker
      startMarkerRef.current = L.marker([startLat, startLng], {
        icon: L.divIcon({
          className: '',
          html: `
            <div style="
              width: 28px; height: 28px; border-radius: 50%;
              background: #10B981;
              display: flex; align-items: center; justify-content: center;
              box-shadow: 0 2px 5px rgba(0,0,0,0.3);
              border: 2px solid white;
            ">
              <i class="fas fa-flag-checkered" style="color:white;font-size:11px;"></i>
            </div>
          `,
          iconSize: [28, 28],
          iconAnchor: [14, 14]
        })
      }).addTo(mapRef.current).bindPopup('Start Point')

      // End flag marker
      endMarkerRef.current = L.marker([endLat, endLng], {
        icon: L.divIcon({
          className: '',
          html: `
            <div style="
              width: 28px; height: 28px; border-radius: 50%;
              background: #EF4444;
              display: flex; align-items: center; justify-content: center;
              box-shadow: 0 2px 5px rgba(0,0,0,0.3);
              border: 2px solid white;
            ">
              <i class="fas fa-map-marker-alt" style="color:white;font-size:11px;"></i>
            </div>
          `,
          iconSize: [28, 28],
          iconAnchor: [14, 14]
        })
      }).addTo(mapRef.current).bindPopup('Destination')

      // Center map on route bounds
      mapRef.current.fitBounds([
        [startLat, startLng],
        [endLat, endLng]
      ], { padding: [50, 50] })
    }
  }, [])

  const handleMyLocation = () => {
    if (!navigator.geolocation) {
      setLocError('Geolocation is not supported by your browser.')
      return
    }
    setLocating(true)
    setLocError(null)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords
        setLocating(false)
        if (!mapRef.current) return
        mapRef.current.setView([latitude, longitude], 15)
        // Remove old user marker
        if (userMarkerRef.current) userMarkerRef.current.remove()
        // Blue pulsing dot for user location
        const userIcon = L.divIcon({
          className: '',
          html: `
            <div style="
              width:36px;height:36px;border-radius:50%;
              background:var(--color-info);
              display:flex;align-items:center;justify-content:center;
              box-shadow:0 0 0 6px rgba(59, 130, 246, 0.2);
              border:2px solid white;
            ">
              <i class="fas fa-location-arrow" style="color:white;font-size:14px;transform:rotate(-45deg);"></i>
            </div>
          `,
          iconSize: [36, 36],
          iconAnchor: [18, 18],
          popupAnchor: [0, -18],
        })
        userMarkerRef.current = L.marker([latitude, longitude], { icon: userIcon })
          .addTo(mapRef.current)
          .bindPopup('<div style="padding:4px"><strong>Current Location</strong><br/><span style="color:var(--text-muted);font-size:12px">Your estimated location</span></div>')
          .openPopup()

        // Auto-fill starting point with user location
        setStartLocation(`${latitude.toFixed(4)}, ${longitude.toFixed(4)}`)
        placeStartMarker(latitude, longitude)

        setLeftPanelOpen(false)
      },
      (err) => {
        setLocating(false)
        switch (err.code) {
          case err.PERMISSION_DENIED:
            setLocError('Location access denied. Please allow in settings.')
            break
          case err.POSITION_UNAVAILABLE:
            setLocError('Location unavailable. Try again.')
            break
          case err.TIMEOUT:
            setLocError('Location request timed out.')
            break
          default:
            setLocError('Could not get location.')
        }
      },
      { timeout: 10000, maximumAge: 60000 }
    )
  }

  // Update markers whenever filtered alerts change
  useEffect(() => {
    if (!mapRef.current) return
    markersRef.current.forEach(m => m.remove())
    markersRef.current = []

    filteredAlerts.forEach(alert => {
      const marker = L.marker([alert.location_lat, alert.location_lng], { icon: makeIcon(alert.alert_type) })
        .addTo(mapRef.current)
        .bindPopup(`
          <div style="min-width: 180px">
            <div style="font-weight: 600; margin-bottom: 4px; font-size: 14px;">${alert.title}</div>
            <span class="badge badge-${alert.alert_type === 'Traffic' ? 'danger' :
            alert.alert_type === 'Emergency' ? 'purple' :
              alert.alert_type === 'Construction' ? 'warning' : 'info'
          }" style="margin-bottom: 8px; display: inline-flex;">${alert.alert_type}</span>
            <div style="color: var(--text-secondary); font-size: 13px;">${alert.description}</div>
          </div>
        `)
      markersRef.current.push(marker)
    })
  }, [filteredAlerts])

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

  return (
    <div className="map-layout">

      {/* Left Panel: Filters & Search */}
      <aside className={`map-panel map-panel-left ${leftPanelOpen ? 'is-open' : ''}`}>
        <div className="map-panel-header">
          <span>Map Controls</span>
          <button className="btn-icon hide-desktop" onClick={() => setLeftPanelOpen(false)}>
            <i className="fas fa-times"></i>
          </button>
        </div>
        <div className="map-panel-content">
          <div className="field mb-6">
            <div className="input-icon">
              <i className="fas fa-search icon-left"></i>
              <input className="input" type="text" placeholder="Search locations..." />
            </div>
          </div>

          <h3 className="font-semibold text-sm mb-3 text-secondary">FILTER ALERTS</h3>
          <div className="flex flex-wrap gap-2 mb-6">
            <button
              className={`btn btn-sm flex-center gap-2 ${filter === 'all' ? 'btn-secondary' : 'btn-white'}`}
              onClick={() => setFilter('all')}
              style={{ borderRadius: 'var(--radius-full)', padding: 'var(--space-2) var(--space-3)', fontSize: '12px', flex: '1 1 auto', justifyContent: 'center' }}
            >
              <i className="fas fa-globe"></i>
              <span>All</span>
            </button>
            <button
              className={`btn btn-sm flex-center gap-2 ${filter === 'Traffic' ? 'btn-secondary' : 'btn-white'}`}
              onClick={() => setFilter('Traffic')}
              style={{ borderRadius: 'var(--radius-full)', padding: 'var(--space-2) var(--space-3)', fontSize: '12px', flex: '1 1 auto', justifyContent: 'center' }}
            >
              <i className="fas fa-car-crash text-danger"></i>
              <span>Traffic</span>
            </button>
            <button
              className={`btn btn-sm flex-center gap-2 ${filter === 'Emergency' ? 'btn-secondary' : 'btn-white'}`}
              onClick={() => setFilter('Emergency')}
              style={{ borderRadius: 'var(--radius-full)', padding: 'var(--space-2) var(--space-3)', fontSize: '12px', flex: '1 1 auto', justifyContent: 'center' }}
            >
              <i className="fas fa-exclamation-triangle text-purple"></i>
              <span>Emergency</span>
            </button>
            <button
              className={`btn btn-sm flex-center gap-2 ${filter === 'Construction' ? 'btn-secondary' : 'btn-white'}`}
              onClick={() => setFilter('Construction')}
              style={{ borderRadius: 'var(--radius-full)', padding: 'var(--space-2) var(--space-3)', fontSize: '12px', flex: '1 1 auto', justifyContent: 'center' }}
            >
              <i className="fas fa-hard-hat text-warning"></i>
              <span>Construction</span>
            </button>
            <button
              className={`btn btn-sm flex-center gap-2 ${filter === 'Weather' ? 'btn-secondary' : 'btn-white'}`}
              onClick={() => setFilter('Weather')}
              style={{ borderRadius: 'var(--radius-full)', padding: 'var(--space-2) var(--space-3)', fontSize: '12px', flex: '1 1 auto', justifyContent: 'center' }}
            >
              <i className="fas fa-cloud-rain text-info"></i>
              <span>Weather</span>
            </button>
          </div>

          <hr className="separator" />

          <button
            className="btn btn-primary btn-full mb-2"
            onClick={handleMyLocation}
            disabled={locating}
          >
            {locating ? <span className="spinner"></span> : <i className="fas fa-location-arrow"></i>}
            <span>Find My Location</span>
          </button>
          {locError && <p className="help-text is-danger mb-4">{locError}</p>}

          <button
            className={`btn btn-full mb-2 ${directionsVisible ? 'btn-secondary' : 'btn-white'}`}
            onClick={() => setDirectionsVisible(!directionsVisible)}
          >
            <i className="fas fa-directions text-primary"></i>
            <span>{directionsVisible ? 'Hide Route Planner' : 'Plan a Route'}</span>
          </button>

          {directionsVisible && (
            <div className="card mt-2 mb-4">
              <div className="card-header" style={{ padding: 'var(--space-3)' }}>
                <span className="font-semibold text-sm"><i className="fas fa-directions text-primary mr-2"></i> Directions</span>
                <button className="btn-icon btn-sm btn-ghost" onClick={() => setDirectionsVisible(false)}>
                  <i className="fas fa-times"></i>
                </button>
              </div>
              <div className="card-body" style={{ padding: 'var(--space-3)' }}>
                <div className="field mb-3">
                  <div className="input-icon">
                    <i className="fas fa-map-marker-alt icon-left text-primary"></i>
                    <input className="input" type="text" placeholder="Starting point (or click map)" value={startLocation} onChange={e => setStartLocation(e.target.value)} />
                  </div>
                </div>
                <div className="field mb-3">
                  <div className="input-icon">
                    <i className="fas fa-flag-checkered icon-left text-danger"></i>
                    <input className="input" type="text" placeholder="Destination (or click map)" value={endLocation} onChange={e => setEndLocation(e.target.value)} />
                  </div>
                </div>
                <div className="flex gap-2">
                  <button className="btn btn-primary flex-1" onClick={handleGetRoute}>Get Route</button>
                  <button className="btn btn-white" onClick={handleClearRoute} title="Clear Route">
                    <i className="fas fa-undo"></i> Clear
                  </button>
                </div>
                {isLoggedIn && (
                  <button
                    className="btn btn-secondary btn-full mt-2"
                    onClick={() => {
                      const start = parseCoords(startLocation)
                      const end = parseCoords(endLocation)
                      if (!start || !end) {
                        alert('Please set a starting point and destination first.')
                        return
                      }
                      setSaveModalActive(true)
                    }}
                  >
                    <i className="fas fa-save mr-2"></i> Save Route
                  </button>
                )}
                <p className="text-xs text-muted mt-3" style={{ lineHeight: '1.4' }}>
                  <i className="fas fa-info-circle mr-1 text-primary"></i>
                  Tip: Click on the map to place starting and destination points.
                </p>
              </div>
            </div>
          )}
        </div>
      </aside>

      {/* Center: Map */}
      <main className="map-center">
        <div id="map" className="map-full"></div>

        {/* Mobile FABs */}
        <div className="hide-desktop" style={{ position: 'absolute', bottom: '24px', left: '0', right: '0', display: 'flex', justifyContent: 'center', gap: 'var(--space-4)', zIndex: 5 }}>
          <button className="btn btn-primary shadow-lg" style={{ borderRadius: 'var(--radius-full)' }} onClick={() => { setLeftPanelOpen(true); setRightPanelOpen(false); }}>
            <i className="fas fa-sliders-h"></i> Filters
          </button>
          <button className="btn btn-white shadow-lg" style={{ borderRadius: 'var(--radius-full)' }} onClick={() => { setRightPanelOpen(true); setLeftPanelOpen(false); }}>
            <i className="fas fa-list-ul text-primary"></i> Alerts
          </button>
        </div>
      </main>

      {/* Right Panel: Live Feed */}
      <aside className={`map-panel map-panel-right ${rightPanelOpen ? 'is-open' : ''}`}>
        <div className="map-panel-header">
          <div className="flex-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-pulse absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" style={{ backgroundColor: 'var(--color-primary)' }}></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-primary" style={{ backgroundColor: 'var(--color-primary)' }}></span>
            </span>
            <span>Live Feed {filteredAlerts.length > 0 && `(${filteredAlerts.length})`}</span>
          </div>
          <button className="btn-icon hide-desktop" onClick={() => setRightPanelOpen(false)}>
            <i className="fas fa-times"></i>
          </button>
        </div>
        <div className="map-panel-content" style={{ padding: 'var(--space-3)' }}>
          {loading ? (
            <div className="flex-center flex-col gap-3 py-10 text-muted">
              <span className="spinner" style={{ width: '24px', height: '24px', borderWidth: '3px' }}></span>
              <span className="text-sm">Loading area intel...</span>
            </div>
          ) : filteredAlerts.length > 0 ? (
            filteredAlerts.map(alert => (
              <div
                key={alert.id}
                className="feed-card"
                onClick={() => focusAlert(alert.location_lat, alert.location_lng)}
                style={{
                  borderLeft: `3px solid ${alert.alert_type === 'Traffic' ? 'var(--color-danger)' :
                      alert.alert_type === 'Emergency' ? 'var(--color-purple)' :
                        alert.alert_type === 'Construction' ? 'var(--color-warning)' : 'var(--color-info)'
                    }`
                }}
              >
                <div className="feed-icon" style={{
                  background: alert.alert_type === 'Traffic' ? 'var(--color-danger-light)' :
                    alert.alert_type === 'Emergency' ? 'var(--color-purple-light)' :
                      alert.alert_type === 'Construction' ? 'var(--color-warning-light)' : 'var(--color-info-light)',
                  color: alert.alert_type === 'Traffic' ? 'var(--color-danger)' :
                    alert.alert_type === 'Emergency' ? 'var(--color-purple)' :
                      alert.alert_type === 'Construction' ? 'var(--color-warning)' : 'var(--color-info)'
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

      {/* Save Route Modal */}
      {saveModalActive && (
        <div className="modal-overlay" style={{ zIndex: 1000 }}>
          <div className="modal-card">
            <div className="modal-card-header">
              <h3 className="font-semibold text-lg"><i className="fas fa-save text-primary mr-2"></i> Save Route</h3>
              <button className="close-btn" onClick={() => setSaveModalActive(false)}>
                <i className="fas fa-times"></i>
              </button>
            </div>
            <div className="modal-card-body">
              <p className="text-secondary text-sm mb-4">Give your route a name so you can quickly navigate it later.</p>
              <div className="field">
                <label className="label">Route Name</label>
                <input
                  className="input"
                  type="text"
                  placeholder="e.g. Home to Work"
                  value={routeName}
                  onChange={e => setRouteName(e.target.value)}
                  maxLength={50}
                  autoFocus
                />
              </div>
            </div>
            <div className="modal-card-footer">
              <button className="btn btn-ghost" onClick={() => setSaveModalActive(false)}>Cancel</button>
              <button
                className="btn btn-primary"
                onClick={confirmSaveRoute}
                disabled={isSavingRoute}
              >
                {isSavingRoute ? <span className="spinner"></span> : 'Save Route'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
