import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { getGovUsers, approveGovUser, revokeGovUser, sendBroadcast } from '../api'
import type { User } from '../types'
import { ALERT_TYPES } from '../lib/alertMeta'
import Seo from '../components/Seo'
import { EmptyState, Kpi, PageHead } from '../components/ui'
import '../styles/pages/admin.css'

type Filter = 'pending' | 'verified' | 'all'

export default function SuperuserPage() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<Filter>('pending')
  const [busyId, setBusyId] = useState<number | null>(null)
  const [confirm, setConfirm] = useState<{ user: User; action: 'approve' | 'revoke' } | null>(null)

  const [bTitle, setBTitle] = useState('')
  const [bDesc, setBDesc] = useState('')
  const [bType, setBType] = useState('Emergency')
  const [bConfirm, setBConfirm] = useState(false)
  const [broadcasting, setBroadcasting] = useState(false)

  const toast = (message: string, type: 'success' | 'danger' | 'info' = 'success') =>
    window.dispatchEvent(new CustomEvent('toast:show', { detail: { message, type } }))

  useEffect(() => {
    getGovUsers()
      .then(res => setUsers(Array.isArray(res.data) ? res.data : []))
      .catch(() => setUsers([]))
      .finally(() => setLoading(false))
  }, [])

  const pending = users.filter(u => !u.is_verified)
  const verified = users.filter(u => u.is_verified)
  const list = filter === 'pending' ? pending : filter === 'verified' ? verified : users

  const doAction = async () => {
    if (!confirm) return
    const { user, action } = confirm
    setBusyId(user.id)
    try {
      if (action === 'approve') await approveGovUser(user.id)
      else await revokeGovUser(user.id)
      setUsers(prev => prev.map(u => (u.id === user.id ? { ...u, is_verified: action === 'approve' } : u)))
      toast(action === 'approve' ? `${user.agency_name || user.username} verified` : `Access revoked for ${user.agency_name || user.username}`,
        action === 'approve' ? 'success' : 'info')
    } catch {
      toast(`Failed to ${action} account`, 'danger')
    } finally {
      setBusyId(null)
      setConfirm(null)
    }
  }

  const reviewBroadcast = (e: FormEvent) => {
    e.preventDefault()
    if (bTitle.trim() && bDesc.trim()) setBConfirm(true)
  }

  const doBroadcast = async () => {
    setBroadcasting(true)
    try {
      await sendBroadcast({ title: bTitle.trim(), description: bDesc.trim(), alert_type: bType })
      toast('Emergency broadcast is live for all users')
      setBTitle(''); setBDesc('')
    } catch {
      toast('Failed to send broadcast', 'danger')
    } finally {
      setBroadcasting(false)
      setBConfirm(false)
    }
  }

  return (
    <div className="app-page">
      <Seo title="Admin Panel" noindex />
      <PageHead title="Administration" subtitle="Verify government agencies and issue region-wide emergency broadcasts." />

      <div className="kpi-grid mb-6">
        <Kpi label="Awaiting verification" value={loading ? '—' : pending.length} icon="fa-hourglass-half" tone="signal" />
        <Kpi label="Verified agencies" value={loading ? '—' : verified.length} icon="fa-building-columns" tone="ink" />
        <Kpi label="Total agency accounts" value={loading ? '—' : users.length} icon="fa-users" tone="primary" />
        <Kpi label="Broadcast channel" value="Ready" icon="fa-tower-broadcast" tone="danger" foot="Reaches every signed-in and public page" />
      </div>

      <div className="admin-grid">
        {/* Verification queue */}
        <section className="panel" aria-labelledby="verify-title">
          <div className="panel-head">
            <h2 id="verify-title" className="section-title"><i className="fas fa-user-shield" aria-hidden="true"></i> Agency verification</h2>
            <div className="assistant-mode" role="group" aria-label="Filter accounts">
              {(['pending', 'verified', 'all'] as Filter[]).map(f => (
                <button key={f} type="button" aria-pressed={filter === f} onClick={() => setFilter(f)}>
                  {f === 'pending' ? `Pending · ${pending.length}` : f === 'verified' ? `Verified · ${verified.length}` : 'All'}
                </button>
              ))}
            </div>
          </div>

          {loading ? (
            <div className="flex-col gap-3" style={{ padding: 'var(--space-5)' }}>
              {[0, 1, 2].map(i => <div key={i} className="skeleton" style={{ height: 48 }} />)}
            </div>
          ) : list.length === 0 ? (
            <EmptyState icon={filter === 'pending' ? 'fa-circle-check' : 'fa-building-columns'}
              title={filter === 'pending' ? 'No agencies waiting' : 'No accounts'}>
              {filter === 'pending' ? 'Every registered agency has been reviewed.' : 'No government accounts match this filter.'}
            </EmptyState>
          ) : (
            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th>Agency</th>
                    <th className="hide-mobile">Contact</th>
                    <th>Status</th>
                    <th style={{ textAlign: 'right' }}><span className="sr-only">Actions</span></th>
                  </tr>
                </thead>
                <tbody>
                  {list.map(u => (
                    <tr key={u.id}>
                      <td>
                        <div className="flex items-center gap-3">
                          <span className="admin-avatar" aria-hidden="true">{(u.agency_name || u.username).charAt(0).toUpperCase()}</span>
                          <div style={{ minWidth: 0 }}>
                            <div className="font-semibold">{u.agency_name || '—'}</div>
                            <div className="text-xs text-muted">{u.department || 'No department'} · @{u.username}</div>
                          </div>
                        </div>
                      </td>
                      <td className="hide-mobile"><a href={`mailto:${u.email}`} className="text-sm">{u.email}</a></td>
                      <td>
                        {u.is_verified
                          ? <span className="badge badge-success"><i className="fas fa-circle-check" aria-hidden="true"></i> Verified</span>
                          : <span className="badge badge-warning"><i className="fas fa-hourglass-half" aria-hidden="true"></i> Pending</span>}
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        {u.is_verified ? (
                          <button type="button" className="btn btn-danger-light btn-sm" disabled={busyId === u.id}
                            onClick={() => setConfirm({ user: u, action: 'revoke' })}>Revoke</button>
                        ) : (
                          <button type="button" className="btn btn-primary btn-sm" disabled={busyId === u.id}
                            onClick={() => setConfirm({ user: u, action: 'approve' })}>Verify</button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* Emergency broadcast */}
        <section className="admin-broadcast" aria-labelledby="broadcast-title">
          <div className="admin-broadcast-head">
            <span className="admin-broadcast-icon" aria-hidden="true"><i className="fas fa-tower-broadcast"></i></span>
            <div>
              <h2 id="broadcast-title">Emergency broadcast</h2>
              <p>Shows a red banner at the top of every page for all users. Use only for life-safety events.</p>
            </div>
          </div>
          <form onSubmit={reviewBroadcast} className="flex-col gap-4">
            <div className="field mb-0">
              <label className="label" htmlFor="b-title">Headline</label>
              <input id="b-title" className="input" placeholder="e.g. Flash flood warning — avoid riverside roads"
                value={bTitle} onChange={e => setBTitle(e.target.value)} maxLength={100} required />
            </div>
            <div className="field mb-0">
              <label className="label" htmlFor="b-type">Category</label>
              <div className="select-wrapper">
                <select id="b-type" className="input select-field" value={bType} onChange={e => setBType(e.target.value)}>
                  {ALERT_TYPES.map(t => <option key={t}>{t}</option>)}
                </select>
              </div>
            </div>
            <div className="field mb-0">
              <label className="label" htmlFor="b-desc">Instructions</label>
              <textarea id="b-desc" className="textarea" rows={3} placeholder="What is happening and exactly what people should do."
                value={bDesc} onChange={e => setBDesc(e.target.value)} maxLength={300} required style={{ minHeight: 90 }} />
              <p className="help-text">{bDesc.length}/300</p>
            </div>

            <div className="admin-banner-preview" aria-label="Banner preview">
              <span className="broadcast-label">EMERGENCY BROADCAST</span>
              <strong>{bTitle || 'Headline'}</strong>
              <span>{bDesc || 'Instructions appear here.'}</span>
            </div>

            <button type="submit" className="btn btn-danger btn-lg" disabled={!bTitle.trim() || !bDesc.trim()}>
              <i className="fas fa-tower-broadcast" aria-hidden="true"></i> Review broadcast
            </button>
          </form>
        </section>
      </div>

      {confirm && (
        <div className="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="verify-confirm-title">
          <div className="modal-card">
            <div className="modal-card-header">
              <h3 id="verify-confirm-title">{confirm.action === 'approve' ? 'Verify agency?' : 'Revoke access?'}</h3>
              <button className="close-btn" onClick={() => setConfirm(null)} aria-label="Close"><i className="fas fa-xmark"></i></button>
            </div>
            <div className="modal-card-body">
              <p className="font-semibold">{confirm.user.agency_name || confirm.user.username}</p>
              <p className="text-sm text-muted mb-3">{confirm.user.department} · {confirm.user.email}</p>
              <p className="text-secondary text-sm">
                {confirm.action === 'approve'
                  ? 'They will be able to publish official alerts, review citizen reports and use the Command Center. They need to sign in again for access to apply.'
                  : 'They will lose access to the Command Center and can no longer publish alerts.'}
              </p>
            </div>
            <div className="modal-card-footer">
              <button className="btn btn-ghost" onClick={() => setConfirm(null)}>Cancel</button>
              <button className={`btn ${confirm.action === 'approve' ? 'btn-primary' : 'btn-danger'}`} onClick={doAction} disabled={busyId !== null}>
                {busyId !== null ? <span className="spinner" /> : confirm.action === 'approve' ? 'Verify agency' : 'Revoke access'}
              </button>
            </div>
          </div>
        </div>
      )}

      {bConfirm && (
        <div className="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="b-confirm-title">
          <div className="modal-card">
            <div className="modal-card-header">
              <h3 id="b-confirm-title" className="text-danger">Send emergency broadcast?</h3>
              <button className="close-btn" onClick={() => setBConfirm(false)} aria-label="Close"><i className="fas fa-xmark"></i></button>
            </div>
            <div className="modal-card-body">
              <div className="alert-banner is-danger mb-4">
                <i className="fas fa-triangle-exclamation" aria-hidden="true"></i>
                <span>This banner will appear immediately for every user of SRANS.</span>
              </div>
              <p className="font-semibold">{bTitle}</p>
              <p className="text-sm text-secondary mt-1">{bDesc}</p>
            </div>
            <div className="modal-card-footer">
              <button className="btn btn-ghost" onClick={() => setBConfirm(false)}>Cancel</button>
              <button className="btn btn-danger" onClick={doBroadcast} disabled={broadcasting}>
                {broadcasting ? <span className="spinner" /> : 'Broadcast now'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
