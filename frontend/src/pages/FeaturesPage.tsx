import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function FeaturesPage() {
  const { isLoggedIn, isAnyGovUser } = useAuth()

  return (
    <>
      {/* Hero Section */}
      <section className="hero is-primary">
        <div className="hero-body">
          <div className="container has-text-centered">
            <h1 className="title is-1">Powerful Features</h1>
            <h2 className="subtitle is-4">Explore the capabilities of our Smart Regional Alert &amp; Navigation System</h2>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="section">
        <div className="container">
          {/* Feature Row 1 */}
          <div className="columns is-variable is-8 mb-6">
            <div className="column">
              <div className="card has-background-light h-100">
                <div className="card-content">
                  <div className="has-text-centered mb-5">
                    <span className="icon is-large">
                      <i className="fas fa-bell fa-3x has-text-danger"></i>
                    </span>
                  </div>
                  <p className="title is-4 has-text-centered">Real-Time Alerts</p>
                  <div className="content">
                    <p>Our system provides immediate notifications about critical events in your area:</p>
                    <ul>
                      <li>Traffic incidents and congestion</li>
                      <li>Emergency situations</li>
                      <li>Construction activities</li>
                      <li>Weather warnings</li>
                    </ul>
                    <p>Alerts are verified by government agencies to ensure accuracy and relevance.</p>
                  </div>
                </div>
                <footer className="card-footer">
                  <Link to="/alerts" className="card-footer-item button is-danger is-light">View Alerts</Link>
                </footer>
              </div>
            </div>
            
            <div className="column">
              <div className="card has-background-light h-100">
                <div className="card-content">
                  <div className="has-text-centered mb-5">
                    <span className="icon is-large">
                      <i className="fas fa-map-marked-alt fa-3x has-text-info"></i>
                    </span>
                  </div>
                  <p className="title is-4 has-text-centered">Interactive Mapping</p>
                  <div className="content">
                    <p>Navigate your region with our advanced mapping features:</p>
                    <ul>
                      <li>Real-time traffic overlay</li>
                      <li>Location-based alerts visualization</li>
                      <li>Current user location tracking (with permission)</li>
                      <li>Alternative route suggestions</li>
                    </ul>
                    <p>Our map integrates seamlessly with Google Maps to provide reliable navigation.</p>
                  </div>
                </div>
                <footer className="card-footer">
                  <Link to="/map" className="card-footer-item button is-info is-light">Open Map</Link>
                </footer>
              </div>
            </div>
          </div>
          
          {/* Feature Row 2 */}
          <div className="columns is-variable is-8 mb-6">
            <div className="column">
              <div className="card has-background-light h-100">
                <div className="card-content">
                  <div className="has-text-centered mb-5">
                    <span className="icon is-large">
                      <i className="fas fa-user-shield fa-3x has-text-success"></i>
                    </span>
                  </div>
                  <p className="title is-4 has-text-centered">User Management</p>
                  <div className="content">
                    <p>Our system offers comprehensive user management:</p>
                    <ul>
                      <li>Secure authentication system</li>
                      <li>Role-based access control</li>
                      <li>User profile customization</li>
                      <li>Alert preferences and subscriptions</li>
                    </ul>
                    <p>Government users have special privileges to create and manage alerts for the public.</p>
                  </div>
                </div>
                <footer className="card-footer">
                  <Link to="/register" className="card-footer-item button is-success is-light">Register Now</Link>
                </footer>
              </div>
            </div>
            
            <div className="column">
              <div className="card has-background-light h-100">
                <div className="card-content">
                  <div className="has-text-centered mb-5">
                    <span className="icon is-large">
                      <i className="fas fa-tachometer-alt fa-3x has-text-primary"></i>
                    </span>
                  </div>
                  <p className="title is-4 has-text-centered">Government Dashboard</p>
                  <div className="content">
                    <p>Government agencies access a powerful administrative dashboard:</p>
                    <ul>
                      <li>Alert creation and management</li>
                      <li>Analytics and reporting tools</li>
                      <li>Batch operations for managing multiple alerts</li>
                      <li>User activity monitoring</li>
                    </ul>
                    <p>The dashboard ensures efficient alert management during critical situations.</p>
                  </div>
                </div>
                <footer className="card-footer">
                  {isLoggedIn && isAnyGovUser ? (
                    <Link to="/dashboard" className="card-footer-item button is-primary is-light">Access Dashboard</Link>
                  ) : (
                    <Link to="/login" className="card-footer-item button is-primary is-light">Government Login</Link>
                  )}
                </footer>
              </div>
            </div>
          </div>
          
          {/* Feature Row 3 */}
          <div className="columns is-variable is-8">
            <div className="column">
              <div className="card has-background-light h-100">
                <div className="card-content">
                  <div className="has-text-centered mb-5">
                    <span className="icon is-large">
                      <i className="fas fa-mobile-alt fa-3x has-text-warning"></i>
                    </span>
                  </div>
                  <p className="title is-4 has-text-centered">Mobile Responsive</p>
                  <div className="content">
                    <p>Access our system from any device:</p>
                    <ul>
                      <li>Fully responsive design adapts to any screen size</li>
                      <li>Optimized for smartphones and tablets</li>
                      <li>Fast loading times on mobile networks</li>
                      <li>Touch-friendly interface</li>
                    </ul>
                    <p>Stay connected and informed whether you're at home or on the go.</p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="column">
              <div className="card has-background-light h-100">
                <div className="card-content">
                  <div className="has-text-centered mb-5">
                    <span className="icon is-large">
                      <i className="fas fa-shield-alt fa-3x has-text-link"></i>
                    </span>
                  </div>
                  <p className="title is-4 has-text-centered">Security &amp; Privacy</p>
                  <div className="content">
                    <p>We prioritize your data security:</p>
                    <ul>
                      <li>Secure password hashing</li>
                      <li>Optional location sharing</li>
                      <li>Data encryption</li>
                      <li>Regular security audits</li>
                    </ul>
                    <p>Your personal information is always protected with industry-standard security measures.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Technology Section */}
      <section className="section has-background-light">
        <div className="container">
          <h2 className="title is-2 has-text-centered mb-6">Powered By Modern Technology</h2>
          
          <div className="columns is-centered">
            <div className="column is-10">
              <div className="columns is-multiline">
                {/* React */}
                <div className="column is-3">
                  <div className="box has-text-centered">
                    <i className="fab fa-react fa-4x mb-4 has-text-info"></i>
                    <h4 className="title is-5 mt-4">React</h4>
                    <p className="subtitle is-6">Frontend Library</p>
                  </div>
                </div>
                
                {/* Node.js / API */}
                <div className="column is-3">
                  <div className="box has-text-centered">
                    <i className="fab fa-node-js fa-4x mb-4 has-text-success"></i>
                    <h4 className="title is-5 mt-4">Node / Python API</h4>
                    <p className="subtitle is-6">Backend API</p>
                  </div>
                </div>
                
                {/* Bulma */}
                <div className="column is-3">
                  <div className="box has-text-centered">
                    <img src="https://bulma.io/images/bulma-logo.png" alt="Bulma" style={{ height: '80px', objectFit: 'contain' }} />
                    <h4 className="title is-5 mt-4">Bulma</h4>
                    <p className="subtitle is-6">CSS Framework</p>
                  </div>
                </div>
                
                {/* Google Maps */}
                <div className="column is-3">
                  <div className="box has-text-centered">
                    <img src="https://www.gstatic.com/images/branding/product/2x/maps_96dp.png" alt="Google Maps" style={{ height: '80px', objectFit: 'contain' }} />
                    <h4 className="title is-5 mt-4">Google Maps</h4>
                    <p className="subtitle is-6">Map Integration</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="section">
        <div className="container has-text-centered">
          <h2 className="title is-2 mb-5">Ready to explore our features?</h2>
          <div className="buttons is-centered">
            <Link to="/alerts" className="button is-primary is-large">
              <span className="icon">
                <i className="fas fa-bell"></i>
              </span>
              <span>View Alerts</span>
            </Link>
            <Link to="/map" className="button is-info is-large">
              <span className="icon">
                <i className="fas fa-map-marked-alt"></i>
              </span>
              <span>Explore Map</span>
            </Link>
            <Link to="/register" className="button is-success is-large">
              <span className="icon">
                <i className="fas fa-user-plus"></i>
              </span>
              <span>Sign Up</span>
            </Link>
          </div>
        </div>
      </section>
    </>
  )
}
