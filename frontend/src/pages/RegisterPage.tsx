import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { register as apiRegister } from '../api'
import AuthLayout from '../components/layout/AuthLayout'
import Seo from '../components/Seo'

type AccountType = 'user' | 'government'

export default function RegisterPage() {
  const [userType, setUserType] = useState<AccountType>('user')
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [agencyName, setAgencyName] = useState('')
  const [department, setDepartment] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const navigate = useNavigate()

  const passwordMismatch = confirmPassword.length > 0 && password !== confirmPassword
  const isGov = userType === 'government'

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (password !== confirmPassword) return
    setError(null)
    setLoading(true)
    try {
      await apiRegister({
        username,
        email,
        password,
        user_type: userType,
        ...(isGov && { agency_name: agencyName, department }),
      })
      window.dispatchEvent(new CustomEvent('toast:show', {
        detail: {
          message: isGov
            ? 'Agency account created. You can sign in now; Command Center unlocks after verification.'
            : 'Account created. Sign in to get your first AI briefing.',
          type: 'success',
        },
      }))
      navigate('/login')
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Registration failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthLayout
      wide
      title={isGov ? 'Register your agency' : 'Create your free account'}
      subtitle={isGov
        ? 'Publish official alerts, triage citizen reports with AI and brief your control room.'
        : 'Save your routes and get AI briefings and risk scores before every commute.'}
      panelTitle={isGov ? 'A command center for your city’s roads.' : 'Commute smarter, starting today.'}
      panelPoints={isGov
        ? ['AI drafts clear public alerts from field notes', 'AI triage for every citizen report', 'Live situation reports and analytics']
        : ['Free forever for commuters', 'AI risk score for every saved route', 'In-journey AI co-pilot on the live map']}
      footer={<>Already have an account? <Link to="/login">Sign in</Link></>}
    >
      <Seo
        title="Create an account"
        description="Create a free SRANS account to save routes, get AI commute briefings and route risk scores, or register your government agency."
        path="/register"
      />

      <div className="segmented" role="group" aria-label="Account type">
        <button type="button" aria-pressed={!isGov} onClick={() => setUserType('user')}>
          <i className="fas fa-user" aria-hidden="true"></i> Commuter
        </button>
        <button type="button" aria-pressed={isGov} onClick={() => setUserType('government')}>
          <i className="fas fa-building-columns" aria-hidden="true"></i> Government agency
        </button>
      </div>

      {error && (
        <div className="alert-banner is-danger mb-6" role="alert">
          <i className="fas fa-circle-exclamation" aria-hidden="true"></i>
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="grid grid-2" style={{ gap: 'var(--space-4)' }}>
          <div className="field mb-0">
            <label className="label" htmlFor="reg-username">Username</label>
            <input
              id="reg-username"
              className="input input-lg"
              type="text"
              autoComplete="username"
              placeholder="e.g. priya_commutes"
              value={username}
              onChange={e => setUsername(e.target.value)}
              minLength={4}
              required
            />
            <p className="help-text">At least 4 characters</p>
          </div>
          <div className="field mb-0">
            <label className="label" htmlFor="reg-email">{isGov ? 'Official email' : 'Email'}</label>
            <input
              id="reg-email"
              className="input input-lg"
              type="email"
              autoComplete="email"
              placeholder={isGov ? 'name@department.gov.in' : 'you@example.com'}
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
            />
            {isGov && <p className="help-text">Use your department email to speed up verification</p>}
          </div>
        </div>

        {isGov && (
          <div className="grid grid-2 mt-4" style={{ gap: 'var(--space-4)' }}>
            <div className="field mb-0">
              <label className="label" htmlFor="reg-agency">Agency name</label>
              <input
                id="reg-agency"
                className="input input-lg"
                type="text"
                placeholder="e.g. Pune Municipal Corporation"
                value={agencyName}
                onChange={e => setAgencyName(e.target.value)}
                required
              />
            </div>
            <div className="field mb-0">
              <label className="label" htmlFor="reg-dept">Department</label>
              <input
                id="reg-dept"
                className="input input-lg"
                type="text"
                placeholder="e.g. Traffic Planning"
                value={department}
                onChange={e => setDepartment(e.target.value)}
                required
              />
            </div>
          </div>
        )}

        <div className="grid grid-2 mt-4" style={{ gap: 'var(--space-4)' }}>
          <div className="field mb-0">
            <label className="label" htmlFor="reg-password">Password</label>
            <div className="relative">
              <input
                id="reg-password"
                className="input input-lg"
                type={showPassword ? 'text' : 'password'}
                autoComplete="new-password"
                placeholder="At least 8 characters"
                value={password}
                onChange={e => setPassword(e.target.value)}
                minLength={8}
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
          <div className="field mb-0">
            <label className="label" htmlFor="reg-confirm">Confirm password</label>
            <input
              id="reg-confirm"
              className={`input input-lg${passwordMismatch ? ' is-error' : ''}`}
              type={showPassword ? 'text' : 'password'}
              autoComplete="new-password"
              placeholder="Repeat password"
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              aria-invalid={passwordMismatch}
              aria-describedby={passwordMismatch ? 'reg-confirm-err' : undefined}
              required
            />
            {passwordMismatch && <p id="reg-confirm-err" className="help-text is-danger">Passwords do not match</p>}
          </div>
        </div>

        <button type="submit" className="btn btn-primary btn-full btn-lg mt-8" disabled={loading || passwordMismatch}>
          {loading ? <span className="spinner" /> : isGov ? 'Register agency' : 'Create account'}
        </button>

        <p className="help-text text-center mt-4">
          By creating an account you agree to use SRANS responsibly and report incidents truthfully.
        </p>
      </form>
    </AuthLayout>
  )
}
