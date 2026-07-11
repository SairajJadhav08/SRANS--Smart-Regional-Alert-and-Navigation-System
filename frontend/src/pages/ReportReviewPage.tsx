import { useState, useEffect } from 'react'
import { getReports, approveReport, rejectReport } from '../api'

const STATUS_BADGE: Record<string, string> = {
  pending: 'badge-warning', approved: 'badge-success', rejected: 'badge-danger'
}
const TYPE_ICONS: Record<string, string> = {
  Traffic: 'fa-car-crash', Emergency: 'fa-exclamation-triangle',
  Construction: 'fa-hard-hat', Weather: 'fa-cloud-rain', Other: 'fa-flag'
}

export default function ReportReviewPage() {
  const [reports, setReports] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending')
  const [actionId, setActionId] = useState<number | null>(null)
  const [noteMap, setNoteMap] = useState<Record<number, string>>({})

  useEffect(() => {
    getReports().then(r => setReports(Array.isArray(r.data) ? r.data : [])).catch(() => setReports([])).finally(() => setLoading(false))
  }, [])

  const filtered = reports.filter(r => filter === 'all' || r.status === filter)
  const pendingCount = reports.filter(r => r.status === 'pending').length

  const handleApprove = async (id: number) => {
    setActionId(id)
    try {
      await approveReport(id, noteMap[id])
      setReports(prev => prev.map(r => r.id === id ? { ...r, status: 'approved', review_note: noteMap[id] || null } : r))
      window.dispatchEvent(new CustomEvent('toast:show', { detail: { message: 'Report approved and alert created', type: 'success' } }))
    } catch { alert('Failed to approve.') } finally { setActionId(null) }
  }

  const handleReject = async (id: number) => {
    setActionId(id)
    try {
      await rejectReport(id, noteMap[id])
      setReports(prev => prev.map(r => r.id === id ? { ...r, status: 'rejected', review_note: noteMap[id] || null } : r))
    } catch { alert('Failed to reject.') } finally { setActionId(null) }
  }

  return (
    <>
      <div className="page-header bg-white">
        <div className="container">
          <div className="flex-between flex-wrap gap-4">
            <div>
              <h1 className="font-display font-bold text-3xl mb-1">Citizen Report Review</h1>
              <p className="text-secondary">Review and act on community-submitted incident reports</p>
            </div>
            {pendingCount > 0 && <span className="badge badge-warning"><i className="fas fa-clock mr-1"></i>{pendingCount} pending review</span>}
          </div>
        </div>
      </div>

      <section className="section pt-6">
        <div className="container">
          <div className="card">
            <div className="card-header">
              <div className="tabs-list">
                {(['pending', 'all', 'approved', 'rejected'] as const).map(f => (
                  <button key={f} className={`tab-btn ${filter === f ? 'active' : ''}`} onClick={() => setFilter(f)}>
                    {f.charAt(0).toUpperCase() + f.slice(1)}
                    {f === 'pending' && pendingCount > 0 && <span className="badge badge-warning ml-1">{pendingCount}</span>}
                  </button>
                ))}
              </div>
            </div>

            {loading ? (
              <div className="flex-center py-12"><span className="spinner"></span></div>
            ) : filtered.length === 0 ? (
              <div className="flex-center flex-col py-12 text-center">
                <div className="icon-box bg-subtle text-muted mb-3 text-2xl"><i className="fas fa-clipboard-check"></i></div>
                <h4 className="font-semibold mb-1">No reports</h4>
                <p className="text-secondary text-sm">No {filter === 'all' ? '' : filter} reports at this time.</p>
              </div>
            ) : (
              <div>
                {filtered.map((r, i) => (
                  <div key={r.id} style={{ padding: 'var(--space-4) var(--space-5)', borderBottom: i < filtered.length - 1 ? '1px solid var(--border-color)' : 'none' }}>
                    <div className="flex gap-3" style={{ alignItems: 'flex-start' }}>
                      <div className={`icon-box-sm ${r.report_type === 'Traffic' ? 'danger' : r.report_type === 'Emergency' ? 'purple' : r.report_type === 'Construction' ? 'warning' : 'info'}`} style={{ flexShrink: 0, marginTop: 2 }}>
                        <i className={`fas ${TYPE_ICONS[r.report_type] || 'fa-flag'}`}></i>
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div className="flex-between flex-wrap gap-2 mb-1">
                          <span className="font-semibold">{r.title}</span>
                          <div className="flex gap-2">
                            <span className="badge badge-info" style={{ fontSize: 10 }}>{r.report_type}</span>
                            <span className={`badge ${STATUS_BADGE[r.status]}`} style={{ fontSize: 10 }}>{r.status}</span>
                          </div>
                        </div>
                        <p className="text-secondary text-sm mb-2" style={{ lineHeight: 1.5 }}>{r.description}</p>
                        <div className="flex gap-4 text-xs text-muted mb-2">
                          <span><i className="fas fa-user mr-1"></i>{r.user?.username || 'Unknown'}</span>
                          <span><i className="fas fa-map-marker-alt mr-1"></i>{r.location_lat?.toFixed(4)}, {r.location_lng?.toFixed(4)}</span>
                          <span><i className="fas fa-clock mr-1"></i>{new Date(r.created_at).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>
                        </div>

                        {r.status === 'pending' && (
                          <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                            <input
                              className="input"
                              style={{ flex: 1, minWidth: 160, height: 32, fontSize: 12 }}
                              placeholder="Optional review note..."
                              value={noteMap[r.id] || ''}
                              onChange={e => setNoteMap(prev => ({ ...prev, [r.id]: e.target.value }))}
                            />
                            <button className="btn btn-sm btn-primary" disabled={actionId === r.id} onClick={() => handleApprove(r.id)}>
                              {actionId === r.id ? <span className="spinner" style={{ width: 12, height: 12, borderWidth: 2 }}></span> : <><i className="fas fa-check mr-1"></i>Approve & Post Alert</>}
                            </button>
                            <button className="btn btn-sm btn-ghost" style={{ color: 'var(--color-danger)', border: '1px solid var(--color-danger)' }} disabled={actionId === r.id} onClick={() => handleReject(r.id)}>
                              <i className="fas fa-times mr-1"></i>Reject
                            </button>
                          </div>
                        )}

                        {r.review_note && <p className="text-xs mt-2" style={{ color: 'var(--color-primary)' }}><i className="fas fa-comment-dots mr-1"></i>{r.review_note}</p>}
                        {r.promoted_to && <p className="text-xs mt-1 text-primary"><i className="fas fa-external-link-alt mr-1"></i>Created alert #{r.promoted_to}</p>}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>
    </>
  )
}
