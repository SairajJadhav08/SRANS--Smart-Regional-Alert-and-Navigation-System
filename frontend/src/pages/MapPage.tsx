import { useState, useEffect, useRef } from 'react'

export default function MapPage() {
  const [filter, setFilter] = useState('all')
  const [directionsVisible, setDirectionsVisible] = useState(false)
  const [activeLayers, setActiveLayers] = useState<string[]>(['traffic'])
  const [startLocation, setStartLocation] = useState('')
  const [endLocation, setEndLocation] = useState('')

  // Mock list of alerts for frontend demonstration
  const [alerts] = useState([
    {
      id: 1,
      alert_type: 'Traffic',
      title: 'Heavy Traffic on Main St',
      description: 'Accident reported on Main St causing significant delays.',
      location_lat: 37.7749,
      location_lng: -122.4194
    },
    {
      id: 2,
      alert_type: 'Construction',
      title: 'Roadwork on Highway 101',
      description: 'Lanes closed due to ongoing construction.',
      location_lat: 37.7849,
      location_lng: -122.4094
    }
  ])

  const filteredAlerts = filter === 'all' ? alerts : alerts.filter(a => a.alert_type === filter)

  const toggleLayer = (layer: string) => {
    setActiveLayers(prev => {
      if (prev.includes(layer)) return prev.filter(l => l !== layer)
      return [...prev, layer]
    })
  }

  const showDirections = (lat: number, lng: number) => {
    setEndLocation(`${lat}, ${lng}`)
    setDirectionsVisible(true)

    // Pan map and open info window for the selected alert
    if (mapRef.current) {
      mapRef.current.panTo({ lat, lng })
      mapRef.current.setZoom(15)

      // Find the matching marker and open its info window
      const found = markersRef.current.find(m => {
        const pos = m.marker.getPosition()
        return Math.abs(pos.lat() - lat) < 0.0001 && Math.abs(pos.lng() - lng) < 0.0001
      })
      if (found) {
        found.infoWindow.open(mapRef.current, found.marker)
        // Bounce animation
        found.marker.setAnimation((window as any).google.maps.Animation.BOUNCE)
        setTimeout(() => found.marker.setAnimation(null), 2100)
      }
    }
  }

  const mapRef = useRef<any>(null)
  const markersRef = useRef<{ marker: any; infoWindow: any }[]>([])

  useEffect(() => {
    // Initialize map
    const mapElement = document.getElementById('map')
    if (mapElement && (window as any).google && !mapRef.current) {
      mapRef.current = new (window as any).google.maps.Map(mapElement, {
        center: { lat: 37.7749, lng: -122.4194 },
        zoom: 12,
        mapTypeId: "roadmap",
      })
    }
  }, [])

  useEffect(() => {
    if (!mapRef.current || !(window as any).google) return;

    // Clear old markers
    markersRef.current.forEach(m => m.marker.setMap(null))
    markersRef.current = []

    filteredAlerts.forEach(alert => {
      let iconUrl = "https://maps.google.com/mapfiles/ms/icons/red-dot.png"
      if (alert.alert_type === "Traffic") {
          iconUrl = "https://maps.google.com/mapfiles/ms/icons/red-dot.png";
      } else if (alert.alert_type === "Emergency") {
          iconUrl = "https://maps.google.com/mapfiles/ms/icons/purple-dot.png";
      } else if (alert.alert_type === "Construction") {
          iconUrl = "https://maps.google.com/mapfiles/ms/icons/yellow-dot.png";
      } else if (alert.alert_type === "Weather") {
          iconUrl = "https://maps.google.com/mapfiles/ms/icons/blue-dot.png";
      }

      const marker = new (window as any).google.maps.Marker({
        position: { lat: alert.location_lat, lng: alert.location_lng },
        map: mapRef.current,
        title: alert.title,
        icon: {
           url: iconUrl,
           scaledSize: new (window as any).google.maps.Size(32, 32)
        },
        animation: (window as any).google.maps.Animation.DROP
      })

      const infoWindow = new (window as any).google.maps.InfoWindow({
        content: `
            <div style="max-width: 300px; color: black;">
                <h3 style="font-weight: bold; margin-bottom: 5px;">${alert.title}</h3>
                <span style="display: inline-block; padding: 2px 8px; background-color: #f5f5f5; border-radius: 4px; margin-bottom: 8px;">${alert.alert_type}</span>
                <p>${alert.description}</p>
            </div>
        `
      })

      marker.addListener("click", () => {
        infoWindow.open(mapRef.current, marker)
      })

      markersRef.current.push({ marker, infoWindow })
    })
  }, [filteredAlerts])

  return (
    <>
      {/* Hero Section */}
      <section className="hero is-primary">
        <div className="hero-body">
          <div className="container has-text-centered">
            <h1 className="title is-1">Interactive Map</h1>
            <h2 className="subtitle is-4">Explore and navigate your region with live traffic updates</h2>
          </div>
        </div>
      </section>

      {/* Map Controls */}
      <section className="section pt-5 pb-3">
        <div className="container">
          <div className="columns is-mobile is-multiline">
            <div className="column is-8">
              <div className="field is-grouped is-grouped-multiline">
                <div className="control">
                  <div className="buttons has-addons">
                    <button 
                      className={`button ${activeLayers.includes('traffic') ? 'is-info' : ''}`}
                      onClick={() => toggleLayer('traffic')}
                    >
                      <span className="icon">
                        <i className="fas fa-traffic-light"></i>
                      </span>
                      <span>Traffic</span>
                    </button>
                    <button 
                      className={`button ${activeLayers.includes('terrain') ? 'is-info' : ''}`}
                      onClick={() => toggleLayer('terrain')}
                    >
                      <span className="icon">
                        <i className="fas fa-mountain"></i>
                      </span>
                      <span>Terrain</span>
                    </button>
                    <button 
                      className={`button ${activeLayers.includes('satellite') ? 'is-info' : ''}`}
                      onClick={() => toggleLayer('satellite')}
                    >
                      <span className="icon">
                        <i className="fas fa-satellite"></i>
                      </span>
                      <span>Satellite</span>
                    </button>
                  </div>
                </div>

                <div className="control">
                  <button className="button is-primary">
                    <span className="icon">
                      <i className="fas fa-location-arrow"></i>
                    </span>
                    <span>My Location</span>
                  </button>
                </div>
              </div>
            </div>

            <div className="column is-4">
              <div className="field">
                <div className="control has-icons-left">
                  <div className="select is-fullwidth">
                    <select value={filter} onChange={(e) => setFilter(e.target.value)}>
                      <option value="all">All Alerts</option>
                      <option value="Traffic">Traffic Alerts</option>
                      <option value="Emergency">Emergency Alerts</option>
                      <option value="Construction">Construction Alerts</option>
                      <option value="Weather">Weather Alerts</option>
                    </select>
                  </div>
                  <div className="icon is-small is-left">
                    <i className="fas fa-filter"></i>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Map Section */}
      <section className="section pt-3">
        <div className="container">
          <div className="columns">
            {/* Main Map */}
            <div className="column is-9">
              <div className="card">
                <div className="card-content p-0">
                  <div id="map" style={{ height: '600px', width: '100%', borderRadius: '6px' }}></div>
                </div>
              </div>
            </div>

            {/* Sidebar with Alerts */}
            <div className="column is-3">
              <div className="card">
                <header className="card-header">
                  <p className="card-header-title">
                    <span className="icon-text">
                      <span className="icon">
                        <i className="fas fa-bell"></i>
                      </span>
                      <span>Nearby Alerts</span>
                    </span>
                  </p>
                </header>
                <div className="card-content" style={{ maxHeight: '530px', overflowY: 'auto' }}>
                  <div id="alerts-list">
                    {filteredAlerts.length > 0 ? (
                      filteredAlerts.map(alert => (
                        <div key={alert.id} className="box mb-3 alert-item" style={{ cursor: 'pointer', borderLeftWidth: '4px', borderLeftStyle: 'solid', borderLeftColor: '#3273dc' }}>
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
                                }`}>
                                  {alert.alert_type}
                                </span>
                                <a className="is-size-7 view-on-map" onClick={(e) => { e.preventDefault(); showDirections(alert.location_lat, alert.location_lng) }}>View on map</a>
                              </div>
                            </div>
                          </article>
                        </div>
                      ))
                    ) : (
                      <div className="has-text-centered my-6">
                        <span className="icon is-large">
                          <i className="fas fa-info-circle has-text-grey-light"></i>
                        </span>
                        <p className="mt-3 has-text-grey">No alerts available</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Directions Section */}
      {directionsVisible && (
        <section className="section pt-3" id="directions-section">
          <div className="container">
            <div className="card">
              <header className="card-header">
                <p className="card-header-title">
                  <span className="icon-text">
                    <span className="icon">
                      <i className="fas fa-directions"></i>
                    </span>
                    <span>Directions</span>
                  </span>
                </p>
                <button className="card-header-icon" aria-label="close" onClick={() => setDirectionsVisible(false)}>
                  <span className="icon">
                    <i className="fas fa-times"></i>
                  </span>
                </button>
              </header>
              <div className="card-content">
                <div className="columns">
                  <div className="column is-4">
                    <div className="field">
                      <label className="label">Starting Point</label>
                      <div className="control has-icons-left">
                        <input 
                          className="input" 
                          type="text" 
                          placeholder="Enter starting point" 
                          value={startLocation}
                          onChange={e => setStartLocation(e.target.value)}
                        />
                        <span className="icon is-small is-left">
                          <i className="fas fa-map-marker-alt"></i>
                        </span>
                      </div>
                    </div>
                    
                    <div className="field">
                      <label className="label">Destination</label>
                      <div className="control has-icons-left">
                        <input className="input" type="text" placeholder="Enter destination" value={endLocation} readOnly />
                        <span className="icon is-small is-left">
                          <i className="fas fa-flag-checkered"></i>
                        </span>
                      </div>
                    </div>
                    
                    <div className="field">
                      <label className="label">Travel Mode</label>
                      <div className="control has-icons-left">
                        <div className="select is-fullwidth">
                          <select>
                            <option value="DRIVING">Driving</option>
                            <option value="WALKING">Walking</option>
                            <option value="BICYCLING">Bicycling</option>
                            <option value="TRANSIT">Transit</option>
                          </select>
                        </div>
                        <span className="icon is-small is-left">
                          <i className="fas fa-car"></i>
                        </span>
                      </div>
                    </div>
                    
                    <div className="field">
                      <div className="control">
                        <button className="button is-primary is-fullwidth" onClick={() => alert("Mock: Calculating Route...")}>
                          <span className="icon">
                            <i className="fas fa-route"></i>
                          </span>
                          <span>Get Directions</span>
                        </button>
                      </div>
                    </div>
                  </div>
                  
                  <div className="column is-8">
                    <div id="directions-panel" style={{ height: '350px', overflowY: 'auto' }}>
                      <div id="directions-results">
                        <div className="notification is-info is-light">
                          <p><strong>Tip:</strong> Enter a starting location to calculate routes.</p>
                        </div>
                      </div>
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
