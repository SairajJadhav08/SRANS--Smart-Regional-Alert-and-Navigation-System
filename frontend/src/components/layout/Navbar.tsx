import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

const NAV_LINKS = [
  { to: '/',        label: 'Home',     icon: 'fa-house' },
  { to: '/features',label: 'Features', icon: 'fa-star' },
  { to: '/alerts',  label: 'Alerts',   icon: 'fa-bell' },
  { to: '/map',     label: 'Map',      icon: 'fa-map' },
  { to: '/about',   label: 'About',    icon: 'fa-circle-info' },
  { to: '/contact', label: 'Contact',  icon: 'fa-envelope' },
]

export default function Navbar() {
  const { isLoggedIn, isGovUser, isAnyGovUser, isSuperuser, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [burgerOpen, setBurgerOpen] = useState(false)

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  const isActive = (path: string) =>
    path === '/' ? location.pathname === '/' : location.pathname.startsWith(path)

  return (
    <nav className="navbar" role="navigation" aria-label="main navigation">
      <div className="container">
        <div className="navbar-brand">
          <Link className="navbar-item" to="/" onClick={() => setBurgerOpen(false)}>
            <span className="nav-logo-icon mr-2">
              <i className="fas fa-map-marked-alt"></i>
            </span>
            <span>Smart<strong style={{ color: '#2c4c7c' }}>Alert</strong></span>
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
            {NAV_LINKS.map(link => (
              <Link
                key={link.to}
                className={`navbar-item${isActive(link.to) ? ' is-active-link' : ''}`}
                to={link.to}
                onClick={() => setBurgerOpen(false)}
              >
                <span className="icon is-small mr-1">
                  <i className={`fas ${link.icon}`}></i>
                </span>
                {link.label}
              </Link>
            ))}
          </div>

          <div className="navbar-end">
            <div className="navbar-item">
              <div className="buttons">
                {isLoggedIn ? (
                  <>
                    {isSuperuser && (
                      <Link className="button is-danger is-small" to="/admin" onClick={() => setBurgerOpen(false)}>
                        <span className="icon"><i className="fas fa-shield-halved"></i></span>
                        <span>Admin Panel</span>
                      </Link>
                    )}
                    {(isAnyGovUser || isSuperuser) && (
                      <Link className="button is-primary is-small" to="/dashboard" onClick={() => setBurgerOpen(false)}>
                        <span className="icon">
                          <i className="fas fa-tachometer-alt"></i>
                        </span>
                        <span>Dashboard</span>
                        {isAnyGovUser && !isGovUser && (
                          <span className="tag is-warning is-light ml-2">Pending</span>
                        )}
                      </Link>
                    )}
                    <button className="button is-light is-small" onClick={handleLogout}>
                      <span className="icon">
                        <i className="fas fa-sign-out-alt"></i>
                      </span>
                      <span>Logout</span>
                    </button>
                  </>
                ) : (
                  <>
                    <Link className="button is-primary is-small" to="/register" onClick={() => setBurgerOpen(false)}>
                      <span className="icon">
                        <i className="fas fa-user-plus"></i>
                      </span>
                      <span>Sign Up</span>
                    </Link>
                    <Link className="button is-light is-small" to="/login" onClick={() => setBurgerOpen(false)}>
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
