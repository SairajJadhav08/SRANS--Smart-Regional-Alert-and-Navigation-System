import { useState, useEffect } from 'react'
import { getGovUsers, approveGovUser, revokeGovUser } from '../api'
import type { User } from '../types'

export default function SuperuserPage() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<number | null>(null)
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved'>('all')

  const fetchUsers = async () => {
    try {
      setLoading(true)
      const res = await getGovUsers()
      setUsers(res.data)
    } catch {
      // error
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchUsers() }, [])

  const handleApprove = async (id: number) => {
    setActionLoading(id)
    try {
      const res = await approveGovUser(id)
      setUsers(prev => prev.map(u => u.id === id ? res.data.user : u))
    } catch {
      alert('Failed to approve user.')
    } finally {
      setActionLoading(null)
    }
  }

  const handleRevoke = async (id: number) => {
    setActionLoading(id)
    try {
      const res = await revokeGovUser(id)
      setUsers(prev => prev.map(u => u.id === id ? res.data.user : u))
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
