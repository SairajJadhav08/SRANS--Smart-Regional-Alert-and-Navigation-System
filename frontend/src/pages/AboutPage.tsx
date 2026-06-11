import { Link } from 'react-router-dom'

export default function AboutPage() {
  return (
    <>
      {/* Hero */}
      <div className="page-header bg-white" style={{ paddingTop: 'var(--space-16)', paddingBottom: 'var(--space-16)' }}>
        <div className="container text-center" style={{ maxWidth: '720px', margin: '0 auto' }}>
          <span className="badge badge-primary mb-4"><i className="fas fa-landmark mr-1"></i> Our Story</span>
          <h1 className="font-display" style={{ fontSize: 'var(--text-5xl)', fontWeight: 'var(--weight-extrabold)', lineHeight: 1.1, marginBottom: 'var(--space-6)' }}>
            Building Safer Communities Through Technology
          </h1>
          <p className="text-secondary text-lg" style={{ lineHeight: 1.7 }}>
            Learn about our mission to keep communities connected, informed, and safe through real-time intelligence.
          </p>
        </div>
      </div>

      {/* Mission */}
      <section className="section">
        <div className="container" style={{ maxWidth: '900px', margin: '0 auto' }}>
          <div className="card" style={{ border: 'none', boxShadow: 'none', background: 'transparent' }}>
            <div className="card-body" style={{ padding: 0 }}>
              <div className="flex gap-6 mb-8" style={{ alignItems: 'flex-start' }}>
                <div className="icon-box primary" style={{ flexShrink: 0, width: '56px', height: '56px', fontSize: '24px' }}>
                  <i className="fas fa-crosshairs"></i>
                </div>
                <div>
                  <h2 className="font-display font-bold text-2xl mb-4">Our Mission</h2>
                  <p className="text-secondary" style={{ lineHeight: 1.8, marginBottom: 'var(--space-4)' }}>
                    We strive to provide timely and accurate information to help you navigate your region safely and efficiently. We are dedicated to empowering communities by keeping them informed about critical events and updates that affect their daily lives.
                  </p>
                  <p className="text-secondary" style={{ lineHeight: 1.8, marginBottom: 'var(--space-4)' }}>
                    The Smart Regional Alert &amp; Navigation System was created with a singular vision: to bridge the information gap between local governments and citizens. By providing real-time alerts about traffic conditions, emergencies, construction activities, and weather events, we help people make informed decisions about their travel and daily activities.
                  </p>
                  <p className="text-secondary" style={{ lineHeight: 1.8 }}>
                    Our platform enables government agencies to quickly disseminate critical information to the public, ensuring that important alerts reach citizens when they matter most. By combining these alerts with interactive mapping technology, we offer not just information, but actionable guidance to navigate around disruptions safely.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Core Values */}
      <section className="section bg-subtle">
        <div className="container">
          <div className="text-center mb-12" style={{ marginBottom: 'var(--space-12)' }}>
            <h2 className="font-display font-bold text-3xl mb-4">Our Core Values</h2>
            <p className="text-secondary" style={{ maxWidth: '500px', margin: '0 auto' }}>
              The principles that guide every decision we make.
            </p>
          </div>

          <div className="grid grid-4">
            {[
              { icon: 'fa-shield-alt', title: 'Safety First', color: 'primary',
                text: 'We prioritize the safety and well-being of communities in everything we do. Our alerts are designed to help citizens avoid dangerous situations and navigate their region safely.' },
              { icon: 'fa-check-circle', title: 'Accuracy', color: 'accent',
                text: 'We are committed to providing verified and accurate information. All alerts on our platform are validated by official government sources before being published.' },
              { icon: 'fa-bolt', title: 'Timeliness', color: 'warning',
                text: 'We understand that in critical situations, every second counts. Our platform is designed to deliver alerts rapidly, ensuring users receive information when they need it most.' },
              { icon: 'fa-users', title: 'Community', color: 'info',
                text: 'We believe in the power of connected communities. By improving communication between government agencies and citizens, we help build stronger, more resilient communities.' },
            ].map((v, i) => (
              <div key={i} className="card card-hover h-full">
                <div className="card-body text-center" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'var(--space-4)' }}>
                  <div className={`icon-box ${v.color}`} style={{ width: '56px', height: '56px', fontSize: '24px' }}>
                    <i className={`fas ${v.icon}`}></i>
                  </div>
                  <h3 className="font-semibold text-lg">{v.title}</h3>
                  <p className="text-secondary text-sm" style={{ lineHeight: 1.6 }}>{v.text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="section text-center" style={{ background: 'linear-gradient(135deg, var(--color-primary) 0%, var(--color-secondary) 100%)', color: 'white' }}>
        <div className="container" style={{ maxWidth: '700px', margin: '0 auto' }}>
          <h2 className="font-display font-bold text-3xl mb-4 text-white">Join Our Mission</h2>
          <p className="text-lg mb-8" style={{ opacity: 0.9 }}>
            Be part of our effort to create safer, more connected communities across the region.
          </p>
          <Link to="/register" className="btn btn-white btn-lg">Sign Up Today</Link>
        </div>
      </section>
    </>
  )
}
