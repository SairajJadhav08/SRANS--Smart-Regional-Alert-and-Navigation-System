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
            We built SRANS to solve a real problem — commuters losing time every day to road disruptions they never saw coming. Here's why we built it.
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
                    SRANS was built for daily commuters who lose time every day to unexpected road disruptions — construction zones, utility work, traffic diversions, and flooding. Our mission is to put that time back in their hands by giving them accurate, real-time information and AI-powered route guidance before they step out the door.
                  </p>
                  <p className="text-secondary" style={{ lineHeight: 1.8, marginBottom: 'var(--space-4)' }}>
                    The Smart Regional Alert &amp; Navigation System bridges the gap between government agencies and citizens. When a road is closed for infrastructure maintenance, a utility project disrupts traffic, or a natural disaster like flooding blocks key routes, SRANS aggregates those alerts instantly and surfaces them to commuters in a clear, actionable format — on a live map and in plain language through our AI Travel Assistant.
                  </p>
                  <p className="text-secondary" style={{ lineHeight: 1.8 }}>
                    Beyond alerts, SRANS uses an AI engine to analyze disruptions along your saved routes and recommend the safest, fastest alternative path. Whether you commute by road every day or need to react to a sudden regional incident, SRANS turns fragmented government data into the guidance you actually need — in seconds.
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
                text: 'Every feature we build is designed to keep commuters away from dangerous situations — flooded roads, active construction zones, and blocked routes — before they become a problem.' },
              { icon: 'fa-check-circle', title: 'Accuracy', color: 'accent',
                text: 'We only surface alerts that are verified by government agencies. Commuters make real decisions based on our data, so accuracy is non-negotiable.' },
              { icon: 'fa-bolt', title: 'Timeliness', color: 'warning',
                text: 'A road closure alert that arrives after you\'re already stuck in traffic is useless. SRANS delivers disruption intelligence before you leave, so you can plan smarter.' },
              { icon: 'fa-brain', title: 'AI-Driven', color: 'info',
                text: 'We go beyond raw alerts. Our Groq-powered AI engine reasons over live disruption data to generate personalized route recommendations and answer your commuting questions in natural language.' },
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
          <h2 className="font-display font-bold text-3xl mb-4 text-white">Start commuting smarter today</h2>
          <p className="text-lg mb-8" style={{ opacity: 0.9 }}>
            Join thousands of commuters who use SRANS to avoid disruptions, save time, and navigate their region safely every day.
          </p>
          <Link to="/register" className="btn btn-white btn-lg">Sign Up Today</Link>
        </div>
      </section>
    </>
  )
}
