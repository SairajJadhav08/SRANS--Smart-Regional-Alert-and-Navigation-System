import { useEffect, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { getAiDraftAlert } from '../api'
import type { AlertPayload } from '../api'
import type { AlertDraft } from '../types'
import { ALERT_TYPES, typeMeta } from '../lib/alertMeta'
import { geocode } from '../lib/geocode'
import { createMap, isLeafletReady } from '../lib/mapConfig'
import type { LatLng } from '../lib/mapConfig'
import { AiShimmer, TypeIcon } from './ui'
import '../styles/pages/alert-form.css'

declare const L: any

interface AlertFormProps {
  mode: 'create' | 'edit'
  initial?: AlertPayload
  onSubmit: (data: AlertPayload) => Promise<void>
}

const SEV_CLS: Record<string, string> = {
  low: 'badge-success', moderate: 'badge-warning', high: 'badge-signal', critical: 'badge-danger',
}

// Shared form for publishing and editing official alerts: AI drafter, map
// picker, live commuter preview and a confirm step.
export default function AlertForm({ mode, initial, onSubmit }: AlertFormProps) {
  const [notes, setNotes] = useState('')
  const [drafting, setDrafting] = useState(false)
  const [draft, setDraft] = useState<AlertDraft | null>(null)
  const [draftError, setDraftError] = useState<string | null>(null)

  const [alertType, setAlertType] = useState(initial?.alert_type ?? '')
  const [title, setTitle] = useState(initial?.title ?? '')
  const [description, setDescription] = useState(initial?.description ?? '')
  const [coords, setCoords] = useState<LatLng | null>(initial ? [initial.location_lat, initial.location_lng] : null)
  const [place, setPlace] = useState('')
  const [finding, setFinding] = useState(false)

  const [error, setError] = useState<string | null>(null)
  const [confirming, setConfirming] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const mapEl = useRef<HTMLDivElement>(null)
  const mapRef = useRef<any>(null)
  const markerRef = useRef<any>(null)

  const placeMarker = (at: LatLng, zoom?: number) => {
    setCoords(at)
    const map = mapRef.current
    if (!map) return
    if (zoom) map.setView(at, zoom)
    const icon = L.divIcon({
      className: '',
      html: '<div class="af-pin"><i class="fas fa-tower-broadcast"></i></div>',
      iconSize: [34, 34],
      iconAnchor: [17, 17],
    })
    if (markerRef.current) markerRef.current.setLatLng(at)
    else markerRef.current = L.marker(at, { icon, draggable: true }).addTo(map)
    markerRef.current.off('dragend').on('dragend', (e: any) => {
      const p = e.target.getLatLng()
      setCoords([p.lat, p.lng])
    })
  }

  useEffect(() => {
    if (mapRef.current || !mapEl.current || !isLeafletReady()) return
    const start = initial ? ([initial.location_lat, initial.location_lng] as LatLng) : undefined
    mapRef.current = createMap(mapEl.current, { center: start, zoom: start ? 15 : 13, zoomControl: 'topleft' })
    mapRef.current.on('click', (e: any) => placeMarker([e.latlng.lat, e.latlng.lng]))
    if (start) placeMarker(start)
    return () => {
      mapRef.current?.remove()
      mapRef.current = null
      markerRef.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const runDraft = async () => {
    if (!notes.trim()) return
    setDrafting(true)
    setDraftError(null)
    try {
      const res = await getAiDraftAlert(notes, 'alert')
      setDraft(res.data)
      setTitle(res.data.title)
      setDescription(res.data.description)
      setAlertType(res.data.alert_type)
    } catch (err: any) {
      setDraftError(err?.response?.data?.message || 'AI drafter is unavailable right now.')
    } finally {
      setDrafting(false)
    }
  }

  const findPlace = async () => {
    if (!place.trim()) return
    setFinding(true)
    setError(null)
    const r = await geocode(place)
    setFinding(false)
    if (!r) { setError(`Could not find "${place}". Try a landmark or click the map.`); return }
    placeMarker([r.lat, r.lng], 16)
  }

  const useMyLocation = () => {
    navigator.geolocation?.getCurrentPosition(
      pos => placeMarker([pos.coords.latitude, pos.coords.longitude], 16),
      () => setError('Location permission denied. Search a place or click the map.'),
      { timeout: 8000 }
    )
  }

  const review = (e: FormEvent) => {
    e.preventDefault()
    if (!alertType) { setError('Choose an alert type.'); return }
    if (!title.trim() || !description.trim()) { setError('Add a title and description.'); return }
    if (!coords) { setError('Set the location on the map.'); return }
    setError(null)
    setConfirming(true)
  }

  const submit = async () => {
    if (!coords) return
    setSubmitting(true)
    try {
      await onSubmit({
        title: title.trim(),
        description: description.trim(),
        alert_type: alertType,
        location_lat: coords[0],
        location_lng: coords[1],
      })
    } catch (err: any) {
      setError(err?.response?.data?.message || `Failed to ${mode === 'create' ? 'publish' : 'update'} alert.`)
      setConfirming(false)
    } finally {
      setSubmitting(false)
    }
  }

  const m = alertType ? typeMeta(alertType) : null

  return (
    <>
      <form className="af" onSubmit={review} noValidate>
        <div className="af-main">
          {/* AI drafter */}
          <section className="ai-card" aria-labelledby="drafter-title">
            <div className="flex-between flex-wrap gap-2 mb-3">
              <span className="ai-chip"><i className="fas fa-pen-nib" aria-hidden="true"></i> AI alert drafter</span>
              {draft && <span className="text-xs" style={{ color: '#9BBDB4' }}>Draft applied below — review before publishing</span>}
            </div>
            <h2 id="drafter-title" className="af-ai-title">Paste field notes, get a publish-ready alert</h2>
            <label htmlFor="af-notes" className="sr-only">Field notes</label>
            <textarea
              id="af-notes"
              className="af-ai-input"
              rows={3}
              placeholder="e.g. water main burst near city hall jn, left lane of MG road dug up till friday, divert via station rd, buses delayed"
              value={notes}
              onChange={e => setNotes(e.target.value)}
              maxLength={1200}
            />
            <div className="flex-between flex-wrap gap-3 mt-3">
              <span className="text-xs" style={{ color: '#9BBDB4' }}>AI fills the title, description and type. You stay in control.</span>
              <button type="button" className="btn btn-signal btn-sm" onClick={runDraft} disabled={drafting || !notes.trim()}>
                {drafting ? <span className="spinner" /> : <><i className="fas fa-wand-magic-sparkles" aria-hidden="true"></i> Draft alert</>}
              </button>
            </div>
            {drafting && <div className="mt-4"><AiShimmer lines={3} /></div>}
            {draftError && <p className="mt-3 text-sm" style={{ color: '#FCA5A5' }}>{draftError}</p>}
            {draft && !drafting && (
              <div className="af-ai-meta">
                <span>Severity <span className={`badge ${SEV_CLS[draft.severity]}`}>{draft.severity}</span></span>
                <span>Expected duration <strong>{draft.expected_duration}</strong></span>
                {draft.broadcast_recommended && (
                  <span className="af-ai-broadcast"><i className="fas fa-tower-broadcast" aria-hidden="true"></i> AI recommends an emergency broadcast</span>
                )}
              </div>
            )}
          </section>

          {error && (
            <div className="alert-banner is-danger" role="alert">
              <i className="fas fa-circle-exclamation" aria-hidden="true"></i><span>{error}</span>
            </div>
          )}

          {/* Details */}
          <section className="panel" aria-labelledby="details-title">
            <div className="panel-head">
              <h2 id="details-title" className="section-title"><i className="fas fa-file-lines" aria-hidden="true"></i> Alert details</h2>
            </div>
            <div className="panel-body flex-col gap-5">
              <div>
                <span className="label" id="af-type-label">Type</span>
                <div className="af-types" role="radiogroup" aria-labelledby="af-type-label">
                  {ALERT_TYPES.map(t => {
                    const tm = typeMeta(t)
                    return (
                      <button key={t} type="button" role="radio" aria-checked={alertType === t}
                        className={`af-type${alertType === t ? ' active' : ''}`} style={{ ['--hz' as string]: tm.color }}
                        onClick={() => setAlertType(t)}>
                        <TypeIcon type={t} size={30} /> {tm.label}
                      </button>
                    )
                  })}
                </div>
              </div>
              <div className="field mb-0">
                <label className="label" htmlFor="af-title">Title</label>
                <input id="af-title" className="input" placeholder="e.g. MG Road left lane closed near City Hall — water main repair"
                  value={title} onChange={e => setTitle(e.target.value)} maxLength={120} required />
                <p className="help-text">{title.length}/120 · Name the road or area and the issue.</p>
              </div>
              <div className="field mb-0">
                <label className="label" htmlFor="af-desc">Description</label>
                <textarea id="af-desc" className="textarea" rows={4}
                  placeholder="What happened, which lanes or directions are affected, the diversion to use, and how long it will last."
                  value={description} onChange={e => setDescription(e.target.value)} maxLength={500} required />
                <p className="help-text">{description.length}/500</p>
              </div>
            </div>
          </section>

          {/* Location */}
          <section className="panel" aria-labelledby="loc-title">
            <div className="panel-head">
              <h2 id="loc-title" className="section-title"><i className="fas fa-location-dot" aria-hidden="true"></i> Location</h2>
              {coords && <span className="mono text-xs text-muted">{coords[0].toFixed(5)}, {coords[1].toFixed(5)}</span>}
            </div>
            <div className="panel-body flex-col gap-3">
              <div className="af-loc-row">
                <div className="input-icon" style={{ flex: 1 }}>
                  <i className="fas fa-magnifying-glass icon-left" aria-hidden="true"></i>
                  <input className="input" placeholder="Search a road, junction or landmark" aria-label="Search location"
                    value={place} onChange={e => setPlace(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); findPlace() } }} />
                </div>
                <button type="button" className="btn btn-secondary" onClick={findPlace} disabled={finding || !place.trim()}>
                  {finding ? <span className="spinner" /> : 'Find'}
                </button>
                <button type="button" className="btn btn-secondary" onClick={useMyLocation} aria-label="Use my location" title="Use my location">
                  <i className="fas fa-location-crosshairs"></i>
                </button>
              </div>
              <div ref={mapEl} className="af-map" aria-label="Map — click to place the alert, drag the pin to adjust" />
              <p className="help-text">Click the map to place the alert; drag the pin to fine-tune.</p>
            </div>
          </section>
        </div>

        {/* Preview + publish */}
        <aside className="af-side">
          <section className="panel" aria-labelledby="preview-title">
            <div className="panel-head">
              <h2 id="preview-title" className="section-title"><i className="fas fa-eye" aria-hidden="true"></i> Commuter preview</h2>
            </div>
            <div className="panel-body">
              <article className="af-preview" style={{ ['--hz' as string]: m?.color ?? 'var(--border-color)' }}>
                <div className="flex gap-3 items-start">
                  {m ? <TypeIcon type={alertType} /> : <span className="type-icon t-other" aria-hidden="true"><i className="fas fa-bell"></i></span>}
                  <div style={{ minWidth: 0 }}>
                    <h3 className="af-preview-title">{title || 'Alert title'}</h3>
                    <div className="af-preview-meta">
                      {m ? <span className={`badge ${m.badge}`}>{m.label}</span> : <span className="badge badge-neutral">Type</span>}
                      <span>just now</span>
                    </div>
                  </div>
                </div>
                <p className="af-preview-desc">{description || 'The description commuters will read appears here.'}</p>
              </article>
              <ul className="af-checklist">
                <li className={alertType ? 'ok' : ''}><i className="fas fa-circle-check" aria-hidden="true"></i> Type selected</li>
                <li className={title.trim().length >= 10 ? 'ok' : ''}><i className="fas fa-circle-check" aria-hidden="true"></i> Specific title</li>
                <li className={description.trim().length >= 40 ? 'ok' : ''}><i className="fas fa-circle-check" aria-hidden="true"></i> Impact &amp; diversion described</li>
                <li className={coords ? 'ok' : ''}><i className="fas fa-circle-check" aria-hidden="true"></i> Location pinned</li>
              </ul>
            </div>
            <div className="af-actions">
              <Link to="/dashboard" className="btn btn-ghost">Cancel</Link>
              <button type="submit" className="btn btn-primary flex-1">
                <i className="fas fa-paper-plane" aria-hidden="true"></i> {mode === 'create' ? 'Review & publish' : 'Review & update'}
              </button>
            </div>
          </section>
        </aside>
      </form>

      {confirming && (
        <div className="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="af-confirm-title">
          <div className="modal-card">
            <div className="modal-card-header">
              <h3 id="af-confirm-title">{mode === 'create' ? 'Publish this alert?' : 'Update this alert?'}</h3>
              <button type="button" className="close-btn" onClick={() => setConfirming(false)} aria-label="Close"><i className="fas fa-xmark"></i></button>
            </div>
            <div className="modal-card-body">
              <div className="alert-banner is-warning mb-4">
                <i className="fas fa-triangle-exclamation" aria-hidden="true"></i>
                <span>It will be visible immediately on the public map, alert feed and commuters&apos; route risk scores.</span>
              </div>
              <p className="font-semibold">{title}</p>
              <p className="text-sm text-secondary mt-1">{description}</p>
            </div>
            <div className="modal-card-footer">
              <button type="button" className="btn btn-ghost" onClick={() => setConfirming(false)}>Back</button>
              <button type="button" className="btn btn-primary" onClick={submit} disabled={submitting}>
                {submitting ? <span className="spinner" /> : mode === 'create' ? 'Publish now' : 'Save changes'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
