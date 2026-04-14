import { useState, useEffect, useRef } from 'react'
import { getAlerts } from '../api'
import type { Alert } from '../types'

declare const L: any

const ICON_COLORS: Record<string, string> = {
  Traffic: '#e53e3e',
  Emergency: '#805ad5',
  Construction: '#d69e2e',
  Weather: '#3182ce',
}

const ICON_FA: Record<string, string> = {
  Traffic: 'fa-car-crash',
  Emergency: 'fa-exclamation-triangle',
  Construction: 'fa-hard-hat',
  Weather: 'fa-cloud-rain',
}

function makeIcon(type: string) {
  const color = ICON_COLORS[type] || '#718096'
  const icon = ICON_FA[type] || 'fa-bell'
  return L.divIcon({
    className: '',
    html: `
      <div style="
        width: 36px; height: 36px; border-radius: 50%;
        background: ${color};
        display: flex; align-items: center; justify-content: center;
        box-shadow: 0 2px 8px rgba(0,0,0,0.35);
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
      "></div>
    `,
    iconSize: [36, 44],
    iconAnchor: [18, 44],
    popupAnchor: [0, -46],
  })
}

export default function MapPage() {
  const [filter, setFilter] = useState('all')
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [loading, setLoading] = useState(true)
  const [directionsVisible, setDirectionsVisible] = useState(false)
  const [startLocation, setStartLocation] = useState('')
  const [endLocation, setEndLocation] = useState('')
  const [locating, setLocating] = useState(false)
  const [locError, setLocError] = useState<string | null>(null)

  const mapRef = useRef<any>(null)
  const markersRef = useRef<any[]>([])
  const userMarkerRef = useRef<any>(null)

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
    mapRef.current = L.map('map').setView([18.5204, 73.8567], 13)
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo(mapRef.current)
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
              background:#3273dc;
              display:flex;align-items:center;justify-content:center;
              box-shadow:0 2px 8px rgba(0,0,0,0.35);
              border:2px solid white;
            ">
              <i class="fas fa-user" style="color:white;font-size:14px;"></i>
            </div>
            <div style="
              width:0;height:0;
              border-left:6px solid transparent;
              border-right:6px solid transparent;
              border-top:8px solid #3273dc;
              margin:0 auto;
            "></div>
          `,
          iconSize: [36, 44],
          iconAnchor: [18, 44],
          popupAnchor: [0, -46],
        })
        userMarkerRef.current = L.marker([latitude, longitude], { icon: userIcon })
          .addTo(mapRef.current)
          .bindPopup('<strong>You are here</strong>')
          .openPopup()
      },
      (err) => {
        setLocating(false)
        switch (err.code) {
          case err.PERMISSION_DENIED:
            setLocError('Location access denied. Please allow location in your browser settings.')
            break
          case err.POSITION_UNAVAILABLE:
            setLocError('Location unavailable. Try again.')
            break
          case err.TIMEOUT:
            setLocError('Location request timed out. Try again.')
            break
          default:
            setLocError('Could not get your location.')
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
      const color = ICON_COLORS[alert.alert_type] || '#718096'
      const marker = L.marker([alert.location_lat, alert.location_lng], { icon: makeIcon(alert.alert_type) })
        .addTo(mapRef.current)
        .bindPopup(`<strong>${alert.title}</strong><br/><em>${alert.alert_type}</em><br/>${alert.description}`)
      markersRef.current.push(marker)
    })
  }, [filteredAlerts])

  const focusAlert = (lat: number, lng: number, title: string) => {
    setEndLocation(`${lat}, ${lng}`)
    setDirectionsVisible(true)
    if (mapRef.current) {
      mapRef.current.setView([lat, lng], 15)
      const found = markersRef.current.find(m => {
        const pos = m.getLatLng()
        return Math.abs(pos.lat - lat) < 0.0001 && Math.abs(pos.lng - lng) < 0.0001
      })
      if (found) found.openPopup()
    }
  }

  return (
    <>
      <section className="hero is-primary">
        <div className="hero-body">
          <div className="container has-text-centered">
            <h1 className="title is-1">Interactive Map</h1>
            <h2 className="subtitle is-4">Explore and navigate your region with live traffic updates</h2>
          </div>
        </div>
      </section>

      {/* Controls */}
      <section className="section pt-5 pb-3">
        <div className="container">
          <div className="columns is-mobile is-multiline">
            <div className="column is-8">
              <div className="field is-grouped">
                <div className="control">
                  <button
                    className={`button is-primary${locating ? ' is-loading' : ''}`}
                    onClick={handleMyLocation}
                    disabled={locating}
                  >
                    <span className="icon"><i className="fas fa-location-arrow"></i></span>
                    <span>My Location</span>
                  </button>
                </div>
              </div>
              {locError && (
                <p className="help is-danger mt-2">
                  <span className="icon-text">
                    <span className="icon"><i className="fas fa-exclamation-circle"></i></span>
                    <span>{locError}</span>
                  </span>
                </p>
              )}
            </div>
            <div className="column is-4">
              <div className="field">
                <div className="control has-icons-left">
                  <div className="select is-fullwidth">
                    <select value={filter} onChange={e => setFilter(e.target.value)}>
                      <option value="all">All Alerts</option>
                      <option value="Traffic">Traffic Alerts</option>
                      <option value="Emergency">Emergency Alerts</option>
                      <option value="Construction">Construction Alerts</option>
                      <option value="Weather">Weather Alerts</option>
                    </select>
                  </div>
                  <div className="icon is-small is-left"><i className="fas fa-filter"></i></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Map + Sidebar */}
      <section className="section pt-3">
        <div className="container">
          <div className="columns">
            <div className="column is-9">
              <div className="card">
                <div className="card-content p-0">
                  <div id="map" style={{ height: '600px', width: '100%', borderRadius: '6px' }}></div>
                </div>
              </div>
            </div>

            <div className="column is-3">
              <div className="card">
                <header className="card-header">
                  <p className="card-header-title">
                    <span className="icon-text">
                      <span className="icon"><i className="fas fa-bell"></i></span>
                      <span>Nearby Alerts {!loading && `(${filteredAlerts.length})`}</span>
                    </span>
                  </p>
                </header>
                <div className="card-content" style={{ maxHeight: '530px', overflowY: 'auto' }}>
                  {loading ? (
                    <div className="has-text-centered py-5">
                      <span className="icon"><i className="fas fa-spinner fa-spin has-text-primary"></i></span>
                      <p className="mt-2 is-size-7">Loading alerts...</p>
                    </div>
                  ) : filteredAlerts.length > 0 ? filteredAlerts.map(alert => (
                    <div key={alert.id} className="box mb-3" style={{ cursor: 'pointer', borderLeft: `4px solid ${ICON_COLORS[alert.alert_type] || 'gray'}` }}>
                      <article className="media">
                        <div className="media-left">
                          <span className="icon is-medium">
                            {alert.alert_type === 'Traffic' && <i className="fas fa-car-crash has-text-danger"></i>}
                            {alert.alert_type === 'Emergency' && <i className="fas fa-exclamation-triangle has-text-danger"></i>}
                            {alert.alert_type === 'Construction' && <i className="fas fa-hard-hat has-text-warning"></i>}
                            {alert.alert_type === 'Weather' && <i className="fas fa-cloud-rain has-text-info"></i>}
                          </span>
                        </div>
                        <div className="media-content">
                          <p className="is-6"><strong>{alert.title}</strong></p>
                          <p className="is-7">{alert.description}</p>
                          <div className="is-flex is-justify-content-space-between is-align-items-center mt-1">
                            <span className={`tag is-small ${
                              alert.alert_type === 'Traffic' ? 'is-danger' :
                              alert.alert_type === 'Emergency' ? 'is-warning' :
                              alert.alert_type === 'Construction' ? 'is-warning' : 'is-info'
                            }`}>{alert.alert_type}</span>
                            <a className="is-size-7" onClick={e => { e.preventDefault(); focusAlert(alert.location_lat, alert.location_lng, alert.title) }}>
                              View on map
                            </a>
                          </div>
                        </div>
                      </article>
                    </div>
                  )) : (
                    <div className="has-text-centered my-6">
                      <span className="icon is-large"><i className="fas fa-info-circle has-text-grey-light"></i></span>
                      <p className="mt-3 has-text-grey">No alerts available</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Directions */}
      {directionsVisible && (
        <section className="section pt-3">
          <div className="container">
            <div className="card">
              <header className="card-header">
                <p className="card-header-title">
                  <span className="icon-text">
                    <span className="icon"><i className="fas fa-directions"></i></span>
                    <span>Directions</span>
                  </span>
                </p>
                <button className="card-header-icon" onClick={() => setDirectionsVisible(false)}>
                  <span className="icon"><i className="fas fa-times"></i></span>
                </button>
              </header>
              <div className="card-content">
                <div className="columns">
                  <div className="column is-4">
                    <div className="field">
                      <label className="label">Starting Point</label>
                      <div className="control has-icons-left">
                        <input className="input" type="text" placeholder="Enter starting point"
                          value={startLocation} onChange={e => setStartLocation(e.target.value)} />
                        <span className="icon is-small is-left"><i className="fas fa-map-marker-alt"></i></span>
                      </div>
                    </div>
                    <div className="field">
                      <label className="label">Destination</label>
                      <div className="control has-icons-left">
                        <input className="input" type="text" value={endLocation} readOnly />
                        <span className="icon is-small is-left"><i className="fas fa-flag-checkered"></i></span>
                      </div>
                    </div>
                    <div className="field">
                      <div className="control">
                        <button className="button is-primary is-fullwidth">
                          <span className="icon"><i className="fas fa-route"></i></span>
                          <span>Get Directions</span>
                        </button>
                      </div>
                    </div>
                  </div>
                  <div className="column is-8">
                    <div className="notification is-info is-light">
                      <p><strong>Tip:</strong> Enter a starting location to calculate routes.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}
    </>
  )
}
