import { useState, useEffect } from 'react'
import { getGovUsers, approveGovUser, revokeGovUser, sendBroadcast } from '../api'
import type { User } from '../types'

export default function SuperuserPage() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<number | null>(null)
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved'>('all')

  // Broadcast state
  const [broadcastTitle, setBroadcastTitle] = useState('')
  const [broadcastDesc, setBroadcastDesc] = useState('')
  const [broadcastType, setBroadcastType] = useState('Emergency')
  const [broadcasting, setBroadcasting] = useState(false)
  const [broadcastSuccess, setBroadcastSuccess] = useState(false)

  const fetchUsers = async () => {
    try {
      setLoading(true)
      const res = await getGovUsers()
      if (Array.isArray(res.data)) {
        setUsers(res.data)
      } else {
        console.error('API did not return an array of users')
        setUsers([])
      }
    } catch {
      // error
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchUsers() }, [])

  const handleBroadcast = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!broadcastTitle.trim() || !broadcastDesc.trim()) return
    setBroadcasting(true)
    try {
      await sendBroadcast({ title: broadcastTitle, description: broadcastDesc, alert_type: broadcastType })
      setBroadcastSuccess(true); setBroadcastTitle(''); setBroadcastDesc('')
      setTimeout(() => setBroadcastSuccess(false), 5000)
    } catch { alert('Failed to send broadcast.') } finally { setBroadcasting(false) }
  }

  const handleApprove = async (id: number) => {    setActionLoading(id)
    try {
      await approveGovUser(id)
      // Update local state directly — backend returns { message } not a user object
      setUsers(prev => prev.map(u => u.id === id ? { ...u, is_verified: true } : u))
    } catch {
      alert('Failed to approve user.')
    } finally {
      setActionLoading(null)
    }
  }

  const handleRevoke = async (id: number) => {
    setActionLoading(id)
    try {
      await revokeGovUser(id)
      // Update local state directly — backend returns { message } not a user object
      setUsers(prev => prev.map(u => u.id === id ? { ...u, is_verified: false } : u))
    } catch {
      alert('Failed to revoke user.')
    } finally {
      setActionLoading(null)
    }
  }

  const filtered = users.filter(u => {
    if (filter === 'pending') return !u.is_verified
    if (filter === 'approved') return u.is_verified
    return true
  })

  const pendingCount = users.filter(u => !u.is_verified).length
  const approvedCount = users.filter(u => u.is_verified).length

  return (
    <>
      <div className="page-header bg-white">
        <div className="container">
          <h1>System Administration</h1>
          <p>Manage government agency access and system health</p>
        </div>
      </div>

      <section className="section pt-0">
        <div className="container">
          {/* Emergency Broadcast */}
          <div className="card mb-8" style={{ border: '2px solid #fca5a5', background: '#fff5f5' }}>
            <div className="card-header" style={{ background: '#fef2f2', borderBottom: '1px solid #fca5a5' }}>
              <div className="flex-center gap-3">
                <div className="icon-box danger" style={{ width: 36, height: 36, fontSize: 16 }}><i className="fas fa-broadcast-tower"></i></div>
                <div>
                  <span className="font-bold text-danger">Emergency Broadcast</span>
                  <p className="text-xs text-muted" style={{ margin: 0 }}>Sends a full-width alert banner to ALL users on the platform</p>
                </div>
              </div>
            </div>
            <div className="card-body">
              {broadcastSuccess && (
                <div className="alert-banner is-success mb-4">
                  <i className="fas fa-check-circle"></i>
                  <span>Broadcast sent — banner is now live for all users.</span>
                </div>
              )}
              <form onSubmit={handleBroadcast} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                <div className="grid" style={{ gridTemplateColumns: '1fr auto', gap: 12 }}>
                  <input className="input" placeholder="Broadcast title — e.g. Cyclone Warning: Avoid Coastal Roads" value={broadcastTitle} onChange={e => setBroadcastTitle(e.target.value)} maxLength={100} required />
                  <select className="input" style={{ width: 140 }} value={broadcastType} onChange={e => setBroadcastType(e.target.value)}>
                    <option>Emergency</option><option>Weather</option><option>Traffic</option><option>Construction</option>
                  </select>
                </div>
                <textarea className="input" rows={2} placeholder="Describe the situation and what people should do..." value={broadcastDesc} onChange={e => setBroadcastDesc(e.target.value)} maxLength={300} required style={{ resize: 'none' }} />
                <div className="flex gap-3 justify-end">
                  <button type="submit" className="btn btn-danger" disabled={broadcasting || !broadcastTitle.trim() || !broadcastDesc.trim()}>
                    {broadcasting ? <><span className="spinner"></span> Sending...</> : <><i className="fas fa-broadcast-tower mr-2"></i>Send Broadcast Now</>}
                  </button>
                </div>
              </form>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-3 mb-8">
            <div className="stat-card cursor-pointer" onClick={() => setFilter('all')}>
              <div className="stat-icon info"><i className="fas fa-building"></i></div>
              <div>
                <p className="stat-label">Total Agencies</p>
                <p className="stat-value">{users.length}</p>
              </div>
            </div>
            <div className="stat-card cursor-pointer" onClick={() => setFilter('pending')} style={{ borderTop: filter === 'pending' ? '2px solid var(--color-warning)' : '' }}>
              <div className="stat-icon warning"><i className="fas fa-clock"></i></div>
              <div>
                <p className="stat-label">Pending Approval</p>
                <p className="stat-value text-warning">{pendingCount}</p>
              </div>
            </div>
            <div className="stat-card cursor-pointer" onClick={() => setFilter('approved')} style={{ borderTop: filter === 'approved' ? '2px solid var(--color-primary)' : '' }}>
              <div className="stat-icon primary"><i className="fas fa-check-circle"></i></div>
              <div>
                <p className="stat-label">Approved Agencies</p>
                <p className="stat-value text-primary">{approvedCount}</p>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-header border-b border-color">
              <div className="tabs-list">
                <button className={`tab-btn ${filter === 'all' ? 'active' : ''}`} onClick={() => setFilter('all')}>All Accounts</button>
                <button className={`tab-btn ${filter === 'pending' ? 'active' : ''}`} onClick={() => setFilter('pending')}>Pending <span className="badge badge-warning ml-1">{pendingCount}</span></button>
                <button className={`tab-btn ${filter === 'approved' ? 'active' : ''}`} onClick={() => setFilter('approved')}>Approved</button>
              </div>
            </div>
            
            {loading ? (
              <div className="flex-center py-12">
                <span className="spinner"></span>
              </div>
            ) : filtered.length > 0 ? (
              <div className="table-container">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Agency / Department</th>
                      <th>Account</th>
                      <th>Status</th>
                      <th style={{ textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map(user => (
                      <tr key={user.id}>
                        <td>
                          <div className="font-semibold">{user.agency_name || 'N/A'}</div>
                          <div className="text-sm text-muted">{user.department || 'N/A'}</div>
                        </td>
                        <td>
                          <div>{user.username}</div>
                          <div className="text-sm text-muted">{user.email}</div>
                        </td>
                        <td>
                          {user.is_verified ? (
                            <span className="badge badge-success"><i className="fas fa-check mr-1"></i> Approved</span>
                          ) : (
                            <span className="badge badge-warning"><i className="fas fa-clock mr-1"></i> Pending</span>
                          )}
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          {!user.is_verified ? (
                            <button
                              className="btn btn-sm btn-primary"
                              onClick={() => handleApprove(user.id)}
                              disabled={actionLoading === user.id}
                            >
                              {actionLoading === user.id ? <span className="spinner"></span> : <><i className="fas fa-check"></i> Approve</>}
                            </button>
                          ) : (
                            <button
                              className="btn btn-sm btn-danger-light"
                              onClick={() => handleRevoke(user.id)}
                              disabled={actionLoading === user.id}
                            >
                              {actionLoading === user.id ? <span className="spinner"></span> : <><i className="fas fa-ban"></i> Revoke</>}
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="py-12 flex-center flex-col text-center">
                <div className="icon-box bg-subtle text-muted mb-4 text-3xl" style={{ width: '64px', height: '64px' }}>
                  <i className="fas fa-clipboard-list"></i>
                </div>
                <h4 className="font-semibold mb-2">No accounts found</h4>
                <p className="text-secondary text-sm">No agency accounts match the current filter.</p>
              </div>
            )}
          </div>
        </div>
      </section>
    </>
  )
}
