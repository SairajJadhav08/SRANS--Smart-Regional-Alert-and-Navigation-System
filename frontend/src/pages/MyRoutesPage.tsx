import { useState } from 'react'
import { Link } from 'react-router-dom'

export default function MyRoutesPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [deleteModalActive, setDeleteModalActive] = useState(false)
  const [routeToDelete, setRouteToDelete] = useState<number | null>(null)

  const [routes, setRoutes] = useState([
    {
      id: 1,
      name: 'Home to Work',
      created_at: new Date().toISOString(),
      start_lat: 37.7749,
      start_lng: -122.4194,
      end_lat: 37.7849,
      end_lng: -122.4094
    },
    {
      id: 2,
      name: 'School Pickup',
      created_at: new Date(Date.now() - 86400000).toISOString(),
      start_lat: 37.7749,
      start_lng: -122.4194,
      end_lat: 37.7549,
      end_lng: -122.4294
    }
  ])

  const filteredRoutes = routes.filter(r => r.name.toLowerCase().includes(searchTerm.toLowerCase()))

  const handleDelete = () => {
    if (routeToDelete !== null) {
      setRoutes(routes.filter(r => r.id !== routeToDelete))
      setDeleteModalActive(false)
      setRouteToDelete(null)
    }
  }

  return (
    <>
      <section className="hero is-primary">
        <div className="hero-body">
          <div className="container has-text-centered">
            <h1 className="title is-1">My Saved Routes</h1>
            <h2 className="subtitle is-4">View and manage your favorite paths</h2>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="columns is-centered">
            <div className="column is-10">
              <div className="level mb-5">
                <div className="level-left">
                  <div className="level-item">
                    <Link to="/map" className="button is-primary">
                      <span className="icon">
                        <i className="fas fa-plus"></i>
                      </span>
                      <span>Create New Route</span>
                    </Link>
                  </div>
                </div>
                <div className="level-right">
                  <div className="level-item">
                    <div className="field has-addons">
                      <div className="control">
                        <input 
                          className="input" 
                          type="text" 
                          placeholder="Search your routes"
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                        />
                      </div>
                      <div className="control">
                        <button className="button is-info">
                          <span className="icon">
                            <i className="fas fa-search"></i>
                          </span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              {filteredRoutes.length > 0 ? (
                <div className="columns is-multiline">
                  {filteredRoutes.map(route => (
                    <div className="column is-4 route-item" key={route.id}>
                      <div className="card h-100">
                        <div className="card-content">
                          <div className="media">
                            <div className="media-left">
                              <span className="icon is-large has-text-info">
                                <i className="fas fa-route fa-2x"></i>
                              </span>
                            </div>
                            <div className="media-content">
                              <p className="title is-5">{route.name}</p>
                              <p className="subtitle is-6">Added on {new Date(route.created_at).toLocaleDateString()}</p>
                            </div>
                          </div>
                          
                          <div className="content">
                            <div className="route-preview mb-4" style={{ height: '150px', backgroundColor: '#f5f5f5', borderRadius: '6px', position: 'relative', overflow: 'hidden' }}>
                              <div style={{ height: '100%', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ccc' }}>
                                Map Preview (Mocked)
                              </div>
                            </div>
                            
                            <div className="route-details">
                              <div className="columns is-mobile mb-2">
                                <div className="column is-2">
                                  <span className="icon has-text-success">
                                    <i className="fas fa-flag-checkered"></i>
                                  </span>
                                </div>
                                <div className="column">
                                  <span className="has-text-weight-bold">Start:</span>
                                  <span className="is-size-7 ml-1">{route.start_lat}, {route.start_lng}</span>
                                </div>
                              </div>
                              <div className="columns is-mobile">
                                <div className="column is-2">
                                  <span className="icon has-text-danger">
                                    <i className="fas fa-map-marker-alt"></i>
                                  </span>
                                </div>
                                <div className="column">
                                  <span className="has-text-weight-bold">End:</span>
                                  <span className="is-size-7 ml-1">{route.end_lat}, {route.end_lng}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                        <footer className="card-footer">
                          <Link to={`/map?start_lat=${route.start_lat}&start_lng=${route.start_lng}&end_lat=${route.end_lat}&end_lng=${route.end_lng}`} className="card-footer-item">
                            <span className="icon-text">
                              <span className="icon">
                                <i className="fas fa-directions"></i>
                              </span>
                              <span>Navigate</span>
                            </span>
                          </Link>
                          <a onClick={() => { setRouteToDelete(route.id); setDeleteModalActive(true) }} className="card-footer-item">
                            <span className="icon-text">
                              <span className="icon has-text-danger">
                                <i className="fas fa-trash-alt"></i>
                              </span>
                              <span>Delete</span>
                            </span>
                          </a>
                        </footer>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="box has-text-centered p-6">
                  <span className="icon is-large mb-4">
                    <i className="fas fa-map fa-3x has-text-grey-light"></i>
                  </span>
                  <h3 className="title is-4">No Saved Routes</h3>
                  <p className="subtitle is-6 mb-5">You haven't saved any routes matching your search.</p>
                  <Link to="/map" className="button is-primary is-medium">
                    <span className="icon">
                      <i className="fas fa-plus"></i>
                    </span>
                    <span>Create New Route</span>
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      <section className="section has-background-light">
        <div className="container">
          <div className="columns is-centered">
            <div className="column is-10">
              <h3 className="title is-3 has-text-centered mb-5">Route Management Tips</h3>
              <div className="columns is-multiline">
                <div className="column is-4">
                  <div className="box h-100">
                    <h4 className="title is-5">
                      <span className="icon-text">
                        <span className="icon has-text-info">
                          <i className="fas fa-save"></i>
                        </span>
                        <span>Save Your Frequent Routes</span>
                      </span>
                    </h4>
                    <div className="content">
                      <p>Save routes you travel frequently to quickly check for alerts and disruptions along your path before you depart.</p>
                    </div>
                  </div>
                </div>
                <div className="column is-4">
                  <div className="box h-100">
                    <h4 className="title is-5">
                      <span className="icon-text">
                        <span className="icon has-text-success">
                          <i className="fas fa-bell"></i>
                        </span>
                        <span>Get Route Notifications</span>
                      </span>
                    </h4>
                    <div className="content">
                      <p>When logged in, you'll automatically receive notifications about alerts affecting your saved routes.</p>
                    </div>
                  </div>
                </div>
                <div className="column is-4">
                  <div className="box h-100">
                    <h4 className="title is-5">
                      <span className="icon-text">
                        <span className="icon has-text-primary">
                          <i className="fas fa-clipboard-list"></i>
                        </span>
                        <span>Organize Your Routes</span>
                      </span>
                    </h4>
                    <div className="content">
                      <p>Give your routes descriptive names like "Home to Work" or "School Pickup" to easily identify them later.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Delete Modal */}
      <div className={`modal ${deleteModalActive ? 'is-active' : ''}`}>
        <div className="modal-background" onClick={() => setDeleteModalActive(false)}></div>
        <div className="modal-card">
          <header className="modal-card-head">
            <p className="modal-card-title">Confirm Deletion</p>
            <button className="delete" aria-label="close" onClick={() => setDeleteModalActive(false)}></button>
          </header>
          <section className="modal-card-body">
            <p>Are you sure you want to delete this route?</p>
            <p className="has-text-danger">This action cannot be undone.</p>
          </section>
          <footer className="modal-card-foot">
            <button className="button is-danger" onClick={handleDelete}>Delete Route</button>
            <button className="button" onClick={() => setDeleteModalActive(false)}>Cancel</button>
          </footer>
        </div>
      </div>
    </>
  )
}
