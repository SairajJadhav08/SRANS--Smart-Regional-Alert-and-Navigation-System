import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { login as apiLogin } from '../api'

export default function LoginPage() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { login } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const res = await apiLogin(username, password)
      const { token, user } = res.data
      login(token, user)

      if (user.is_superuser) {
        navigate('/superuser')
      } else if (user.is_government) {
        if (!user.is_verified) {
          window.dispatchEvent(new CustomEvent('toast:show', {
            detail: { message: 'Your government account is pending system verification.', type: 'warning' }
          }))
          navigate('/')
        } else {
          navigate('/dashboard')
        }
      } else {
        navigate('/map')
      }
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Invalid username or password'
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
          <h2 className="auth-brand-title">Commute smarter, every day.</h2>
          <p className="auth-brand-subtitle">
            AI-powered route optimization that helps you avoid road construction, infrastructure work, traffic diversions, and flooding — before you leave home.
          </p>
        </div>
        <div style={{ position: 'relative', zIndex: 2 }}>
          <div className="flex gap-8" style={{ opacity: 0.8 }}>
            <div>
              <p className="font-bold text-2xl">12K+</p>
              <p className="text-sm" style={{ opacity: 0.7 }}>Active Users</p>
            </div>
            <div>
              <p className="font-bold text-2xl">24/7</p>
              <p className="text-sm" style={{ opacity: 0.7 }}>Monitoring</p>
            </div>
            <div>
              <p className="font-bold text-2xl">99%</p>
              <p className="text-sm" style={{ opacity: 0.7 }}>Uptime</p>
            </div>
          </div>
        </div>
      </div>

      {/* Form Panel */}
      <div className="auth-panel-form">
        <div className="auth-form-container">
          <div className="auth-header">
            {/* Mobile-only logo */}
            <Link to="/" className="flex items-center gap-2 mb-6 hide-desktop" style={{ textDecoration: 'none' }}>
              <div className="navbar-logo-icon">
                <i className="fas fa-location-arrow"></i>
              </div>
              <span className="navbar-brand-text">SRANS</span>
            </Link>

            <h1>Welcome back</h1>
            <p>Sign in to your account to continue</p>
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

          <form onSubmit={handleSubmit}>
            <div className="field">
              <label className="label">Username</label>
              <div className="input-icon">
                <i className="fas fa-user icon-left"></i>
                <input
                  className="input"
                  type="text"
                  placeholder="Enter your username"
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  required
                  autoFocus
                />
              </div>
            </div>

            <div className="field">
              <label className="label">Password</label>
              <div className="input-icon">
                <i className="fas fa-lock icon-left"></i>
                <input
                  className="input"
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              className="btn btn-primary btn-full btn-lg mt-6"
              disabled={loading}
            >
              {loading ? <span className="spinner"></span> : <><i className="fas fa-sign-in-alt"></i> Sign In</>}
            </button>
          </form>

          <p className="text-center mt-6 text-secondary text-sm">
            Don't have an account? <Link to="/register" className="font-semibold" style={{ color: 'var(--color-primary)' }}>Create one</Link>
          </p>

          <div className="card mt-8" style={{ background: 'var(--bg-subtle)', border: '1px solid var(--border-light)' }}>
            <div className="card-body text-center" style={{ padding: 'var(--space-4)' }}>
              <p className="text-xs text-muted">
                <i className="fas fa-shield-alt mr-1"></i>
                <strong>Government accounts</strong> require admin verification before accessing the dashboard.
                <Link to="/contact" className="ml-1" style={{ color: 'var(--color-primary)' }}>Contact us</Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
