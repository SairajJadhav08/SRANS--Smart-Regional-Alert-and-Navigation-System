import { Link } from 'react-router-dom'

export default function Footer() {
  return (
    <footer className="footer">
      <div className="container">
        <div className="columns">
          <div className="column is-4">
            <h3 className="title is-4">Smart Regional Alert &amp; Navigation</h3>
            <p className="subtitle is-6">Stay informed. Stay safe.</p>
            <p>Our mission is to provide timely and accurate information to help you navigate your region safely and efficiently.</p>
          </div>

          <div className="column is-3 is-offset-1">
            <h3 className="title is-5">Quick Links</h3>
            <ul>
              <li><Link to="/">Home</Link></li>
              <li><Link to="/features">Features</Link></li>
              <li><Link to="/alerts">Alerts</Link></li>
              <li><Link to="/map">Map</Link></li>
              <li><Link to="/about">About</Link></li>
              <li><Link to="/contact">Contact</Link></li>
            </ul>
          </div>

          <div className="column is-3 is-offset-1">
            <h3 className="title is-5">Contact Us</h3>
            <p><span className="icon"><i className="fas fa-envelope"></i></span> contact@example.com</p>
            <p><span className="icon"><i className="fas fa-phone"></i></span> +1-555-000-0000</p>
            <p><span className="icon"><i className="fas fa-map-marker-alt"></i></span> 123 Main Street, City, State 00000</p>

            <div className="social-icons mt-3">
              <a href="https://github.com" target="_blank" rel="noreferrer" className="mr-2">
                <span className="icon is-large"><i className="fab fa-github fa-lg"></i></span>
              </a>
              <a href="https://linkedin.com" target="_blank" rel="noreferrer" className="mr-2">
                <span className="icon is-large"><i className="fab fa-linkedin fa-lg"></i></span>
              </a>
              <a href="https://instagram.com" target="_blank" rel="noreferrer" className="mr-2">
                <span className="icon is-large"><i className="fab fa-instagram fa-lg"></i></span>
              </a>
              <a href="https://x.com" target="_blank" rel="noreferrer" className="mr-2">
                <span className="icon is-large"><i className="fab fa-x-twitter fa-lg"></i></span>
              </a>
            </div>
          </div>
        </div>

        <div className="has-text-centered mt-6">
          <p>&copy; {new Date().getFullYear()} Smart Regional Alert &amp; Navigation System. All rights reserved.</p>
        </div>
      </div>
    </footer>
  )
}
