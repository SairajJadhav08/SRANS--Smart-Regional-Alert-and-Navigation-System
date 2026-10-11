import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { login as apiLogin } from '../api'
import AuthLayout from '../components/layout/AuthLayout'
import { homePathFor } from '../components/layout/Layouts'
import Seo from '../components/Seo'

export default function LoginPage() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
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

      if (user.is_government && !user.is_verified && !user.is_superuser) {
        window.dispatchEvent(new CustomEvent('toast:show', {
          detail: { message: 'Your government account is pending verification. Commuter features are available meanwhile.', type: 'warning' },
        }))
      }
      navigate(homePathFor(user), { replace: true })
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Invalid username or password')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthLayout
      title="Welcome back"
      subtitle="Sign in to see today's disruptions and your AI commute briefing."
      panelTitle="Know what's on your road before you leave."
      panelPoints={[
        'AI briefing for your area every morning',
        'Risk score for each saved route',
        'Live alerts from verified agencies',
      ]}
      footer={<>New to SRANS? <Link to="/register">Create a free account</Link></>}
    >
      <Seo title="Sign in" description="Sign in to SRANS to view live regional alerts, AI commute briefings and route risk scores." path="/login" />

      {error && (
        <div className="alert-banner is-danger mb-6" role="alert">
          <i className="fas fa-circle-exclamation" aria-hidden="true"></i>
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} noValidate={false}>
        <div className="field">
          <label className="label" htmlFor="login-username">Username</label>
          <div className="input-icon">
            <i className="fas fa-user icon-left" aria-hidden="true"></i>
            <input
              id="login-username"
              className="input input-lg"
              type="text"
              autoComplete="username"
              placeholder="Your username"
              value={username}
              onChange={e => setUsername(e.target.value)}
              required
              autoFocus
            />
          </div>
        </div>

        <div className="field">
          <label className="label" htmlFor="login-password">Password</label>
          <div className="input-icon relative">
            <i className="fas fa-lock icon-left" aria-hidden="true"></i>
            <input
              id="login-password"
              className="input input-lg"
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              placeholder="Your password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              style={{ paddingRight: '3rem' }}
            />
            <button
              type="button"
              className="pw-toggle"
              onClick={() => setShowPassword(s => !s)}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              <i className={`fas ${showPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
            </button>
          </div>
        </div>

        <button type="submit" className="btn btn-primary btn-full btn-lg mt-6" disabled={loading}>
          {loading ? <span className="spinner" /> : <>Sign in <i className="fas fa-arrow-right" aria-hidden="true"></i></>}
        </button>
      </form>

      <div className="auth2-note mt-6">
        <i className="fas fa-shield-halved" aria-hidden="true"></i>
        <span>
          Government accounts are verified by an administrator before Command Center access is granted.{' '}
          <Link to="/contact">Contact us</Link> to speed up verification.
        </span>
      </div>
    </AuthLayout>
  )
}
