import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function AlertsPage() {
  const [currentType, setCurrentType] = useState<string>('')
  const { isLoggedIn } = useAuth()

  // Mock list of alerts for frontend demonstration
  const [alerts] = useState([
    {
      id: 1,
      alert_type: 'Traffic',
      title: 'Heavy Traffic on Main St',
      description: 'Accident reported on Main St causing significant delays.',
      created_at: new Date().toISOString(),
      location_lat: 37.7749,
      location_lng: -122.4194
    },
    {
      id: 2,
      alert_type: 'Construction',
      title: 'Roadwork on Highway 101',
      description: 'Lanes closed due to ongoing construction.',
      created_at: new Date().toISOString(),
      location_lat: 37.7849,
      location_lng: -122.4094
    }
  ])

  const filteredAlerts = currentType ? alerts.filter(a => a.alert_type.toLowerCase() === currentType.toLowerCase()) : alerts

  useEffect(() => {
    // A placeholder for initializing Google Map, similar to the script tag in template
    const initMap = () => {
      const mapElement = document.getElementById('alertMap')
      if (mapElement && (window as any).google) {
        const map = new (window as any).google.maps.Map(mapElement, {
          zoom: 10,
          center: { lat: 37.7749, lng: -122.4194 },
          mapTypeId: 'roadmap',
        })
        
        filteredAlerts.forEach(alert => {
          if (alert.location_lat && alert.location_lng) {
            new (window as any).google.maps.Marker({
              position: { lat: alert.location_lat, lng: alert.location_lng },
              map: map,
              title: alert.title
            })
          }
        })
      }
    }
    
    // In a real scenario we'd wait for maps API to load, mocking here
    if ((window as any).google) {
      initMap()
    }
  }, [filteredAlerts])

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

      <section className="section pt-5 pb-0">
        <div className="container">
          <div className="tabs is-centered is-boxed is-medium">
            <ul>
              <li className={!currentType ? 'is-active' : ''}>
                <a onClick={() => setCurrentType('')}>
                  <span className="icon"><i className="fas fa-list"></i></span>
                  <span>All Alerts</span>
                </a>
              </li>
              <li className={currentType === 'traffic' ? 'is-active' : ''}>
                <a onClick={() => setCurrentType('traffic')}>
                  <span className="icon has-text-danger"><i className="fas fa-car-crash"></i></span>
                  <span>Traffic</span>
                </a>
              </li>
              <li className={currentType === 'emergency' ? 'is-active' : ''}>
                <a onClick={() => setCurrentType('emergency')}>
                  <span className="icon has-text-danger"><i className="fas fa-exclamation-triangle"></i></span>
                  <span>Emergency</span>
                </a>
              </li>
              <li className={currentType === 'construction' ? 'is-active' : ''}>
                <a onClick={() => setCurrentType('construction')}>
                  <span className="icon has-text-warning"><i className="fas fa-hard-hat"></i></span>
                  <span>Construction</span>
                </a>
              </li>
              <li className={currentType === 'weather' ? 'is-active' : ''}>
                <a onClick={() => setCurrentType('weather')}>
                  <span className="icon has-text-info"><i className="fas fa-cloud-rain"></i></span>
                  <span>Weather</span>
                </a>
              </li>
            </ul>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          {filteredAlerts.length > 0 ? (
            <div className="columns is-multiline">
              {filteredAlerts.map(alert => (
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
                      <div className="content">
                        <h4 className="title is-5">{alert.title}</h4>
                        <p>{alert.description}</p>
                      </div>
                    </div>
                    <footer className="card-footer">
                      <Link to={`/map?lat=${alert.location_lat}&lng=${alert.location_lng}`} className="card-footer-item">
                        <span className="icon-text">
                          <span className="icon">
                            <i className="fas fa-map-marker-alt"></i>
                          </span>
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
              <span className="icon is-large">
                <i className="fas fa-info-circle fa-3x has-text-grey-light"></i>
              </span>
              <h3 className="title is-4 mt-4 has-text-grey">No Alerts Available</h3>
              <p className="subtitle is-6 has-text-grey">
                {currentType
                  ? `There are currently no ${currentType} alerts in your region.`
                  : `There are currently no alerts in your region.`}
              </p>
            </div>
          )}
        </div>
      </section>

      <section className="section has-background-light">
        <div className="container">
          <h2 className="title is-3 has-text-centered mb-6">Alert Locations</h2>
          <div id="alertMap" style={{ height: '400px', borderRadius: '6px', boxShadow: '0 2px 10px rgba(0, 0, 0, 0.1)' }}></div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="columns is-centered">
            <div className="column is-8">
              <div className="box has-background-primary-light p-6">
                <div className="columns is-vcentered">
                  <div className="column is-7">
                    <h3 className="title is-4">Get Alerts in Real-Time</h3>
                    <p className="subtitle is-6">Register an account to receive instant notifications when new alerts are issued in your area.</p>
                  </div>
                  <div className="column is-5">
                    {!isLoggedIn ? (
                      <Link to="/register" className="button is-primary is-fullwidth">
                        <span className="icon">
                          <i className="fas fa-user-plus"></i>
                        </span>
                        <span>Register Now</span>
                      </Link>
                    ) : (
                      <div className="notification is-success is-light">
                        <span className="icon-text">
                          <span className="icon">
                            <i className="fas fa-check-circle"></i>
                          </span>
                          <span>You're logged in and will receive alerts</span>
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
