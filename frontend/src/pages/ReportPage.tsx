import { useState, useEffect, useRef } from 'react'
import type { FormEvent } from 'react'
import { submitReport, getReports, deleteReport, getAiDraftAlert } from '../api'
import type { Report, Severity } from '../types'
import { geocode } from '../lib/geocode'
import { createMap, isLeafletReady } from '../lib/mapConfig'
import { timeAgo, typeMeta } from '../lib/alertMeta'
import Seo from '../components/Seo'
import { AiShimmer, EmptyState, PageHead, TypeIcon } from '../components/ui'
import '../styles/pages/report.css'

declare const L: any

const REPORT_TYPES = ['Traffic', 'Emergency', 'Construction', 'Weather', 'Other']

const STATUS: Record<string, { label: string; cls: string }> = {
  pending: { label: 'In review', cls: 'badge-warning' },
  approved: { label: 'Published', cls: 'badge-success' },
  rejected: { label: 'Not published', cls: 'badge-danger' },
}

const SEVERITY_CLS: Record<Severity, string> = {
  low: 'badge-success', moderate: 'badge-warning', high: 'badge-signal', critical: 'badge-danger',
}

export default function ReportPage() {
  const [reports, setReports] = useState<Report[]>([])
  const [loadingReports, setLoadingReports] = useState(true)

  const [notes, setNotes] = useState('')
  const [drafting, setDrafting] = useState(false)
  const [severity, setSeverity] = useState<Severity | null>(null)

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [reportType, setReportType] = useState('Traffic')
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null)
  const [placeName, setPlaceName] = useState('')
  const [geocoding, setGeocoding] = useState(false)
  const [locating, setLocating] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const mapRef = useRef<any>(null)
  const markerRef = useRef<any>(null)
  const mapEl = useRef<HTMLDivElement>(null)

  useEffect(() => {
    getReports()
      .then(r => setReports(Array.isArray(r.data) ? (r.data as Report[]) : []))
      .catch(() => setReports([]))
      .finally(() => setLoadingReports(false))
  }, [])

  const placeMarker = (lat: number, lng: number, zoom?: number) => {
    setCoords({ lat, lng })
    if (!mapRef.current) return
    if (zoom) mapRef.current.setView([lat, lng], zoom)
    if (markerRef.current) markerRef.current.setLatLng([lat, lng])
    else markerRef.current = L.marker([lat, lng]).addTo(mapRef.current).bindPopup('Incident location')
  }

  useEffect(() => {
    if (mapRef.current || !mapEl.current || !isLeafletReady()) return
    mapRef.current = createMap(mapEl.current, { zoomControl: 'topleft' })
    mapRef.current.on('click', (e: any) => placeMarker(e.latlng.lat, e.latlng.lng))
    return () => {
      mapRef.current?.remove()
      mapRef.current = null
      markerRef.current = null
    }
  }, [])

  const handleGeocode = async () => {
    if (!placeName.trim()) return
    setGeocoding(true)
    setError(null)
    const result = await geocode(placeName)
    setGeocoding(false)
    if (!result) { setError(`Could not find "${placeName}". Try a nearby landmark or click the map.`); return }
    setPlaceName(result.displayName.split(',').slice(0, 2).join(', '))
    placeMarker(result.lat, result.lng, 16)
  }

  const useMyLocation = () => {
    if (!('geolocation' in navigator)) return
    setLocating(true)
    navigator.geolocation.getCurrentPosition(
      pos => { placeMarker(pos.coords.latitude, pos.coords.longitude, 16); setLocating(false) },
      () => { setError('Location permission denied. Search a place or click the map instead.'); setLocating(false) },
      { timeout: 8000 }
    )
  }

  const draftWithAi = async () => {
    if (!notes.trim()) return
    setDrafting(true)
    setError(null)
    try {
      const res = await getAiDraftAlert(notes, 'report')
      setTitle(res.data.title)
      setDescription(res.data.description)
      setReportType(REPORT_TYPES.includes(res.data.alert_type) ? res.data.alert_type : 'Other')
      setSeverity(res.data.severity)
    } catch (err: any) {
      setError(err?.response?.data?.message || 'AI could not draft your report. You can fill the form manually.')
    } finally {
      setDrafting(false)
    }
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!title.trim() || !description.trim()) { setError('Please add a title and description.'); return }
    if (!coords) { setError('Please set the incident location on the map.'); return }
    setSubmitting(true)
    setError(null)
    try {
      const res = await submitReport({
        title, description, report_type: reportType, location_lat: coords.lat, location_lng: coords.lng,
      })
      setReports(prev => [res.data as Report, ...prev])
      setTitle(''); setDescription(''); setNotes(''); setPlaceName(''); setReportType('Traffic')
      setSeverity(null); setCoords(null)
      markerRef.current?.remove()
      markerRef.current = null
      window.dispatchEvent(new CustomEvent('toast:show', {
        detail: { message: 'Report submitted. Officials will review it shortly.', type: 'success' },
      }))
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to submit report.')
    } finally {
      setSubmitting(false)
    }
  }

  const removeReport = async (id: number) => {
    try {
      await deleteReport(id)
      setReports(prev => prev.filter(x => x.id !== id))
    } catch {
      window.dispatchEvent(new CustomEvent('toast:show', { detail: { message: 'Could not withdraw report', type: 'danger' } }))
    }
  }

  return (
    <div className="app-page">
      <Seo title="Report an incident" noindex />
      <PageHead
        title="Report an incident"
        subtitle="Seen a blocked road, waterlogging or a hazard? Officials review every report before it goes public."
      />

      <div className="report-layout">
        <form className="panel" onSubmit={handleSubmit} aria-labelledby="new-report-title">
          <div className="panel-head">
            <h2 id="new-report-title" className="section-title"><i className="fas fa-flag" aria-hidden="true"></i> New report</h2>
          </div>
          <div className="panel-body flex-col gap-5">
            {/* AI assist */}
            <div className="report-ai">
              <label htmlFor="report-notes" className="report-ai-label">
                <i className="fas fa-wand-magic-sparkles" aria-hidden="true"></i> Describe it in your own words — AI fills the form
              </label>
              <textarea
                id="report-notes"
                className="textarea"
                rows={3}
                placeholder="e.g. huge water logging under the railway bridge near the station, bikes can't pass, started after the rain an hour ago"
                value={notes}
                onChange={e => setNotes(e.target.value)}
                maxLength={1200}
                style={{ minHeight: 88 }}
              />
              <div className="flex-between flex-wrap gap-3 mt-3">
                <span className="text-xs text-muted">Any language style works — short notes are fine.</span>
                <button type="button" className="btn btn-ai btn-sm" onClick={draftWithAi} disabled={drafting || !notes.trim()}>
                  {drafting ? <span className="spinner" /> : <><i className="fas fa-wand-magic-sparkles" aria-hidden="true"></i> Draft report</>}
                </button>
              </div>
              {drafting && <div className="mt-3"><AiShimmer lines={2} onLight /></div>}
            </div>

            {error && (
              <div className="alert-banner is-danger" role="alert">
                <i className="fas fa-circle-exclamation" aria-hidden="true"></i>
                <span>{error}</span>
              </div>
            )}

            <div className="field mb-0">
              <label className="label" htmlFor="report-title">Title</label>
              <input id="report-title" className="input" placeholder="e.g. Waterlogging under railway bridge, Station Road"
                value={title} onChange={e => setTitle(e.target.value)} maxLength={120} required />
            </div>

            <div className="field mb-0">
              <span className="label" id="report-type-label">Type</span>
              <div className="pill-filters" role="radiogroup" aria-labelledby="report-type-label">
                {REPORT_TYPES.map(t => (
                  <button
                    key={t}
                    type="button"
                    role="radio"
                    aria-checked={reportType === t}
                    className={`pill${reportType === t ? ' active' : ''}`}
                    onClick={() => setReportType(t)}
                  >
                    <i className={`fas ${typeMeta(t).icon}`} aria-hidden="true"></i> {t}
                  </button>
                ))}
              </div>
              {severity && (
                <p className="help-text mt-2">
                  AI-estimated severity: <span className={`badge ${SEVERITY_CLS[severity]}`}>{severity}</span>
                </p>
              )}
            </div>

            <div className="field mb-0">
              <label className="label" htmlFor="report-desc">Description</label>
              <textarea id="report-desc" className="textarea" rows={4}
                placeholder="What is happening, how bad is it, which direction or lanes are affected?"
                value={description} onChange={e => setDescription(e.target.value)} maxLength={500} required />
              <p className="help-text">{description.length}/500</p>
            </div>

            <div className="field mb-0">
              <span className="label">Location</span>
              <div className="report-loc-row">
                <div className="input-icon" style={{ flex: 1 }}>
                  <i className="fas fa-magnifying-glass icon-left" aria-hidden="true"></i>
                  <input
                    className="input"
                    placeholder="Search a place or landmark"
                    aria-label="Search a place or landmark"
                    value={placeName}
                    onChange={e => setPlaceName(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleGeocode() } }}
                  />
                </div>
                <button type="button" className="btn btn-secondary" onClick={handleGeocode} disabled={geocoding || !placeName.trim()}>
                  {geocoding ? <span className="spinner" /> : 'Find'}
                </button>
                <button type="button" className="btn btn-secondary" onClick={useMyLocation} disabled={locating} aria-label="Use my current location" title="Use my location">
                  {locating ? <span className="spinner" /> : <i className="fas fa-location-crosshairs"></i>}
                </button>
              </div>
              <div ref={mapEl} className="report-map" aria-label="Map — click to set the incident location" />
              <p className="help-text">
                {coords
                  ? <><i className="fas fa-circle-check text-primary" aria-hidden="true"></i> Pinned at <span className="mono">{coords.lat.toFixed(5)}, {coords.lng.toFixed(5)}</span> · click the map to adjust</>
                  : 'Search above, use your location, or click the map to pin the spot.'}
              </p>
            </div>

            <button type="submit" className="btn btn-primary btn-lg btn-full" disabled={submitting}>
              {submitting ? <span className="spinner" /> : <><i className="fas fa-paper-plane" aria-hidden="true"></i> Submit for review</>}
            </button>
          </div>
        </form>

        <section className="panel panel-flush" aria-labelledby="my-reports-title">
          <div className="panel-head">
            <h2 id="my-reports-title" className="section-title"><i className="fas fa-clock-rotate-left" aria-hidden="true"></i> My reports</h2>
            <span className="badge badge-neutral">{reports.length}</span>
          </div>
          <div className="panel-body">
            {loadingReports ? (
              <div className="flex-col gap-3" style={{ padding: 'var(--space-5)' }}>
                {[0, 1, 2].map(i => <div key={i} className="skeleton" style={{ height: 64 }} />)}
              </div>
            ) : reports.length === 0 ? (
              <EmptyState icon="fa-flag" title="No reports yet">Your submitted reports and their review status will appear here.</EmptyState>
            ) : (
              reports.map(r => {
                const st = STATUS[r.status] ?? STATUS.pending
                return (
                  <article key={r.id} className="report-item">
                    <div className="flex gap-3 items-start">
                      <TypeIcon type={r.report_type} size={30} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div className="flex-between gap-2">
                          <h3 className="list-row-title" style={{ whiteSpace: 'normal' }}>{r.title}</h3>
                          <span className={`badge ${st.cls}`}>{st.label}</span>
                        </div>
                        <p className="report-item-desc">{r.description}</p>
                        <div className="list-row-meta">{typeMeta(r.report_type).label} · {timeAgo(r.created_at)}</div>
                        {r.review_note && (
                          <p className="report-item-note"><i className="fas fa-comment-dots" aria-hidden="true"></i> Official note: {r.review_note}</p>
                        )}
                        {r.promoted_to && (
                          <p className="report-item-note is-success"><i className="fas fa-circle-check" aria-hidden="true"></i> Published as official alert #{r.promoted_to}</p>
                        )}
                      </div>
                      {r.status === 'pending' && (
                        <button type="button" className="btn btn-ghost btn-icon btn-sm text-danger" onClick={() => removeReport(r.id)}
                          aria-label={`Withdraw report ${r.title}`} title="Withdraw report">
                          <i className="fas fa-trash-can"></i>
                        </button>
                      )}
                    </div>
                  </article>
                )
              })
            )}
          </div>
        </section>
      </div>
    </div>
  )
}
