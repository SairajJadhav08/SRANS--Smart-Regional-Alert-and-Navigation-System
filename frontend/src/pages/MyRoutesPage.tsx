import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getRoutes, deleteRoute, getAiRoutinePlan } from '../api'
import type { SavedRoute } from '../types'
import Seo from '../components/Seo'
import { AiShimmer, EmptyState, PageHead } from '../components/ui'
import RouteRiskCard from '../components/ai/RouteRiskCard'
import RichText from '../components/ai/RichText'

export default function MyRoutesPage() {
  const [routes, setRoutes] = useState<SavedRoute[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [arrival, setArrival] = useState('09:00')
  const [toDelete, setToDelete] = useState<SavedRoute | null>(null)
  const [deleting, setDeleting] = useState(false)

  // AI departure planner (routine-planner endpoint)
  const [planFor, setPlanFor] = useState<SavedRoute | null>(null)
  const [plan, setPlan] = useState<string | null>(null)
  const [planLoading, setPlanLoading] = useState(false)

  useEffect(() => {
    getRoutes()
      .then(res => setRoutes(res.data))
      .catch(() => setError('Failed to load saved routes.'))
      .finally(() => setLoading(false))
  }, [])

  const filtered = routes.filter(r => r.name.toLowerCase().includes(search.trim().toLowerCase()))

  const confirmDelete = async () => {
    if (!toDelete) return
    setDeleting(true)
    try {
      await deleteRoute(toDelete.id)
      setRoutes(prev => prev.filter(r => r.id !== toDelete.id))
      window.dispatchEvent(new CustomEvent('toast:show', { detail: { message: `“${toDelete.name}” deleted`, type: 'success' } }))
    } catch {
      window.dispatchEvent(new CustomEvent('toast:show', { detail: { message: 'Failed to delete route', type: 'danger' } }))
    } finally {
      setDeleting(false)
      setToDelete(null)
    }
  }

  const askPlanner = async (route: SavedRoute) => {
    setPlanFor(route)
    setPlan(null)
    setPlanLoading(true)
    try {
      const res = await getAiRoutinePlan(route.id, arrival)
      setPlan(res.data.recommendation)
    } catch {
      setPlan('Sorry, the AI planner is unavailable right now. Please try again in a moment.')
    } finally {
      setPlanLoading(false)
    }
  }

  return (
    <div className="app-page">
      <Seo title="My Routes" noindex />

      <PageHead
        title="My Routes"
        subtitle="Every saved route is scored by AI against live alerts along its corridor."
        actions={<Link to="/map" className="btn btn-primary"><i className="fas fa-plus" aria-hidden="true"></i> New route</Link>}
      />

      <div className="routes-toolbar panel">
        <div className="input-icon routes-search">
          <i className="fas fa-magnifying-glass icon-left" aria-hidden="true"></i>
          <input
            className="input"
            type="search"
            placeholder="Search routes"
            aria-label="Search routes"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <div className="routes-arrival">
          <label className="label mb-0" htmlFor="arrival-time">
            <i className="fas fa-flag-checkered" aria-hidden="true"></i> Arrive by
          </label>
          <input
            id="arrival-time"
            type="time"
            className="input"
            value={arrival}
            onChange={e => setArrival(e.target.value)}
          />
        </div>
        <span className="text-sm text-muted routes-count">
          {filtered.length} of {routes.length} route{routes.length === 1 ? '' : 's'}
        </span>
      </div>

      {planFor && (
        <section className="ai-card mb-6" aria-live="polite" aria-labelledby="plan-title">
          <div className="flex-between flex-wrap gap-3 mb-3">
            <span className="ai-chip"><i className="fas fa-wand-magic-sparkles" aria-hidden="true"></i> AI departure plan</span>
            <button type="button" className="btn btn-outline-white btn-sm" onClick={() => setPlanFor(null)} aria-label="Close plan">
              <i className="fas fa-xmark" aria-hidden="true"></i> Close
            </button>
          </div>
          <h2 id="plan-title" className="mb-3" style={{ fontSize: 'var(--text-lg)' }}>
            {planFor.name} · arrive by {arrival}
          </h2>
          {planLoading ? <AiShimmer lines={4} /> : <RichText text={plan ?? ''} tone="dark" />}
        </section>
      )}

      {loading ? (
        <div className="route-grid">
          {[0, 1, 2].map(i => <div key={i} className="skeleton" style={{ height: 240 }} />)}
        </div>
      ) : error ? (
        <div className="panel"><EmptyState icon="fa-circle-exclamation" title="Something went wrong">{error}</EmptyState></div>
      ) : routes.length === 0 ? (
        <div className="panel">
          <EmptyState
            icon="fa-route"
            title="No saved routes yet"
            action={<Link to="/map" className="btn btn-primary">Plan your first route</Link>}
          >
            Plan a route on the live map and save it. SRANS will score it against live disruptions every time you check in.
          </EmptyState>
        </div>
      ) : filtered.length === 0 ? (
        <div className="panel"><EmptyState icon="fa-magnifying-glass" title="No routes match your search" /></div>
      ) : (
        <div className="route-grid">
          {filtered.map(route => (
            <div key={route.id} className="routes-item">
              <RouteRiskCard route={route} arrivalTime={arrival} showAlerts onDelete={() => setToDelete(route)} />
              <button type="button" className="btn btn-ai btn-sm btn-full" onClick={() => askPlanner(route)}>
                <i className="fas fa-clock" aria-hidden="true"></i> Plan my departure with AI
              </button>
            </div>
          ))}
        </div>
      )}

      {toDelete && (
        <div className="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="del-route-title">
          <div className="modal-card">
            <div className="modal-card-header">
              <h3 id="del-route-title">Delete “{toDelete.name}”?</h3>
              <button className="close-btn" onClick={() => setToDelete(null)} aria-label="Close"><i className="fas fa-xmark"></i></button>
            </div>
            <div className="modal-card-body">
              <p className="text-secondary">This route will be removed from your account. This cannot be undone.</p>
            </div>
            <div className="modal-card-footer">
              <button className="btn btn-ghost" onClick={() => setToDelete(null)}>Cancel</button>
              <button className="btn btn-danger" onClick={confirmDelete} disabled={deleting}>
                {deleting ? <span className="spinner" /> : 'Delete route'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
