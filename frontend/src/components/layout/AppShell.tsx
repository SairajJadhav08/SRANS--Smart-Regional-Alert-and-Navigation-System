import { useState } from 'react'
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import BroadcastBanner from './BroadcastBanner'
import { BrandMark } from '../ui'

interface NavItem { to: string; label: string; icon: string; tag?: string; end?: boolean }

const COMMUTE_NAV: NavItem[] = [
  { to: '/overview', label: 'Today', icon: 'fa-house' },
  { to: '/map', label: 'Live Map', icon: 'fa-map-location-dot' },
  { to: '/alerts', label: 'Alerts', icon: 'fa-bell', end: true },
  { to: '/my-routes', label: 'My Routes', icon: 'fa-route' },
  { to: '/ai-assistant', label: 'AI Assistant', icon: 'fa-wand-magic-sparkles', tag: 'AI' },
  { to: '/report', label: 'Report Incident', icon: 'fa-flag' },
]

const AGENCY_NAV: NavItem[] = [
  { to: '/dashboard', label: 'Command Center', icon: 'fa-tower-broadcast' },
  { to: '/alerts/new', label: 'Publish Alert', icon: 'fa-circle-plus' },
  { to: '/reports/review', label: 'Report Review', icon: 'fa-clipboard-check' },
  { to: '/analytics', label: 'Analytics', icon: 'fa-chart-column' },
]

const ADMIN_NAV: NavItem[] = [
  { to: '/superuser', label: 'Admin Panel', icon: 'fa-shield-halved' },
]

// Topbar title for each route (longest prefix wins)
const TITLES: Array<[string, string, string]> = [
  ['/overview', 'Today', 'Commute'],
  ['/map', 'Live Map', 'Commute'],
  ['/alerts/new', 'Publish Alert', 'Agency'],
  ['/alerts/edit', 'Edit Alert', 'Agency'],
  ['/alerts', 'Regional Alerts', 'Commute'],
  ['/my-routes', 'My Routes', 'Commute'],
  ['/ai-assistant', 'AI Assistant', 'Commute'],
  ['/report', 'Report Incident', 'Commute'],
  ['/dashboard', 'Command Center', 'Agency'],
  ['/reports/review', 'Report Review', 'Agency'],
  ['/analytics', 'Analytics', 'Agency'],
  ['/superuser', 'Admin Panel', 'Admin'],
]

function titleFor(path: string) {
  const match = TITLES.filter(([p]) => path.startsWith(p)).sort((a, b) => b[0].length - a[0].length)[0]
  return match ? { title: match[1], crumb: match[2] } : { title: 'SRANS', crumb: '' }
}

export default function AppShell() {
  const { user, isGovUser, isAnyGovUser, isSuperuser, logout } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const [notifState, setNotifState] = useState<NotificationPermission | 'unsupported'>(
    'Notification' in window ? Notification.permission : 'unsupported'
  )

  // Close the mobile sidebar whenever the route changes
  const [lastPath, setLastPath] = useState(location.pathname)
  if (lastPath !== location.pathname) {
    setLastPath(location.pathname)
    setOpen(false)
  }

  const { title, crumb } = titleFor(location.pathname)
  const role = isSuperuser ? 'Administrator' : isGovUser ? (user?.agency_name || 'Government official') : isAnyGovUser ? 'Verification pending' : 'Commuter'

  const enableNotifications = async () => {
    if (!('Notification' in window)) return
    const p = await Notification.requestPermission()
    setNotifState(p)
    window.dispatchEvent(new CustomEvent('toast:show', {
      detail: p === 'granted'
        ? { message: 'Alert notifications enabled', type: 'success' }
        : { message: 'Notifications are blocked in your browser settings', type: 'warning' },
    }))
  }

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  const renderLinks = (items: NavItem[]) =>
    items.map(item => (
      <NavLink
        key={item.to}
        to={item.to}
        end={item.end}
        className={({ isActive }) => `sidebar-link${isActive ? ' active' : ''}`}
      >
        <i className={`fas ${item.icon}`} aria-hidden="true"></i>
        <span>{item.label}</span>
        {item.tag && <span className="sidebar-tag">{item.tag}</span>}
      </NavLink>
    ))

  return (
    <div className="app-shell">
      <aside className={`app-sidebar${open ? ' is-open' : ''}`} aria-label="Main navigation">
        <Link to="/overview" className="app-sidebar-brand">
          <BrandMark />
          <span>
            <span className="brand-name">SRANS</span>
            <span className="brand-sub">Alert &amp; Navigation</span>
          </span>
        </Link>

        <nav className="app-sidebar-nav">
          <div className="sidebar-section-label">Commute</div>
          {renderLinks(COMMUTE_NAV)}

          {(isGovUser || isSuperuser) && (
            <>
              <div className="sidebar-section-label">Agency</div>
              {renderLinks(AGENCY_NAV)}
            </>
          )}

          {isSuperuser && (
            <>
              <div className="sidebar-section-label">Administration</div>
              {renderLinks(ADMIN_NAV)}
            </>
          )}
        </nav>

        <div className="app-sidebar-footer">
          <div className="sidebar-user">
            <div className="sidebar-user-avatar" aria-hidden="true">
              {user?.username?.charAt(0).toUpperCase()}
            </div>
            <div style={{ minWidth: 0 }}>
              <div className="sidebar-user-name">{user?.username}</div>
              <div className="sidebar-user-role">{role}</div>
            </div>
            <button className="sidebar-logout" onClick={handleLogout} aria-label="Log out" title="Log out">
              <i className="fas fa-arrow-right-from-bracket"></i>
            </button>
          </div>
        </div>
      </aside>

      <div className={`app-sidebar-overlay${open ? ' is-open' : ''}`} onClick={() => setOpen(false)} />

      <div className="app-main">
        <header className="app-topbar">
          <button
            className="topbar-icon-btn app-menu-btn"
            onClick={() => setOpen(o => !o)}
            aria-label="Open navigation"
            aria-expanded={open}
          >
            <i className="fas fa-bars"></i>
          </button>

          <div style={{ minWidth: 0 }}>
            {crumb && <div className="app-topbar-crumb">{crumb}</div>}
            <div className="app-topbar-title">{title}</div>
          </div>

          <div className="app-topbar-actions">
            {notifState !== 'unsupported' && (
              <button
                className="topbar-icon-btn"
                onClick={enableNotifications}
                aria-label={notifState === 'granted' ? 'Alert notifications are on' : 'Enable alert notifications'}
                title={notifState === 'granted' ? 'Alert notifications are on' : 'Enable alert notifications'}
              >
                <i className={`fas ${notifState === 'granted' ? 'fa-bell' : 'fa-bell-slash'}`}></i>
                {notifState !== 'granted' && <span className="topbar-dot" />}
              </button>
            )}
            <Link to="/report" className="btn btn-secondary topbar-hide-sm">
              <i className="fas fa-flag"></i> Report
            </Link>
            <Link to="/ai-assistant" className="btn btn-signal">
              <i className="fas fa-wand-magic-sparkles"></i>
              <span className="topbar-hide-sm">Ask SRANS AI</span>
            </Link>
          </div>
        </header>

        <BroadcastBanner />

        <main className="app-content" id="main-content">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
