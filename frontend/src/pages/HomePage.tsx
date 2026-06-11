import { Link } from 'react-router-dom'
import './HomePage.css'

export default function HomePage() {
  return (
    <>
      {/* Hero Section */}
      <section className="hero-split">
        <div className="hero-content">
          <div className="badge badge-primary mb-6 animate-slideUp" style={{ animationDelay: '0.1s' }}>
            <span className="icon"><i className="fas fa-satellite-dish"></i></span>
            <span>Live Regional Monitoring</span>
          </div>
          <h1 className="title-display animate-slideUp" style={{ animationDelay: '0.2s', fontSize: 'var(--text-5xl)', fontWeight: 'var(--weight-extrabold)', marginBottom: 'var(--space-6)', lineHeight: '1.1' }}>
            Navigate Smarter.<br />
            Stay <span className="text-primary">Safer.</span>
          </h1>
          <p className="subtitle-lead animate-slideUp" style={{ animationDelay: '0.3s', fontSize: 'var(--text-lg)', color: 'var(--text-secondary)', marginBottom: 'var(--space-8)', maxWidth: '480px', lineHeight: '1.6' }}>
            Real-time alerts, traffic intelligence, weather monitoring, and emergency notifications for smarter communities.
          </p>
          <div className="btn-group animate-slideUp" style={{ animationDelay: '0.4s' }}>
            <Link to="/map" className="btn btn-primary btn-lg">
              Explore Map <i className="fas fa-arrow-right"></i>
            </Link>
            <Link to="/alerts" className="btn btn-secondary btn-lg">
              View Alerts
            </Link>
          </div>

          <div className="hero-stats animate-fadeIn" style={{ animationDelay: '0.8s', display: 'flex', gap: 'var(--space-8)', marginTop: 'var(--space-12)', paddingTop: 'var(--space-8)', borderTop: '1px solid var(--border-color)', width: '100%' }}>
            <div>
              <p className="font-display font-bold text-2xl text-primary">12K+</p>
              <p className="text-sm text-muted font-medium">Active Users</p>
            </div>
            <div>
              <p className="font-display font-bold text-2xl text-primary">24/7</p>
              <p className="text-sm text-muted font-medium">Monitoring</p>
            </div>
            <div>
              <p className="font-display font-bold text-2xl text-primary">99%</p>
              <p className="text-sm text-muted font-medium">Uptime</p>
            </div>
          </div>
        </div>
        
        <div className="hero-visual">
          {/* Abstract map illustration using CSS */}
          <div className="abstract-map">
            <div className="map-line horizontal" style={{ top: '30%' }}></div>
            <div className="map-line horizontal" style={{ top: '60%' }}></div>
            <div className="map-line vertical" style={{ left: '40%' }}></div>
            <div className="map-line vertical" style={{ left: '70%' }}></div>
            
            <div className="map-node node-1 animate-pulse"></div>
            <div className="map-node node-2 animate-pulse" style={{ animationDelay: '0.5s' }}></div>
            <div className="map-node node-3 animate-pulse" style={{ animationDelay: '1s' }}></div>
            
            <div className="floating-card float-1 animate-fadeIn" style={{ animationDelay: '1s' }}>
              <div className="icon-box-sm warning"><i className="fas fa-hard-hat"></i></div>
              <div className="fc-content">
                <p className="fc-title">Construction</p>
                <p className="fc-desc">Main St Closed</p>
              </div>
            </div>

            <div className="floating-card float-2 animate-fadeIn" style={{ animationDelay: '1.5s' }}>
              <div className="icon-box-sm danger"><i className="fas fa-car-crash"></i></div>
              <div className="fc-content">
                <p className="fc-title">Accident</p>
                <p className="fc-desc">Highway 101 South</p>
              </div>
            </div>

            <div className="floating-card float-3 animate-fadeIn" style={{ animationDelay: '2s' }}>
              <div className="icon-box-sm info"><i className="fas fa-cloud-rain"></i></div>
              <div className="fc-content">
                <p className="fc-title">Weather</p>
                <p className="fc-desc">Heavy rain expected</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="section bg-white">
        <div className="container">
          <div className="text-center mb-12" style={{ marginBottom: 'var(--space-12)' }}>
            <h2 className="font-display font-bold text-3xl mb-4">Everything you need to navigate the city</h2>
            <p className="text-secondary text-lg max-w-2xl mx-auto" style={{ maxWidth: '600px', margin: '0 auto' }}>
              SRANS combines real-time data from government agencies and citizens to provide a comprehensive view of your region.
            </p>
          </div>

          <div className="grid grid-3">
            {/* Feature 1 */}
            <div className="card card-hover h-full">
              <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)', height: '100%' }}>
                <div className="icon-box danger"><i className="fas fa-bell"></i></div>
                <h3 className="font-semibold text-lg">Real-Time Alerts</h3>
                <p className="text-secondary flex-1">
                  Get instant notifications about traffic incidents, emergencies, construction, and severe weather in your immediate vicinity.
                </p>
              </div>
            </div>

            {/* Feature 2 */}
            <div className="card card-hover h-full">
              <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)', height: '100%' }}>
                <div className="icon-box info"><i className="fas fa-map-marked-alt"></i></div>
                <h3 className="font-semibold text-lg">Interactive Mapping</h3>
                <p className="text-secondary flex-1">
                  Visualize alerts on a dynamic map. See exactly where incidents are located and plan alternative routes efficiently.
                </p>
              </div>
            </div>

            {/* Feature 3 */}
            <div className="card card-hover h-full">
              <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)', height: '100%' }}>
                <div className="icon-box accent"><i className="fas fa-shield-alt"></i></div>
                <h3 className="font-semibold text-lg">Verified Information</h3>
                <p className="text-secondary flex-1">
                  Trust what you read. Critical alerts are verified by local government and emergency response agencies.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="section bg-subtle">
        <div className="container">
          <div className="text-center mb-12" style={{ marginBottom: 'var(--space-12)' }}>
            <h2 className="font-display font-bold text-3xl mb-4">How SRANS Works</h2>
            <p className="text-secondary text-lg max-w-2xl mx-auto" style={{ maxWidth: '600px', margin: '0 auto' }}>
              A seamless flow of information from authorities to citizens.
            </p>
          </div>

          <div className="workflow-container" style={{ position: 'relative', display: 'flex', justifyContent: 'space-between', gap: 'var(--space-8)' }}>
            <div className="workflow-line" style={{ position: 'absolute', top: '40px', left: '10%', right: '10%', height: '2px', background: 'var(--border-color)', zIndex: 0 }}></div>
            
            <div className="workflow-step" style={{ flex: 1, textAlign: 'center', position: 'relative', zIndex: 1 }}>
              <div className="workflow-icon" style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'var(--bg-white)', border: '2px solid var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', color: 'var(--color-primary)', margin: '0 auto var(--space-4)', boxShadow: 'var(--shadow-sm)' }}>
                <i className="fas fa-broadcast-tower"></i>
              </div>
              <h4 className="font-semibold text-lg mb-2">1. Data Collection</h4>
              <p className="text-sm text-secondary">Government agencies and IoT sensors report incidents.</p>
            </div>

            <div className="workflow-step" style={{ flex: 1, textAlign: 'center', position: 'relative', zIndex: 1 }}>
              <div className="workflow-icon" style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'var(--bg-white)', border: '2px solid var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', color: 'var(--color-primary)', margin: '0 auto var(--space-4)', boxShadow: 'var(--shadow-sm)' }}>
                <i className="fas fa-server"></i>
              </div>
              <h4 className="font-semibold text-lg mb-2">2. Processing</h4>
              <p className="text-sm text-secondary">SRANS verifies and categorizes the data in real-time.</p>
            </div>

            <div className="workflow-step" style={{ flex: 1, textAlign: 'center', position: 'relative', zIndex: 1 }}>
              <div className="workflow-icon" style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'var(--bg-white)', border: '2px solid var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', color: 'var(--color-primary)', margin: '0 auto var(--space-4)', boxShadow: 'var(--shadow-sm)' }}>
                <i className="fas fa-mobile-alt"></i>
              </div>
              <h4 className="font-semibold text-lg mb-2">3. Notification</h4>
              <p className="text-sm text-secondary">Citizens receive instant alerts on their devices.</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="section cta-section" style={{ background: 'linear-gradient(135deg, var(--color-primary) 0%, var(--color-secondary) 100%)', color: 'white', textAlign: 'center' }}>
        <div className="container">
          <div className="cta-content" style={{ maxWidth: '800px', margin: '0 auto', padding: 'var(--space-8) 0' }}>
            <h2 className="font-display font-bold text-3xl mb-4 text-white">Ready to join your smart city network?</h2>
            <p className="text-lg mb-8" style={{ opacity: 0.9 }}>
              Create an account today to customize your alerts, save your frequent routes, and stay informed.
            </p>
            <div className="btn-group flex-center">
              <Link to="/register" className="btn btn-white btn-lg">
                Create Free Account
              </Link>
              <Link to="/features" className="btn btn-outline-white btn-lg">
                Learn More
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
