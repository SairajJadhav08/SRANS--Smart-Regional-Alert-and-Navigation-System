import { Link } from 'react-router-dom'

export default function AboutPage() {
  return (
    <>
      {/* Hero Section */}
      <section className="hero is-primary">
        <div className="hero-body">
          <div className="container has-text-centered">
            <h1 className="title is-1">About Our System</h1>
            <h2 className="subtitle is-4">Learn about our mission to keep communities connected and safe</h2>
          </div>
        </div>
      </section>

      {/* Mission Section */}
      <section className="section">
        <div className="container">
          <div className="columns is-centered">
            <div className="column is-10">
              <div className="box p-6">
                <h3 className="title is-3 has-text-centered mb-6">Our Mission</h3>
                
                <div className="content is-medium">
                  <p>
                    We strive to provide timely and accurate information to help you navigate your region safely and efficiently. We are dedicated to empowering communities by keeping them informed about critical events and updates that affect their daily lives.
                  </p>
                  
                  <p>
                    The Smart Regional Alert &amp; Navigation System was created with a singular vision: to bridge the information gap between local governments and citizens. By providing real-time alerts about traffic conditions, emergencies, construction activities, and weather events, we help people make informed decisions about their travel and daily activities.
                  </p>
                  
                  <p>
                    Our platform enables government agencies to quickly disseminate critical information to the public, ensuring that important alerts reach citizens when they matter most. By combining these alerts with interactive mapping technology, we offer not just information, but actionable guidance to navigate around disruptions safely.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="section has-background-light">
        <div className="container">
          <h3 className="title is-3 has-text-centered mb-6">Our Core Values</h3>
          
          <div className="columns is-multiline">
            {/* Value 1 */}
            <div className="column is-3">
              <div className="card h-100">
                <div className="card-content has-text-centered">
                  <span className="icon is-large mb-4">
                    <i className="fas fa-shield-alt fa-3x has-text-primary"></i>
                  </span>
                  <h4 className="title is-4">Safety First</h4>
                  <div className="content">
                    <p>We prioritize the safety and well-being of communities in everything we do. Our alerts are designed to help citizens avoid dangerous situations and navigate their region safely.</p>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Value 2 */}
            <div className="column is-3">
              <div className="card h-100">
                <div className="card-content has-text-centered">
                  <span className="icon is-large mb-4">
                    <i className="fas fa-check-circle fa-3x has-text-success"></i>
                  </span>
                  <h4 className="title is-4">Accuracy</h4>
                  <div className="content">
                    <p>We are committed to providing verified and accurate information. All alerts on our platform are validated by official government sources before being published.</p>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Value 3 */}
            <div className="column is-3">
              <div className="card h-100">
                <div className="card-content has-text-centered">
                  <span className="icon is-large mb-4">
                    <i className="fas fa-bolt fa-3x has-text-warning"></i>
                  </span>
                  <h4 className="title is-4">Timeliness</h4>
                  <div className="content">
                    <p>We understand that in critical situations, every second counts. Our platform is designed to deliver alerts rapidly, ensuring that users receive information when they need it most.</p>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Value 4 */}
            <div className="column is-3">
              <div className="card h-100">
                <div className="card-content has-text-centered">
                  <span className="icon is-large mb-4">
                    <i className="fas fa-users fa-3x has-text-info"></i>
                  </span>
                  <h4 className="title is-4">Community</h4>
                  <div className="content">
                    <p>We believe in the power of connected communities. By improving communication between government agencies and citizens, we help build stronger, more resilient communities.</p>
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
                    <h3 className="title is-3 has-text-white">Join Our Mission</h3>
                    <p className="subtitle is-5 has-text-white">Be part of our effort to create safer, more connected communities.</p>
                  </div>
                  <div className="column is-4 has-text-centered">
                    <Link to="/register" className="button is-white is-large">Sign Up Today</Link>
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
