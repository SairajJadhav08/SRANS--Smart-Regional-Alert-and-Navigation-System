import { Link } from 'react-router-dom'

export default function HomePage() {
  return (
    <>
      {/* Hero Section */}
      <section className="hero is-primary is-bold is-medium">
        <div className="hero-body">
          <div className="container has-text-centered">
            <h1 className="title is-1 mb-6">
              Welcome to Smart Regional Alert &amp; Navigation System
            </h1>
            <h2 className="subtitle is-4 mb-6">
              Stay informed about real-time alerts and navigate your region efficiently
            </h2>
            <div className="buttons is-centered">
              <Link to="/alerts" className="button is-white is-outlined is-large">
                <span className="icon">
                  <i className="fas fa-bell"></i>
                </span>
                <span>View Alerts</span>
              </Link>
              <Link to="/map" className="button is-white is-large">
                <span className="icon">
                  <i className="fas fa-map-marked-alt"></i>
                </span>
                <span>Explore Map</span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Main Features Section */}
      <section className="section">
        <div className="container">
          <div className="columns is-centered">
            <div className="column is-10">
              <div className="columns is-multiline">
                {/* Live Alerts Card */}
                <div className="column is-4">
                  <div className="card">
                    <div className="card-image">
                      <figure className="image is-3by2">
                        <img
                          src="https://images.unsplash.com/photo-1517048676732-d65bc937f952?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80"
                          alt="Live Alerts"
                        />
                      </figure>
                    </div>
                    <div className="card-content">
                      <div className="media">
                        <div className="media-left">
                          <span className="icon is-large has-text-danger">
                            <i className="fas fa-exclamation-circle fa-2x"></i>
                          </span>
                        </div>
                        <div className="media-content">
                          <p className="title is-4">Live Alerts</p>
                        </div>
                      </div>
                      <div className="content">
                        Get instant notifications about emergencies, road closures, and other disruptions in
                        your area. Stay informed to stay safe.
                        <br /><br />
                        <Link to="/alerts" className="button is-danger is-outlined is-fullwidth">
                          View Alerts
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Smart Navigation Card */}
                <div className="column is-4">
                  <div className="card">
                    <div className="card-image">
                      <figure className="image is-3by2">
                        <img
                          src="https://images.unsplash.com/photo-1508182314998-3bd49473002f?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80"
                          alt="Smart Navigation"
                        />
                      </figure>
                    </div>
                    <div className="card-content">
                      <div className="media">
                        <div className="media-left">
                          <span className="icon is-large has-text-info">
                            <i className="fas fa-route fa-2x"></i>
                          </span>
                        </div>
                        <div className="media-content">
                          <p className="title is-4">Smart Navigation</p>
                        </div>
                      </div>
                      <div className="content">
                        Find the best routes to avoid roadblocks and traffic congestion. Our interactive map
                        shows real-time traffic updates.
                        <br /><br />
                        <Link to="/map" className="button is-info is-outlined is-fullwidth">
                          Open Map
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Government Updates Card */}
                <div className="column is-4">
                  <div className="card">
                    <div className="card-image">
                      <figure className="image is-3by2">
                        <img
                          src="https://images.unsplash.com/photo-1556761175-5973dc0f32e7?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80"
                          alt="Government Updates"
                        />
                      </figure>
                    </div>
                    <div className="card-content">
                      <div className="media">
                        <div className="media-left">
                          <span className="icon is-large has-text-success">
                            <i className="fas fa-building fa-2x"></i>
                          </span>
                        </div>
                        <div className="media-content">
                          <p className="title is-4">Government Updates</p>
                        </div>
                      </div>
                      <div className="content">
                        Stay informed about local government projects, regulations, and important
                        announcements that affect your community.
                        <br /><br />
                        <Link to="/about" className="button is-success is-outlined is-fullwidth">
                          Learn More
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="section has-background-light">
        <div className="container">
          <h2 className="title is-2 has-text-centered mb-6">How It Works</h2>

          <div className="columns is-centered">
            <div className="column is-10">
              <div className="columns is-multiline">
                {/* Step 1 */}
                <div className="column is-4">
                  <div className="box has-text-centered">
                    <span className="icon is-large">
                      <i className="fas fa-user-plus fa-3x has-text-primary"></i>
                    </span>
                    <h4 className="title is-4 mt-4">1. Create an Account</h4>
                    <p className="subtitle is-6">Sign up for free to access all features of our system.</p>
                  </div>
                </div>

                {/* Step 2 */}
                <div className="column is-4">
                  <div className="box has-text-centered">
                    <span className="icon is-large">
                      <i className="fas fa-bell fa-3x has-text-primary"></i>
                    </span>
                    <h4 className="title is-4 mt-4">2. Receive Alerts</h4>
                    <p className="subtitle is-6">Get notifications about important events in your region.</p>
                  </div>
                </div>

                {/* Step 3 */}
                <div className="column is-4">
                  <div className="box has-text-centered">
                    <span className="icon is-large">
                      <i className="fas fa-map-marked-alt fa-3x has-text-primary"></i>
                    </span>
                    <h4 className="title is-4 mt-4">3. Navigate Safely</h4>
                    <p className="subtitle is-6">Use our interactive map to find the best routes.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="section">
        <div className="container">
          <div className="columns is-centered">
            <div className="column is-8">
              <div className="box has-background-primary has-text-white p-6">
                <div className="columns is-vcentered">
                  <div className="column is-8">
                    <h3 className="title is-3 has-text-white">Ready to get started?</h3>
                    <p className="subtitle is-5 has-text-white">
                      Create an account today and stay informed about what's happening in your region.
                    </p>
                  </div>
                  <div className="column is-4 has-text-centered">
                    <Link to="/register" className="button is-white is-large">
                      Sign Up Now
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
