import { Link } from 'react-router-dom'
import './Footer.css'

export default function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="footer-modern">
      <div className="container">
        <div className="grid grid-4 footer-grid">
          
          {/* Brand Column */}
          <div className="footer-brand-col">
            <Link to="/" className="footer-logo">
              <div className="footer-logo-icon">
                <i className="fas fa-location-arrow"></i>
              </div>
              <span>SRANS</span>
            </Link>
            <p className="footer-desc">
              Smart Regional Alert & Navigation System. Empowering communities with real-time intelligence for safer, smarter travel.
            </p>
            <div className="footer-social">
              <a href="https://x.com/BuildsbySairaj" target="_blank" rel="noreferrer" className="social-icon" aria-label="Twitter">
                <i className="fab fa-x-twitter"></i>
              </a>
              <a href="https://github.com/SairajJadhav08" target="_blank" rel="noreferrer" className="social-icon" aria-label="GitHub">
                <i className="fab fa-github"></i>
              </a>
              <a href="https://www.linkedin.com/in/sairaj-jadhav-/" target="_blank" rel="noreferrer" className="social-icon" aria-label="LinkedIn">
                <i className="fab fa-linkedin-in"></i>
              </a>
            </div>
          </div>

          {/* Navigation */}
          <div className="footer-links-col">
            <h4 className="footer-heading">Platform</h4>
            <ul className="footer-links">
              <li><Link to="/map">Live Map</Link></li>
              <li><Link to="/alerts">Regional Alerts</Link></li>
              <li><Link to="/features">Features</Link></li>
              <li><Link to="/about">About Us</Link></li>
            </ul>
          </div>

          {/* Account & Resources */}
          <div className="footer-links-col">
            <h4 className="footer-heading">Resources</h4>
            <ul className="footer-links">
              <li><Link to="/contact">Help Center</Link></li>
              <li><Link to="/contact">Contact Support</Link></li>
              <li><a href="#">Privacy Policy</a></li>
              <li><a href="#">Terms of Service</a></li>
            </ul>
          </div>

          {/* Contact info */}
          <div className="footer-links-col">
            <h4 className="footer-heading">Contact</h4>
            <ul className="footer-contact">
              <li>
                <i className="fas fa-envelope"></i>
                <a href="mailto:sairajjadhav433@gmail.com">sairajjadhav433@gmail.com</a>
              </li>
              <li>
                <i className="fas fa-phone"></i>
                <span>+91-9356860010</span>
              </li>
              <li>
                <i className="fas fa-map-marker-alt"></i>
                <span>Pune, Maharashtra, India</span>
              </li>
            </ul>
          </div>

        </div>

        <div className="footer-bottom">
          <p>&copy; {currentYear} SRANS — Smart Regional Alert & Navigation System. All rights reserved.</p>
          <div className="footer-bottom-links">
            <span className="badge badge-neutral">System Status: All Systems Operational</span>
          </div>
        </div>
      </div>
    </footer>
  )
}
