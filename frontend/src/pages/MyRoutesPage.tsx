import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { getRoutes, deleteRoute } from '../api'
import type { SavedRoute } from '../types'

export default function MyRoutesPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [deleteModalActive, setDeleteModalActive] = useState(false)
  const [routeToDelete, setRouteToDelete] = useState<number | null>(null)
  const [routes, setRoutes] = useState<SavedRoute[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    getRoutes()
      .then(res => {
        setRoutes(res.data)
        setLoading(false)
      })
      .catch(() => {
        setError('Failed to load saved routes.')
        setLoading(false)
      })
  }, [])

  const filteredRoutes = routes.filter(r => r.name.toLowerCase().includes(searchTerm.toLowerCase()))

  const handleDelete = async () => {
    if (routeToDelete !== null) {
      try {
        await deleteRoute(routeToDelete)
        setRoutes(routes.filter(r => r.id !== routeToDelete))
        setDeleteModalActive(false)
        setRouteToDelete(null)
      } catch {
        alert('Failed to delete route')
      }
    }
  }

  return (
    <>
      <div className="page-header bg-white">
        <div className="container flex-between flex-wrap gap-4">
          <div>
            <h1>My Saved Routes</h1>
            <p>View and manage your favorite paths</p>
          </div>
          <Link to="/map" className="btn btn-primary">
            <i className="fas fa-plus"></i> Create New Route
          </Link>
        </div>
      </div>

      <section className="section pt-0">
        <div className="container" style={{ maxWidth: '1000px', margin: '0 auto' }}>
          {/* Search */}
          <div className="dashboard-toolbar mb-6">
            <div className="dashboard-search">
              <div className="input-icon">
                <i className="fas fa-search icon-left"></i>
                <input
                  className="input"
                  type="text"
                  placeholder="Search your routes..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            <span className="text-sm text-muted">{filteredRoutes.length} route{filteredRoutes.length !== 1 ? 's' : ''}</span>
          </div>

          {loading ? (
            <div className="flex-center py-12">
              <span className="spinner"></span>
            </div>
          ) : error ? (
            <div className="card">
              <div className="card-body py-12 text-center text-danger">
                <i className="fas fa-exclamation-circle text-3xl mb-4" style={{ fontSize: '32px', marginBottom: '16px' }}></i>
                <p>{error}</p>
              </div>
            </div>
          ) : filteredRoutes.length > 0 ? (
            <div className="grid grid-3">
              {filteredRoutes.map(route => (
                <div className="card card-hover h-full" key={route.id}>
                  <div className="card-body" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                    <div className="flex gap-3 items-start mb-4">
                      <div className="icon-box info" style={{ flexShrink: 0 }}>
                        <i className="fas fa-route"></i>
                      </div>
                      <div>
                        <h3 className="font-semibold text-lg">{route.name}</h3>
                        <p className="text-xs text-muted">Added {new Date(route.created_at).toLocaleDateString()}</p>
                      </div>
                    </div>

                    {/* Map Preview Placeholder */}
                    <div style={{
                      height: '120px',
                      background: 'var(--bg-subtle)',
                      borderRadius: 'var(--radius-md)',
                      marginBottom: 'var(--space-4)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      border: '1px dashed var(--border-color)'
                    }}>
                      <span className="text-muted text-sm"><i className="fas fa-map mr-2"></i>Route Preview</span>
                    </div>

                    <div className="flex-col gap-2 mb-4 flex-1">
                      <div className="flex gap-2 items-center text-sm">
                        <i className="fas fa-flag-checkered text-primary" style={{ width: '16px' }}></i>
                        <span className="text-muted">Start:</span>
                        <span className="font-medium">{route.start_lat.toFixed(4)}, {route.start_lng.toFixed(4)}</span>
                      </div>
                      <div className="flex gap-2 items-center text-sm">
                        <i className="fas fa-map-marker-alt text-danger" style={{ width: '16px' }}></i>
                        <span className="text-muted">End:</span>
                        <span className="font-medium">{route.end_lat.toFixed(4)}, {route.end_lng.toFixed(4)}</span>
                      </div>
                    </div>

                    <div className="flex gap-2 mt-auto" style={{ borderTop: '1px solid var(--border-light)', paddingTop: 'var(--space-4)' }}>
                      <Link
                        to={`/map?start_lat=${route.start_lat}&start_lng=${route.start_lng}&end_lat=${route.end_lat}&end_lng=${route.end_lng}`}
                        className="btn btn-primary btn-sm flex-1"
                      >
                        <i className="fas fa-directions"></i> Navigate
                      </Link>
                      <button
                        className="btn btn-danger-light btn-sm"
                        onClick={() => { setRouteToDelete(route.id); setDeleteModalActive(true) }}
                      >
                        <i className="fas fa-trash-alt"></i>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="card">
              <div className="card-body py-12 flex-center flex-col text-center">
                <div className="icon-box bg-subtle text-muted mb-4 text-3xl" style={{ width: '80px', height: '80px' }}>
                  <i className="fas fa-map"></i>
                </div>
                <h3 className="font-display font-bold text-2xl mb-2">No Saved Routes</h3>
                <p className="text-secondary mb-6">You haven't saved any routes matching your search.</p>
                <Link to="/map" className="btn btn-primary"><i className="fas fa-plus"></i> Create New Route</Link>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Tips */}
      <section className="section bg-subtle">
        <div className="container" style={{ maxWidth: '1000px', margin: '0 auto' }}>
          <h3 className="font-display font-bold text-2xl text-center mb-8" style={{ marginBottom: 'var(--space-8)' }}>Route Management Tips</h3>
          <div className="grid grid-3">
            {[
              { icon: 'fa-save', color: 'info', title: 'Save Frequent Routes', text: 'Save routes you travel frequently to quickly check for alerts and disruptions along your path before you depart.' },
              { icon: 'fa-bell', color: 'primary', title: 'Get Route Notifications', text: 'When logged in, you\'ll automatically receive notifications about alerts affecting your saved routes.' },
              { icon: 'fa-clipboard-list', color: 'accent', title: 'Organize Your Routes', text: 'Give your routes descriptive names like "Home to Work" or "School Pickup" to easily identify them later.' },
            ].map((tip, i) => (
              <div key={i} className="card h-full">
                <div className="card-body">
                  <div className={`icon-box-sm ${tip.color} mb-4`}>
                    <i className={`fas ${tip.icon}`}></i>
                  </div>
                  <h4 className="font-semibold mb-2">{tip.title}</h4>
                  <p className="text-secondary text-sm" style={{ lineHeight: 1.6 }}>{tip.text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Delete Modal */}
      {deleteModalActive && (
        <div className="modal-overlay">
          <div className="modal-card">
            <div className="modal-card-header">
              <h3 className="text-danger flex items-center gap-2"><i className="fas fa-exclamation-triangle"></i> Confirm Deletion</h3>
              <button className="close-btn" onClick={() => setDeleteModalActive(false)}><i className="fas fa-times"></i></button>
            </div>
            <div className="modal-card-body">
              <p>Are you sure you want to delete this route?</p>
              <p className="text-danger text-sm mt-2">This action cannot be undone.</p>
            </div>
            <div className="modal-card-footer">
              <button className="btn btn-ghost" onClick={() => setDeleteModalActive(false)}>Cancel</button>
              <button className="btn btn-danger" onClick={handleDelete}>Delete Route</button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
