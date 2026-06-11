import { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import './Navbar.css'

export default function Navbar() {
  const { isLoggedIn, user, isAnyGovUser, isSuperuser, logout } = useAuth()
  const location = useLocation()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  // Handle scroll for sticky glassmorphism effect
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const handleLogout = () => {
    logout()
  }

  const isActive = (path: string) => {
    return location.pathname === path ? 'active' : ''
  }

  return (
    <header className={`navbar-modern ${scrolled ? 'scrolled' : ''}`}>
      <div className="container navbar-container">
        <Link to="/" className="navbar-brand">
          <div className="navbar-logo-icon">
            <i className="fas fa-location-arrow"></i>
          </div>
          <span className="navbar-brand-text">SRANS</span>
        </Link>

        {/* Desktop Menu */}
        <nav className="navbar-menu hide-mobile">
          <Link to="/" className={`nav-link ${isActive('/')}`}>Home</Link>
          <Link to="/map" className={`nav-link ${isActive('/map')}`}>Live Map</Link>
          <Link to="/alerts" className={`nav-link ${isActive('/alerts')}`}>Alerts</Link>
          {!isLoggedIn && (
            <>
              <Link to="/features" className={`nav-link ${isActive('/features')}`}>Features</Link>
              <Link to="/about" className={`nav-link ${isActive('/about')}`}>About</Link>
              <Link to="/contact" className={`nav-link ${isActive('/contact')}`}>Contact</Link>
            </>
          )}

          {isLoggedIn && (
            <Link to="/my-routes" className={`nav-link ${isActive('/my-routes')}`}>My Routes</Link>
          )}
        </nav>

        {/* Desktop Auth */}
        <div className="navbar-auth hide-mobile">
          {isLoggedIn ? (
            <div className="navbar-user-dropdown">
              <button className="navbar-user-btn">
                <div className="avatar">
                  {user?.username?.charAt(0).toUpperCase()}
                </div>
                <span>{user?.username}</span>
                <i className="fas fa-chevron-down text-xs"></i>
              </button>
              <div className="dropdown-menu">
                <div className="dropdown-header">
                  <p className="font-semibold">{user?.username}</p>
                  <p className="text-muted text-xs">{user?.email}</p>
                  {isAnyGovUser && <span className="badge badge-primary mt-2">Gov Official</span>}
                </div>
                <div className="dropdown-divider"></div>
                {(isAnyGovUser || isSuperuser) && (
                  <Link to="/dashboard" className="dropdown-item">
                    <i className="fas fa-tachometer-alt"></i> Dashboard
                  </Link>
                )}
                {isSuperuser && (
                  <Link to="/superuser" className="dropdown-item">
                    <i className="fas fa-shield-alt"></i> Admin Panel
                  </Link>
                )}
                <button onClick={handleLogout} className="dropdown-item text-danger">
                  <i className="fas fa-sign-out-alt"></i> Log Out
                </button>
              </div>
            </div>
          ) : (
            <div className="auth-buttons">
              <Link to="/login" className="btn btn-ghost">Log In</Link>
              <Link to="/register" className="btn btn-primary">Sign Up</Link>
            </div>
          )}
        </div>

        {/* Mobile Toggle */}
        <button
          className={`mobile-toggle hide-desktop ${mobileMenuOpen ? 'is-active' : ''}`}
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label="Toggle menu"
        >
          <span></span>
          <span></span>
          <span></span>
        </button>
      </div>

      {/* Mobile Menu Drawer */}
      <div className={`mobile-drawer ${mobileMenuOpen ? 'is-open' : ''}`}>
        <div className="mobile-drawer-inner">
          <nav className="mobile-nav">
            <Link to="/" className={`mobile-nav-link ${isActive('/')}`} onClick={() => setMobileMenuOpen(false)}>Home</Link>
            <Link to="/map" className={`mobile-nav-link ${isActive('/map')}`} onClick={() => setMobileMenuOpen(false)}>Live Map</Link>
            <Link to="/alerts" className={`mobile-nav-link ${isActive('/alerts')}`} onClick={() => setMobileMenuOpen(false)}>Alerts</Link>
            {!isLoggedIn && (
              <>
                <Link to="/features" className={`mobile-nav-link ${isActive('/features')}`} onClick={() => setMobileMenuOpen(false)}>Features</Link>
                <Link to="/about" className={`mobile-nav-link ${isActive('/about')}`} onClick={() => setMobileMenuOpen(false)}>About</Link>
                <Link to="/contact" className={`mobile-nav-link ${isActive('/contact')}`} onClick={() => setMobileMenuOpen(false)}>Contact</Link>
              </>
            )}

            {isLoggedIn && (
              <Link to="/my-routes" className={`mobile-nav-link ${isActive('/my-routes')}`} onClick={() => setMobileMenuOpen(false)}>My Routes</Link>
            )}
          </nav>

          <div className="mobile-auth">
            {isLoggedIn ? (
              <>
                <div className="mobile-user-info">
                  <div className="avatar avatar-lg">
                    {user?.username?.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="font-semibold">{user?.username}</p>
                    <p className="text-muted text-sm">{user?.email}</p>
                  </div>
                </div>

                <div className="mobile-auth-links">
                  {(isAnyGovUser || isSuperuser) && (
                    <Link to="/dashboard" className="btn btn-secondary btn-full mb-3" onClick={() => setMobileMenuOpen(false)}>
                      <i className="fas fa-tachometer-alt"></i> Dashboard
                    </Link>
                  )}
                  {isSuperuser && (
                    <Link to="/superuser" className="btn btn-warning btn-full mb-3" onClick={() => setMobileMenuOpen(false)}>
                      <i className="fas fa-shield-alt"></i> Admin Panel
                    </Link>
                  )}
                  <button onClick={() => { handleLogout(); setMobileMenuOpen(false); }} className="btn btn-danger-light btn-full">
                    <i className="fas fa-sign-out-alt"></i> Log Out
                  </button>
                </div>
              </>
            ) : (
              <div className="mobile-auth-buttons">
                <Link to="/login" className="btn btn-secondary btn-full mb-3">Log In</Link>
                <Link to="/register" className="btn btn-primary btn-full">Sign Up</Link>
              </div>
            )}
          </div>
        </div>
      </div>
      {mobileMenuOpen && (
        <div className="mobile-drawer-overlay" onClick={() => setMobileMenuOpen(false)}></div>
      )}
    </header>
  )
}
