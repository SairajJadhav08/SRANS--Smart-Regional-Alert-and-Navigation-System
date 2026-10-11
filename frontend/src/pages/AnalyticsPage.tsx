import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  getAnalyticsSummary, getAnalyticsByType, getAnalyticsWeekly,
  getAnalyticsHotspots, getAnalyticsRecentActivity, getAiAnalyticsInsights,
} from '../api'
import { readCache, writeCache, clearCache } from '../lib/aiCache'
import { timeAgo, typeMeta } from '../lib/alertMeta'
import Seo from '../components/Seo'
import { AiChip, AiShimmer, EmptyState, Kpi, PageHead, TypeIcon } from '../components/ui'
import '../styles/pages/analytics.css'

interface Summary { totalAlerts: number; totalUsers: number; totalRoutes: number; totalReports: number }
interface Insights { insights: string[]; forecast: string | null; generated_at: string }
interface Activity {
  recentAlerts: Array<{ id: number; title: string; type: string; author: string; createdAt: string }>
  recentReports: Array<{ id: number; title: string; type: string; status: string; submittedBy: string; createdAt: string }>
}

const INSIGHTS_TTL = 15 * 60_000

export default function AnalyticsPage() {
  const [summary, setSummary] = useState<Summary | null>(null)
  const [byType, setByType] = useState<Array<{ type: string; count: number }>>([])
  const [weekly, setWeekly] = useState<Array<{ date: string; count: number }>>([])
  const [hotspots, setHotspots] = useState<Array<{ lat: number; lng: number; count: number; types: string[] }>>([])
  const [activity, setActivity] = useState<Activity | null>(null)
  const [loading, setLoading] = useState(true)

  const [insights, setInsights] = useState<Insights | null>(() => readCache<Insights>('insights', INSIGHTS_TTL))
  const [insightsLoading, setInsightsLoading] = useState(false)
  const [insightsError, setInsightsError] = useState<string | null>(null)

  useEffect(() => {
    Promise.allSettled([
      getAnalyticsSummary(), getAnalyticsByType(), getAnalyticsWeekly(),
      getAnalyticsHotspots(), getAnalyticsRecentActivity(),
    ]).then(([s, t, w, h, a]) => {
      if (s.status === 'fulfilled') setSummary(s.value.data)
      if (t.status === 'fulfilled') setByType(t.value.data)
      if (w.status === 'fulfilled') setWeekly(w.value.data)
      if (h.status === 'fulfilled') setHotspots(h.value.data)
      if (a.status === 'fulfilled') setActivity(a.value.data)
      setLoading(false)
    })
  }, [])

  const loadInsights = useCallback(async (force = false) => {
    if (force) clearCache('insights')
    setInsightsLoading(true)
    setInsightsError(null)
    try {
      const res = await getAiAnalyticsInsights()
      setInsights(res.data)
      writeCache('insights', res.data)
    } catch (err: any) {
      setInsightsError(err?.response?.data?.message || 'AI insights are unavailable right now.')
    } finally {
      setInsightsLoading(false)
    }
  }, [])

  useEffect(() => {
    if (!insights) loadInsights()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const typeTotal = byType.reduce((s, t) => s + t.count, 0)
  const weekTotal = weekly.reduce((s, d) => s + d.count, 0)
  const maxDay = Math.max(1, ...weekly.map(d => d.count))
  const busiest = weekly.reduce<{ date: string; count: number } | null>((b, d) => (!b || d.count > b.count ? d : b), null)
  const topHotspotMax = Math.max(1, ...hotspots.map(h => h.count))

  const feed = [
    ...(activity?.recentAlerts ?? []).map(a => ({ kind: 'alert' as const, id: `a${a.id}`, title: a.title, type: a.type, who: a.author, at: a.createdAt, status: '' })),
    ...(activity?.recentReports ?? []).map(r => ({ kind: 'report' as const, id: `r${r.id}`, title: r.title, type: r.type, who: r.submittedBy, at: r.createdAt, status: r.status })),
  ].sort((x, y) => +new Date(y.at) - +new Date(x.at))

  return (
    <div className="app-page">
      <Seo title="Analytics" noindex />
      <PageHead
        title="Analytics"
        subtitle="Region-wide incident trends, hotspots and AI insights for planning."
        eyebrow={<><span className="live-dot" aria-hidden="true"></span> Live data</>}
        actions={<Link to="/dashboard" className="btn btn-secondary"><i className="fas fa-tower-broadcast" aria-hidden="true"></i> Command Center</Link>}
      />

      <div className="kpi-grid mb-6">
        <Kpi label="Total alerts" value={summary?.totalAlerts ?? '—'} icon="fa-bell" tone="danger" foot={`${weekTotal} in the last 7 days`} />
        <Kpi label="Commuters" value={summary?.totalUsers ?? '—'} icon="fa-users" tone="primary" foot="Registered citizen accounts" />
        <Kpi label="Saved routes" value={summary?.totalRoutes ?? '—'} icon="fa-route" tone="ink" foot="Monitored by AI risk scoring" />
        <Kpi label="Citizen reports" value={summary?.totalReports ?? '—'} icon="fa-flag" tone="signal" foot="All time" />
      </div>

      {/* AI insights */}
      <section className="ai-card mb-6" aria-labelledby="ins-title">
        <div className="flex-between flex-wrap gap-3 mb-4">
          <AiChip label="AI trend insights · last 14 days" />
          <button type="button" className="btn btn-outline-white btn-sm" onClick={() => loadInsights(true)} disabled={insightsLoading}>
            <i className={`fas fa-rotate${insightsLoading ? ' fa-spin' : ''}`} aria-hidden="true"></i> Refresh
          </button>
        </div>
        <h2 id="ins-title" className="sr-only">AI trend insights</h2>
        {insightsLoading && <AiShimmer lines={4} />}
        {insightsError && !insightsLoading && <p className="ai-text">{insightsError}</p>}
        {insights && !insightsLoading && (
          <div className="an-insights">
            <ul className="sitrep-list">
              {insights.insights.map(i => <li key={i}>{i}</li>)}
            </ul>
            {insights.forecast && (
              <div className="an-forecast">
                <span className="sitrep-label">3-day outlook</span>
                <p>{insights.forecast}</p>
              </div>
            )}
          </div>
        )}
      </section>

      <div className="an-grid mb-5">
        {/* Weekly column chart */}
        <section className="panel" aria-labelledby="week-title">
          <div className="panel-head">
            <h2 id="week-title" className="section-title"><i className="fas fa-chart-column" aria-hidden="true"></i> Alerts — last 7 days</h2>
            {busiest && busiest.count > 0 && (
              <span className="text-xs text-muted">Busiest: {new Date(busiest.date).toLocaleDateString('en-IN', { weekday: 'long' })}</span>
            )}
          </div>
          <div className="panel-body">
            {loading ? <div className="skeleton" style={{ height: 200 }} /> : (
              <ol className="an-columns" aria-label="Alerts per day">
                {weekly.map(d => {
                  const day = new Date(d.date)
                  return (
                    <li key={d.date} aria-label={`${day.toDateString()}: ${d.count} alerts`}>
                      <span className="an-col-value">{d.count}</span>
                      <span className="an-col-track">
                        <span className="an-col-bar" style={{ height: `${Math.max((d.count / maxDay) * 100, d.count ? 6 : 2)}%` }} />
                      </span>
                      <span className="an-col-label">{day.toLocaleDateString('en-IN', { weekday: 'short' })}</span>
                    </li>
                  )
                })}
              </ol>
            )}
          </div>
        </section>

        {/* By type */}
        <section className="panel" aria-labelledby="type-title">
          <div className="panel-head">
            <h2 id="type-title" className="section-title"><i className="fas fa-chart-simple" aria-hidden="true"></i> Alerts by type</h2>
            <span className="text-xs text-muted">{typeTotal} total</span>
          </div>
          <div className="panel-body flex-col gap-4">
            {loading ? <div className="skeleton" style={{ height: 160 }} /> : byType.length === 0 ? (
              <p className="text-sm text-muted">No alerts yet.</p>
            ) : byType.map(t => {
              const pct = typeTotal ? Math.round((t.count / typeTotal) * 100) : 0
              return (
                <div key={t.type}>
                  <div className="flex-between mb-1 text-sm">
                    <span className="flex items-center gap-2 font-medium"><TypeIcon type={t.type} size={26} /> {typeMeta(t.type).label}</span>
                    <span><span className="mono font-semibold">{t.count}</span> <span className="text-muted">· {pct}%</span></span>
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

      <div className="an-grid">
        {/* Hotspots */}
        <section className="panel panel-flush" aria-labelledby="hot-title">
          <div className="panel-head">
            <h2 id="hot-title" className="section-title"><i className="fas fa-fire" aria-hidden="true"></i> Incident hotspots</h2>
            <span className="text-xs text-muted">≈1 km zones</span>
          </div>
          <div className="panel-body">
            {loading ? (
              <div className="flex-col gap-2" style={{ padding: 'var(--space-5)' }}>{[0, 1, 2].map(i => <div key={i} className="skeleton" style={{ height: 44 }} />)}</div>
            ) : hotspots.length === 0 ? (
              <EmptyState icon="fa-fire" title="No hotspots yet">Hotspots appear once several alerts cluster in the same area.</EmptyState>
            ) : hotspots.map((h, i) => (
              <Link key={`${h.lat},${h.lng}`} to={`/map?lat=${h.lat}&lng=${h.lng}`} className="list-row an-hot">
                <span className="an-rank">{i + 1}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="mono text-sm font-semibold">{h.lat.toFixed(3)}°N, {h.lng.toFixed(3)}°E</div>
                  <div className="flex items-center gap-2 mt-1">
                    {h.types.map(t => <span key={t} className="type-dot" style={{ background: typeMeta(t).color }} title={t} />)}
                    <span className="list-row-meta">{h.types.join(' · ')}</span>
                  </div>
                </div>
                <div className="an-hot-bar" aria-hidden="true"><span style={{ width: `${(h.count / topHotspotMax) * 100}%` }} /></div>
                <span className="badge badge-danger">{h.count}</span>
              </Link>
            ))}
          </div>
        </section>

        {/* Activity */}
        <section className="panel panel-flush" aria-labelledby="act-title">
          <div className="panel-head">
            <h2 id="act-title" className="section-title"><i className="fas fa-clock-rotate-left" aria-hidden="true"></i> Recent activity</h2>
          </div>
          <div className="panel-body">
            {loading ? (
              <div className="flex-col gap-2" style={{ padding: 'var(--space-5)' }}>{[0, 1, 2].map(i => <div key={i} className="skeleton" style={{ height: 44 }} />)}</div>
            ) : feed.length === 0 ? (
              <EmptyState icon="fa-clock-rotate-left" title="No recent activity" />
            ) : feed.map(f => (
              <div key={f.id} className="list-row">
                <TypeIcon type={f.type} size={30} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="list-row-title">{f.title}</div>
                  <div className="list-row-meta">{f.kind === 'alert' ? 'Alert by' : 'Report by'} {f.who} · {timeAgo(f.at)}</div>
                </div>
                {f.kind === 'alert'
                  ? <span className="badge badge-ink">Alert</span>
                  : <span className={`badge ${f.status === 'approved' ? 'badge-success' : f.status === 'rejected' ? 'badge-danger' : 'badge-warning'}`}>{f.status}</span>}
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  )
}
