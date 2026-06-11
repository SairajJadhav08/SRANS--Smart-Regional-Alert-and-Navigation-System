import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { getAlerts, bulkDeleteAlerts, deleteAlert } from '../api'
import type { Alert } from '../types'
import { useAuth } from '../context/AuthContext'

export default function DashboardPage() {
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedAlerts, setSelectedAlerts] = useState<number[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState('all')
  const { user } = useAuth()

  const [deleteModalActive, setDeleteModalActive] = useState(false)
  const [alertToDelete, setAlertToDelete] = useState<number | null>(null)

  const fetchMyAlerts = async () => {
    setLoading(true)
    try {
      const res = await getAlerts({ author_only: true })
      setAlerts(res.data)
    } catch {
      setAlerts([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchMyAlerts() }, [])

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) setSelectedAlerts(alerts.map(a => a.id))
    else setSelectedAlerts([])
  }

  const handleSelect = (id: number) => {
    setSelectedAlerts(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
  }

  const handleDeleteClick = (id: number) => {
    setAlertToDelete(id)
    setDeleteModalActive(true)
  }

  const confirmDelete = async () => {
    if (alertToDelete !== null) {
      try {
        await deleteAlert(alertToDelete)
        setAlerts(prev => prev.filter(a => a.id !== alertToDelete))
      } catch {
        alert('Failed to delete alert')
      }
    }
    setDeleteModalActive(false)
    setAlertToDelete(null)
  }

  const handleBulkDelete = async () => {
    if (!confirm(`Are you sure you want to delete ${selectedAlerts.length} alerts?`)) return
    try {
      await bulkDeleteAlerts(selectedAlerts)
      setAlerts(prev => prev.filter(a => !selectedAlerts.includes(a.id)))
      setSelectedAlerts([])
    } catch {
      alert('Failed to delete alerts')
    }
  }

  const filteredAlerts = alerts
    .filter(a => filterType === 'all' || a.alert_type === filterType)
    .filter(a => a.title.toLowerCase().includes(searchTerm.toLowerCase()) || a.description.toLowerCase().includes(searchTerm.toLowerCase()))

  const stats = {
    total: alerts.length,
    traffic: alerts.filter(a => a.alert_type === 'Traffic').length,
    emergency: alerts.filter(a => a.alert_type === 'Emergency').length,
    weather: alerts.filter(a => a.alert_type === 'Weather').length,
  }

  return (
    <>
      <div className="page-header bg-white">
        <div className="container flex-between flex-wrap gap-4">
          <div>
            <h1>Agency Dashboard</h1>
            <p>Welcome back, {user?.agency_name || 'Official'}</p>
          </div>
          <Link to="/alerts/new" className="btn btn-primary">
            <i className="fas fa-plus"></i> Create Alert
          </Link>
        </div>
      </div>

      <section className="section pt-0">
        <div className="container">
          
          {/* Stats Row */}
          <div className="grid grid-4 mb-8">
            <div className="stat-card" style={{ borderTop: '3px solid var(--color-primary)' }}>
              <div className="stat-icon primary"><i className="fas fa-broadcast-tower"></i></div>
              <div>
                <p className="stat-label">Total Active Alerts</p>
                <p className="stat-value">{stats.total}</p>
              </div>
            </div>
            <div className="stat-card" style={{ borderTop: '3px solid var(--color-danger)' }}>
              <div className="stat-icon danger"><i className="fas fa-car-crash"></i></div>
              <div>
                <p className="stat-label">Traffic Incidents</p>
                <p className="stat-value">{stats.traffic}</p>
              </div>
            </div>
            <div className="stat-card" style={{ borderTop: '3px solid var(--color-purple)' }}>
              <div className="stat-icon purple"><i className="fas fa-exclamation-triangle"></i></div>
              <div>
                <p className="stat-label">Emergencies</p>
                <p className="stat-value">{stats.emergency}</p>
              </div>
            </div>
            <div className="stat-card" style={{ borderTop: '3px solid var(--color-info)' }}>
              <div className="stat-icon info"><i className="fas fa-cloud-rain"></i></div>
              <div>
                <p className="stat-label">Weather Warnings</p>
                <p className="stat-value">{stats.weather}</p>
              </div>
            </div>
          </div>

          {/* Toolbar */}
          <div className="dashboard-toolbar">
            <div className="dashboard-search">
              <div className="input-icon">
                <i className="fas fa-search icon-left"></i>
                <input 
                  type="text" 
                  className="input" 
                  placeholder="Search alerts..." 
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            
            <div className="flex gap-3">
              <div className="select-wrapper">
                <select className="input select-field" value={filterType} onChange={e => setFilterType(e.target.value)}>
                  <option value="all">All Types</option>
                  <option value="Traffic">Traffic</option>
                  <option value="Emergency">Emergency</option>
                  <option value="Construction">Construction</option>
                  <option value="Weather">Weather</option>
                </select>
              </div>
              
              {selectedAlerts.length > 0 && (
                <button className="btn btn-danger" onClick={handleBulkDelete}>
                  <i className="fas fa-trash"></i> Delete Selected ({selectedAlerts.length})
                </button>
              )}
            </div>
          </div>

          {/* Table */}
          <div className="card">
            {loading ? (
              <div className="flex-center py-12">
                <span className="spinner"></span>
              </div>
            ) : filteredAlerts.length > 0 ? (
              <div className="table-container">
                <table className="table">
                  <thead>
                    <tr>
                      <th style={{ width: '40px' }}>
                        <input 
                          type="checkbox" 
                          checked={selectedAlerts.length === filteredAlerts.length && filteredAlerts.length > 0}
                          onChange={handleSelectAll}
                        />
                      </th>
                      <th>Title</th>
                      <th>Type</th>
                      <th>Location</th>
                      <th>Created / Updated</th>
                      <th style={{ textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredAlerts.map(alert => (
                      <tr key={alert.id}>
                        <td>
                          <input 
                            type="checkbox" 
                            checked={selectedAlerts.includes(alert.id)}
                            onChange={() => handleSelect(alert.id)}
                          />
                        </td>
                        <td className="font-medium text-primary-dark">{alert.title}</td>
                        <td>
                          <span className={`badge badge-${
                            alert.alert_type === 'Traffic' ? 'danger' :
                            alert.alert_type === 'Emergency' ? 'purple' :
                            alert.alert_type === 'Construction' ? 'warning' : 'info'
                          }`}>{alert.alert_type}</span>
                        </td>
                        <td className="text-muted text-sm">
                          {alert.location_lat.toFixed(4)}, {alert.location_lng.toFixed(4)}
                        </td>
                        <td className="text-muted text-sm">
                          {new Date(alert.updated_at).toLocaleDateString()} {new Date(alert.updated_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <div className="flex justify-end gap-2" style={{ justifyContent: 'flex-end' }}>
                            <Link to={`/alerts/edit/${alert.id}`} className="btn-icon btn-sm btn-ghost" title="Edit">
                              <i className="fas fa-edit"></i>
                            </Link>
                            <button className="btn-icon btn-sm btn-ghost text-danger" title="Delete" onClick={() => handleDeleteClick(alert.id)}>
                              <i className="fas fa-trash-alt"></i>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="py-12 flex-center flex-col text-center">
                <div className="icon-box bg-subtle text-muted mb-4 text-3xl" style={{ width: '64px', height: '64px' }}>
                  <i className="fas fa-search"></i>
                </div>
                <h4 className="font-semibold mb-2">No alerts found</h4>
                <p className="text-secondary text-sm">No alerts match your current search and filters.</p>
              </div>
            )}
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
              <p>Are you sure you want to delete this alert? This action cannot be undone and the alert will be immediately removed from the public map.</p>
            </div>
            <div className="modal-card-footer">
              <button className="btn btn-ghost" onClick={() => setDeleteModalActive(false)}>Cancel</button>
              <button className="btn btn-danger" onClick={confirmDelete}>Delete Alert</button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
