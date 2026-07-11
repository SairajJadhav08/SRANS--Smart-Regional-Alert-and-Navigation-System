import { useState, useEffect } from 'react'
import {
  getAnalyticsSummary, getAnalyticsByType,
  getAnalyticsWeekly, getAnalyticsHotspots, getAnalyticsRecentActivity
} from '../api'

const TYPE_COLORS: Record<string, string> = {
  Traffic: '#EF4444', Emergency: '#8B5CF6',
  Construction: '#F59E0B', Weather: '#3B82F6', Other: '#94A3B8',
}
const TYPE_ICONS: Record<string, string> = {
  Traffic: 'fa-car-crash', Emergency: 'fa-exclamation-triangle',
  Construction: 'fa-hard-hat', Weather: 'fa-cloud-rain',
}

export default function AnalyticsPage() {
  const [summary, setSummary] = useState<any>(null)
  const [byType, setByType] = useState<any[]>([])
  const [weekly, setWeekly] = useState<any[]>([])
  const [hotspots, setHotspots] = useState<any[]>([])
  const [activity, setActivity] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      getAnalyticsSummary(), getAnalyticsByType(),
      getAnalyticsWeekly(), getAnalyticsHotspots(), getAnalyticsRecentActivity()
    ]).then(([s, t, w, h, a]) => {
      setSummary(s.data); setByType(t.data)
      setWeekly(w.data); setHotspots(h.data); setActivity(a.data)
    }).catch(console.error).finally(() => setLoading(false))
  }, [])

  const maxWeekly = Math.max(...weekly.map(d => d.count), 1)
  const totalByType = byType.reduce((s, t) => s + t.count, 0)

  if (loading) return (
    <div className="flex-center py-20"><span className="spinner" style={{ width: 32, height: 32, borderWidth: 3 }}></span></div>
  )

  return (
    <>
      <div className="page-header bg-white">
        <div className="container">
          <div className="flex-between flex-wrap gap-4">
            <div>
              <h1 className="font-display font-bold text-3xl mb-1">Analytics Dashboard</h1>
              <p className="text-secondary">System-wide insights for government officials</p>
            </div>
            <span className="badge badge-primary"><i className="fas fa-chart-bar mr-1"></i> Live Data</span>
          </div>
        </div>
      </div>

      <section className="section pt-6">
        <div className="container">

          {/* Summary Stats */}
          <div className="grid grid-4 mb-8">
            {[
              { label: 'Total Alerts', value: summary?.totalAlerts ?? 0, icon: 'fa-bell', color: 'danger' },
              { label: 'Active Users', value: summary?.totalUsers ?? 0, icon: 'fa-users', color: 'primary' },
              { label: 'Saved Routes', value: summary?.totalRoutes ?? 0, icon: 'fa-route', color: 'info' },
              { label: 'Citizen Reports', value: summary?.totalReports ?? 0, icon: 'fa-flag', color: 'warning' },
            ].map((s, i) => (
              <div key={i} className="stat-card">
                <div className={`stat-icon ${s.color}`}><i className={`fas ${s.icon}`}></i></div>
                <div>
                  <p className="stat-label">{s.label}</p>
                  <p className="stat-value" style={{ fontSize: '28px' }}>{s.value}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="grid" style={{ gridTemplateColumns: '1fr 1fr', gap: 'var(--space-6)', marginBottom: 'var(--space-6)' }}>

            {/* Alerts by Type — horizontal bar chart */}
            <div className="card">
              <div className="card-header">
                <span className="font-semibold"><i className="fas fa-chart-pie text-primary mr-2"></i>Alerts by Type</span>
              </div>
              <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {byType.length === 0 ? <p className="text-muted text-sm">No data yet.</p> : byType.map(t => (
                  <div key={t.type}>
                    <div className="flex-between mb-1">
                      <span className="text-sm font-medium" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <i className={`fas ${TYPE_ICONS[t.type] || 'fa-bell'}`} style={{ color: TYPE_COLORS[t.type] || '#94A3B8', width: 14 }}></i>
                        {t.type}
                      </span>
                      <span className="text-sm text-muted">{t.count} ({totalByType > 0 ? Math.round(t.count / totalByType * 100) : 0}%)</span>
                    </div>
                    <div style={{ height: 8, background: 'var(--bg-subtle)', borderRadius: 4, overflow: 'hidden' }}>
                      <div style={{
                        height: '100%', borderRadius: 4,
                        width: `${totalByType > 0 ? (t.count / totalByType) * 100 : 0}%`,
                        background: TYPE_COLORS[t.type] || '#94A3B8',
                        transition: 'width 0.6s ease',
                      }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Weekly trend — bar chart */}
            <div className="card">
              <div className="card-header">
                <span className="font-semibold"><i className="fas fa-chart-bar text-primary mr-2"></i>Alerts — Last 7 Days</span>
              </div>
              <div className="card-body">
                <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, height: 120 }}>
                  {weekly.map(d => (
                    <div key={d.date} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                      <span style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 600 }}>{d.count || ''}</span>
                      <div
                        title={`${d.date}: ${d.count} alerts`}
                        style={{
                          width: '100%', borderRadius: '4px 4px 0 0',
                          height: `${maxWeekly > 0 ? Math.max((d.count / maxWeekly) * 90, d.count > 0 ? 8 : 2) : 2}px`,
                          background: d.count > 0 ? 'var(--color-primary)' : 'var(--bg-subtle)',
                          transition: 'height 0.4s ease',
                        }}
                      />
                      <span style={{ fontSize: 9, color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                        {new Date(d.date).toLocaleDateString('en-IN', { weekday: 'short' })}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="grid" style={{ gridTemplateColumns: '1fr 1fr', gap: 'var(--space-6)' }}>

            {/* Hotspots */}
            <div className="card">
              <div className="card-header">
                <span className="font-semibold"><i className="fas fa-fire text-danger mr-2"></i>Alert Hotspots</span>
                <span className="badge badge-danger">{hotspots.length} zones</span>
              </div>
              <div className="card-body" style={{ padding: 0 }}>
                {hotspots.length === 0 ? (
                  <p className="text-muted text-sm p-4">No hotspot data yet.</p>
                ) : hotspots.map((h, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 16px', borderBottom: i < hotspots.length - 1 ? '1px solid var(--border-color)' : 'none' }}>
                    <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'var(--color-danger-light)', color: 'var(--color-danger)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, flexShrink: 0 }}>
                      {i + 1}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 12, fontWeight: 600 }}>
                        {h.lat.toFixed(3)}°N, {h.lng.toFixed(3)}°E
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                        {h.types.join(' · ')}
                      </div>
                    </div>
                    <span className="badge badge-danger">{h.count} alerts</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Recent activity */}
            <div className="card">
              <div className="card-header">
                <span className="font-semibold"><i className="fas fa-history text-primary mr-2"></i>Recent Activity</span>
              </div>
              <div className="card-body" style={{ padding: 0 }}>
                {activity?.recentAlerts?.map((a: any, i: number) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 16px', borderBottom: '1px solid var(--border-color)' }}>
                    <div className={`icon-box-sm ${a.type === 'Traffic' ? 'danger' : a.type === 'Emergency' ? 'purple' : a.type === 'Construction' ? 'warning' : 'info'}`}>
                      <i className={`fas ${TYPE_ICONS[a.type] || 'fa-bell'}`}></i>
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{a.title}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{a.author} · {new Date(a.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                    </div>
                    <span className="badge badge-primary" style={{ fontSize: 10 }}>Alert</span>
                  </div>
                ))}
                {activity?.recentReports?.map((r: any, i: number) => (
                  <div key={`r${i}`} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 16px', borderBottom: i < activity.recentReports.length - 1 ? '1px solid var(--border-color)' : 'none' }}>
                    <div className="icon-box-sm warning"><i className="fas fa-flag"></i></div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{r.title}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{r.submittedBy} · {new Date(r.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                    </div>
                    <span className={`badge ${r.status === 'approved' ? 'badge-success' : r.status === 'rejected' ? 'badge-danger' : 'badge-warning'}`} style={{ fontSize: 10 }}>{r.status}</span>
                  </div>
                ))}
                {!activity?.recentAlerts?.length && !activity?.recentReports?.length && (
                  <p className="text-muted text-sm p-4">No recent activity.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
