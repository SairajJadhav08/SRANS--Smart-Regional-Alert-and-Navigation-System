import React, { useState, useEffect, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { createAlert } from '../api'

declare const L: any

export default function NewAlertPage() {
  const [alertType, setAlertType] = useState('')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [lat, setLat] = useState('')
  const [lng, setLng] = useState('')
  const [isPublishing, setIsPublishing] = useState(false)

  const [publishModalActive, setPublishModalActive] = useState(false)
  const navigate = useNavigate()
  const mapRef = useRef<any>(null)
  const markerRef = useRef<any>(null)

  useEffect(() => {
    if (mapRef.current) return
    mapRef.current = L.map('newAlertMap').setView([18.5204, 73.8567], 13)
    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; OpenStreetMap contributors &copy; CARTO',
    }).addTo(mapRef.current)
    mapRef.current.on('click', (e: any) => {
      const { lat, lng } = e.latlng
      setLat(lat.toFixed(6))
      setLng(lng.toFixed(6))
      if (markerRef.current) markerRef.current.remove()

      const icon = L.divIcon({
        className: '',
        html: `<div style="width:24px;height:24px;background:var(--color-primary);border-radius:50%;border:3px solid white;box-shadow:0 2px 5px rgba(0,0,0,0.3)"></div>`,
        iconSize: [24, 24],
        iconAnchor: [12, 12]
      })

      markerRef.current = L.marker([lat, lng], { icon }).addTo(mapRef.current)
    })
  }, [])

  const handlePublishClick = (e: React.FormEvent) => {
    e.preventDefault()
    if (!alertType || !title || !description || !lat || !lng) {
      alert("Please fill in all required fields.")
      return
    }
    setPublishModalActive(true)
  }

  const confirmPublish = async () => {
    setIsPublishing(true)
    try {
      await createAlert({
        title,
        description,
        alert_type: alertType,
        location_lat: parseFloat(lat),
        location_lng: parseFloat(lng)
      })
      window.dispatchEvent(new Event('alert:created'))
      navigate('/dashboard')
    } catch {
      alert('Failed to publish alert')
    } finally {
      setIsPublishing(false)
      setPublishModalActive(false)
    }
  }

  return (
    <>
      <div className="page-header bg-white">
        <div className="container flex-between flex-wrap gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2 text-sm text-muted">
              <Link to="/dashboard">Dashboard</Link>
              <i className="fas fa-chevron-right text-xs"></i>
              <span>New Alert</span>
            </div>
            <h1>Create New Alert</h1>
          </div>
          <Link to="/dashboard" className="btn btn-secondary">
            Cancel
          </Link>
        </div>
      </div>

      <section className="section pt-0">
        <div className="container">
          <form onSubmit={handlePublishClick}>
            <div className="grid grid-2 gap-8" style={{ alignItems: 'start' }}>

              {/* Form Column */}
              <div className="flex-col gap-6">
                <div className="card">
                  <div className="card-header">
                    <h3>Alert Details</h3>
                  </div>
                  <div className="card-body">
                    <div className="field">
                      <label className="label">Alert Type <span className="text-danger">*</span></label>
                      <div className="select-wrapper">
                        <select className="input select-field" value={alertType} onChange={e => setAlertType(e.target.value)} required>
                          <option value="" disabled>Select categorization</option>
                          <option value="Traffic">Traffic Incident</option>
                          <option value="Emergency">Emergency Alert</option>
                          <option value="Construction">Construction/Roadwork</option>
                          <option value="Weather">Severe Weather</option>
                        </select>
                      </div>
                    </div>

                    <div className="field">
                      <label className="label">Title <span className="text-danger">*</span></label>
                      <input className="input" type="text" placeholder="e.g., Highway 101 Northbound Closed" value={title} onChange={e => setTitle(e.target.value)} required />
                    </div>

                    <div className="field">
                      <label className="label">Description <span className="text-danger">*</span></label>
                      <textarea className="textarea" placeholder="Provide detailed information, impact, and instructions..." value={description} onChange={e => setDescription(e.target.value)} required></textarea>
                    </div>
                  </div>
                </div>

                <div className="card">
                  <div className="card-header">
                    <h3>Location</h3>
                  </div>
                  <div className="card-body">
                    <div className="grid grid-2 mb-4">
                      <div className="field mb-0">
                        <label className="label text-xs">Latitude</label>
                        <input className="input bg-subtle" type="text" readOnly value={lat} placeholder="Click map" required />
                      </div>
                      <div className="field mb-0">
                        <label className="label text-xs">Longitude</label>
                        <input className="input bg-subtle" type="text" readOnly value={lng} placeholder="Click map" required />
                      </div>
                    </div>
                    <p className="help-text mb-4"><i className="fas fa-info-circle"></i> Click anywhere on the map to drop a pin.</p>
                    <div className="map-container" style={{ height: '300px' }}>
                      <div id="newAlertMap" className="map-full"></div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Preview Column */}
              <div className="flex-col gap-6" style={{ position: 'sticky', top: '88px' }}>
                <div className="card">
                  <div className="card-header bg-subtle">
                    <h3><i className="fas fa-eye text-muted mr-2"></i> Live Preview</h3>
                  </div>
                  <div className="card-body bg-subtle">
                    <div className="feed-card" style={{ background: 'white', pointerEvents: 'none' }}>
                      <div className="feed-icon" style={{
                        background: alertType === 'Traffic' ? 'var(--color-danger-light)' :
                          alertType === 'Emergency' ? 'var(--color-purple-light)' :
                            alertType === 'Construction' ? 'var(--color-warning-light)' :
                              alertType === 'Weather' ? 'var(--color-info-light)' : 'var(--bg-muted)',
                        color: alertType === 'Traffic' ? 'var(--color-danger)' :
                          alertType === 'Emergency' ? 'var(--color-purple)' :
                            alertType === 'Construction' ? 'var(--color-warning)' :
                              alertType === 'Weather' ? 'var(--color-info)' : 'var(--text-muted)'
                      }}>
                        <i className={`fas ${alertType === 'Traffic' ? 'fa-car-crash' : alertType === 'Emergency' ? 'fa-exclamation-triangle' : alertType === 'Construction' ? 'fa-hard-hat' : alertType === 'Weather' ? 'fa-cloud-rain' : 'fa-bell'}`}></i>
                      </div>
                      <div className="feed-content">
                        <div className="feed-title text-base mb-1">{title || 'Alert Title'}</div>
                        <div className="mb-2">
                          {alertType ? (
                            <span className={`badge badge-${alertType === 'Traffic' ? 'danger' : alertType === 'Emergency' ? 'purple' : alertType === 'Construction' ? 'warning' : 'info'}`}>{alertType}</span>
                          ) : (
                            <span className="badge badge-neutral">Type</span>
                          )}
                        </div>
                        <div className="text-sm text-secondary line-clamp-3">{description || 'Alert description will appear here as you type...'}</div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="card border-primary">
                  <div className="card-body">
                    <h4 className="font-semibold mb-3"><i className="fas fa-check-circle text-primary mr-2"></i> Publishing Checklist</h4>
                    <ul className="text-sm text-secondary flex-col gap-2">
                      <li className="flex gap-2"><i className="fas fa-check text-primary mt-1"></i> Title is clear and concise</li>
                      <li className="flex gap-2"><i className="fas fa-check text-primary mt-1"></i> Description includes impact and instructions</li>
                      <li className="flex gap-2"><i className="fas fa-check text-primary mt-1"></i> Location is accurately placed on map</li>
                    </ul>

                    <hr className="separator" />

                    <button type="submit" className="btn btn-primary btn-full btn-lg">
                      <i className="fas fa-paper-plane"></i> Publish Alert
                    </button>
                  </div>
                </div>
              </div>

            </div>
          </form>
        </div>
      </section>

      {/* Publish Modal */}
      {publishModalActive && (
        <div className="modal-overlay">
          <div className="modal-card">
            <div className="modal-card-header">
              <h3>Confirm Broadcast</h3>
              <button className="close-btn" onClick={() => setPublishModalActive(false)}><i className="fas fa-times"></i></button>
            </div>
            <div className="modal-card-body">
              <div className="alert-banner is-warning mb-4">
                <i className="fas fa-exclamation-triangle mt-1"></i>
                <div>
                  <strong>Public Broadcast</strong>
                  <p className="mt-1">This alert will be immediately visible to all citizens on the live map and feed.</p>
                </div>
              </div>
              <p>Are you sure you want to publish <strong>{title}</strong>?</p>
            </div>
            <div className="modal-card-footer">
              <button className="btn btn-ghost" onClick={() => setPublishModalActive(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={confirmPublish} disabled={isPublishing}>
                {isPublishing ? <span className="spinner"></span> : <i className="fas fa-broadcast-tower"></i>} Broadcast Now
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
