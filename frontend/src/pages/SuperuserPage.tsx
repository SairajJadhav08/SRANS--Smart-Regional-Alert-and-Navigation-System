import { useState, useEffect } from 'react'
import { getGovUsers, approveGovUser, revokeGovUser } from '../api'
import type { User } from '../types'

export default function SuperuserPage() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [actionLoading, setActionLoading] = useState<number | null>(null)
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved'>('all')

  const fetchUsers = async () => {
    try {
      setLoading(true)
      const res = await getGovUsers()
      setUsers(res.data)
    } catch {
      setError('Failed to load government users.')
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
      <section className="hero is-primary">
        <div className="hero-body">
          <div className="container">
            <h1 className="title is-1">Admin Panel</h1>
            <h2 className="subtitle is-4">Manage government agency registrations</h2>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">

          {/* Stats */}
          <div className="columns mb-5">
            <div className="column is-3">
              <div className="box dashboard-tile" style={{ borderLeft: '4px solid #3273dc', cursor: 'pointer' }} onClick={() => setFilter('all')}>
                <p className="heading">Total Agencies</p>
                <p className="title">{users.length}</p>
              </div>
            </div>
            <div className="column is-3">
              <div className="box dashboard-tile" style={{ borderLeft: '4px solid #ffdd57', cursor: 'pointer' }} onClick={() => setFilter('pending')}>
                <p className="heading">Pending Approval</p>
                <p className="title has-text-warning">{pendingCount}</p>
              </div>
            </div>
            <div className="column is-3">
              <div className="box dashboard-tile" style={{ borderLeft: '4px solid #48c774', cursor: 'pointer' }} onClick={() => setFilter('approved')}>
                <p className="heading">Approved</p>
                <p className="title has-text-success">{approvedCount}</p>
              </div>
            </div>
          </div>

          {/* Filter tabs */}
          <div className="tabs is-boxed mb-4">
            <ul>
              {(['all', 'pending', 'approved'] as const).map(f => (
                <li key={f} className={filter === f ? 'is-active' : ''}>
                  <a onClick={() => setFilter(f)} style={{ textTransform: 'capitalize' }}>{f}</a>
                </li>
              ))}
            </ul>
          </div>

          {loading && (
            <div className="has-text-centered py-6">
              <span className="icon is-large"><i className="fas fa-spinner fa-spin fa-2x has-text-primary"></i></span>
              <p className="mt-3">Loading government users...</p>
            </div>
          )}

          {error && (
            <div className="notification is-danger is-light">{error}</div>
          )}

          {!loading && !error && filtered.length === 0 && (
            <div className="box has-text-centered py-6">
              <span className="icon is-large mb-3"><i className="fas fa-building fa-3x has-text-grey-light"></i></span>
              <p className="title is-5 has-text-grey mt-3">No {filter !== 'all' ? filter : ''} government registrations</p>
            </div>
          )}

          {!loading && filtered.length > 0 && (
            <div className="columns is-multiline">
              {filtered.map(user => (
                <div className="column is-6" key={user.id}>
                  <div className="card" style={{ borderLeft: `4px solid ${user.is_verified ? '#48c774' : '#ffdd57'}` }}>
                    <div className="card-content">
                      <div className="is-flex is-justify-content-space-between is-align-items-flex-start">
                        <div>
                          <p className="title is-5 mb-1">{user.username}</p>
                          <p className="subtitle is-6 mb-2" style={{ color: '#718096' }}>{user.email}</p>
                        </div>
                        <span className={`tag ${user.is_verified ? 'is-success' : 'is-warning'}`}>
                          {user.is_verified ? 'Approved' : 'Pending'}
                        </span>
                      </div>

                      <div className="columns is-mobile is-multiline mt-2">
                        <div className="column is-6">
                          <p className="is-size-7 has-text-grey">Agency</p>
                          <p className="has-text-weight-semibold">{user.agency_name || '—'}</p>
                        </div>
                        <div className="column is-6">
                          <p className="is-size-7 has-text-grey">Department</p>
                          <p className="has-text-weight-semibold">{user.department || '—'}</p>
                        </div>
                      </div>

                      <div className="buttons mt-3">
                        {!user.is_verified ? (
                          <button
                            className={`button is-success is-small${actionLoading === user.id ? ' is-loading' : ''}`}
                            onClick={() => handleApprove(user.id)}
                            disabled={actionLoading === user.id}
                          >
                            <span className="icon"><i className="fas fa-check"></i></span>
                            <span>Approve</span>
                          </button>
                        ) : (
                          <button
                            className={`button is-warning is-small${actionLoading === user.id ? ' is-loading' : ''}`}
                            onClick={() => handleRevoke(user.id)}
                            disabled={actionLoading === user.id}
                          >
                            <span className="icon"><i className="fas fa-ban"></i></span>
                            <span>Revoke Access</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </>
  )
}
