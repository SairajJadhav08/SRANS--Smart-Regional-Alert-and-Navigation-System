import { Link } from 'react-router-dom'

const footerStyle: React.CSSProperties = {
  background: 'linear-gradient(135deg, #1a2f52 0%, #2c4c7c 100%)',
  padding: '3rem 1.5rem',
  marginTop: 'auto',
  flexShrink: 0,
}

const headingStyle: React.CSSProperties = {
  color: 'white',
  fontWeight: 600,
  marginBottom: '0.75rem',
  fontSize: '0.85rem',
  textTransform: 'uppercase',
  letterSpacing: '0.6px',
}

const linkStyle: React.CSSProperties = { color: '#90cdf4', fontSize: '0.9rem', textDecoration: 'none' }
const mutedStyle: React.CSSProperties = { color: '#a0aec0', fontSize: '0.9rem' }

const SOCIAL = [
  { href: 'https://github.com/SairajJadhav08',          icon: 'fa-github' },
  { href: 'https://www.linkedin.com/in/sairaj-jadhav-/', icon: 'fa-linkedin-in' },
  { href: 'https://www.instagram.com/sairajjadhav08/',   icon: 'fa-instagram' },
  { href: 'https://x.com/BuildsbySairaj',                icon: 'fa-x-twitter' },
]

const NAV_LINKS  = [['/', 'Home'], ['/features', 'Features'], ['/alerts', 'Alerts'], ['/map', 'Map'], ['/about', 'About']]
const ACC_LINKS  = [['/login', 'Login'], ['/register', 'Sign Up'], ['/dashboard', 'Dashboard'], ['/my-routes', 'My Routes']]
const CONTACT    = [
  { icon: 'fa-envelope',       text: 'sairajjadhav433@gmail.com', href: 'mailto:sairajjadhav433@gmail.com' },
  { icon: 'fa-phone',          text: '+91-9356860010',            href: 'tel:+919356860010' },
  { icon: 'fa-map-marker-alt', text: 'Pune, Maharashtra, India',  href: undefined },
]

export default function Footer() {
  return (
    <footer style={footerStyle}>
      <div className="container">
        <div className="columns">

          {/* Brand */}
          <div className="column is-4">
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: '0.85rem' }}>
              <span style={{
                width: 36, height: 36, borderRadius: 8, flexShrink: 0,
                background: 'rgba(255,255,255,0.15)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white',
              }}>
                <i className="fas fa-map-marked-alt"></i>
              </span>
              <span style={{ fontWeight: 700, fontSize: '1.1rem', color: 'white' }}>SmartAlert</span>
            </div>
            <p style={{ ...mutedStyle, lineHeight: 1.75, marginBottom: '1rem' }}>
              Providing timely and accurate information to help communities navigate safely and stay informed.
            </p>
            <div style={{ display: 'flex', gap: 8 }}>
              {SOCIAL.map(s => (
                <a key={s.icon} href={s.href} target="_blank" rel="noreferrer"
                  style={{ width: 34, height: 34, borderRadius: 8, background: 'rgba(255,255,255,0.1)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#90cdf4',
                    transition: 'background 0.2s, color 0.2s', textDecoration: 'none' }}
                  onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.background = 'rgba(255,255,255,0.25)'; el.style.color = 'white' }}
                  onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.background = 'rgba(255,255,255,0.1)'; el.style.color = '#90cdf4' }}
                >
                  <i className={`fab ${s.icon}`}></i>
                </a>
              ))}
            </div>
          </div>

          {/* Navigation */}
          <div className="column is-2 is-offset-1">
            <p style={headingStyle}>Navigation</p>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
              {NAV_LINKS.map(([to, label]) => (
                <li key={to} style={{ marginBottom: '0.45rem' }}>
                  <Link to={to} style={linkStyle}
                    onMouseEnter={e => (e.currentTarget.style.color = 'white')}
                    onMouseLeave={e => (e.currentTarget.style.color = '#90cdf4')}
                  >{label}</Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Account */}
          <div className="column is-2">
            <p style={headingStyle}>Account</p>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
              {ACC_LINKS.map(([to, label]) => (
                <li key={to} style={{ marginBottom: '0.45rem' }}>
                  <Link to={to} style={linkStyle}
                    onMouseEnter={e => (e.currentTarget.style.color = 'white')}
                    onMouseLeave={e => (e.currentTarget.style.color = '#90cdf4')}
                  >{label}</Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div className="column is-3">
            <p style={headingStyle}>Contact</p>
            {CONTACT.map(item => (
              <div key={item.icon} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: '0.85rem' }}>
                <span style={{
                  width: 30, height: 30, borderRadius: 6, flexShrink: 0,
                  background: 'rgba(255,255,255,0.1)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: '#90cdf4', fontSize: '0.8rem',
                }}>
                  <i className={`fas ${item.icon}`}></i>
                </span>
                {item.href
                  ? <a href={item.href} style={linkStyle}>{item.text}</a>
                  : <span style={mutedStyle}>{item.text}</span>
                }
              </div>
            ))}
          </div>

        </div>

        {/* Bottom bar */}
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', marginTop: '2rem', paddingTop: '1.5rem', textAlign: 'center' }}>
          <p style={{ color: '#718096', fontSize: '0.85rem', margin: 0 }}>
            © {new Date().getFullYear()} Smart Regional Alert &amp; Navigation System. Built by{' '}
            <a href="https://github.com/SairajJadhav08" target="_blank" rel="noreferrer"
              style={{ color: '#90cdf4', textDecoration: 'none' }}>Sairaj Jadhav</a>.
          </p>
        </div>
      </div>
    </footer>
  )
}
