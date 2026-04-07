import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function RegisterPage() {
  const [userType, setUserType] = useState<'user' | 'government'>('user')
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [passwordError, setPasswordError] = useState(false)
  
  // Government fields
  const [agencyName, setAgencyName] = useState('')
  const [department, setDepartment] = useState('')
  const [officialEmail, setOfficialEmail] = useState('')

  const { login } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (password !== confirmPassword) {
      setPasswordError(true)
      return
    }
    setPasswordError(false)
    
    // Mock register logic
    const mockToken = 'mock-token-abc'
    const mockUser = {
      id: 2,
      username,
      email,
      is_government: userType === 'government',
      is_verified: userType !== 'government', // government is unverified by default perhaps
      created_at: new Date().toISOString(),
      agency_name: userType === 'government' ? agencyName : null,
      department: userType === 'government' ? department : null
    }
    
    login(mockToken, mockUser)
    
    if (userType === 'government') {
      // Mock navigation
      navigate('/dashboard')
    } else {
      navigate('/')
    }
  }

  return (
    <>
      <section className="hero is-primary">
        <div className="hero-body">
          <div className="container has-text-centered">
            <h1 className="title is-1">Register</h1>
            <h2 className="subtitle is-4">Create your account</h2>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="columns is-centered">
            <div className="column is-8">
              <div className="card">
                <div className="card-content">
                  <h3 className="title is-4 has-text-centered mb-5">Join Smart Regional Alert &amp; Navigation</h3>
                  
                  {/* Registration Tabs */}
                  <div className="tabs is-centered is-boxed mb-5">
                    <ul>
                      <li className={userType === 'user' ? 'is-active' : ''}>
                        <a onClick={() => setUserType('user')}>
                          <span className="icon"><i className="fas fa-user"></i></span>
                          <span>User Registration</span>
                        </a>
                      </li>
                      <li className={userType === 'government' ? 'is-active' : ''}>
                        <a onClick={() => setUserType('government')}>
                          <span className="icon"><i className="fas fa-building"></i></span>
                          <span>Government Registration</span>
                        </a>
                      </li>
                    </ul>
                  </div>
                  
                  <form onSubmit={handleSubmit}>
                    <div className="columns">
                      <div className="column">
                        <div className="field">
                          <label className="label">Username</label>
                          <div className="control has-icons-left">
                            <input 
                              className="input" 
                              type="text" 
                              placeholder="Choose a username" 
                              value={username}
                              onChange={(e) => setUsername(e.target.value)}
                              required 
                            />
                            <span className="icon is-small is-left">
                              <i className="fas fa-user"></i>
                            </span>
                          </div>
                          <p className="help">Username must be at least 4 characters</p>
                        </div>
                      </div>
                      
                      <div className="column">
                        <div className="field">
                          <label className="label">Email</label>
                          <div className="control has-icons-left">
                            <input 
                              className="input" 
                              type="email" 
                              placeholder="Your email address" 
                              value={email}
                              onChange={(e) => setEmail(e.target.value)}
                              required 
                            />
                            <span className="icon is-small is-left">
                              <i className="fas fa-envelope"></i>
                            </span>
                          </div>
                          <p className="help">We'll send a verification link to this address</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="columns">
                      <div className="column">
                        <div className="field">
                          <label className="label">Password</label>
                          <div className="control has-icons-left">
                            <input 
                              className="input" 
                              type="password" 
                              placeholder="Create a password" 
                              value={password}
                              onChange={(e) => {
                                setPassword(e.target.value)
                                if (confirmPassword && e.target.value !== confirmPassword) {
                                  setPasswordError(true)
                                } else {
                                  setPasswordError(false)
                                }
                              }}
                              required 
                            />
                            <span className="icon is-small is-left">
                              <i className="fas fa-lock"></i>
                            </span>
                          </div>
                          <p className="help">Password must be at least 8 characters</p>
                        </div>
                      </div>
                      
                      <div className="column">
                        <div className="field">
                          <label className="label">Confirm Password</label>
                          <div className="control has-icons-left">
                            <input 
                              className={`input ${passwordError ? 'is-danger' : ''}`} 
                              type="password" 
                              placeholder="Confirm your password"
                              value={confirmPassword}
                              onChange={(e) => {
                                setConfirmPassword(e.target.value)
                                if (password !== e.target.value) {
                                  setPasswordError(true)
                                } else {
                                  setPasswordError(false)
                                }
                              }}
                              required 
                            />
                            <span className="icon is-small is-left">
                              <i className="fas fa-lock"></i>
                            </span>
                          </div>
                          {passwordError && (
                            <p className="help is-danger">Passwords do not match</p>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    {/* Government Fields */}
                    {userType === 'government' && (
                      <div id="government-fields">
                        <hr />
                        <h4 className="title is-5 mb-3">Government Agency Information</h4>
                        
                        <div className="columns">
                          <div className="column">
                            <div className="field">
                              <label className="label">Agency Name</label>
                              <div className="control has-icons-left">
                                <input 
                                  className="input" 
                                  type="text" 
                                  placeholder="Full agency name"
                                  value={agencyName}
                                  onChange={e => setAgencyName(e.target.value)}
                                  required={userType === 'government'}
                                />
                                <span className="icon is-small is-left">
                                  <i className="fas fa-building"></i>
                                </span>
                              </div>
                            </div>
                          </div>
                          
                          <div className="column">
                            <div className="field">
                              <label className="label">Department</label>
                              <div className="control has-icons-left">
                                <input 
                                  className="input" 
                                  type="text" 
                                  placeholder="Your department"
                                  value={department}
                                  onChange={e => setDepartment(e.target.value)}
                                  required={userType === 'government'}
                                />
                                <span className="icon is-small is-left">
                                  <i className="fas fa-briefcase"></i>
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        <div className="field">
                          <label className="label">Official Email</label>
                          <div className="control has-icons-left">
                            <input 
                              className="input" 
                              type="email" 
                              placeholder="Your government email address"
                              value={officialEmail}
                              onChange={e => setOfficialEmail(e.target.value)}
                              required={userType === 'government'}
                            />
                            <span className="icon is-small is-left">
                              <i className="fas fa-envelope"></i>
                            </span>
                          </div>
                          <p className="help">Must be a valid government email domain</p>
                        </div>
                      </div>
                    )}
                    
                    <div className="field mt-5">
                      <div className="control">
                        <label className="checkbox">
                          <input type="checkbox" required />
                          {' '}I agree to the <a href="#">terms of service</a> and <a href="#">privacy policy</a>
                        </label>
                      </div>
                    </div>
                    
                    <div className="field">
                      <div className="control">
                        <button type="submit" className="button is-primary is-fullwidth">
                          <span className="icon">
                            <i className={userType === 'user' ? 'fas fa-user-plus' : 'fas fa-building'}></i>
                          </span>
                          <span>{userType === 'user' ? 'Register' : 'Register as Government Agency'}</span>
                        </button>
                      </div>
                    </div>
                  </form>
                  
                  <div className="has-text-centered mt-4">
                    <p>Already have an account? <Link to="/login">Login here</Link></p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="section has-background-light">
        <div className="container">
          <h3 className="title is-3 has-text-centered mb-6">Why Register?</h3>
          
          <div className="columns">
            <div className="column is-6">
              <h4 className="title is-4 has-text-centered mb-4">For Users</h4>
              <div className="box">
                <div className="content">
                  <ul>
                    <li><strong>Personalized Alerts:</strong> Receive alerts based on your location and preferences.</li>
                    <li><strong>Save Locations:</strong> Save your home, work, and other important locations.</li>
                    <li><strong>Custom Routes:</strong> Create and save your frequent travel routes.</li>
                    <li><strong>Alert History:</strong> View a history of past alerts in your area.</li>
                    <li><strong>Mobile Access:</strong> Access the system from any device, anywhere.</li>
                  </ul>
                </div>
              </div>
            </div>
            
            <div className="column is-6">
              <h4 className="title is-4 has-text-centered mb-4">For Government Agencies</h4>
              <div className="box">
                <div className="content">
                  <ul>
                    <li><strong>Alert Management:</strong> Create, edit, and manage alerts for your jurisdiction.</li>
                    <li><strong>Real-time Updates:</strong> Instantly notify citizens about important events.</li>
                    <li><strong>Analytics:</strong> Access data on alert engagement and effectiveness.</li>
                    <li><strong>Multi-user Access:</strong> Allow multiple staff members to manage the system.</li>
                    <li><strong>Integration:</strong> Connect with existing emergency management systems.</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
