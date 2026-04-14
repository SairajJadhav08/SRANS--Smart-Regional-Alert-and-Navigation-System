import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { getAlerts, deleteAlert, bulkDeleteAlerts } from '../api'
import type { Alert } from '../types'

export default function DashboardPage() {
  const { user, isGovUser, isSuperuser } = useAuth()

  const [alerts, setAlerts] = useState<Alert[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState('all')
  const [sortBy, setSortBy] = useState('newest')
  const [selectedAlerts, setSelectedAlerts] = useState<number[]>([])
  const [deleteModalActive, setDeleteModalActive] = useState(false)
  const [bulkModalActive, setBulkModalActive] = useState(false)
  const [alertToDelete, setAlertToDelete] = useState<number | null>(null)
  const [actionLoading, setActionLoading] = useState(false)

  const fetchAlerts = () => {
    setLoading(true)
    // Superuser sees all alerts; gov user sees only their own
    const params = isSuperuser ? undefined : { author_only: true }
    getAlerts(params)
      .then(res => setAlerts(res.data))
      .catch(() => setAlerts([]))
      .finally(() => setLoading(false))
  }

  useEffect(() => { fetchAlerts() }, [])

  // Filter + sort
  let displayAlerts = alerts.filter(a => {
    if (filterType !== 'all' && a.alert_type !== filterType) return false
    if (searchTerm) {
      const t = searchTerm.toLowerCase()
      return a.title.toLowerCase().includes(t) || a.description.toLowerCase().includes(t)
    }
    return true
  })
  displayAlerts = [...displayAlerts].sort((a, b) => {
    if (sortBy === 'newest') return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    if (sortBy === 'oldest') return new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    if (sortBy === 'type') return a.alert_type.localeCompare(b.alert_type)
    return 0
  })

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedAlerts(e.target.checked ? displayAlerts.map(a => a.id) : [])
  }

  const handleDelete = async () => {
    if (alertToDelete === null) return
    setActionLoading(true)
    try {
      await deleteAlert(alertToDelete)
      setAlerts(prev => prev.filter(a => a.id !== alertToDelete))
    } catch { alert('Failed to delete alert.') }
    finally {
      setActionLoading(false)
      setDeleteModalActive(false)
      setAlertToDelete(null)
    }
  }

  const handleBulkDelete = async () => {
    setActionLoading(true)
    try {
      await bulkDeleteAlerts(selectedAlerts)
      setAlerts(prev => prev.filter(a => !selectedAlerts.includes(a.id)))
      setSelectedAlerts([])
    } catch { alert('Bulk delete failed.') }
    finally {
      setActionLoading(false)
      setBulkModalActive(false)
    }
  }

  const canCreate = isSuperuser || (user?.is_government && user?.is_verified)

  return (
    <>
      <section className="hero is-primary">
        <div className="hero-body">
          <div className="container">
            <div className="columns is-vcentered">
              <div className="column">
                <h1 className="title is-1">
                  {isSuperuser ? 'Superuser Dashboard' : 'Government Dashboard'}
                </h1>
                <h2 className="subtitle is-4">
                  {isSuperuser ? 'Overview of all alerts across all agencies' : 'Manage alerts for your region'}
                </h2>
              </div>
              <div className="column is-narrow">
                <Link
                  to="/dashboard/alerts/new"
                  className={`button is-white is-medium${!canCreate ? ' is-static' : ''}`}
                  title={!canCreate ? 'Verification required' : ''}
                >
                  <span className="icon"><i className="fas fa-plus"></i></span>
                  <span>Create New Alert</span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pending verification banner */}
      {user?.is_government && !user?.is_verified && (
        <section className="section pt-4 pb-0">
          <div className="container">
            <div className="notification is-warning">
              <span className="icon-text">
                <span className="icon"><i className="fas fa-exclamation-triangle"></i></span>
                <strong>Account Verification Pending</strong>
              </span>
              <p className="mt-2">Your government account is under review. You cannot create alerts until verified.</p>
            </div>
          </div>
        </section>
      )}

      <section className="section">
        <div className="container">

          {/* Stats */}
          {loading ? (
            <div className="has-text-centered py-6">
              <span className="icon is-large"><i className="fas fa-spinner fa-spin fa-2x has-text-primary"></i></span>
              <p className="mt-3">Loading alerts...</p>
            </div>
          ) : (
            <>
              <div className="columns is-multiline mb-5">
                {[
                  { label: 'Total Alerts', count: alerts.length, bg: 'has-background-primary', icon: 'fa-bell' },
                  { label: 'Traffic', count: alerts.filter(a => a.alert_type === 'Traffic').length, bg: 'has-background-danger', icon: 'fa-car-crash' },
                  { label: 'Emergency', count: alerts.filter(a => a.alert_type === 'Emergency').length, bg: 'has-background-warning', icon: 'fa-exclamation-triangle', dark: true },
                  { label: 'Weather', count: alerts.filter(a => a.alert_type === 'Weather').length, bg: 'has-background-info', icon: 'fa-cloud-rain' },
                ].map(stat => (
                  <div className="column is-3" key={stat.label}>
                    <div className={`box dashboard-tile ${stat.bg} has-text-${stat.dark ? 'dark' : 'white'}`}>
                      <article className="media">
                        <div className="media-left">
                          <span className="icon is-large"><i className={`fas ${stat.icon} fa-2x`}></i></span>
                        </div>
                        <div className="media-content">
                          <p className={`title is-4 has-text-${stat.dark ? 'dark' : 'white'}`}>{stat.count}</p>
                          <p className={`subtitle is-6 has-text-${stat.dark ? 'dark' : 'white'}`}>{stat.label}</p>
                        </div>
                      </article>
                    </div>
                  </div>
                ))}
              </div>

              {/* Alert Management Table */}
              <div className="card">
                <header className="card-header">
                  <p className="card-header-title">
                    <span className="icon-text">
                      <span className="icon"><i className="fas fa-bell"></i></span>
                      <span>Alert Management</span>
                    </span>
                  </p>
                  <div className="card-header-icon">
                    <div className="field has-addons">
                      <div className="control">
                        <input className="input" type="text" placeholder="Search alerts..."
                          value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
                      </div>
                    </div>
                  </div>
                </header>

                <div className="card-content">
                  <div className="field is-grouped mb-4">
                    <div className="control">
                      <div className="select">
                        <select value={filterType} onChange={e => setFilterType(e.target.value)}>
                          <option value="all">All Types</option>
                          <option value="Traffic">Traffic</option>
                          <option value="Emergency">Emergency</option>
                          <option value="Construction">Construction</option>
                          <option value="Weather">Weather</option>
                        </select>
                      </div>
                    </div>
                    <div className="control">
                      <div className="select">
                        <select value={sortBy} onChange={e => setSortBy(e.target.value)}>
                          <option value="newest">Newest First</option>
                          <option value="oldest">Oldest First</option>
                          <option value="type">By Type</option>
                        </select>
                      </div>
                    </div>
                    <div className="control is-expanded"></div>
                    <div className="control">
                      <button className="button is-danger is-light"
                        disabled={selectedAlerts.length === 0}
                        onClick={() => setBulkModalActive(true)}>
                        <span className="icon"><i className="fas fa-trash"></i></span>
                        <span>Delete Selected ({selectedAlerts.length})</span>
                      </button>
                    </div>
                  </div>

                  {displayAlerts.length > 0 ? (
                    <div className="table-container">
                      <table className="table is-fullwidth is-hoverable">
                        <thead>
                          <tr>
                            <th><input type="checkbox"
                              checked={selectedAlerts.length === displayAlerts.length && displayAlerts.length > 0}
                              onChange={handleSelectAll} /></th>
                            <th>Title</th>
                            <th>Type</th>
                            <th>Description</th>
                            <th>Created</th>
                            <th>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {displayAlerts.map(alert => (
                            <tr key={alert.id}>
                              <td>
                                <input type="checkbox"
                                  checked={selectedAlerts.includes(alert.id)}
                                  onChange={() => setSelectedAlerts(prev =>
                                    prev.includes(alert.id) ? prev.filter(x => x !== alert.id) : [...prev, alert.id]
                                  )} />
                              </td>
                              <td><strong>{alert.title}</strong></td>
                              <td>
                                <span className={`tag ${
                                  alert.alert_type === 'Traffic' ? 'is-danger' :
                                  alert.alert_type === 'Emergency' ? 'is-warning' :
                                  alert.alert_type === 'Construction' ? 'is-warning' : 'is-info'
                                }`}>{alert.alert_type}</span>
                              </td>
                              <td>{alert.description.substring(0, 60)}...</td>
                              <td>{new Date(alert.created_at).toLocaleDateString()}</td>
                              <td>
                                <div className="buttons are-small">
                                  <Link to={`/dashboard/alerts/${alert.id}/edit`} className="button is-primary">
                                    <span className="icon"><i className="fas fa-edit"></i></span>
                                  </Link>
                                  <button className="button is-danger" onClick={() => {
                                    setAlertToDelete(alert.id)
                                    setDeleteModalActive(true)
                                  }}>
                                    <span className="icon"><i className="fas fa-trash-alt"></i></span>
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="has-text-centered py-6">
                      <span className="icon is-large"><i className="fas fa-info-circle fa-3x has-text-grey-light"></i></span>
                      <h3 className="title is-5 mt-4 has-text-grey">No alerts found</h3>
                      {canCreate && (
                        <Link to="/dashboard/alerts/new" className="button is-primary mt-3">
                          <span className="icon"><i className="fas fa-plus"></i></span>
                          <span>Create First Alert</span>
                        </Link>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </section>

      {/* Delete Modal */}
      <div className={`modal ${deleteModalActive ? 'is-active' : ''}`}>
        <div className="modal-background" onClick={() => setDeleteModalActive(false)}></div>
        <div className="modal-card">
          <header className="modal-card-head">
            <p className="modal-card-title">Confirm Deletion</p>
            <button className="delete" onClick={() => setDeleteModalActive(false)}></button>
          </header>
          <section className="modal-card-body">
            <p>Are you sure you want to delete this alert? This cannot be undone.</p>
          </section>
          <footer className="modal-card-foot">
            <button className={`button is-danger${actionLoading ? ' is-loading' : ''}`} onClick={handleDelete}>Delete</button>
            <button className="button" onClick={() => setDeleteModalActive(false)}>Cancel</button>
          </footer>
        </div>
      </div>

      {/* Bulk Delete Modal */}
      <div className={`modal ${bulkModalActive ? 'is-active' : ''}`}>
        <div className="modal-background" onClick={() => setBulkModalActive(false)}></div>
        <div className="modal-card">
          <header className="modal-card-head">
            <p className="modal-card-title">Bulk Delete</p>
            <button className="delete" onClick={() => setBulkModalActive(false)}></button>
          </header>
          <section className="modal-card-body">
            <div className="notification is-warning">
              <strong>Warning:</strong> You are about to delete {selectedAlerts.length} alert(s). This cannot be undone.
            </div>
          </section>
          <footer className="modal-card-foot">
            <button className={`button is-danger${actionLoading ? ' is-loading' : ''}`} onClick={handleBulkDelete}>Delete All</button>
            <button className="button" onClick={() => setBulkModalActive(false)}>Cancel</button>
          </footer>
        </div>
      </div>
    </>
  )
}
