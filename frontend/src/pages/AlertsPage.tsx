import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { getAlerts } from '../api'
import type { Alert } from '../types'

const ICON_FA: Record<string, string> = {
  Traffic: 'fa-car-crash',
  Emergency: 'fa-exclamation-triangle',
  Construction: 'fa-hard-hat',
  Weather: 'fa-cloud-rain',
}

const BADGE_COLOR: Record<string, string> = {
  Traffic: 'danger',
  Emergency: 'purple',
  Construction: 'warning',
  Weather: 'info',
}

export default function AlertsPage() {
  const [filter, setFilter] = useState('all')
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getAlerts()
      .then(res => {
        if (Array.isArray(res.data)) {
          setAlerts(res.data)
        } else {
          console.error('API did not return an array of alerts')
          setAlerts([])
        }
      })
      .catch(() => setAlerts([]))
      .finally(() => setLoading(false))
  }, [])

  const filteredAlerts = filter === 'all' ? alerts : alerts.filter(a => a.alert_type === filter)

  return (
    <>
      <div className="page-header bg-white">
        <div className="container">
          <h1>Regional Alerts</h1>
          <p>Stay informed about current events affecting your area</p>
        </div>
      </div>

      <section className="section pt-0">
        <div className="container">
          {/* Controls */}
          <div className="flex-between flex-wrap gap-4 mb-6">
            <div className="pill-filters">
              <button className={`pill ${filter === 'all' ? 'active' : ''}`} onClick={() => setFilter('all')}>
                All Alerts
              </button>
              <button className={`pill ${filter === 'Traffic' ? 'active' : ''}`} onClick={() => setFilter('Traffic')}>
                <i className="fas fa-car-crash"></i> Traffic
              </button>
              <button className={`pill ${filter === 'Emergency' ? 'active' : ''}`} onClick={() => setFilter('Emergency')}>
                <i className="fas fa-exclamation-triangle"></i> Emergency
              </button>
              <button className={`pill ${filter === 'Construction' ? 'active' : ''}`} onClick={() => setFilter('Construction')}>
                <i className="fas fa-hard-hat"></i> Construction
              </button>
              <button className={`pill ${filter === 'Weather' ? 'active' : ''}`} onClick={() => setFilter('Weather')}>
                <i className="fas fa-cloud-rain"></i> Weather
              </button>
            </div>
            
            <div className="flex gap-2">
              <button 
                className="btn btn-primary"
                onClick={() => {
                  if (!('Notification' in window)) {
                    alert('This browser does not support notifications.');
                    return;
                  }
                  Notification.requestPermission().then(p => {
                    if (p === 'granted') {
                      new Notification('SRANS Notifications Enabled', {
                        body: 'You will now receive alerts directly in your browser.',
                        icon: '/Logo.png'
                      });
                    }
                  });
                }}
              >
                <i className="fas fa-bell mr-1"></i> Enable Notifications
              </button>
              <Link to="/map" className="btn btn-secondary">
                <i className="fas fa-map-marked-alt"></i> View on Map
              </Link>
            </div>
          </div>

          {/* Alert Feed */}
          {loading ? (
            <div className="flex-center flex-col py-12 text-muted">
              <span className="spinner" style={{ width: '40px', height: '40px', borderWidth: '4px' }}></span>
              <p className="mt-4 font-medium">Loading intelligence feed...</p>
            </div>
          ) : filteredAlerts.length > 0 ? (
            <div className="grid grid-2">
              {filteredAlerts.map(alert => {
                const colorTheme = BADGE_COLOR[alert.alert_type] || 'neutral'
                const icon = ICON_FA[alert.alert_type] || 'fa-bell'
                
                return (
                  <div key={alert.id} className="card card-hover" style={{ borderLeft: `4px solid var(--color-${colorTheme === 'purple' ? 'purple' : colorTheme === 'warning' ? 'warning' : colorTheme === 'danger' ? 'danger' : 'info'})` }}>
                    <div className="card-body">
                      <div className="flex items-start gap-4 mb-4">
                        <div className={`icon-box-sm ${colorTheme}`}>
                          <i className={`fas ${icon}`}></i>
                        </div>
                        <div className="flex-1">
                          <div className="flex-between mb-1">
                            <h3 className="font-semibold text-lg leading-tight">{alert.title}</h3>
                            <span className="text-xs text-muted whitespace-nowrap ml-2">
                              {new Date(alert.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                          <span className={`badge badge-${colorTheme}`}>{alert.alert_type}</span>
                        </div>
                      </div>
                      
                      <p className="text-secondary mb-4 line-clamp-3" style={{ display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                        {alert.description}
                      </p>
                      
                      <div className="flex-between pt-4 border-t border-light" style={{ borderTop: '1px solid var(--border-light)' }}>
                        <span className="text-xs text-muted">
                          <i className="fas fa-map-marker-alt mr-1"></i>
                          {alert.location_lat.toFixed(4)}, {alert.location_lng.toFixed(4)}
                        </span>
                        <Link to={`/map?lat=${alert.location_lat}&lng=${alert.location_lng}`} className="btn btn-ghost btn-sm">
                          View Location <i className="fas fa-arrow-right ml-1"></i>
                        </Link>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="card">
              <div className="card-body py-12 flex-center flex-col text-center">
                <div className="icon-box bg-subtle text-muted mb-4 text-3xl" style={{ width: '80px', height: '80px' }}>
                  <i className="fas fa-check-circle"></i>
                </div>
                <h3 className="font-display font-bold text-2xl mb-2">All Clear</h3>
                <p className="text-secondary max-w-md">There are currently no active alerts matching your filters. Your region is clear.</p>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Map CTA */}
      <section className="section bg-primary text-white text-center" style={{ background: 'var(--color-primary)', color: 'white' }}>
        <div className="container">
          <h2 className="font-display font-bold text-3xl mb-4">See the bigger picture</h2>
          <p className="text-lg opacity-90 mb-8 max-w-2xl mx-auto" style={{ maxWidth: '600px', margin: '0 auto 2rem' }}>
            Visualize all active alerts, traffic conditions, and weather patterns on our interactive regional map.
          </p>
          <Link to="/map" className="btn btn-white btn-lg">
            <i className="fas fa-map"></i> Open Interactive Map
          </Link>
        </div>
      </section>
    </>
  )
}
