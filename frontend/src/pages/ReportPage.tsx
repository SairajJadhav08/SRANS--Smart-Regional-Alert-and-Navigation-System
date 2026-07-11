import { useState, useEffect, useRef } from 'react'
import { submitReport, getReports, deleteReport } from '../api'
import { geocode } from '../lib/geocode'

declare const L: any

const STATUS_BADGE: Record<string, string> = {
  pending: 'badge-warning', approved: 'badge-success', rejected: 'badge-danger'
}

export default function ReportPage() {
  const [reports, setReports] = useState<any[]>([])
  const [loadingReports, setLoadingReports] = useState(true)

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [reportType, setReportType] = useState('Traffic')
  const [locationStr, setLocationStr] = useState('')
  const [placeName, setPlaceName] = useState('')
  const [geocoding, setGeocoding] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const mapRef = useRef<any>(null)
  const markerRef = useRef<any>(null)

  useEffect(() => {
    getReports().then(r => setReports(Array.isArray(r.data) ? r.data : [])).catch(() => setReports([])).finally(() => setLoadingReports(false))
  }, [])

  useEffect(() => {
    if (mapRef.current) return
    setTimeout(() => {
      const el = document.getElementById('report-map')
      if (!el || mapRef.current) return
      mapRef.current = L.map('report-map', { zoomControl: true }).setView([18.5204, 73.8567], 13)
      L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
        attribution: '© OpenStreetMap contributors © CARTO', subdomains: 'abcd', maxZoom: 20
      }).addTo(mapRef.current)
      mapRef.current.on('click', (e: any) => {
        const { lat, lng } = e.latlng
        setLocationStr(`${lat.toFixed(5)}, ${lng.toFixed(5)}`)
        setPlaceName('')
        if (markerRef.current) markerRef.current.setLatLng([lat, lng])
        else markerRef.current = L.marker([lat, lng]).addTo(mapRef.current).bindPopup('Incident location')
      })
    }, 100)
  }, [])

  const handleGeocode = async () => {
    if (!placeName.trim()) return
    setGeocoding(true)
    const result = await geocode(placeName)
    setGeocoding(false)
    if (!result) { setError(`Could not find "${placeName}"`); return }
    const { lat, lng } = result
    setLocationStr(`${lat.toFixed(5)}, ${lng.toFixed(5)}`)
    setPlaceName(result.displayName.split(',').slice(0, 2).join(', '))
    if (mapRef.current) mapRef.current.setView([lat, lng], 15)
    if (markerRef.current) markerRef.current.setLatLng([lat, lng])
    else markerRef.current = L.marker([lat, lng]).addTo(mapRef.current).bindPopup('Incident location')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim() || !description.trim() || !locationStr) {
      setError('Please fill all fields and select a location on the map.'); return
    }
    const parts = locationStr.split(',').map(p => parseFloat(p.trim()))
    if (parts.length !== 2 || isNaN(parts[0]) || isNaN(parts[1])) {
      setError('Invalid location. Click the map to set a location.'); return
    }
    setSubmitting(true); setError(null)
    try {
      const res = await submitReport({ title, description, report_type: reportType, location_lat: parts[0], location_lng: parts[1] })
      setReports(prev => [res.data, ...prev])
      setTitle(''); setDescription(''); setLocationStr(''); setPlaceName('')
      setReportType('Traffic'); setSuccess(true)
      if (markerRef.current) { markerRef.current.remove(); markerRef.current = null }
      setTimeout(() => setSuccess(false), 4000)
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to submit report.')
    } finally { setSubmitting(false) }
  }

  return (
    <>
      <div className="page-header bg-white">
        <div className="container">
          <h1 className="font-display font-bold text-3xl mb-1">Report an Incident</h1>
          <p className="text-secondary">Help your community by reporting road hazards, flooding, or disruptions you see.</p>
        </div>
      </div>

      <section className="section pt-6">
        <div className="container" style={{ maxWidth: 960 }}>
          <div className="grid" style={{ gridTemplateColumns: '1fr 1fr', gap: 'var(--space-6)', alignItems: 'start' }}>

            {/* Submit form */}
            <div className="card">
              <div className="card-header">
                <span className="font-semibold"><i className="fas fa-flag text-warning mr-2"></i>New Report</span>
              </div>
              <div className="card-body">
                {success && (
                  <div className="alert-banner is-success mb-4">
                    <i className="fas fa-check-circle"></i>
                    <span>Report submitted! Government officials will review it shortly.</span>
                  </div>
                )}
                {error && (
                  <div className="alert-banner is-danger mb-4">
                    <i className="fas fa-exclamation-circle"></i>
                    <span>{error}</span>
                    <button className="btn-icon btn-sm btn-ghost ml-auto" onClick={() => setError(null)}><i className="fas fa-times"></i></button>
                  </div>
                )}

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
                  <div className="field">
                    <label className="label">Incident Title</label>
                    <input className="input" placeholder="e.g. Waterlogging on FC Road" value={title} onChange={e => setTitle(e.target.value)} maxLength={100} required />
                  </div>

                  <div className="field">
                    <label className="label">Type</label>
                    <select className="input" value={reportType} onChange={e => setReportType(e.target.value)}>
                      {['Traffic', 'Emergency', 'Construction', 'Weather', 'Other'].map(t => <option key={t}>{t}</option>)}
                    </select>
                  </div>

                  <div className="field">
                    <label className="label">Description</label>
                    <textarea className="input" rows={3} placeholder="Describe what you see — road condition, severity, etc." value={description} onChange={e => setDescription(e.target.value)} maxLength={500} required style={{ resize: 'vertical' }} />
                  </div>

                  <div className="field">
                    <label className="label">Location</label>
                    <div className="flex gap-2 mb-2">
                      <input className="input flex-1" placeholder="Search a place name..." value={placeName} onChange={e => setPlaceName(e.target.value)} onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), handleGeocode())} />
                      <button type="button" className="btn btn-primary btn-sm" onClick={handleGeocode} disabled={geocoding || !placeName.trim()}>
                        {geocoding ? <span className="spinner" style={{ width: 12, height: 12, borderWidth: 2 }}></span> : <i className="fas fa-search"></i>}
                      </button>
                    </div>
                    <div id="report-map" style={{ height: 200, borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', zIndex: 0 }}></div>
                    {locationStr && <p className="help-text mt-1" style={{ fontSize: 11 }}><i className="fas fa-check-circle text-primary mr-1"></i>Location set · click map to adjust</p>}
                    {!locationStr && <p className="help-text mt-1" style={{ fontSize: 11 }}>Search above or click the map to pin the incident location</p>}
                  </div>

                  <button type="submit" className="btn btn-primary btn-full" disabled={submitting}>
                    {submitting ? <><span className="spinner"></span> Submitting...</> : <><i className="fas fa-flag mr-2"></i>Submit Report</>}
                  </button>
                </form>
              </div>
            </div>

            {/* My reports */}
            <div className="card">
              <div className="card-header">
                <span className="font-semibold"><i className="fas fa-list text-primary mr-2"></i>My Reports</span>
                <span className="badge badge-primary">{reports.length}</span>
              </div>
              <div className="card-body" style={{ padding: 0 }}>
                {loadingReports ? (
                  <div className="flex-center py-8"><span className="spinner"></span></div>
                ) : reports.length === 0 ? (
                  <div className="flex-center flex-col py-10 text-center px-4">
                    <div className="icon-box bg-subtle text-muted mb-3"><i className="fas fa-flag"></i></div>
                    <p className="text-secondary text-sm">You haven't submitted any reports yet.</p>
                  </div>
                ) : reports.map((r, i) => (
                  <div key={r.id} style={{ padding: '12px 16px', borderBottom: i < reports.length - 1 ? '1px solid var(--border-color)' : 'none' }}>
                    <div className="flex-between mb-1">
                      <span className="font-semibold text-sm">{r.title}</span>
                      <span className={`badge ${STATUS_BADGE[r.status] || 'badge-warning'}`} style={{ fontSize: 10 }}>{r.status}</span>
                    </div>
                    <p className="text-secondary text-xs mb-1" style={{ lineHeight: 1.4 }}>{r.description}</p>
                    <div className="flex-between">
                      <span className="text-xs text-muted">{r.report_type} · {new Date(r.created_at).toLocaleDateString()}</span>
                      {r.status === 'pending' && (
                        <button className="btn btn-ghost btn-sm" style={{ fontSize: 11, padding: '2px 8px' }}
                          onClick={async () => { await deleteReport(r.id); setReports(prev => prev.filter(x => x.id !== r.id)) }}>
                          <i className="fas fa-trash text-danger"></i>
                        </button>
                      )}
                    </div>
                    {r.review_note && <p className="text-xs mt-1" style={{ color: 'var(--color-primary)' }}><i className="fas fa-comment-dots mr-1"></i>{r.review_note}</p>}
                    {r.promoted_to && <p className="text-xs mt-1 text-primary"><i className="fas fa-check-circle mr-1"></i>Promoted to official alert #{r.promoted_to}</p>}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
