import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import './HomePage.css'

export default function HomePage() {
  const { isLoggedIn, user } = useAuth()

  // ── Logged-in variant: show personalised dashboard instead of guest landing ─
  if (isLoggedIn) {
    return (
      <>
        <section className="hero-split">
          <div className="hero-content">
            <div className="badge badge-primary mb-6 animate-slideUp" style={{ animationDelay: '0.1s' }}>
              <span className="icon"><i className="fas fa-satellite-dish"></i></span>
              <span>Live Regional Monitoring</span>
            </div>
            <h1 className="title-display animate-slideUp" style={{ animationDelay: '0.2s', fontSize: 'var(--text-5xl)', fontWeight: 'var(--weight-extrabold)', marginBottom: 'var(--space-6)', lineHeight: '1.1' }}>
              Welcome back,<br />
              <span className="text-primary">{user?.username}.</span>
            </h1>
            <p className="subtitle-lead animate-slideUp" style={{ animationDelay: '0.3s', fontSize: 'var(--text-lg)', color: 'var(--text-secondary)', marginBottom: 'var(--space-8)', maxWidth: '480px', lineHeight: '1.6' }}>
              Check live alerts, plan your route around today's disruptions, and let AI find you the safest path to your destination.
            </p>
            <div className="btn-group animate-slideUp" style={{ animationDelay: '0.4s' }}>
              <Link to="/map" className="btn btn-primary btn-lg">
                <i className="fas fa-map-marked-alt"></i> Open Live Map
              </Link>
              <Link to="/my-routes" className="btn btn-secondary btn-lg">
                <i className="fas fa-route"></i> My Routes
              </Link>
            </div>
            <div className="hero-stats animate-fadeIn" style={{ animationDelay: '0.8s', display: 'flex', gap: 'var(--space-8)', marginTop: 'var(--space-12)', paddingTop: 'var(--space-8)', borderTop: '1px solid var(--border-color)', width: '100%' }}>
              <div><p className="font-display font-bold text-2xl text-primary">12K+</p><p className="text-sm text-muted font-medium">Active Users</p></div>
              <div><p className="font-display font-bold text-2xl text-primary">24/7</p><p className="text-sm text-muted font-medium">Monitoring</p></div>
              <div><p className="font-display font-bold text-2xl text-primary">99%</p><p className="text-sm text-muted font-medium">Uptime</p></div>
            </div>
          </div>
          <div className="hero-visual">
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
                <div className="fc-content"><p className="fc-title">Construction</p><p className="fc-desc">Main St Closed</p></div>
              </div>
              <div className="floating-card float-2 animate-fadeIn" style={{ animationDelay: '1.5s' }}>
                <div className="icon-box-sm danger"><i className="fas fa-water"></i></div>
                <div className="fc-content"><p className="fc-title">Flooding</p><p className="fc-desc">Diversion in effect</p></div>
              </div>
              <div className="floating-card float-3 animate-fadeIn" style={{ animationDelay: '2s' }}>
                <div className="icon-box-sm info"><i className="fas fa-magic"></i></div>
                <div className="fc-content"><p className="fc-title">AI Route</p><p className="fc-desc">Safer path found</p></div>
              </div>
            </div>
          </div>
        </section>

        <section className="section bg-white">
          <div className="container">
            <div className="text-center mb-12" style={{ marginBottom: 'var(--space-12)' }}>
              <h2 className="font-display font-bold text-3xl mb-4">Your SRANS Dashboard</h2>
              <p className="text-secondary text-lg" style={{ maxWidth: '500px', margin: '0 auto' }}>Everything you need for a safer commute, in one place.</p>
            </div>
            <div className="grid grid-3">
              <Link to="/map" className="card card-hover h-full" style={{ textDecoration: 'none' }}>
                <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
                  <div className="icon-box info"><i className="fas fa-map-marked-alt"></i></div>
                  <h3 className="font-semibold text-lg">Live Map</h3>
                  <p className="text-secondary flex-1">View real-time alerts on the interactive map and plan routes around active disruptions.</p>
                  <span className="btn btn-secondary btn-sm" style={{ alignSelf: 'flex-start' }}>Open Map <i className="fas fa-arrow-right ml-1"></i></span>
                </div>
              </Link>
              <Link to="/alerts" className="card card-hover h-full" style={{ textDecoration: 'none' }}>
                <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
                  <div className="icon-box danger"><i className="fas fa-bell"></i></div>
                  <h3 className="font-semibold text-lg">Regional Alerts</h3>
                  <p className="text-secondary flex-1">Browse all active alerts — construction, flooding, traffic diversions, and more.</p>
                  <span className="btn btn-secondary btn-sm" style={{ alignSelf: 'flex-start' }}>View Alerts <i className="fas fa-arrow-right ml-1"></i></span>
                </div>
              </Link>
              <Link to="/my-routes" className="card card-hover h-full" style={{ textDecoration: 'none' }}>
                <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
                  <div className="icon-box accent"><i className="fas fa-magic"></i></div>
                  <h3 className="font-semibold text-lg">AI Route Planner</h3>
                  <p className="text-secondary flex-1">Let AI analyze live alerts on your saved routes and recommend the safest departure time and path.</p>
                  <span className="btn btn-secondary btn-sm" style={{ alignSelf: 'flex-start' }}>My Routes <i className="fas fa-arrow-right ml-1"></i></span>
                </div>
              </Link>
            </div>
          </div>
        </section>
      </>
    )
  }

  // ── Guest landing ─────────────────────────────────────────────────────────
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
            AI-powered route optimization that helps commuters avoid road construction, infrastructure work, traffic diversions, and natural disaster disruptions — every day.
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
              <div className="icon-box-sm danger"><i className="fas fa-water"></i></div>
              <div className="fc-content">
                <p className="fc-title">Flooding</p>
                <p className="fc-desc">Diversion in effect</p>
              </div>
            </div>

            <div className="floating-card float-3 animate-fadeIn" style={{ animationDelay: '2s' }}>
              <div className="icon-box-sm info"><i className="fas fa-magic"></i></div>
              <div className="fc-content">
                <p className="fc-title">AI Route</p>
                <p className="fc-desc">Safer path found</p>
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
              SRANS combines real-time regional alerts with AI-powered route intelligence to keep commuters safe from road disruptions, infrastructure projects, and natural disasters.
            </p>
          </div>

          <div className="grid grid-3">
            {/* Feature 1 */}
            <div className="card card-hover h-full">
              <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)', height: '100%' }}>
                <div className="icon-box danger"><i className="fas fa-bell"></i></div>
                <h3 className="font-semibold text-lg">Regional Disruption Alerts</h3>
                <p className="text-secondary flex-1">
                  Stay ahead of road construction, utility work, traffic diversions, flooding, and other city-wide incidents that affect your daily commute.
                </p>
                <button 
                  className="btn btn-primary btn-sm mt-2" 
                  style={{ alignSelf: 'flex-start' }}
                  onClick={() => {
                    if (!('Notification' in window)) {
                      alert('This browser does not support notifications.');
                      return;
                    }
                    Notification.requestPermission().then(p => {
                      if (p === 'granted') {
                        new Notification('SRANS Notifications Enabled', {
                          body: 'You will now receive alerts directly in your browser.',
                          icon: '/Logo.png'
                        });
                      }
                    });
                  }}
                >
                  <i className="fas fa-bell mr-1"></i> Enable Notifications
                </button>
              </div>
            </div>

            {/* Feature 2 */}
            <div className="card card-hover h-full">
              <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)', height: '100%' }}>
                <div className="icon-box info"><i className="fas fa-magic"></i></div>
                <h3 className="font-semibold text-lg">AI Route Recommendation</h3>
                <p className="text-secondary flex-1">
                  Our AI analyzes live alerts, road closures, and traffic conditions to generate the safest, fastest alternative route to your destination using LLM-powered reasoning.
                </p>
              </div>
            </div>

            {/* Feature 3 */}
            <div className="card card-hover h-full">
              <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)', height: '100%' }}>
                <div className="icon-box accent"><i className="fas fa-robot"></i></div>
                <h3 className="font-semibold text-lg">AI Travel Assistant</h3>
                <p className="text-secondary flex-1">
                  Ask our conversational AI about traffic conditions, get plain-language summaries of regional alerts, and receive personalized travel recommendations before you head out.
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
              From road disruption to safe route — in seconds.
            </p>
          </div>

          <div className="workflow-container" style={{ position: 'relative', display: 'flex', justifyContent: 'space-between', gap: 'var(--space-8)' }}>
            <div className="workflow-line" style={{ position: 'absolute', top: '40px', left: '10%', right: '10%', height: '2px', background: 'var(--border-color)', zIndex: 0 }}></div>
            
            <div className="workflow-step" style={{ flex: 1, textAlign: 'center', position: 'relative', zIndex: 1 }}>
              <div className="workflow-icon" style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'var(--bg-white)', border: '2px solid var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', color: 'var(--color-primary)', margin: '0 auto var(--space-4)', boxShadow: 'var(--shadow-sm)' }}>
                <i className="fas fa-broadcast-tower"></i>
              </div>
              <h4 className="font-semibold text-lg mb-2">1. Disruption Detected</h4>
              <p className="text-sm text-secondary">Government agencies report road construction, utility work, diversions, and natural disaster events.</p>
            </div>

            <div className="workflow-step" style={{ flex: 1, textAlign: 'center', position: 'relative', zIndex: 1 }}>
              <div className="workflow-icon" style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'var(--bg-white)', border: '2px solid var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', color: 'var(--color-primary)', margin: '0 auto var(--space-4)', boxShadow: 'var(--shadow-sm)' }}>
                <i className="fas fa-magic"></i>
              </div>
              <h4 className="font-semibold text-lg mb-2">2. AI Analysis</h4>
              <p className="text-sm text-secondary">Our AI engine analyzes affected areas, traffic conditions, and your destination to find the safest alternative.</p>
            </div>

            <div className="workflow-step" style={{ flex: 1, textAlign: 'center', position: 'relative', zIndex: 1 }}>
              <div className="workflow-icon" style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'var(--bg-white)', border: '2px solid var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', color: 'var(--color-primary)', margin: '0 auto var(--space-4)', boxShadow: 'var(--shadow-sm)' }}>
                <i className="fas fa-route"></i>
              </div>
              <h4 className="font-semibold text-lg mb-2">3. Safe Route Delivered</h4>
              <p className="text-sm text-secondary">Commuters receive a recommended route that avoids disrupted areas, minimizing travel delays every day.</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="section cta-section" style={{ background: 'linear-gradient(135deg, var(--color-primary) 0%, var(--color-secondary) 100%)', color: 'white', textAlign: 'center' }}>
        <div className="container">
          <div className="cta-content" style={{ maxWidth: '800px', margin: '0 auto', padding: 'var(--space-8) 0' }}>
            <h2 className="font-display font-bold text-3xl mb-4 text-white">Ready to commute smarter?</h2>
            <p className="text-lg mb-8" style={{ opacity: 0.9 }}>
              Create a free account to save your routes, get AI-powered daily travel recommendations, and avoid disruptions before they slow you down.
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
