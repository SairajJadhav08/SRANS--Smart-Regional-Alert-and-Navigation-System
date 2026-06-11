import React, { useState, useEffect, useRef } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { getAlert, updateAlert } from '../api'

declare const L: any

export default function EditAlertPage() {
  const { id } = useParams()
  const [alertType, setAlertType] = useState('')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [lat, setLat] = useState('')
  const [lng, setLng] = useState('')
  const [isUpdating, setIsUpdating] = useState(false)
  const [loading, setLoading] = useState(true)

  const [updateModalActive, setUpdateModalActive] = useState(false)
  const navigate = useNavigate()
  const mapRef = useRef<any>(null)
  const markerRef = useRef<any>(null)

  useEffect(() => {
    // Fetch existing alert
    if (id) {
      getAlert(Number(id))
        .then(res => {
          const data = res.data
          setAlertType(data.alert_type)
          setTitle(data.title)
          setDescription(data.description)
          setLat(data.location_lat.toString())
          setLng(data.location_lng.toString())

          if (mapRef.current) {
            mapRef.current.setView([data.location_lat, data.location_lng], 15)
            placeMarker(data.location_lat, data.location_lng)
          }
        })
        .catch(() => alert('Failed to load alert data'))
        .finally(() => setLoading(false))
    }
  }, [id])

  const placeMarker = (lt: number, lg: number) => {
    if (markerRef.current) markerRef.current.remove()
    const icon = L.divIcon({
      className: '',
      html: `<div style="width:24px;height:24px;background:var(--color-primary);border-radius:50%;border:3px solid white;box-shadow:0 2px 5px rgba(0,0,0,0.3)"></div>`,
      iconSize: [24, 24],
      iconAnchor: [12, 12]
    })
    markerRef.current = L.marker([lt, lg], { icon }).addTo(mapRef.current)
  }

  useEffect(() => {
    if (mapRef.current) return
    mapRef.current = L.map('editAlertMap').setView([18.5204, 73.8567], 13)
    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; OpenStreetMap contributors &copy; CARTO',
    }).addTo(mapRef.current)
    mapRef.current.on('click', (e: any) => {
      const { lat: newLat, lng: newLng } = e.latlng
      setLat(newLat.toFixed(6))
      setLng(newLng.toFixed(6))
      placeMarker(newLat, newLng)
    })
  }, [])

  const handleUpdateClick = (e: React.FormEvent) => {
    e.preventDefault()
    if (!alertType || !title || !description || !lat || !lng) {
      alert("Please fill in all required fields.")
      return
    }
    setUpdateModalActive(true)
  }

  const confirmUpdate = async () => {
    if (!id) return
    setIsUpdating(true)
    try {
      await updateAlert(Number(id), {
        title,
        description,
        alert_type: alertType,
        location_lat: parseFloat(lat),
        location_lng: parseFloat(lng)
      })
      navigate('/dashboard')
    } catch {
      alert('Failed to update alert')
    } finally {
      setIsUpdating(false)
      setUpdateModalActive(false)
    }
  }

  if (loading) return <div className="flex-center h-screen"><span className="spinner"></span></div>

  return (
    <>
      <div className="page-header bg-white">
        <div className="container flex-between flex-wrap gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2 text-sm text-muted">
              <Link to="/dashboard">Dashboard</Link>
              <i className="fas fa-chevron-right text-xs"></i>
              <span>Edit Alert</span>
            </div>
            <h1>Update Alert</h1>
          </div>
          <Link to="/dashboard" className="btn btn-secondary">
            Cancel
          </Link>
        </div>
      </div>

      <section className="section pt-0">
        <div className="container">
          <form onSubmit={handleUpdateClick}>
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
                          <option value="Traffic">Traffic Incident</option>
                          <option value="Emergency">Emergency Alert</option>
                          <option value="Construction">Construction/Roadwork</option>
                          <option value="Weather">Severe Weather</option>
                        </select>
                      </div>
                    </div>

                    <div className="field">
                      <label className="label">Title <span className="text-danger">*</span></label>
                      <input className="input" type="text" value={title} onChange={e => setTitle(e.target.value)} required />
                    </div>

                    <div className="field">
                      <label className="label">Description <span className="text-danger">*</span></label>
                      <textarea className="textarea" value={description} onChange={e => setDescription(e.target.value)} required></textarea>
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
                        <input className="input bg-subtle" type="text" readOnly value={lat} required />
                      </div>
                      <div className="field mb-0">
                        <label className="label text-xs">Longitude</label>
                        <input className="input bg-subtle" type="text" readOnly value={lng} required />
                      </div>
                    </div>
                    <p className="help-text mb-4"><i className="fas fa-info-circle"></i> Click anywhere on the map to update the pin location.</p>
                    <div className="map-container" style={{ height: '300px' }}>
                      <div id="editAlertMap" className="map-full"></div>
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
                          {alertType && <span className={`badge badge-${alertType === 'Traffic' ? 'danger' : alertType === 'Emergency' ? 'purple' : alertType === 'Construction' ? 'warning' : 'info'}`}>{alertType}</span>}
                        </div>
                        <div className="text-sm text-secondary line-clamp-3">{description || 'Alert description'}</div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="card border-primary">
                  <div className="card-body">
                    <button type="submit" className="btn btn-primary btn-full btn-lg">
                      <i className="fas fa-save"></i> Save Changes
                    </button>
                  </div>
                </div>
              </div>

            </div>
          </form>
        </div>
      </section>

      {/* Update Modal */}
      {updateModalActive && (
        <div className="modal-overlay">
          <div className="modal-card">
            <div className="modal-card-header">
              <h3>Confirm Changes</h3>
              <button className="close-btn" onClick={() => setUpdateModalActive(false)}><i className="fas fa-times"></i></button>
            </div>
            <div className="modal-card-body">
              <p>Are you sure you want to save these changes? The live map will update immediately.</p>
            </div>
            <div className="modal-card-footer">
              <button className="btn btn-ghost" onClick={() => setUpdateModalActive(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={confirmUpdate} disabled={isUpdating}>
                {isUpdating ? <span className="spinner"></span> : <i className="fas fa-save"></i>} Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
