import { Link } from 'react-router-dom'
import { BrandMark } from '../ui'
import './Footer.css'

export default function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="footer-modern">
      <div className="container">
        <div className="footer-cta">
          <div>
            <h2>Know before you go.</h2>
            <p>Free AI commute briefings, route risk scores and live disruption alerts for your city.</p>
          </div>
          <div className="btn-group">
            <Link to="/register" className="btn btn-signal btn-lg">Create free account</Link>
            <Link to="/map" className="btn btn-outline-white btn-lg">Open live map</Link>
          </div>
        </div>

        <div className="footer-grid">
          <div className="footer-brand-col">
            <Link to="/" className="footer-logo">
              <BrandMark />
              <span>SRANS</span>
            </Link>
            <p className="footer-desc">
              Smart Regional Alert &amp; Navigation System. AI-powered alerts and safe-route guidance around road
              construction, utility work, diversions and flooding.
            </p>
            <div className="footer-social">
              <a href="https://x.com/BuildsbySairaj" target="_blank" rel="noreferrer" className="social-icon" aria-label="SRANS on X">
                <i className="fab fa-x-twitter"></i>
              </a>
              <a href="https://github.com/SairajJadhav08" target="_blank" rel="noreferrer" className="social-icon" aria-label="SRANS on GitHub">
                <i className="fab fa-github"></i>
              </a>
              <a href="https://www.linkedin.com/in/sairaj-jadhav-/" target="_blank" rel="noreferrer" className="social-icon" aria-label="SRANS on LinkedIn">
                <i className="fab fa-linkedin-in"></i>
              </a>
            </div>
          </div>

          <nav className="footer-links-col" aria-label="Product">
            <h3 className="footer-heading">Product</h3>
            <ul className="footer-links">
              <li><Link to="/map">Live Map</Link></li>
              <li><Link to="/alerts">Regional Alerts</Link></li>
              <li><Link to="/features">AI Features</Link></li>
              <li><Link to="/register">For Commuters</Link></li>
            </ul>
          </nav>

          <nav className="footer-links-col" aria-label="Company">
            <h3 className="footer-heading">Company</h3>
            <ul className="footer-links">
              <li><Link to="/about">About SRANS</Link></li>
              <li><Link to="/register">For Government Agencies</Link></li>
              <li><Link to="/contact">Contact &amp; Support</Link></li>
              <li><a href="https://sairajjadhav08.github.io/SRANS--Smart-Regional-Alert-and-Navigation-System/API_DOCUMENTATION/" target="_blank" rel="noreferrer">API Documentation</a></li>
            </ul>
          </nav>

          <div className="footer-links-col">
            <h3 className="footer-heading">Contact</h3>
            <ul className="footer-contact">
              <li>
                <i className="fas fa-envelope" aria-hidden="true"></i>
                <a href="mailto:sairajjadhav433@gmail.com">sairajjadhav433@gmail.com</a>
              </li>
              <li>
                <i className="fas fa-phone" aria-hidden="true"></i>
                <a href="tel:+919356860010">+91-9356860010</a>
              </li>
              <li>
                <i className="fas fa-location-dot" aria-hidden="true"></i>
                <span>Pune, Maharashtra, India</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="footer-bottom">
          <p>&copy; {currentYear} SRANS — Smart Regional Alert &amp; Navigation System.</p>
          <span className="footer-status"><span className="live-dot" aria-hidden="true"></span> Live monitoring active</span>
        </div>
      </div>
    </footer>
  )
}
