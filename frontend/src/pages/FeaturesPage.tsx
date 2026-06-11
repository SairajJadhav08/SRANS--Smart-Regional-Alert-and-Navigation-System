import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function FeaturesPage() {
  const { isLoggedIn, isAnyGovUser } = useAuth()

  const features = [
    {
      icon: 'fa-bell', color: 'danger', title: 'Real-Time Alerts',
      bullets: ['Traffic incidents and congestion', 'Emergency situations', 'Construction activities', 'Weather warnings'],
      description: 'Alerts are verified by government agencies to ensure accuracy and relevance.',
      link: '/alerts', linkText: 'View Alerts'
    },
    {
      icon: 'fa-map-marked-alt', color: 'info', title: 'Interactive Mapping',
      bullets: ['Real-time traffic overlay', 'Location-based alert visualization', 'Current user location tracking', 'Alternative route suggestions'],
      description: 'Our map integrates seamlessly with OpenStreetMap to provide reliable navigation.',
      link: '/map', linkText: 'Open Map'
    },
    {
      icon: 'fa-user-shield', color: 'primary', title: 'User Management',
      bullets: ['Secure authentication system', 'Role-based access control', 'User profile customization', 'Alert preferences and subscriptions'],
      description: 'Government users have special privileges to create and manage alerts for the public.',
      link: '/register', linkText: 'Register Now'
    },
    {
      icon: 'fa-tachometer-alt', color: 'accent', title: 'Government Dashboard',
      bullets: ['Alert creation and management', 'Analytics and reporting tools', 'Batch operations for managing multiple alerts', 'User activity monitoring'],
      description: 'The dashboard ensures efficient alert management during critical situations.',
      link: isLoggedIn && isAnyGovUser ? '/dashboard' : '/login',
      linkText: isLoggedIn && isAnyGovUser ? 'Access Dashboard' : 'Government Login'
    },
    {
      icon: 'fa-mobile-alt', color: 'warning', title: 'Mobile Responsive',
      bullets: ['Fully responsive design adapts to any screen size', 'Optimized for smartphones and tablets', 'Fast loading times on mobile networks', 'Touch-friendly interface'],
      description: 'Stay connected and informed whether you\'re at home or on the go.',
    },
    {
      icon: 'fa-shield-alt', color: 'secondary', title: 'Security & Privacy',
      bullets: ['Secure password hashing', 'Optional location sharing', 'Data encryption', 'Regular security audits'],
      description: 'Your personal information is always protected with industry-standard security measures.',
    },
  ]

  const techStack = [
    { icon: 'fab fa-react', name: 'React', subtitle: 'Frontend Library', color: '#61DAFB' },
    { icon: 'fab fa-python', name: 'Flask API', subtitle: 'Backend Service', color: '#3776AB' },
    { icon: 'fas fa-paint-brush', name: 'Custom CSS', subtitle: 'Design System', color: 'var(--color-primary)' },
    { icon: 'fas fa-map', name: 'Leaflet + OSM', subtitle: 'Map Integration', color: '#199900' },
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
          <p className="text-secondary text-lg">Explore the capabilities of our Smart Regional Alert & Navigation System.</p>
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
              Built with a reliable, production-ready stack.
            </p>
          </div>

          <div className="grid grid-4">
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
