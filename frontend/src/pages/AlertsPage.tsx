import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { getAlerts } from '../api'
import type { Alert } from '../types'

declare const L: any

const TABS = [
  { key: '', label: 'All Alerts', icon: 'fa-list' },
  { key: 'Traffic', label: 'Traffic', icon: 'fa-car-crash' },
  { key: 'Emergency', label: 'Emergency', icon: 'fa-exclamation-triangle' },
  { key: 'Construction', label: 'Construction', icon: 'fa-hard-hat' },
  { key: 'Weather', label: 'Weather', icon: 'fa-cloud-rain' },
]

const TYPE_COLOR: Record<string, string> = {
  Traffic: 'is-danger', Emergency: 'is-danger', Construction: 'is-warning', Weather: 'is-info'
}

export default function AlertsPage() {
  const [currentType, setCurrentType] = useState('')
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [loading, setLoading] = useState(true)
  const { isLoggedIn } = useAuth()

  const mapRef = useRef<any>(null)
  const markersRef = useRef<any[]>([])

  // Fetch alerts from API
  useEffect(() => {
    setLoading(true)
    getAlerts(currentType ? { type: currentType } : undefined)
      .then(res => setAlerts(res.data))
      .catch(() => setAlerts([]))
      .finally(() => setLoading(false))
  }, [currentType])

  // Init map once
  useEffect(() => {
    if (mapRef.current) return
    mapRef.current = L.map('alertMap').setView([18.5204, 73.8567], 12)
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo(mapRef.current)
  }, [])

  // Update markers when alerts change
  useEffect(() => {
    if (!mapRef.current) return
    markersRef.current.forEach(m => m.remove())
    markersRef.current = []

    const COLORS: Record<string, string> = {
      Traffic: '#e53e3e', Emergency: '#805ad5', Construction: '#d69e2e', Weather: '#3182ce'
    }
    const ICONS: Record<string, string> = {
      Traffic: 'fa-car-crash', Emergency: 'fa-exclamation-triangle',
      Construction: 'fa-hard-hat', Weather: 'fa-cloud-rain'
    }

    alerts.forEach(alert => {
      const color = COLORS[alert.alert_type] || '#718096'
      const icon = ICONS[alert.alert_type] || 'fa-bell'
      const divIcon = L.divIcon({
        className: '',
        html: `
          <div style="width:36px;height:36px;border-radius:50%;background:${color};
            display:flex;align-items:center;justify-content:center;
            box-shadow:0 2px 8px rgba(0,0,0,0.35);border:2px solid white;">
            <i class="fas ${icon}" style="color:white;font-size:14px;"></i>
          </div>
          <div style="width:0;height:0;border-left:6px solid transparent;
            border-right:6px solid transparent;border-top:8px solid ${color};margin:0 auto;"></div>
        `,
        iconSize: [36, 44],
        iconAnchor: [18, 44],
        popupAnchor: [0, -46],
      })
      const marker = L.marker([alert.location_lat, alert.location_lng], { icon: divIcon })
        .addTo(mapRef.current)
        .bindPopup(`<strong>${alert.title}</strong><br/><em>${alert.alert_type}</em>`)
      markersRef.current.push(marker)
    })
  }, [alerts])

  return (
    <>
      <section className="hero is-primary">
        <div className="hero-body">
          <div className="container has-text-centered">
            <h1 className="title is-1">Real-Time Alerts</h1>
            <h2 className="subtitle is-4">Stay ahead with up-to-the-minute information</h2>
          </div>
        </div>
      </section>

      {/* Filter Tabs */}
      <section className="section pt-5 pb-0">
        <div className="container">
          <div className="tabs is-centered is-boxed is-medium">
            <ul>
              {TABS.map(tab => (
                <li key={tab.key} className={currentType === tab.key ? 'is-active' : ''}>
                  <a onClick={() => setCurrentType(tab.key)}>
                    <span className="icon"><i className={`fas ${tab.icon}`}></i></span>
                    <span>{tab.label}</span>
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* Alert Cards */}
      <section className="section">
        <div className="container">
          {loading ? (
            <div className="has-text-centered py-6">
              <span className="icon is-large"><i className="fas fa-spinner fa-spin fa-3x has-text-primary"></i></span>
              <p className="mt-4">Loading alerts...</p>
            </div>
          ) : alerts.length > 0 ? (
            <div className="columns is-multiline">
              {alerts.map(alert => (
                <div className="column is-4" key={alert.id}>
                  <div className={`card alert-${alert.alert_type.toLowerCase()}`}>
                    <header className="card-header">
                      <p className="card-header-title">
                        <span className="icon-text">
                          <span className="icon">
                            {alert.alert_type === 'Traffic' && <i className="fas fa-car-crash has-text-danger"></i>}
                            {alert.alert_type === 'Emergency' && <i className="fas fa-exclamation-triangle has-text-danger"></i>}
                            {alert.alert_type === 'Construction' && <i className="fas fa-hard-hat has-text-warning"></i>}
                            {alert.alert_type === 'Weather' && <i className="fas fa-cloud-rain has-text-info"></i>}
                          </span>
                          <span>{alert.alert_type}</span>
                        </span>
                      </p>
                      <p className="card-header-icon">
                        <time dateTime={alert.created_at}>
                          {new Date(alert.created_at).toLocaleDateString()}
                        </time>
                      </p>
                    </header>
                    <div className="card-content">
                      <h4 className="title is-5">{alert.title}</h4>
                      <p>{alert.description}</p>
                    </div>
                    <footer className="card-footer">
                      <Link to={`/map?lat=${alert.location_lat}&lng=${alert.location_lng}`} className="card-footer-item">
                        <span className="icon-text">
                          <span className="icon"><i className="fas fa-map-marker-alt"></i></span>
                          <span>View on Map</span>
                        </span>
                      </Link>
                    </footer>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="has-text-centered my-6">
              <span className="icon is-large"><i className="fas fa-info-circle fa-3x has-text-grey-light"></i></span>
              <h3 className="title is-4 mt-4 has-text-grey">No Alerts Available</h3>
              <p className="subtitle is-6 has-text-grey">
                {currentType ? `No ${currentType} alerts right now.` : 'No alerts in your region right now.'}
              </p>
            </div>
          )}
        </div>
      </section>

      {/* Map */}
      <section className="section has-background-light">
        <div className="container">
          <h2 className="title is-3 has-text-centered mb-5">Alert Locations</h2>
          <div id="alertMap" style={{ height: '400px', borderRadius: '10px', boxShadow: '0 2px 10px rgba(0,0,0,0.1)' }}></div>
        </div>
      </section>

      {/* CTA */}
      <section className="section">
        <div className="container">
          <div className="columns is-centered">
            <div className="column is-8">
              <div className="box p-6" style={{ background: 'linear-gradient(135deg,#4a7bab,#2c4c7c)', borderRadius: 14 }}>
                <div className="columns is-vcentered">
                  <div className="column is-7">
                    <h3 className="title is-4 has-text-white">Get Alerts in Real-Time</h3>
                    <p className="has-text-white" style={{ opacity: 0.85 }}>Register to receive instant notifications when new alerts are issued in your area.</p>
                  </div>
                  <div className="column is-5">
                    {!isLoggedIn ? (
                      <Link to="/register" className="button is-white is-fullwidth">
                        <span className="icon"><i className="fas fa-user-plus"></i></span>
                        <span>Register Now</span>
                      </Link>
                    ) : (
                      <div className="notification is-success is-light">
                        <span className="icon-text">
                          <span className="icon"><i className="fas fa-check-circle"></i></span>
                          <span>You're receiving alerts</span>
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
