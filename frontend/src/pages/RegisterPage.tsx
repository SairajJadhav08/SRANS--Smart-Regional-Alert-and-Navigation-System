import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { register as apiRegister } from '../api'

export default function RegisterPage() {
  const [userType, setUserType] = useState<'user' | 'government'>('user')
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [passwordError, setPasswordError] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Government fields
  const [agencyName, setAgencyName] = useState('')
  const [department, setDepartment] = useState('')
  const [officialEmail, setOfficialEmail] = useState('')

  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (password !== confirmPassword) {
      setPasswordError(true)
      return
    }
    setPasswordError(false)
    setError(null)
    setLoading(true)
    try {
      await apiRegister({
        username,
        email: userType === 'government' ? officialEmail || email : email,
        password,
        user_type: userType,
        ...(userType === 'government' && { agency_name: agencyName, department }),
      })
      navigate('/login')
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Registration failed. Please try again.'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-layout">
      {/* Brand Panel */}
      <div className="auth-panel-brand">
        <div className="auth-brand-content">
          <div className="auth-brand-logo">
            <i className="fas fa-location-arrow"></i> SRANS
          </div>
          <h2 className="auth-brand-title">Commute smarter, starting today.</h2>
          <p className="auth-brand-subtitle">
            Save your daily routes, get AI-powered disruption alerts, and receive safe route recommendations before you leave home.
          </p>
        </div>
        <div style={{ position: 'relative', zIndex: 2 }}>
          <div className="flex-col gap-4" style={{ opacity: 0.85 }}>
            <div className="flex gap-3 items-center">
              <i className="fas fa-check-circle" style={{ opacity: 0.7 }}></i>
              <span>AI-Powered Safe Route Recommendations</span>
            </div>
            <div className="flex gap-3 items-center">
              <i className="fas fa-check-circle" style={{ opacity: 0.7 }}></i>
              <span>Save Frequent Routes & Get Daily Alerts</span>
            </div>
            <div className="flex gap-3 items-center">
              <i className="fas fa-check-circle" style={{ opacity: 0.7 }}></i>
              <span>Government Dashboard Access</span>
            </div>
          </div>
        </div>
      </div>

      {/* Form Panel */}
      <div className="auth-panel-form" style={{ maxWidth: '700px', overflowY: 'auto' }}>
        <div className="auth-form-container" style={{ maxWidth: '500px' }}>
          <div className="auth-header">
            {/* Mobile-only logo */}
            <Link to="/" className="flex items-center gap-2 mb-6 hide-desktop" style={{ textDecoration: 'none' }}>
              <div className="navbar-logo-icon">
                <i className="fas fa-location-arrow"></i>
              </div>
              <span className="navbar-brand-text">SRANS</span>
            </Link>

            <h1>Create your account</h1>
            <p>Get started with SRANS today</p>
          </div>

          {error && (
            <div className="alert-banner is-danger mb-6">
              <i className="fas fa-exclamation-circle"></i>
              <span>{error}</span>
              <button className="btn-icon btn-sm btn-ghost ml-auto" onClick={() => setError(null)}>
                <i className="fas fa-times"></i>
              </button>
            </div>
          )}

          {/* Account Type Toggle */}
          <div className="tabs-list mb-6" style={{ background: 'var(--bg-subtle)', borderRadius: 'var(--radius-lg)', padding: 'var(--space-1)' }}>
            <button
              className={`tab-btn ${userType === 'user' ? 'active' : ''}`}
              onClick={() => setUserType('user')}
              type="button"
              style={{ flex: 1 }}
            >
              <i className="fas fa-user mr-2"></i> Citizen
            </button>
            <button
              className={`tab-btn ${userType === 'government' ? 'active' : ''}`}
              onClick={() => setUserType('government')}
              type="button"
              style={{ flex: 1 }}
            >
              <i className="fas fa-building mr-2"></i> Government
            </button>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="grid grid-2">
              <div className="field">
                <label className="label">Username</label>
                <div className="input-icon">
                  <i className="fas fa-user icon-left"></i>
                  <input
                    className="input"
                    type="text"
                    placeholder="Choose a username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                  />
                </div>
                <p className="help-text">At least 4 characters</p>
              </div>

              <div className="field">
                <label className="label">Email</label>
                <div className="input-icon">
                  <i className="fas fa-envelope icon-left"></i>
                  <input
                    className="input"
                    type="email"
                    placeholder="Your email address"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-2">
              <div className="field">
                <label className="label">Password</label>
                <div className="input-icon">
                  <i className="fas fa-lock icon-left"></i>
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
                </div>
                <p className="help-text">At least 8 characters</p>
              </div>

              <div className="field">
                <label className="label">Confirm Password</label>
                <div className="input-icon">
                  <i className="fas fa-lock icon-left"></i>
                  <input
                    className={`input ${passwordError ? 'is-error' : ''}`}
                    type="password"
                    placeholder="Confirm password"
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
                </div>
                {passwordError && <p className="help-text is-danger">Passwords do not match</p>}
              </div>
            </div>

            {/* Government Fields */}
            {userType === 'government' && (
              <>
                <hr className="separator" />
                <h4 className="font-semibold mb-4"><i className="fas fa-building text-primary mr-2"></i>Agency Information</h4>

                <div className="grid grid-2">
                  <div className="field">
                    <label className="label">Agency Name</label>
                    <div className="input-icon">
                      <i className="fas fa-building icon-left"></i>
                      <input
                        className="input"
                        type="text"
                        placeholder="Full agency name"
                        value={agencyName}
                        onChange={e => setAgencyName(e.target.value)}
                        required={userType === 'government'}
                      />
                    </div>
                  </div>

                  <div className="field">
                    <label className="label">Department</label>
                    <div className="input-icon">
                      <i className="fas fa-briefcase icon-left"></i>
                      <input
                        className="input"
                        type="text"
                        placeholder="Your department"
                        value={department}
                        onChange={e => setDepartment(e.target.value)}
                        required={userType === 'government'}
                      />
                    </div>
                  </div>
                </div>

                <div className="field">
                  <label className="label">Official Email</label>
                  <div className="input-icon">
                    <i className="fas fa-envelope icon-left"></i>
                    <input
                      className="input"
                      type="email"
                      placeholder="Your government email address"
                      value={officialEmail}
                      onChange={e => setOfficialEmail(e.target.value)}
                      required={userType === 'government'}
                    />
                  </div>
                  <p className="help-text">Must be a valid government email domain</p>
                </div>
              </>
            )}

            <div className="field mt-4">
              <label className="flex gap-2 items-center text-sm text-secondary cursor-pointer">
                <input type="checkbox" required style={{ accentColor: 'var(--color-primary)' }} />
                <span>I agree to the <a href="#">terms of service</a> and <a href="#">privacy policy</a></span>
              </label>
            </div>

            <button type="submit" className="btn btn-primary btn-full btn-lg mt-4" disabled={loading}>
              {loading ? <span className="spinner"></span> : (
                <>
                  <i className={userType === 'user' ? 'fas fa-user-plus' : 'fas fa-building'}></i>
                  {userType === 'user' ? ' Create Account' : ' Register Agency'}
                </>
              )}
            </button>
          </form>

          <p className="text-center mt-6 text-secondary text-sm">
            Already have an account? <Link to="/login" className="font-semibold" style={{ color: 'var(--color-primary)' }}>Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
