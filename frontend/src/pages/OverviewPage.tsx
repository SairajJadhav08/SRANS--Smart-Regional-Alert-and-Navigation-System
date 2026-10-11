import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { getAlerts, getRoutes, getReports, getAiDailyBriefing } from '../api'
import type { Alert, SavedRoute, Report } from '../types'
import { reverseGeocode } from '../lib/geocode'
import { readCache, writeCache, clearCache, distanceKm } from '../lib/aiCache'
import { greeting, timeAgo, typeMeta } from '../lib/alertMeta'
import Seo from '../components/Seo'
import { AiChip, AiShimmer, EmptyState, Kpi, OptionalImg, TypeIcon } from '../components/ui'
import RouteRiskCard from '../components/ai/RouteRiskCard'
import AlertExplainer from '../components/ai/AlertExplainer'

interface Coords { lat: number; lng: number }
interface Briefing { briefing: string; alertCount: number; city: string; at: number }

const NEARBY_KM = 15
const BRIEFING_TTL = 20 * 60_000

export default function OverviewPage() {
  const { user, isAnyGovUser, isGovUser } = useAuth()

  const [coords, setCoords] = useState<Coords | null>(null)
  const [city, setCity] = useState<string>(() => localStorage.getItem('srans_city') || '')
  const [locating, setLocating] = useState(true)

  const [alerts, setAlerts] = useState<Alert[]>([])
  const [routes, setRoutes] = useState<SavedRoute[]>([])
  const [reports, setReports] = useState<Report[]>([])
  const [loadingData, setLoadingData] = useState(true)

  const [briefing, setBriefing] = useState<Briefing | null>(() => readCache<Briefing>('briefing', BRIEFING_TTL))
  const [briefingLoading, setBriefingLoading] = useState(false)
  const [briefingError, setBriefingError] = useState<string | null>(null)

  // Location (best effort) — the briefing falls back to the saved/typed city
  useEffect(() => {
    if (!('geolocation' in navigator)) { setLocating(false); return }
    navigator.geolocation.getCurrentPosition(
      async pos => {
        const c = { lat: pos.coords.latitude, lng: pos.coords.longitude }
        setCoords(c)
        const name = await reverseGeocode(c.lat, c.lng)
        if (name) {
          setCity(name)
          localStorage.setItem('srans_city', name)
        }
        setLocating(false)
      },
      () => setLocating(false),
      { timeout: 8000, maximumAge: 10 * 60_000 }
    )
  }, [])

  useEffect(() => {
    Promise.allSettled([getAlerts(), getRoutes(), getReports()]).then(([a, r, rep]) => {
      if (a.status === 'fulfilled') setAlerts(a.value.data)
      if (r.status === 'fulfilled') setRoutes(r.value.data)
      if (rep.status === 'fulfilled') setReports(rep.value.data as Report[])
      setLoadingData(false)
    })
  }, [])

  const loadBriefing = useCallback(async (force = false) => {
    if (force) clearCache('briefing')
    setBriefingLoading(true)
    setBriefingError(null)
    try {
      const label = city || 'Pune'
      const res = await getAiDailyBriefing(coords ? { city: label, lat: coords.lat, lng: coords.lng } : { city: label })
      const b = { ...res.data, city: label, at: Date.now() }
      setBriefing(b)
      writeCache('briefing', b)
    } catch (err: any) {
      setBriefingError(err?.response?.data?.message || 'Could not generate your briefing right now.')
    } finally {
      setBriefingLoading(false)
    }
  }, [city, coords])

  // Generate once location lookup settles (unless a fresh cached briefing exists)
  useEffect(() => {
    if (!locating && !briefing && !briefingLoading) loadBriefing()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [locating])

  const nearby = useMemo(() => {
    const withDist = alerts.map(a => ({
      alert: a,
      km: coords ? distanceKm(coords, { lat: a.location_lat, lng: a.location_lng }) : null,
    }))
    const filtered = coords ? withDist.filter(x => (x.km ?? 0) <= NEARBY_KM) : withDist
    return filtered
      .sort((x, y) => (x.km ?? 0) - (y.km ?? 0) || +new Date(y.alert.created_at) - +new Date(x.alert.created_at))
      .slice(0, 6)
  }, [alerts, coords])

  const last24h = alerts.filter(a => Date.now() - new Date(a.created_at).getTime() < 24 * 3600_000).length
  const pendingReports = reports.filter(r => r.status === 'pending').length
  const today = new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })

  return (
    <div className="app-page">
      <Seo title="Today" noindex />

      <div className="app-page-head">
        <div>
          <div className="eyebrow mb-2"><i className="fas fa-calendar-day" aria-hidden="true"></i> {today}</div>
          <h1>{greeting()}, {user?.username}</h1>
          <p>
            {city ? <><i className="fas fa-location-dot text-primary" aria-hidden="true"></i> {city} · </> : null}
            Here&apos;s what&apos;s happening on the roads around you.
          </p>
        </div>
        <div className="btn-group">
          <Link to="/map" className="btn btn-primary"><i className="fas fa-route" aria-hidden="true"></i> Plan a route</Link>
          <Link to="/report" className="btn btn-secondary"><i className="fas fa-flag" aria-hidden="true"></i> Report incident</Link>
        </div>
      </div>

      {isAnyGovUser && !isGovUser && (
        <div className="alert-banner is-warning mb-6" role="status">
          <i className="fas fa-hourglass-half" aria-hidden="true"></i>
          <span>
            Your agency account is awaiting verification. Command Center tools unlock once an administrator approves it —
            meanwhile all commuter features are available.
          </span>
        </div>
      )}

      {/* AI briefing */}
      <section className="ai-card mb-6" aria-labelledby="brief-title">
        <OptionalImg className="ai-card-art" src="/images/dashboard-briefing-art.webp" alt="" aria-hidden="true" />
        <div className="flex-between flex-wrap gap-3 mb-4">
          <div className="flex items-center gap-3 flex-wrap">
            <AiChip label="AI commute briefing" />
            {briefing && (
              <span className="text-xs" style={{ color: '#9BBDB4' }}>
                {briefing.city} · {briefing.alertCount} alert{briefing.alertCount === 1 ? '' : 's'} analysed · {timeAgo(new Date(briefing.at))}
              </span>
            )}
          </div>
          <button
            type="button"
            className="btn btn-outline-white btn-sm"
            onClick={() => loadBriefing(true)}
            disabled={briefingLoading || locating}
          >
            <i className={`fas fa-rotate${briefingLoading ? ' fa-spin' : ''}`} aria-hidden="true"></i> Regenerate
          </button>
        </div>
        <h2 id="brief-title" className="sr-only">AI commute briefing</h2>
        {(briefingLoading || (locating && !briefing)) && <AiShimmer lines={5} />}
        {briefingError && !briefingLoading && <p className="ai-text">{briefingError}</p>}
        {briefing && !briefingLoading && <p className="ai-text overview-brief">{briefing.briefing}</p>}
        <div className="flex gap-3 flex-wrap mt-6">
          <Link to="/ai-assistant" className="btn btn-signal btn-sm">
            <i className="fas fa-comments" aria-hidden="true"></i> Ask a follow-up
          </Link>
          <Link to="/alerts" className="btn btn-outline-white btn-sm">See all alerts</Link>
        </div>
      </section>

      {/* KPIs */}
      <div className="kpi-grid mb-6">
        <Kpi
          label={coords ? `Alerts within ${NEARBY_KM} km` : 'Active alerts'}
          value={loadingData ? '—' : coords ? nearby.length : alerts.length}
          icon="fa-bell"
          tone="signal"
          foot={coords ? 'Based on your current location' : 'Allow location for nearby alerts'}
        />
        <Kpi label="New in 24 hours" value={loadingData ? '—' : last24h} icon="fa-bolt" tone="danger" foot="Across the whole region" />
        <Kpi label="Saved routes" value={loadingData ? '—' : routes.length} icon="fa-route" tone="ink" foot="Scored by AI below" />
        <Kpi label="My pending reports" value={loadingData ? '—' : pendingReports} icon="fa-flag" tone="info" foot={`${reports.length} submitted in total`} />
      </div>

      {/* Routes get a full-width row so several fit side by side */}
      <section className="panel mb-6" aria-labelledby="routes-title">
        <div className="panel-head">
          <h2 id="routes-title" className="section-title"><i className="fas fa-route" aria-hidden="true"></i> Your routes today</h2>
          <Link to="/my-routes" className="btn btn-ghost btn-sm">Manage <i className="fas fa-arrow-right" aria-hidden="true"></i></Link>
        </div>
        <div className="panel-body">
          {loadingData ? (
            <div className="route-grid">
              {[0, 1].map(i => <div key={i} className="skeleton" style={{ height: 180 }} />)}
            </div>
          ) : routes.length === 0 ? (
            <EmptyState
              icon="fa-route"
              title="No saved routes yet"
              action={<Link to="/map" className="btn btn-primary btn-sm">Plan and save a route</Link>}
            >
              Save your daily commute on the live map and SRANS will score its risk every time you open the app.
            </EmptyState>
          ) : (
            <div className="route-grid">
              {routes.slice(0, 4).map(r => <RouteRiskCard key={r.id} route={r} />)}
            </div>
          )}
        </div>
      </section>

      <div className="dash-grid">
        {/* Nearby alerts */}
        <section className="panel panel-flush" aria-labelledby="nearby-title">
          <div className="panel-head">
            <h2 id="nearby-title" className="section-title">
              <span className="live-dot" aria-hidden="true"></span> {coords ? 'Near you' : 'Latest alerts'}
            </h2>
            <Link to="/alerts" className="btn btn-ghost btn-sm">View all <i className="fas fa-arrow-right" aria-hidden="true"></i></Link>
          </div>
          <div className="panel-body">
            {loadingData ? (
              <div className="p-4 flex-col gap-3" style={{ padding: 'var(--space-5)' }}>
                {[0, 1, 2].map(i => <div key={i} className="skeleton" style={{ height: 56 }} />)}
              </div>
            ) : nearby.length === 0 ? (
              <EmptyState icon="fa-circle-check" title="All clear">
                {coords ? `No active alerts within ${NEARBY_KM} km of you.` : 'No active alerts right now.'}
              </EmptyState>
            ) : (
              nearby.map(({ alert, km }) => (
                <div key={alert.id} className="overview-alert">
                  <div className="flex gap-3 items-start">
                    <TypeIcon type={alert.alert_type} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div className="list-row-title" style={{ whiteSpace: 'normal' }}>{alert.title}</div>
                      <div className="list-row-meta">
                        {typeMeta(alert.alert_type).label} · {timeAgo(alert.created_at)}
                        {km !== null && <> · <span className="mono">{km.toFixed(1)} km</span></>}
                      </div>
                    </div>
                  </div>
                  <p className="overview-alert-desc">{alert.description}</p>
                  <AlertExplainer alertId={alert.id} compact />
                </div>
              ))
            )}
          </div>
        </section>

        <div className="stack">
            {/* My reports */}
            <section className="panel panel-flush" aria-labelledby="reports-title">
              <div className="panel-head">
                <h2 id="reports-title" className="section-title"><i className="fas fa-flag" aria-hidden="true"></i> My reports</h2>
                <Link to="/report" className="btn btn-ghost btn-sm">New report <i className="fas fa-plus" aria-hidden="true"></i></Link>
              </div>
              <div className="panel-body">
                {reports.length === 0 ? (
                  <EmptyState icon="fa-flag" title="You haven't reported anything yet">
                    Spotted a pothole, waterlogging or a blocked road? Report it — officials review every submission.
                  </EmptyState>
                ) : (
                  reports.slice(0, 4).map(r => (
                    <div key={r.id} className="list-row">
                      <TypeIcon type={r.report_type} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div className="list-row-title">{r.title}</div>
                        <div className="list-row-meta">{typeMeta(r.report_type).label} · {timeAgo(r.created_at)}</div>
                      </div>
                      <span className={`badge ${r.status === 'approved' ? 'badge-success' : r.status === 'rejected' ? 'badge-danger' : 'badge-warning'}`}>
                        {r.status === 'approved' ? 'Published' : r.status === 'rejected' ? 'Not published' : 'In review'}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </section>
        </div>
      </div>
    </div>
  )
}
