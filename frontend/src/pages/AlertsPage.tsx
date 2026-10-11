import { useEffect, useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { getAlerts, getAiSmartSearch } from '../api'
import type { Alert } from '../types'
import { useAuth } from '../context/AuthContext'
import { ALERT_TYPES, timeAgo, typeMeta } from '../lib/alertMeta'
import { distanceKm } from '../lib/aiCache'
import Seo from '../components/Seo'
import { AiShimmer, EmptyState, TypeBadge, TypeIcon } from '../components/ui'
import AlertExplainer from '../components/ai/AlertExplainer'
import '../styles/pages/alerts.css'

type Sort = 'newest' | 'nearest'

export default function AlertsPage() {
  const { isLoggedIn } = useAuth()
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<string>('all')
  const [query, setQuery] = useState('')
  const [sort, setSort] = useState<Sort>('newest')
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null)

  // AI smart search
  const [aiQuery, setAiQuery] = useState('')
  const [aiLoading, setAiLoading] = useState(false)
  const [aiResult, setAiResult] = useState<{ answer: string; ids: number[] } | null>(null)
  const [aiError, setAiError] = useState<string | null>(null)

  useEffect(() => {
    getAlerts()
      .then(res => setAlerts(Array.isArray(res.data) ? res.data : []))
      .catch(() => setAlerts([]))
      .finally(() => setLoading(false))
  }, [])

  const enableNearest = () => {
    if (coords) { setSort('nearest'); return }
    if (!('geolocation' in navigator)) return
    navigator.geolocation.getCurrentPosition(
      pos => {
        setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude })
        setSort('nearest')
      },
      () => window.dispatchEvent(new CustomEvent('toast:show', {
        detail: { message: 'Location permission is needed to sort by distance', type: 'warning' },
      }))
    )
  }

  const runSmartSearch = async (e: FormEvent) => {
    e.preventDefault()
    const q = aiQuery.trim()
    if (!q) return
    setAiLoading(true)
    setAiError(null)
    setAiResult(null)
    try {
      const res = await getAiSmartSearch(q)
      setAiResult({ answer: res.data.answer, ids: res.data.alert_ids })
    } catch (err: any) {
      setAiError(err?.response?.data?.message || 'AI search is unavailable right now.')
    } finally {
      setAiLoading(false)
    }
  }

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: alerts.length }
    alerts.forEach(a => { c[a.alert_type] = (c[a.alert_type] ?? 0) + 1 })
    return c
  }, [alerts])

  const visible = useMemo(() => {
    let list = alerts
    if (aiResult) {
      const order = new Map(aiResult.ids.map((id, i) => [id, i]))
      list = list.filter(a => order.has(a.id)).sort((a, b) => order.get(a.id)! - order.get(b.id)!)
    }
    if (filter !== 'all') list = list.filter(a => a.alert_type === filter)
    const q = query.trim().toLowerCase()
    if (q) list = list.filter(a => a.title.toLowerCase().includes(q) || a.description.toLowerCase().includes(q))

    const withKm = list.map(a => ({
      alert: a,
      km: coords ? distanceKm(coords, { lat: a.location_lat, lng: a.location_lng }) : null,
    }))
    if (!aiResult) {
      if (sort === 'nearest' && coords) withKm.sort((x, y) => (x.km ?? 0) - (y.km ?? 0))
      else withKm.sort((x, y) => +new Date(y.alert.created_at) - +new Date(x.alert.created_at))
    }
    return withKm
  }, [alerts, filter, query, sort, coords, aiResult])

  const content = (
    <>
      {isLoggedIn ? (
        <section className="alerts-ai panel" aria-labelledby="smart-search-label">
          <form onSubmit={runSmartSearch} className="alerts-ai-form">
            <label id="smart-search-label" htmlFor="smart-search" className="alerts-ai-label">
              <i className="fas fa-wand-magic-sparkles" aria-hidden="true"></i> Ask about the alerts
            </label>
            <div className="alerts-ai-row">
              <input
                id="smart-search"
                className="input"
                type="text"
                placeholder="e.g. Is anything blocking the road to the airport this morning?"
                value={aiQuery}
                onChange={e => setAiQuery(e.target.value)}
              />
              <button type="submit" className="btn btn-signal" disabled={aiLoading || !aiQuery.trim()}>
                {aiLoading ? <span className="spinner" /> : <>Search <i className="fas fa-arrow-right" aria-hidden="true"></i></>}
              </button>
            </div>
          </form>
          {(aiLoading || aiResult || aiError) && (
            <div className="alerts-ai-result" aria-live="polite">
              {aiLoading && <AiShimmer lines={2} onLight />}
              {aiError && <p className="text-sm text-danger">{aiError}</p>}
              {aiResult && (
                <div className="ai-inline">
                  <div className="flex-between gap-3 mb-1">
                    <span className="ai-chip on-light"><i className="fas fa-wand-magic-sparkles" aria-hidden="true"></i> AI answer</span>
                    <button type="button" className="btn btn-ghost btn-sm" onClick={() => { setAiResult(null); setAiQuery('') }}>
                      Clear search
                    </button>
                  </div>
                  <p>{aiResult.answer}</p>
                  <p className="text-xs text-muted mt-2">
                    Showing {aiResult.ids.length} matching alert{aiResult.ids.length === 1 ? '' : 's'}.
                  </p>
                </div>
              )}
            </div>
          )}
        </section>
      ) : (
        <div className="alerts-guest-cta">
          <i className="fas fa-wand-magic-sparkles" aria-hidden="true"></i>
          <p>
            <strong>Want AI to explain what these alerts mean for your commute?</strong>{' '}
            Create a free account to unlock AI search, impact explanations and route risk scores.
          </p>
          <Link to="/register" className="btn btn-signal btn-sm">Sign up free</Link>
        </div>
      )}

      <div className="alerts-toolbar">
        <div className="pill-filters" role="group" aria-label="Filter by type">
          <button type="button" className={`pill${filter === 'all' ? ' active' : ''}`} aria-pressed={filter === 'all'} onClick={() => setFilter('all')}>
            All <span className="pill-count">{counts.all ?? 0}</span>
          </button>
          {ALERT_TYPES.map(t => (
            <button
              key={t}
              type="button"
              className={`pill${filter === t ? ' active' : ''}`}
              aria-pressed={filter === t}
              onClick={() => setFilter(t)}
            >
              <span className="type-dot" style={{ background: typeMeta(t).color }} aria-hidden="true"></span>
              {t} <span className="pill-count">{counts[t] ?? 0}</span>
            </button>
          ))}
        </div>

        <div className="alerts-toolbar-right">
          <div className="input-icon">
            <i className="fas fa-magnifying-glass icon-left" aria-hidden="true"></i>
            <input
              className="input"
              type="search"
              placeholder="Filter by keyword"
              aria-label="Filter alerts by keyword"
              value={query}
              onChange={e => setQuery(e.target.value)}
            />
          </div>
          <div className="select-wrapper">
            <select
              className="input select-field"
              aria-label="Sort alerts"
              value={sort}
              onChange={e => (e.target.value === 'nearest' ? enableNearest() : setSort('newest'))}
              disabled={!!aiResult}
            >
              <option value="newest">Newest first</option>
              <option value="nearest">Nearest to me</option>
            </select>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="alerts-grid">
          {[0, 1, 2, 3].map(i => <div key={i} className="skeleton" style={{ height: 200 }} />)}
        </div>
      ) : visible.length === 0 ? (
        <div className="panel">
          <EmptyState icon="fa-circle-check" title={alerts.length === 0 ? 'All clear' : 'No alerts match'}>
            {alerts.length === 0
              ? 'There are no active alerts in the region right now.'
              : 'Try a different category or keyword.'}
          </EmptyState>
        </div>
      ) : (
        <ul className="alerts-grid">
          {visible.map(({ alert, km }) => {
            const m = typeMeta(alert.alert_type)
            return (
              <li key={alert.id}>
                <article className="alert-card" style={{ ['--hz' as string]: m.color }}>
                  <header className="alert-card-head">
                    <TypeIcon type={alert.alert_type} />
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <h2 className="alert-card-title">{alert.title}</h2>
                      <div className="alert-card-meta">
                        <TypeBadge type={alert.alert_type} />
                        <span><i className="fas fa-clock" aria-hidden="true"></i> <time dateTime={alert.created_at}>{timeAgo(alert.created_at)}</time></span>
                        {km !== null && <span className="mono">{km.toFixed(1)} km away</span>}
                      </div>
                    </div>
                  </header>
                  <p className="alert-card-desc">{alert.description}</p>
                  <footer className="alert-card-foot">
                    <span className="mono text-xs text-muted">
                      <i className="fas fa-location-dot" aria-hidden="true"></i> {alert.location_lat.toFixed(4)}, {alert.location_lng.toFixed(4)}
                    </span>
                    <Link to={`/map?lat=${alert.location_lat}&lng=${alert.location_lng}`} className="btn btn-ghost btn-sm">
                      View on map <i className="fas fa-arrow-right" aria-hidden="true"></i>
                    </Link>
                  </footer>
                  {isLoggedIn && <div className="alert-card-ai"><AlertExplainer alertId={alert.id} compact /></div>}
                </article>
              </li>
            )
          })}
        </ul>
      )}
    </>
  )

  if (isLoggedIn) {
    return (
      <div className="app-page">
        <Seo title="Regional Alerts" noindex />
        <div className="app-page-head">
          <div>
            <div className="eyebrow mb-2"><span className="live-dot" aria-hidden="true"></span> Live feed</div>
            <h1>Regional alerts</h1>
            <p>Construction, utility work, diversions, flooding and emergencies across the region.</p>
          </div>
          <Link to="/map" className="btn btn-secondary"><i className="fas fa-map-location-dot" aria-hidden="true"></i> Open map</Link>
        </div>
        {content}
      </div>
    )
  }

  return (
    <>
      <Seo
        title="Live Regional Alerts — Road Closures, Diversions & Flooding"
        description="Live alerts for road construction, utility work, traffic diversions, flooding and emergencies, published by verified agencies and confirmed citizen reports."
        path="/alerts"
      />
      <section className="alerts-hero">
        <div className="container">
          <span className="eyebrow on-dark"><span className="live-dot" aria-hidden="true"></span> Updated in real time</span>
          <h1>Live regional alerts</h1>
          <p>
            Road construction, utility work, traffic diversions, flooding and emergencies — published by verified agencies
            and confirmed citizen reports.
          </p>
          <div className="btn-group">
            <Link to="/map" className="btn btn-signal"><i className="fas fa-map-location-dot" aria-hidden="true"></i> View on live map</Link>
            <Link to="/register" className="btn btn-outline-white">Get alerts for my routes</Link>
          </div>
        </div>
      </section>
      <section className="section">
        <div className="container">{content}</div>
      </section>
    </>
  )
}
