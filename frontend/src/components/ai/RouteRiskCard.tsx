import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getAiRouteRisk } from '../../api'
import type { RouteRisk, SavedRoute } from '../../types'
import { readCache, writeCache, clearCache } from '../../lib/aiCache'
import { AiShimmer, RiskGauge, TypeIcon } from '../ui'

const TTL = 15 * 60_000

export function navigateUrl(r: SavedRoute) {
  return `/map?start_lat=${r.start_lat}&start_lng=${r.start_lng}&end_lat=${r.end_lat}&end_lng=${r.end_lng}`
}

// Saved route with its AI risk score, summary and departure advice.
export default function RouteRiskCard({
  route, arrivalTime, onDelete, showAlerts = false,
}: {
  route: SavedRoute
  arrivalTime?: string
  onDelete?: () => void
  showAlerts?: boolean
}) {
  const cacheKey = `risk:${route.id}:${arrivalTime ?? ''}`
  const [risk, setRisk] = useState<RouteRisk | null>(() => readCache<RouteRisk>(cacheKey, TTL))
  const [loading, setLoading] = useState(!risk)
  const [error, setError] = useState(false)

  const load = useCallback(async (force = false) => {
    if (force) clearCache(cacheKey)
    setLoading(true)
    setError(false)
    try {
      const res = await getAiRouteRisk(route.id, arrivalTime)
      setRisk(res.data)
      writeCache(cacheKey, res.data)
    } catch {
      setError(true)
    } finally {
      setLoading(false)
    }
  }, [route.id, arrivalTime, cacheKey])

  useEffect(() => {
    if (!readCache<RouteRisk>(cacheKey, TTL)) load()
    else setLoading(false)
  }, [cacheKey, load])

  return (
    <article className="route-card">
      <header className="route-card-head">
        {risk && !loading
          ? <RiskGauge score={risk.score} level={risk.level} />
          : <div className="risk-gauge skeleton" aria-hidden="true" />}
        <div style={{ minWidth: 0, flex: 1 }}>
          <h3 className="route-card-title">{route.name}</h3>
          {risk && !loading ? (
            <p className="route-card-meta">
              <span className={`risk-label risk-${risk.level}`}>{risk.level} risk</span>
              <span aria-hidden="true"> · </span>{risk.length_km} km
              <span aria-hidden="true"> · </span>{risk.alerts.length} alert{risk.alerts.length === 1 ? '' : 's'} on corridor
            </p>
          ) : (
            <p className="route-card-meta">{loading ? 'Scoring route with AI…' : 'Risk unavailable'}</p>
          )}
        </div>
        <button
          type="button"
          className="btn btn-ghost btn-icon btn-sm"
          onClick={() => load(true)}
          disabled={loading}
          aria-label={`Refresh risk score for ${route.name}`}
          title="Refresh"
        >
          <i className={`fas fa-rotate${loading ? ' fa-spin' : ''}`}></i>
        </button>
      </header>

      <div className="route-card-body">
        {loading && <AiShimmer lines={2} onLight />}
        {error && !loading && <p className="text-sm text-danger">Could not score this route right now.</p>}
        {risk && !loading && (
          <>
            <p className="route-card-summary">{risk.summary}</p>
            {risk.best_departure && (
              <p className="route-card-depart">
                <i className="fas fa-clock" aria-hidden="true"></i> {risk.best_departure}
              </p>
            )}
            {risk.advice.length > 0 && (
              <ul className="route-card-advice">
                {risk.advice.map(a => <li key={a}>{a}</li>)}
              </ul>
            )}
            {showAlerts && risk.alerts.length > 0 && (
              <ul className="route-card-alerts">
                {risk.alerts.slice(0, 3).map(a => (
                  <li key={a.id}>
                    <TypeIcon type={a.alert_type} size={26} />
                    <span className="truncate">{a.title}</span>
                    <span className="mono text-muted text-xs">{a.distance_km} km</span>
                  </li>
                ))}
              </ul>
            )}
          </>
        )}
      </div>

      <footer className="route-card-foot">
        <Link to={navigateUrl(route)} className="btn btn-primary btn-sm">
          <i className="fas fa-diamond-turn-right" aria-hidden="true"></i> Navigate
        </Link>
        {onDelete && (
          <button type="button" className="btn btn-ghost btn-sm text-danger" onClick={onDelete} aria-label={`Delete ${route.name}`}>
            <i className="fas fa-trash-can"></i>
          </button>
        )}
      </footer>
    </article>
  )
}
