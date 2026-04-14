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
        navigate('/admin')
      } else if (user.is_government) {
        navigate('/dashboard')
      } else {
        navigate('/')
      }
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Invalid username or password'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <section className="hero is-primary">
        <div className="hero-body">
          <div className="container has-text-centered">
            <h1 className="title is-1">Login</h1>
            <h2 className="subtitle is-4">Access your account</h2>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="columns is-centered">
            <div className="column is-5">
              <div className="card">
                <div className="card-content">
                  <h3 className="title is-4 has-text-centered mb-5">Welcome Back</h3>

                  {error && (
                    <div className="notification is-danger is-light mb-4">
                      <button className="delete" onClick={() => setError(null)}></button>
                      <span className="icon-text">
                        <span className="icon"><i className="fas fa-exclamation-circle"></i></span>
                        <span>{error}</span>
                      </span>
                    </div>
                  )}

                  <form onSubmit={handleSubmit}>
                    <div className="field">
                      <label className="label">Username</label>
                      <div className="control has-icons-left">
                        <input
                          className="input"
                          type="text"
                          placeholder="Enter your username"
                          value={username}
                          onChange={e => setUsername(e.target.value)}
                          required
                          autoFocus
                        />
                        <span className="icon is-small is-left">
                          <i className="fas fa-user"></i>
                        </span>
                      </div>
                    </div>

                    <div className="field">
                      <label className="label">Password</label>
                      <div className="control has-icons-left">
                        <input
                          className="input"
                          type="password"
                          placeholder="Enter your password"
                          value={password}
                          onChange={e => setPassword(e.target.value)}
                          required
                        />
                        <span className="icon is-small is-left">
                          <i className="fas fa-lock"></i>
                        </span>
                      </div>
                    </div>

                    <div className="field mt-4">
                      <div className="control">
                        <button
                          type="submit"
                          className={`button is-primary is-fullwidth${loading ? ' is-loading' : ''}`}
                          disabled={loading}
                        >
                          <span className="icon"><i className="fas fa-sign-in-alt"></i></span>
                          <span>Login</span>
                        </button>
                      </div>
                    </div>
                  </form>

                  <div className="has-text-centered mt-5">
                    <p>Don't have an account? <Link to="/register">Sign up now</Link></p>
                  </div>
                </div>
              </div>

              <div className="box mt-4">
                <p className="is-size-7 has-text-grey has-text-centered">
                  <strong>Government accounts</strong> require admin verification before accessing the dashboard.
                  <br />
                  <Link to="/contact">Contact us</Link> for more information.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="section has-background-light">
        <div className="container">
          <h3 className="title is-3 has-text-centered mb-6">Benefits of Creating an Account</h3>
          <div className="columns is-multiline">
            {[
              { icon: 'fa-bell', title: 'Personalized Alerts', text: 'Receive alerts based on your location and preferences.' },
              { icon: 'fa-route', title: 'Save Routes', text: 'Save frequent routes and get notified of disruptions.' },
              { icon: 'fa-history', title: 'Alert History', text: 'Access past notifications you may have missed.' },
            ].map(item => (
              <div className="column is-4" key={item.title}>
                <div className="box has-text-centered">
                  <span className="icon is-large mb-4">
                    <i className={`fas ${item.icon} fa-3x has-text-primary`}></i>
                  </span>
                  <h4 className="title is-4">{item.title}</h4>
                  <p>{item.text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  )
}
