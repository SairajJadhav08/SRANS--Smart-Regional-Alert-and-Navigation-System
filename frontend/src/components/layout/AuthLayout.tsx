import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { BrandMark } from '../ui'
import '../../styles/auth.css'

interface AuthLayoutProps {
  title: string
  subtitle: ReactNode
  panelTitle: ReactNode
  panelPoints: string[]
  children: ReactNode
  footer?: ReactNode
  wide?: boolean
}

// Split-screen layout for login / register. Deliberately minimal — the brand
// panel carries a single message, not a copy of the landing page.
export default function AuthLayout({ title, subtitle, panelTitle, panelPoints, children, footer, wide }: AuthLayoutProps) {
  return (
    <div className="auth2">
      <aside className="auth2-panel" aria-hidden="true">
        {/* Optional photo from IMAGE_PROMPTS.md; the gradient panel stands on its own without it */}
        <img
          className="auth2-photo"
          src="/images/auth-panel.webp"
          alt=""
          onError={e => { e.currentTarget.style.display = 'none' }}
        />
        <div className="auth2-panel-inner">
          <Link to="/" className="auth2-logo" tabIndex={-1}>
            <span className="brand-mark auth2-logo-mark" />
            <span>
              <strong>SRANS</strong>
              <small>Smart Regional Alert &amp; Navigation System</small>
            </span>
          </Link>

          <div>
            <h2 className="auth2-panel-title">{panelTitle}</h2>
            <ul className="auth2-points">
              {panelPoints.map(p => (
                <li key={p}><i className="fas fa-circle-check"></i> {p}</li>
              ))}
            </ul>
          </div>

          <div className="auth2-sample">
            <div className="auth2-sample-head">
              <span className="ai-chip"><i className="fas fa-wand-magic-sparkles"></i> AI briefing</span>
              <span className="auth2-sample-time">Updated just now</span>
            </div>
            <p>
              Your usual route is clear except a utility dig near the main junction. Leave 10 minutes early or take
              the ring road.
            </p>
          </div>
        </div>
      </aside>

      <main className="auth2-main" id="main-content">
        <div className="auth2-topline">
          <Link to="/" className="auth2-mobile-brand">
            <BrandMark />
            <span>SRANS</span>
          </Link>
          <Link to="/" className="auth2-back">
            <i className="fas fa-arrow-left" aria-hidden="true"></i> Back to site
          </Link>
        </div>

        <div className={`auth2-form-wrap${wide ? ' wide' : ''}`}>
          <header className="auth2-header">
            <h1>{title}</h1>
            <p>{subtitle}</p>
          </header>
          {children}
          {footer && <div className="auth2-footer">{footer}</div>}
        </div>
      </main>
    </div>
  )
}
