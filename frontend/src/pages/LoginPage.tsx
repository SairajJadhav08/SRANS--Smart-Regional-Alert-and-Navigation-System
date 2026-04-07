import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function LoginPage() {
  const [loginType, setLoginType] = useState<'user' | 'government'>('user')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const { login } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // Mock login logic
    const mockToken = 'mock-token-123'
    const mockUser = {
      id: 1,
      username,
      email: `${username}@example.com`,
      is_government: loginType === 'government',
      is_verified: true,
      created_at: new Date().toISOString(),
      agency_name: null,
      department: null
    }
    
    login(mockToken, mockUser)
    
    if (loginType === 'government') {
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
            <h1 className="title is-1">Login</h1>
            <h2 className="subtitle is-4">Access your account</h2>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="columns is-centered">
            <div className="column is-6">
              <div className="card">
                <div className="card-content">
                  <h3 className="title is-4 has-text-centered mb-5">Welcome Back</h3>

                  {/* Login Tabs */}
                  <div className="tabs is-centered is-boxed mb-5">
                    <ul>
                      <li className={loginType === 'user' ? 'is-active' : ''}>
                        <a onClick={() => setLoginType('user')}>
                          <span className="icon"><i className="fas fa-user"></i></span>
                          <span>User</span>
                        </a>
                      </li>
                      <li className={loginType === 'government' ? 'is-active' : ''}>
                        <a onClick={() => setLoginType('government')}>
                          <span className="icon"><i className="fas fa-building"></i></span>
                          <span>Government</span>
                        </a>
                      </li>
                    </ul>
                  </div>

                  <form onSubmit={handleSubmit}>
                    <div className="field">
                      <label className="label">Username</label>
                      <div className="control has-icons-left">
                        <input
                          className="input"
                          type="text"
                          placeholder="Enter your username"
                          value={username}
                          onChange={(e) => setUsername(e.target.value)}
                          required
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
                          onChange={(e) => setPassword(e.target.value)}
                          required
                        />
                        <span className="icon is-small is-left">
                          <i className="fas fa-lock"></i>
                        </span>
                      </div>
                    </div>

                    <div className="field">
                      <div className="control">
                        <label className="checkbox">
                          <input type="checkbox" name="remember_me" />
                          {' '}Remember me
                        </label>
                      </div>
                    </div>

                    <div className="field">
                      <div className="control">
                        <button type="submit" className="button is-primary is-fullwidth">
                          <span className="icon">
                            <i className={loginType === 'user' ? 'fas fa-sign-in-alt' : 'fas fa-building'}></i>
                          </span>
                          <span>{loginType === 'user' ? 'Login' : 'Government Login'}</span>
                        </button>
                      </div>
                    </div>
                  </form>

                  <div className="has-text-centered mt-5">
                    <p>Don't have an account? <Link to="/register">Sign up now</Link></p>
                    <p className="mt-2"><a href="#">Forgot your password?</a></p>
                  </div>
                </div>
              </div>

              {/* Login Info */}
              <div className="box mt-5">
                <h4 className="title is-5 has-text-centered mb-4">Login Options</h4>
                <div className="content has-text-centered">
                  <p><strong>User Login:</strong> Access alerts and navigation features.</p>
                  <p><strong>Government Login:</strong> Manage and create alerts for your region.</p>
                  <p className="is-size-7 mt-2">
                    Note: Government accounts require verification. <Link to="/contact">Contact us</Link> for more information.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="section has-background-light">
        <div className="container">
          <h3 className="title is-3 has-text-centered mb-6">Benefits of Creating an Account</h3>

          <div className="columns is-multiline">
            <div className="column is-4">
              <div className="box has-text-centered h-100">
                <span className="icon is-large mb-4">
                  <i className="fas fa-bell fa-3x has-text-primary"></i>
                </span>
                <h4 className="title is-4">Personalized Alerts</h4>
                <p>Receive alerts based on your location and preferences, ensuring you get information that matters to you.</p>
              </div>
            </div>

            <div className="column is-4">
              <div className="box has-text-centered h-100">
                <span className="icon is-large mb-4">
                  <i className="fas fa-route fa-3x has-text-primary"></i>
                </span>
                <h4 className="title is-4">Save Routes</h4>
                <p>Save your frequent routes and get notified of any disruptions that might affect your journey.</p>
              </div>
            </div>

            <div className="column is-4">
              <div className="box has-text-centered h-100">
                <span className="icon is-large mb-4">
                  <i className="fas fa-history fa-3x has-text-primary"></i>
                </span>
                <h4 className="title is-4">Alert History</h4>
                <p>Access your alert history and view past notifications that you may have missed.</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
