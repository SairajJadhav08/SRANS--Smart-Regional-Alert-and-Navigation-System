import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

export default function Navbar() {
  const { isLoggedIn, isGovUser, isAnyGovUser, logout } = useAuth()
  const navigate = useNavigate()
  const [burgerOpen, setBurgerOpen] = useState(false)

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  return (
    <nav className="navbar is-white" role="navigation" aria-label="main navigation">
      <div className="container">
        <div className="navbar-brand">
          <Link className="navbar-item" to="/">
            <span className="icon mr-2">
              <i className="fas fa-map-marked-alt"></i>
            </span>
            <strong>Smart Regional Alert</strong>
          </Link>

          <a
            role="button"
            className={`navbar-burger${burgerOpen ? ' is-active' : ''}`}
            aria-label="menu"
            aria-expanded={burgerOpen}
            onClick={() => setBurgerOpen(!burgerOpen)}
          >
            <span aria-hidden="true"></span>
            <span aria-hidden="true"></span>
            <span aria-hidden="true"></span>
          </a>
        </div>

        <div className={`navbar-menu${burgerOpen ? ' is-active' : ''}`}>
          <div className="navbar-start">
            <Link className="navbar-item" to="/">Home</Link>
            <Link className="navbar-item" to="/features">Features</Link>
            <Link className="navbar-item" to="/alerts">Alerts</Link>
            <Link className="navbar-item" to="/map">Map</Link>
            <Link className="navbar-item" to="/about">About</Link>
            <Link className="navbar-item" to="/contact">Contact</Link>
          </div>

          <div className="navbar-end">
            <div className="navbar-item">
              <div className="buttons">
                {isLoggedIn ? (
                  <>
                    {isAnyGovUser && (
                      <Link className="button is-primary" to="/dashboard">
                        <span className="icon">
                          <i className="fas fa-tachometer-alt"></i>
                        </span>
                        <span>Dashboard</span>
                        {!isGovUser && (
                          <span className="tag is-warning is-light ml-2">Pending</span>
                        )}
                      </Link>
                    )}
                    <button className="button is-light" onClick={handleLogout}>
                      <span className="icon">
                        <i className="fas fa-sign-out-alt"></i>
                      </span>
                      <span>Logout</span>
                    </button>
                  </>
                ) : (
                  <>
                    <Link className="button is-primary" to="/register">
                      <span className="icon">
                        <i className="fas fa-user-plus"></i>
                      </span>
                      <span>Sign Up</span>
                    </Link>
                    <Link className="button is-light" to="/login">
                      <span className="icon">
                        <i className="fas fa-sign-in-alt"></i>
                      </span>
                      <span>Log in</span>
                    </Link>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </nav>
  )
}
