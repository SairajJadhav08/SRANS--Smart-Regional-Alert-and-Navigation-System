import { useState, useEffect } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { BrandMark } from '../ui'
import './Navbar.css'

const LINKS = [
  { to: '/features', label: 'Features' },
  { to: '/map', label: 'Live Map' },
  { to: '/alerts', label: 'Alerts' },
  { to: '/about', label: 'About' },
  { to: '/contact', label: 'Contact' },
]

// Marketing navbar for public pages. Signed-in users get a single
// "Open app" entry point instead of a copy of the app navigation.
export default function Navbar() {
  const { isLoggedIn, user } = useAuth()
  const location = useLocation()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 12)
    handleScroll()
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Close the drawer whenever the route changes
  const [lastPath, setLastPath] = useState(location.pathname)
  if (lastPath !== location.pathname) {
    setLastPath(location.pathname)
    setMobileMenuOpen(false)
  }

  const onDarkHero = location.pathname === '/' && !scrolled && !mobileMenuOpen

  return (
    <header className={`navbar-modern${scrolled ? ' scrolled' : ''}${onDarkHero ? ' on-dark' : ''}`}>
      <div className="container navbar-container">
        <Link to="/" className="navbar-brand" aria-label="SRANS home">
          <BrandMark />
          <span className="navbar-brand-text">SRANS</span>
        </Link>

        <nav className="navbar-menu hide-mobile" aria-label="Primary">
          {LINKS.map(l => (
            <NavLink key={l.to} to={l.to} className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>
              {l.label}
            </NavLink>
          ))}
        </nav>

        <div className="navbar-auth hide-mobile">
          {isLoggedIn ? (
            <Link to="/overview" className="btn btn-primary">
              <span className="nav-avatar" aria-hidden="true">{user?.username?.charAt(0).toUpperCase()}</span>
              Open app <i className="fas fa-arrow-right"></i>
            </Link>
          ) : (
            <div className="auth-buttons">
              <Link to="/login" className="btn btn-ghost nav-login">Log in</Link>
              <Link to="/register" className="btn btn-primary">Get started free</Link>
            </div>
          )}
        </div>

        <button
          className={`mobile-toggle hide-desktop ${mobileMenuOpen ? 'is-active' : ''}`}
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label="Toggle menu"
          aria-expanded={mobileMenuOpen}
        >
          <span></span>
          <span></span>
          <span></span>
        </button>
      </div>

      <div className={`mobile-drawer ${mobileMenuOpen ? 'is-open' : ''}`}>
        <div className="mobile-drawer-inner">
          <nav className="mobile-nav" aria-label="Mobile">
            <NavLink to="/" end className={({ isActive }) => `mobile-nav-link${isActive ? ' active' : ''}`}>Home</NavLink>
            {LINKS.map(l => (
              <NavLink key={l.to} to={l.to} className={({ isActive }) => `mobile-nav-link${isActive ? ' active' : ''}`}>
                {l.label}
              </NavLink>
            ))}
          </nav>

          <div className="mobile-auth">
            {isLoggedIn ? (
              <Link to="/overview" className="btn btn-primary btn-full">
                Open app <i className="fas fa-arrow-right"></i>
              </Link>
            ) : (
              <div className="mobile-auth-buttons">
                <Link to="/login" className="btn btn-secondary btn-full mb-3">Log in</Link>
                <Link to="/register" className="btn btn-primary btn-full">Get started free</Link>
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
