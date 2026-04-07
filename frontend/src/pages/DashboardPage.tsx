import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function DashboardPage() {
  const { user, isGovUser } = useAuth()

  // Mock Alerts
  const [alerts, setAlerts] = useState([
    {
      id: 1,
      alert_type: 'Traffic',
      title: 'Heavy Traffic on Main St',
      description: 'Accident reported on Main St causing significant delays.',
      created_at: new Date().toISOString()
    },
    {
      id: 2,
      alert_type: 'Emergency',
      title: 'Power Outage',
      description: 'Large power outage in the downtown area.',
      created_at: new Date(Date.now() - 86400000).toISOString()
    }
  ])

  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState('all')
  const [sortBy, setSortBy] = useState('newest')
  const [selectedAlerts, setSelectedAlerts] = useState<number[]>([])
  
  const [deleteModalActive, setDeleteModalActive] = useState(false)
  const [bulkModalActive, setBulkModalActive] = useState(false)
  const [alertToDelete, setAlertToDelete] = useState<number | null>(null)

  // Filter and Sort Alerts
  let displayAlerts = alerts.filter(a => {
    if (filterType !== 'all' && a.alert_type !== filterType) return false
    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      return a.title.toLowerCase().includes(term) || a.description.toLowerCase().includes(term)
    }
    return true
  })

  displayAlerts.sort((a, b) => {
    if (sortBy === 'newest') return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    if (sortBy === 'oldest') return new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    if (sortBy === 'type') return a.alert_type.localeCompare(b.alert_type)
    return 0
  })

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedAlerts(displayAlerts.map(a => a.id))
    } else {
      setSelectedAlerts([])
    }
  }

  const handleSelectAlert = (id: number) => {
    setSelectedAlerts(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
  }

  const handleDelete = () => {
    if (alertToDelete !== null) {
      setAlerts(alerts.filter(a => a.id !== alertToDelete))
      setDeleteModalActive(false)
      setAlertToDelete(null)
    }
  }

  const handleBulkDelete = () => {
    setAlerts(alerts.filter(a => !selectedAlerts.includes(a.id)))
    setSelectedAlerts([])
    setBulkModalActive(false)
  }

  return (
    <>
      {/* Hero Section */}
      <section className="hero is-primary">
        <div className="hero-body">
          <div className="container">
            <div className="columns is-vcentered">
              <div className="column">
                <h1 className="title is-1">Government Dashboard</h1>
                <h2 className="subtitle is-4">Manage alerts and notifications for your region</h2>
              </div>
              <div className="column is-narrow">
                {user?.is_verified ? (
                  <Link to="/new_alert" className="button is-white is-medium">
                    <span className="icon">
                      <i className="fas fa-plus"></i>
                    </span>
                    <span>Create New Alert</span>
                  </Link>
                ) : (
                  <button className="button is-white is-medium" disabled title="Account verification required to create alerts">
                    <span className="icon">
                      <i className="fas fa-plus"></i>
                    </span>
                    <span>Create New Alert</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {!user?.is_verified && isGovUser && (
        <section className="section pt-4 pb-0">
          <div className="container">
            <div className="notification is-warning">
              <div className="columns is-vcentered">
                <div className="column">
                  <span className="icon-text">
                    <span className="icon">
                      <i className="fas fa-exclamation-triangle"></i>
                    </span>
                    <span><strong>Account Verification Pending</strong></span>
                  </span>
                  <p className="mt-2">Your government account is currently under review. Some features may be limited until verification is complete.</p>
                </div>
                <div className="column is-narrow">
                  <Link to="/contact" className="button is-warning is-light">
                    <span className="icon">
                      <i className="fas fa-question-circle"></i>
                    </span>
                    <span>Need Help?</span>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Dashboard Overview */}
      <section className="section">
        <div className="container">
          {!user?.is_verified && (
            <div className="card mb-6">
              <div className="card-content">
                <div className="content">
                  <div className="columns is-vcentered">
                    <div className="column is-2 has-text-centered">
                      <span className="icon is-large">
                        <i className="fas fa-user-shield fa-3x has-text-warning"></i>
                      </span>
                    </div>
                    <div className="column">
                      <h3 className="title is-4">Government Account Verification</h3>
                      <p>Your account is awaiting verification by an administrator. Once verified, you'll be able to:</p>
                      <ul className="mt-3">
                        <li><i className="fas fa-check-circle has-text-success mr-2"></i> Create and publish alerts</li>
                        <li><i className="fas fa-check-circle has-text-success mr-2"></i> Manage emergency notifications</li>
                        <li><i className="fas fa-check-circle has-text-success mr-2"></i> Access analytics and reporting</li>
                      </ul>
                      <p className="is-italic mt-3">This process typically takes 1-2 business days. Please contact us if you have any questions.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Quick Stats */}
          <div className="columns is-multiline">
            <div className="column is-3">
              <div className="box dashboard-tile has-background-primary has-text-white">
                <article className="media">
                  <div className="media-left">
                    <span className="icon is-large">
                      <i className="fas fa-bell fa-2x"></i>
                    </span>
                  </div>
                  <div className="media-content">
                    <div className="content">
                      <p className="title has-text-white is-4">{alerts.length}</p>
                      <p className="subtitle has-text-white is-6">Active Alerts</p>
                    </div>
                  </div>
                </article>
              </div>
            </div>

            <div className="column is-3">
              <div className="box dashboard-tile has-background-danger has-text-white">
                <article className="media">
                  <div className="media-left">
                    <span className="icon is-large">
                      <i className="fas fa-car-crash fa-2x"></i>
                    </span>
                  </div>
                  <div className="media-content">
                    <div className="content">
                      <p className="title has-text-white is-4">{alerts.filter(a => a.alert_type === 'Traffic').length}</p>
                      <p className="subtitle has-text-white is-6">Traffic Alerts</p>
                    </div>
                  </div>
                </article>
              </div>
            </div>

            <div className="column is-3">
              <div className="box dashboard-tile has-background-warning has-text-dark">
                <article className="media">
                  <div className="media-left">
                    <span className="icon is-large">
                      <i className="fas fa-exclamation-triangle fa-2x"></i>
                    </span>
                  </div>
                  <div className="media-content">
                    <div className="content">
                      <p className="title has-text-dark is-4">{alerts.filter(a => a.alert_type === 'Emergency').length}</p>
                      <p className="subtitle has-text-dark is-6">Emergency Alerts</p>
                    </div>
                  </div>
                </article>
              </div>
            </div>

            <div className="column is-3">
              <div className="box dashboard-tile has-background-info has-text-white">
                <article className="media">
                  <div className="media-left">
                    <span className="icon is-large">
                      <i className="fas fa-cloud-rain fa-2x"></i>
                    </span>
                  </div>
                  <div className="media-content">
                    <div className="content">
                      <p className="title has-text-white is-4">{alerts.filter(a => a.alert_type === 'Weather').length}</p>
                      <p className="subtitle has-text-white is-6">Weather Alerts</p>
                    </div>
                  </div>
                </article>
              </div>
            </div>
          </div>

          {/* Alert Management */}
          <div className="card mt-6">
            <header className="card-header">
              <p className="card-header-title">
                <span className="icon-text">
                  <span className="icon">
                    <i className="fas fa-bell"></i>
                  </span>
                  <span>Alert Management</span>
                </span>
              </p>
              <div className="card-header-icon">
                <div className="field has-addons">
                  <div className="control">
                    <input className="input" type="text" placeholder="Search alerts..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                  </div>
                  <div className="control">
                    <button className="button is-primary">
                      <span className="icon">
                        <i className="fas fa-search"></i>
                      </span>
                    </button>
                  </div>
                </div>
              </div>
            </header>

            <div className="card-content">
              <div className="content">
                <div className="field is-grouped mb-5">
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
                    <button 
                      className="button is-primary" 
                      disabled={selectedAlerts.length === 0}
                      onClick={() => setBulkModalActive(true)}
                    >
                      <span className="icon">
                        <i className="fas fa-tasks"></i>
                      </span>
                      <span>Bulk Actions</span>
                    </button>
                  </div>
                </div>

                {displayAlerts.length > 0 ? (
                  <div className="table-container">
                    <table className="table is-fullwidth is-hoverable">
                      <thead>
                        <tr>
                          <th>
                            <label className="checkbox">
                              <input 
                                type="checkbox" 
                                checked={selectedAlerts.length === displayAlerts.length && displayAlerts.length > 0} 
                                onChange={handleSelectAll} 
                              />
                            </label>
                          </th>
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
                              <label className="checkbox">
                                <input 
                                  type="checkbox" 
                                  checked={selectedAlerts.includes(alert.id)}
                                  onChange={() => handleSelectAlert(alert.id)}
                                />
                              </label>
                            </td>
                            <td>{alert.title}</td>
                            <td>
                              <span className={`tag ${
                                alert.alert_type === 'Traffic' ? 'is-danger' :
                                alert.alert_type === 'Emergency' ? 'is-warning' :
                                alert.alert_type === 'Construction' ? 'is-warning' : 'is-info'
                              }`}>
                                {alert.alert_type}
                              </span>
                            </td>
                            <td>{alert.description.substring(0, 50)}...</td>
                            <td>{new Date(alert.created_at).toLocaleDateString()}</td>
                            <td>
                              <div className="buttons are-small">
                                <Link to={`/edit_alert/${alert.id}`} className="button is-primary">
                                  <span className="icon">
                                    <i className="fas fa-edit"></i>
                                  </span>
                                </Link>
                                <button className="button is-danger" onClick={() => {
                                  setAlertToDelete(alert.id)
                                  setDeleteModalActive(true)
                                }}>
                                  <span className="icon">
                                    <i className="fas fa-trash-alt"></i>
                                  </span>
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="has-text-centered my-6">
                    <span className="icon is-large">
                      <i className="fas fa-info-circle fa-3x has-text-grey-light"></i>
                    </span>
                    <h3 className="title is-4 mt-4 has-text-grey">No Alerts Available</h3>
                    <p className="subtitle is-6 has-text-grey">No alerts match your current view.</p>
                    <Link to="/new_alert" className="button is-primary mt-3">
                      <span className="icon">
                        <i className="fas fa-plus"></i>
                      </span>
                      <span>Create Alert</span>
                    </Link>
                  </div>
                )}
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
            <p>Are you sure you want to delete this alert? This action cannot be undone.</p>
          </section>
          <footer className="modal-card-foot">
            <button className="button is-danger" onClick={handleDelete}>Delete Alert</button>
            <button className="button" onClick={() => setDeleteModalActive(false)}>Cancel</button>
          </footer>
        </div>
      </div>

      {/* Bulk Modal */}
      <div className={`modal ${bulkModalActive ? 'is-active' : ''}`}>
        <div className="modal-background" onClick={() => setBulkModalActive(false)}></div>
        <div className="modal-card">
          <header className="modal-card-head">
            <p className="modal-card-title">Bulk Actions</p>
            <button className="delete" aria-label="close" onClick={() => setBulkModalActive(false)}></button>
          </header>
          <section className="modal-card-body">
            <div className="field">
              <label className="label">Select Action</label>
              <div className="control">
                <div className="select is-fullwidth">
                  <select>
                    <option value="delete">Delete Selected Alerts</option>
                  </select>
                </div>
              </div>
            </div>
            <div className="notification is-warning">
              <p><strong>Warning:</strong> Bulk actions will affect all selected alerts. This action cannot be undone.</p>
            </div>
          </section>
          <footer className="modal-card-foot">
            <button className="button is-primary" onClick={handleBulkDelete}>Apply</button>
            <button className="button" onClick={() => setBulkModalActive(false)}>Cancel</button>
          </footer>
        </div>
      </div>
    </>
  )
}
