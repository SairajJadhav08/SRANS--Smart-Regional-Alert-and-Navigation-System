import React, { useState, useEffect, useRef } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'

declare const L: any

export default function EditAlertPage() {
  const { id } = useParams()
  
  // Mock fetching alert
  const [alertType, setAlertType] = useState('Traffic')
  const [title, setTitle] = useState('Heavy Traffic on Main St')
  const [description, setDescription] = useState('Accident reported on Main St causing significant delays.')
  const [lat, setLat] = useState('37.7749')
  const [lng, setLng] = useState('-122.4194')

  const [updateModalActive, setUpdateModalActive] = useState(false)
  const navigate = useNavigate()
  const mapRef = useRef<any>(null)
  const markerRef = useRef<any>(null)

  useEffect(() => {
    if (mapRef.current) return
    const initLat = parseFloat(lat) || 18.5204
    const initLng = parseFloat(lng) || 73.8567
    mapRef.current = L.map('editAlertMap').setView([initLat, initLng], 13)
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo(mapRef.current)
    // Place existing marker
    markerRef.current = L.marker([initLat, initLng]).addTo(mapRef.current).bindPopup('Alert location').openPopup()
    mapRef.current.on('click', (e: any) => {
      const { lat: newLat, lng: newLng } = e.latlng
      setLat(newLat.toFixed(6))
      setLng(newLng.toFixed(6))
      if (markerRef.current) markerRef.current.remove()
      markerRef.current = L.marker([newLat, newLng]).addTo(mapRef.current)
        .bindPopup('Alert location').openPopup()
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

  const confirmUpdate = () => {
    // Mock update
    setUpdateModalActive(false)
    navigate('/dashboard')
  }

  return (
    <>
      <section className="hero is-primary">
        <div className="hero-body">
          <div className="container">
            <div className="columns is-vcentered">
              <div className="column">
                <h1 className="title is-1">Edit Alert</h1>
                <h2 className="subtitle is-4">Update alert information</h2>
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
                  <form onSubmit={handleUpdateClick}>
                    <div className="field">
                      <label className="label">Alert Type</label>
                      <div className="control">
                        <div className="select is-fullwidth">
                          <select 
                            value={alertType} 
                            onChange={(e) => setAlertType(e.target.value)} 
                            required
                          >
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
                          value={title}
                          onChange={(e) => setTitle(e.target.value)}
                          placeholder="Enter a clear, concise title" 
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
                              value={lat}
                              onChange={(e) => setLat(e.target.value)}
                              placeholder="Latitude" 
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
                              value={lng}
                              onChange={(e) => setLng(e.target.value)}
                              placeholder="Longitude" 
                              required 
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="field">
                      <label className="label">Select Location on Map</label>
                      <div id="editAlertMap" style={{ height: '400px', width: '100%', borderRadius: '6px', marginBottom: '20px' }}></div>
                      <p className="help">Click on the map to update the alert location</p>
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
                            <i className="fas fa-save"></i>
                          </span>
                          <span>Save Changes</span>
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

      {/* Update Confirmation Modal */}
      <div className={`modal ${updateModalActive ? 'is-active' : ''}`}>
        <div className="modal-background" onClick={() => setUpdateModalActive(false)}></div>
        <div className="modal-card">
          <header className="modal-card-head">
            <p className="modal-card-title">Confirm Changes</p>
            <button className="delete" aria-label="close" onClick={() => setUpdateModalActive(false)}></button>
          </header>
          <section className="modal-card-body">
            <p>Are you sure you want to update this alert? The changes will be immediately visible to all users.</p>
            <div className="notification is-info is-light mt-3">
              <p><strong>Note:</strong> Please verify all information is accurate before updating.</p>
            </div>
          </section>
          <footer className="modal-card-foot">
            <button type="button" className="button is-primary" onClick={confirmUpdate}>Save Changes</button>
            <button type="button" className="button" onClick={() => setUpdateModalActive(false)}>Cancel</button>
          </footer>
        </div>
      </div>
    </>
  )
}
