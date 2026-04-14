import React, { useState, useEffect, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'

declare const L: any

export default function NewAlertPage() {
  const [alertType, setAlertType] = useState('')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [lat, setLat] = useState('')
  const [lng, setLng] = useState('')

  const [publishModalActive, setPublishModalActive] = useState(false)
  const navigate = useNavigate()
  const mapRef = useRef<any>(null)
  const markerRef = useRef<any>(null)

  useEffect(() => {
    if (mapRef.current) return
    mapRef.current = L.map('newAlertMap').setView([18.5204, 73.8567], 13)
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo(mapRef.current)
    mapRef.current.on('click', (e: any) => {
      const { lat, lng } = e.latlng
      setLat(lat.toFixed(6))
      setLng(lng.toFixed(6))
      if (markerRef.current) markerRef.current.remove()
      markerRef.current = L.marker([lat, lng]).addTo(mapRef.current)
        .bindPopup('Alert location').openPopup()
    })
  }, [])

  const handlePublishClick = (e: React.FormEvent) => {
    e.preventDefault()
    // Perform basic validation
    if (!alertType || !title || !description || !lat || !lng) {
      alert("Please fill in all required fields.")
      return
    }
    setPublishModalActive(true)
  }

  const confirmPublish = () => {
    // Mock publish
    setPublishModalActive(false)
    navigate('/dashboard')
  }

  return (
    <>
      <section className="hero is-primary">
        <div className="hero-body">
          <div className="container">
            <div className="columns is-vcentered">
              <div className="column">
                <h1 className="title is-1">Create New Alert</h1>
                <h2 className="subtitle is-4">Notify citizens about important events in your region</h2>
              </div>
              <div className="column is-narrow">
                <Link to="/dashboard" className="button is-white is-outlined is-medium">
                  <span className="icon">
                    <i className="fas fa-arrow-left"></i>
                  </span>
                  <span>Back to Dashboard</span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="columns is-centered">
            <div className="column is-10">
              <div className="card">
                <div className="card-content">
                  <form onSubmit={handlePublishClick}>
                    <div className="field">
                      <label className="label">Alert Type</label>
                      <div className="control">
                        <div className="select is-fullwidth">
                          <select 
                            value={alertType} 
                            onChange={(e) => setAlertType(e.target.value)} 
                            required
                          >
                            <option value="" disabled>Select alert type</option>
                            <option value="Traffic">Traffic Alert</option>
                            <option value="Emergency">Emergency Alert</option>
                            <option value="Construction">Construction Alert</option>
                            <option value="Weather">Weather Alert</option>
                          </select>
                        </div>
                      </div>
                      <p className="help">The type of alert determines how it's displayed to users</p>
                    </div>

                    <div className="field">
                      <label className="label">Alert Title</label>
                      <div className="control">
                        <input 
                          className="input" 
                          type="text" 
                          placeholder="Enter a clear, concise title" 
                          value={title}
                          onChange={(e) => setTitle(e.target.value)}
                          required 
                        />
                      </div>
                      <p className="help">Keep titles brief but descriptive (e.g., "Highway 101 Closure")</p>
                    </div>

                    <div className="field">
                      <label className="label">Alert Description</label>
                      <div className="control">
                        <textarea 
                          className="textarea" 
                          placeholder="Provide detailed information about the alert" 
                          rows={5} 
                          value={description}
                          onChange={(e) => setDescription(e.target.value)}
                          required
                        ></textarea>
                      </div>
                      <p className="help">Include relevant details such as timing, impact, and recommended actions</p>
                    </div>

                    <div className="columns">
                      <div className="column">
                        <div className="field">
                          <label className="label">Location</label>
                          <div className="control">
                            <input className="input" type="text" placeholder="Search for a location" />
                          </div>
                        </div>
                      </div>
                      
                      <div className="column is-3">
                        <div className="field">
                          <label className="label">Latitude</label>
                          <div className="control">
                            <input 
                              className="input" 
                              type="number" 
                              step="0.000001" 
                              placeholder="Latitude" 
                              value={lat}
                              onChange={(e) => setLat(e.target.value)}
                              required 
                            />
                          </div>
                        </div>
                      </div>
                      
                      <div className="column is-3">
                        <div className="field">
                          <label className="label">Longitude</label>
                          <div className="control">
                            <input 
                              className="input" 
                              type="number" 
                              step="0.000001" 
                              placeholder="Longitude" 
                              value={lng}
                              onChange={(e) => setLng(e.target.value)}
                              required 
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="field">
                      <label className="label">Select Location on Map</label>
                      <div id="newAlertMap" style={{ height: '400px', width: '100%', borderRadius: '6px', marginBottom: '20px' }}></div>
                      <p className="help">Click on the map to set the alert location</p>
                    </div>

                    <hr />

                    <div className="columns">
                      <div className="column is-6">
                        <h4 className="title is-5">Alert Preview</h4>
                        <div className="box" id="alert-preview">
                          <article className="media">
                            <div className="media-left">
                              <span className="icon is-large">
                                <i className={`fas fa-2x ${
                                  alertType === 'Traffic' ? 'fa-car-crash has-text-danger' :
                                  alertType === 'Emergency' ? 'fa-exclamation-triangle has-text-warning' :
                                  alertType === 'Construction' ? 'fa-hard-hat has-text-warning' :
                                  alertType === 'Weather' ? 'fa-cloud-rain has-text-info' : 'fa-bell'
                                }`}></i>
                              </span>
                            </div>
                            <div className="media-content">
                              <div className="content">
                                <p>
                                  <strong>{title || 'Alert Title'}</strong>
                                  <br />
                                  <span className={`tag ${
                                    alertType === 'Traffic' ? 'is-danger' :
                                    alertType === 'Emergency' ? 'is-warning' :
                                    alertType === 'Construction' ? 'is-warning' : 'is-info'
                                  }`}>
                                    {alertType || 'Alert Type'}
                                  </span>
                                  <br />
                                  <span>{description || 'Alert description will appear here as you type...'}</span>
                                </p>
                              </div>
                            </div>
                          </article>
                        </div>
                      </div>
                      
                      <div className="column is-6">
                        <h4 className="title is-5">Alert Guidelines</h4>
                        <div className="content">
                          <ul>
                            <li><strong>Be clear and specific</strong> about the nature of the alert.</li>
                            <li><strong>Include timing information</strong> if applicable (start/end times).</li>
                            <li><strong>Provide alternative routes</strong> for traffic and construction alerts.</li>
                            <li><strong>Include safety instructions</strong> for emergency and weather alerts.</li>
                            <li><strong>Avoid all caps</strong> except for emphasis on critical words.</li>
                          </ul>
                        </div>
                      </div>
                    </div>

                    <div className="field is-grouped is-grouped-right mt-5">
                      <div className="control">
                        <Link to="/dashboard" className="button is-light">Cancel</Link>
                      </div>
                      <div className="control">
                        <button type="submit" className="button is-primary">
                          <span className="icon">
                            <i className="fas fa-paper-plane"></i>
                          </span>
                          <span>Publish Alert</span>
                        </button>
                      </div>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Publish Confirmation Modal */}
      <div className={`modal ${publishModalActive ? 'is-active' : ''}`}>
        <div className="modal-background" onClick={() => setPublishModalActive(false)}></div>
        <div className="modal-card">
          <header className="modal-card-head">
            <p className="modal-card-title">Confirm Alert Publication</p>
            <button className="delete" aria-label="close" onClick={() => setPublishModalActive(false)}></button>
          </header>
          <section className="modal-card-body">
            <p>Are you sure you want to publish this alert? It will be immediately visible to all users in the affected area.</p>
            <div className="notification is-info is-light mt-3">
              <p><strong>Note:</strong> Please verify all information is accurate before publishing. This alert may trigger emergency responses.</p>
            </div>
          </section>
          <footer className="modal-card-foot">
            <button type="button" className="button is-primary" onClick={confirmPublish}>Publish Alert</button>
            <button type="button" className="button" onClick={() => setPublishModalActive(false)}>Cancel</button>
          </footer>
        </div>
      </div>
    </>
  )
}
