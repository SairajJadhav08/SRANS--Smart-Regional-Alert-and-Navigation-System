import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function FeaturesPage() {
  const { isLoggedIn, isAnyGovUser } = useAuth()

  const features = [
    {
      icon: 'fa-magic', color: 'info', title: 'AI Route Recommendation Engine',
      bullets: [
        'Analyzes live regional alerts and road closures',
        'Considers traffic conditions and your destination',
        'Generates safest and fastest alternative route',
        'Powered by LLM reasoning via Groq API',
      ],
      description: 'Before you leave, our AI builds a real-time picture of disruptions along your path and recommends the optimal route to avoid them.',
      link: '/my-routes', linkText: 'Try AI Planner'
    },
    {
      icon: 'fa-robot', color: 'accent', title: 'AI Travel Assistant',
      bullets: [
        'Conversational answers about current traffic conditions',
        'Plain-language summaries of regional alerts',
        'Personalized travel recommendations',
        'Helps you make informed commuting decisions',
      ],
      description: 'Ask anything about your commute in natural language. The assistant uses live alert data to give you accurate, context-aware answers.',
      link: '/my-routes', linkText: 'Ask the Assistant'
    },
    {
      icon: 'fa-bell', color: 'danger', title: 'Regional Disruption Alerts',
      bullets: [
        'Road construction and infrastructure work',
        'Public utility work and maintenance diversions',
        'Flooding and natural disaster warnings',
        'Traffic incidents and emergency situations',
      ],
      description: 'Alerts are sourced from government agencies and verified before being published to ensure accuracy for every commuter.',
      link: '/alerts', linkText: 'View Alerts'
    },
    {
      icon: 'fa-map-marked-alt', color: 'primary', title: 'Interactive Mapping',
      bullets: ['Real-time alert visualization on live map', 'Location-based disruption overlay', 'Click-to-navigate from any alert', 'Alternative route suggestions'],
      description: 'Our map integrates with OpenStreetMap to show exactly where disruptions are so you can plan around them.',
      link: '/map', linkText: 'Open Map'
    },
    {
      icon: 'fa-tachometer-alt', color: 'warning', title: 'Government Dashboard',
      bullets: ['Alert creation and management', 'Batch operations for multiple alerts', 'Analytics and reporting tools', 'Verified agency access only'],
      description: 'Government agencies can publish and manage alerts directly, ensuring citizens receive accurate disruption information fast.',
      link: isLoggedIn && isAnyGovUser ? '/dashboard' : '/login',
      linkText: isLoggedIn && isAnyGovUser ? 'Access Dashboard' : 'Government Login'
    },
    {
      icon: 'fa-route', color: 'secondary', title: 'Personalized Route Saving',
      bullets: ['Save frequent commute routes', 'Get AI recommendations per saved route', 'Set target arrival time for departure advice', 'Manage all routes in one place'],
      description: 'Save the routes you travel every day and let SRANS proactively warn you about disruptions before you even leave home.',
      link: '/register', linkText: 'Get Started'
    },
  ]

  const techStack = [
    { icon: 'fab fa-react', name: 'React', subtitle: 'Frontend Library', color: '#61DAFB' },
    { icon: 'fab fa-node-js', name: 'Express.js', subtitle: 'Backend API', color: '#68A063' },
    { icon: 'fas fa-database', name: 'Neon PostgreSQL', subtitle: 'Serverless Database', color: '#00E699' },
    { icon: 'fas fa-map', name: 'Leaflet + OSM', subtitle: 'Map Integration', color: '#199900' },
    { icon: 'fas fa-brain', name: 'Groq API', subtitle: 'AI / LLM Engine', color: '#F55036' },
  ]

  return (
    <>
      {/* Hero */}
      <div className="page-header bg-white" style={{ paddingTop: 'var(--space-16)', paddingBottom: 'var(--space-16)' }}>
        <div className="container text-center" style={{ maxWidth: '700px', margin: '0 auto' }}>
          <span className="badge badge-primary mb-4"><i className="fas fa-rocket mr-1"></i> Capabilities</span>
          <h1 className="font-display" style={{ fontSize: 'var(--text-5xl)', fontWeight: 'var(--weight-extrabold)', lineHeight: 1.1, marginBottom: 'var(--space-6)' }}>
            Powerful Features for a <span style={{ color: 'var(--color-primary)' }}>Smarter</span> Region
          </h1>
          <p className="text-secondary text-lg">AI-powered route optimization, real-time regional disruption alerts, and an intelligent travel assistant — built for daily commuters.</p>
        </div>
      </div>

      {/* Features Grid */}
      <section className="section pt-0">
        <div className="container">
          <div className="grid grid-2" style={{ gap: 'var(--space-8)' }}>
            {features.map((f, i) => (
              <div key={i} className="card card-hover h-full">
                <div className="card-body" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                  <div className="flex gap-4 items-center mb-4">
                    <div className={`icon-box ${f.color}`} style={{ width: '48px', height: '48px', fontSize: '20px' }}>
                      <i className={`fas ${f.icon}`}></i>
                    </div>
                    <h3 className="font-display font-bold text-xl">{f.title}</h3>
                  </div>

                  <ul className="flex-col gap-2 mb-4 flex-1" style={{ listStyle: 'none', paddingLeft: 0 }}>
                    {f.bullets.map((b, j) => (
                      <li key={j} className="flex gap-2 text-secondary text-sm">
                        <i className="fas fa-check text-primary mt-1" style={{ fontSize: '10px' }}></i>
                        <span>{b}</span>
                      </li>
                    ))}
                  </ul>

                  <p className="text-secondary text-sm mb-4" style={{ lineHeight: 1.6 }}>{f.description}</p>

                  {f.link && (
                    <Link to={f.link} className="btn btn-secondary btn-sm mt-auto" style={{ alignSelf: 'flex-start' }}>
                      {f.linkText} <i className="fas fa-arrow-right ml-1"></i>
                    </Link>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Tech Stack */}
      <section className="section bg-subtle">
        <div className="container">
          <div className="text-center mb-10" style={{ marginBottom: 'var(--space-10)' }}>
            <h2 className="font-display font-bold text-3xl mb-4">Powered By Modern Technology</h2>
            <p className="text-secondary" style={{ maxWidth: '500px', margin: '0 auto' }}>
              A production-ready stack built for real-time intelligence and AI-powered commuting.
            </p>
          </div>

          <div className="grid grid-5" style={{ gap: 'var(--space-6)' }}>
            {techStack.map((t, i) => (
              <div key={i} className="card card-hover text-center">
                <div className="card-body" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'var(--space-4)', padding: 'var(--space-8) var(--space-6)' }}>
                  <i className={t.icon} style={{ fontSize: '48px', color: t.color }}></i>
                  <h4 className="font-semibold text-lg">{t.name}</h4>
                  <p className="text-muted text-sm">{t.subtitle}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="section text-center">
        <div className="container">
          <h2 className="font-display font-bold text-3xl mb-6" style={{ marginBottom: 'var(--space-6)' }}>Ready to explore?</h2>
          <div className="btn-group flex-center">
            <Link to="/alerts" className="btn btn-primary btn-lg"><i className="fas fa-bell"></i> View Alerts</Link>
            <Link to="/map" className="btn btn-secondary btn-lg"><i className="fas fa-map-marked-alt"></i> Explore Map</Link>
            <Link to="/register" className="btn btn-ghost btn-lg"><i className="fas fa-user-plus"></i> Sign Up</Link>
          </div>
        </div>
      </section>
    </>
  )
}
