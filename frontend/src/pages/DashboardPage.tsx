import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  getAlerts, bulkDeleteAlerts, deleteAlert, getReports,
  getAnalyticsSummary, getAnalyticsByType, getAiSituationReport,
} from '../api'
import type { Alert, Report, SituationReport } from '../types'
import { useAuth } from '../context/AuthContext'
import { readCache, writeCache, clearCache } from '../lib/aiCache'
import { ALERT_TYPES, timeAgo, typeMeta } from '../lib/alertMeta'
import Seo from '../components/Seo'
import { AiChip, AiShimmer, EmptyState, Kpi, OptionalImg, TypeBadge, TypeIcon } from '../components/ui'

const SITREP_TTL = 10 * 60_000

const STATUS_META: Record<SituationReport['status'], { label: string; cls: string; icon: string }> = {
  normal: { label: 'Normal', cls: 'sit-normal', icon: 'fa-circle-check' },
  elevated: { label: 'Elevated', cls: 'sit-elevated', icon: 'fa-triangle-exclamation' },
  critical: { label: 'Critical', cls: 'sit-critical', icon: 'fa-circle-exclamation' },
}

export default function DashboardPage() {
  const { user } = useAuth()

  const [alerts, setAlerts] = useState<Alert[]>([])
  const [loading, setLoading] = useState(true)
  const [reports, setReports] = useState<Report[]>([])
  const [summary, setSummary] = useState<{ totalAlerts: number; totalUsers: number; totalRoutes: number; totalReports: number } | null>(null)
  const [byType, setByType] = useState<Array<{ type: string; count: number }>>([])

  const [sitrep, setSitrep] = useState<SituationReport | null>(() => readCache<SituationReport>('sitrep', SITREP_TTL))
  const [sitrepLoading, setSitrepLoading] = useState(false)
  const [sitrepError, setSitrepError] = useState<string | null>(null)

  const [selected, setSelected] = useState<number[]>([])
  const [search, setSearch] = useState('')
  const [filterType, setFilterType] = useState('all')
  const [confirm, setConfirm] = useState<{ ids: number[] } | null>(null)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    Promise.allSettled([
      getAlerts({ author_only: true }),
      getReports(),
      getAnalyticsSummary(),
      getAnalyticsByType(),
    ]).then(([a, r, s, t]) => {
      if (a.status === 'fulfilled') setAlerts(a.value.data)
      if (r.status === 'fulfilled') setReports(r.value.data as Report[])
      if (s.status === 'fulfilled') setSummary(s.value.data)
      if (t.status === 'fulfilled') setByType(t.value.data)
      setLoading(false)
    })
  }, [])

  const loadSitrep = useCallback(async (force = false) => {
    if (force) clearCache('sitrep')
    setSitrepLoading(true)
    setSitrepError(null)
    try {
      const res = await getAiSituationReport()
      setSitrep(res.data)
      writeCache('sitrep', res.data)
    } catch (err: any) {
      setSitrepError(err?.response?.data?.message || 'Situation report unavailable right now.')
    } finally {
      setSitrepLoading(false)
    }
  }, [])

  useEffect(() => {
    if (!sitrep) loadSitrep()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return alerts
      .filter(a => filterType === 'all' || a.alert_type === filterType)
      .filter(a => !q || a.title.toLowerCase().includes(q) || a.description.toLowerCase().includes(q))
  }, [alerts, search, filterType])

  const pending = reports.filter(r => r.status === 'pending')
  const last24h = alerts.filter(a => Date.now() - new Date(a.created_at).getTime() < 24 * 3600_000).length
  const typeTotal = byType.reduce((s, t) => s + t.count, 0)
  const allSelected = filtered.length > 0 && filtered.every(a => selected.includes(a.id))

  const toggleAll = () => setSelected(allSelected ? [] : filtered.map(a => a.id))
  const toggle = (id: number) => setSelected(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])

  const doDelete = async () => {
    if (!confirm) return
    setDeleting(true)
    try {
      if (confirm.ids.length === 1) await deleteAlert(confirm.ids[0])
      else await bulkDeleteAlerts(confirm.ids)
      setAlerts(prev => prev.filter(a => !confirm.ids.includes(a.id)))
      setSelected(prev => prev.filter(id => !confirm.ids.includes(id)))
      window.dispatchEvent(new CustomEvent('toast:show', {
        detail: { message: `${confirm.ids.length} alert${confirm.ids.length === 1 ? '' : 's'} removed from the public map`, type: 'success' },
      }))
    } catch {
      window.dispatchEvent(new CustomEvent('toast:show', { detail: { message: 'Failed to delete alert', type: 'danger' } }))
    } finally {
      setDeleting(false)
      setConfirm(null)
    }
  }

  const status = sitrep ? STATUS_META[sitrep.status] : null

  return (
    <div className="app-page">
      <Seo title="Command Center" noindex />

      <div className="app-page-head">
        <div>
          <div className="eyebrow mb-2"><span className="live-dot" aria-hidden="true"></span> Live · {user?.agency_name || 'Agency'}{user?.department ? ` · ${user.department}` : ''}</div>
          <h1>Command Center</h1>
          <p>Monitor the region, publish alerts and act on citizen reports.</p>
        </div>
        <div className="btn-group">
          <Link to="/reports/review" className="btn btn-secondary">
            <i className="fas fa-clipboard-check" aria-hidden="true"></i> Review queue
            {pending.length > 0 && <span className="badge badge-signal">{pending.length}</span>}
          </Link>
          <Link to="/alerts/new" className="btn btn-primary"><i className="fas fa-plus" aria-hidden="true"></i> Publish alert</Link>
        </div>
      </div>

      {/* AI situation report */}
      <section className="ai-card mb-6" aria-labelledby="sitrep-title">
        <OptionalImg className="ai-card-art" src="/images/command-center-art.webp" alt="" aria-hidden="true" />
        <div className="flex-between flex-wrap gap-3 mb-4">
          <div className="flex items-center gap-3 flex-wrap">
            <AiChip label="AI situation report · last 48h" />
            {status && (
              <span className={`sit-status ${status.cls}`}>
                <i className={`fas ${status.icon}`} aria-hidden="true"></i> {status.label}
              </span>
            )}
          </div>
          <button type="button" className="btn btn-outline-white btn-sm" onClick={() => loadSitrep(true)} disabled={sitrepLoading}>
            <i className={`fas fa-rotate${sitrepLoading ? ' fa-spin' : ''}`} aria-hidden="true"></i> Refresh
          </button>
        </div>

        {sitrepLoading && <AiShimmer lines={5} />}
        {sitrepError && !sitrepLoading && <p className="ai-text">{sitrepError}</p>}
        {sitrep && !sitrepLoading && (
          <>
            <h2 id="sitrep-title" className="sitrep-headline">{sitrep.headline}</h2>
            <div className="sitrep-cols">
              <div>
                <h3 className="sitrep-label">Key developments</h3>
                <ul className="sitrep-list">
                  {sitrep.key_points.length === 0 && <li>No significant developments.</li>}
                  {sitrep.key_points.map(p => <li key={p}>{p}</li>)}
                </ul>
              </div>
              <div>
                <h3 className="sitrep-label">Recommended actions</h3>
                <ol className="sitrep-actions">
                  {sitrep.recommended_actions.map((a, i) => <li key={a}><span>{i + 1}</span>{a}</li>)}
                </ol>
              </div>
            </div>
            <p className="sitrep-foot">Generated {timeAgo(sitrep.generated_at)} from live alerts and pending reports. Verify before acting.</p>
          </>
        )}
      </section>

      <div className="kpi-grid mb-6">
        <Kpi label="My published alerts" value={loading ? '—' : alerts.length} icon="fa-tower-broadcast" tone="ink" foot={`${last24h} in the last 24 hours`} />
        <Kpi label="Pending citizen reports" value={loading ? '—' : pending.length} icon="fa-inbox" tone="signal"
          foot={<Link to="/reports/review">Open review queue →</Link>} />
        <Kpi label="Region-wide alerts" value={summary?.totalAlerts ?? '—'} icon="fa-map-location-dot" tone="danger" foot="All agencies, all time" />
        <Kpi label="Registered commuters" value={summary?.totalUsers ?? '—'} icon="fa-users" tone="primary" foot={`${summary?.totalRoutes ?? 0} saved routes`} />
      </div>

      <div className="dash-grid">
        {/* Alerts table */}
        <section className="panel" aria-labelledby="myalerts-title">
          <div className="panel-head">
            <h2 id="myalerts-title" className="section-title"><i className="fas fa-list" aria-hidden="true"></i> My published alerts</h2>
            <div className="flex gap-2 flex-wrap items-center">
              <div className="input-icon" style={{ width: 220 }}>
                <i className="fas fa-magnifying-glass icon-left" aria-hidden="true"></i>
                <input className="input" type="search" placeholder="Search alerts" aria-label="Search alerts"
                  value={search} onChange={e => setSearch(e.target.value)} />
              </div>
              <div className="select-wrapper">
                <select className="input select-field" aria-label="Filter by type" value={filterType} onChange={e => setFilterType(e.target.value)}>
                  <option value="all">All types</option>
                  {ALERT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
            </div>
          </div>

          {selected.length > 0 && (
            <div className="bulk-bar">
              <span><strong>{selected.length}</strong> selected</span>
              <button type="button" className="btn btn-ghost btn-sm" onClick={() => setSelected([])}>Clear</button>
              <button type="button" className="btn btn-danger btn-sm" onClick={() => setConfirm({ ids: selected })}>
                <i className="fas fa-trash-can" aria-hidden="true"></i> Delete selected
              </button>
            </div>
          )}

          {loading ? (
            <div style={{ padding: 'var(--space-5)' }} className="flex-col gap-3">
              {[0, 1, 2, 3].map(i => <div key={i} className="skeleton" style={{ height: 44 }} />)}
            </div>
          ) : filtered.length === 0 ? (
            <EmptyState
              icon={alerts.length === 0 ? 'fa-tower-broadcast' : 'fa-magnifying-glass'}
              title={alerts.length === 0 ? 'You have not published any alerts' : 'No alerts match your filters'}
              action={alerts.length === 0 ? <Link to="/alerts/new" className="btn btn-primary btn-sm">Publish your first alert</Link> : undefined}
            >
              {alerts.length === 0 ? 'Use the AI drafter to turn field notes into a clear public alert in seconds.' : 'Try a different search term or type.'}
            </EmptyState>
          ) : (
            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th style={{ width: 40 }}>
                      <input type="checkbox" checked={allSelected} onChange={toggleAll} aria-label="Select all alerts" />
                    </th>
                    <th>Alert</th>
                    <th>Type</th>
                    <th>Updated</th>
                    <th style={{ textAlign: 'right' }}><span className="sr-only">Actions</span></th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(a => (
                    <tr key={a.id}>
                      <td>
                        <input type="checkbox" checked={selected.includes(a.id)} onChange={() => toggle(a.id)} aria-label={`Select ${a.title}`} />
                      </td>
                      <td style={{ maxWidth: 360 }}>
                        <div className="flex items-center gap-3">
                          <TypeIcon type={a.alert_type} size={30} />
                          <span className="font-semibold truncate">{a.title}</span>
                        </div>
                      </td>
                      <td><TypeBadge type={a.alert_type} /></td>
                      <td className="text-muted text-sm whitespace-nowrap">{timeAgo(a.updated_at)}</td>
                      <td style={{ textAlign: 'right' }}>
                        <div className="flex gap-1" style={{ justifyContent: 'flex-end' }}>
                          <Link to={`/alerts/edit/${a.id}`} className="btn btn-ghost btn-icon btn-sm" aria-label={`Edit ${a.title}`} title="Edit">
                            <i className="fas fa-pen"></i>
                          </Link>
                          <button type="button" className="btn btn-ghost btn-icon btn-sm text-danger" onClick={() => setConfirm({ ids: [a.id] })} aria-label={`Delete ${a.title}`} title="Delete">
                            <i className="fas fa-trash-can"></i>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <div className="stack">
          {/* Review queue */}
          <section className="panel panel-flush" aria-labelledby="queue-title">
            <div className="panel-head">
              <h2 id="queue-title" className="section-title"><i className="fas fa-inbox" aria-hidden="true"></i> Review queue</h2>
              <Link to="/reports/review" className="btn btn-ghost btn-sm">Open <i className="fas fa-arrow-right" aria-hidden="true"></i></Link>
            </div>
            <div className="panel-body">
              {pending.length === 0 ? (
                <EmptyState icon="fa-inbox" title="Queue is clear">No citizen reports are waiting for review.</EmptyState>
              ) : (
                pending.slice(0, 5).map(r => (
                  <Link key={r.id} to="/reports/review" className="list-row">
                    <TypeIcon type={r.report_type} size={30} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div className="list-row-title">{r.title}</div>
                      <div className="list-row-meta">by {r.user?.username ?? 'citizen'} · {timeAgo(r.created_at)}</div>
                    </div>
                    <span className="badge badge-signal"><i className="fas fa-wand-magic-sparkles" aria-hidden="true"></i> Triage</span>
                  </Link>
                ))
              )}
            </div>
          </section>

          {/* Type distribution */}
          <section className="panel" aria-labelledby="mix-title">
            <div className="panel-head">
              <h2 id="mix-title" className="section-title"><i className="fas fa-chart-simple" aria-hidden="true"></i> Region alert mix</h2>
              <Link to="/analytics" className="btn btn-ghost btn-sm">Analytics <i className="fas fa-arrow-right" aria-hidden="true"></i></Link>
            </div>
            <div className="panel-body flex-col gap-4">
              {byType.length === 0 && <p className="text-sm text-muted">No alerts yet.</p>}
              {byType.map(t => {
                const pct = typeTotal ? Math.round((t.count / typeTotal) * 100) : 0
                return (
                  <div key={t.type}>
                    <div className="flex-between mb-1 text-sm">
                      <span className="flex items-center gap-2 font-medium">
                        <span className="type-dot" style={{ background: typeMeta(t.type).color }} aria-hidden="true"></span>
                        {typeMeta(t.type).label}
                      </span>
                      <span className="text-muted"><span className="mono">{t.count}</span> · {pct}%</span>
                    </div>
                    <div className="bar-track" role="img" aria-label={`${t.type}: ${pct} percent`}>
                      <div className="bar-fill" style={{ width: `${pct}%`, background: typeMeta(t.type).color }} />
                    </div>
                  </div>
                )
              })}
            </div>
          </section>
        </div>
      </div>

      {confirm && (
        <div className="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="del-title">
          <div className="modal-card">
            <div className="modal-card-header">
              <h3 id="del-title">Delete {confirm.ids.length === 1 ? 'alert' : `${confirm.ids.length} alerts`}?</h3>
              <button className="close-btn" onClick={() => setConfirm(null)} aria-label="Close"><i className="fas fa-xmark"></i></button>
            </div>
            <div className="modal-card-body">
              <p className="text-secondary">
                {confirm.ids.length === 1 ? 'This alert' : 'These alerts'} will be removed from the public map and commuters&apos;
                route scores immediately. This cannot be undone.
              </p>
            </div>
            <div className="modal-card-footer">
              <button className="btn btn-ghost" onClick={() => setConfirm(null)}>Cancel</button>
              <button className="btn btn-danger" onClick={doDelete} disabled={deleting}>
                {deleting ? <span className="spinner" /> : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
