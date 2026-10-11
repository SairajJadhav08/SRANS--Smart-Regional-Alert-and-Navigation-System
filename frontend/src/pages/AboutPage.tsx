import Seo from '../components/Seo'
import { OptionalImg } from '../components/ui'
import '../styles/pages/marketing.css'

const VALUES = [
  { icon: 'fa-shield-heart', title: 'Safety first', text: 'Every feature exists to keep people away from flooded roads, active work zones and blocked routes before they reach them.' },
  { icon: 'fa-circle-check', title: 'Verified information', text: 'Official alerts come only from verified agencies, and citizen reports are reviewed before they go public.' },
  { icon: 'fa-bolt', title: 'Timely', text: 'An alert that arrives after you are stuck in traffic is useless. SRANS briefs you before you leave.' },
  { icon: 'fa-wand-magic-sparkles', title: 'AI that explains', text: 'AI turns raw notices into plain-language decisions — and always shows the alerts it is based on.' },
]

const TECH = [
  { name: 'React + TypeScript', role: 'Web app & PWA' },
  { name: 'Express + Prisma', role: 'REST API' },
  { name: 'PostgreSQL (Neon)', role: 'Alerts, routes & reports' },
  { name: 'Groq · GPT-OSS 120B', role: 'AI briefings, triage & chat' },
  { name: 'Leaflet', role: 'Interactive maps' },
  { name: 'OpenStreetMap', role: 'Map data & tiles' },
  { name: 'OSRM', role: 'Turn-by-turn routing' },
  { name: 'Photon / Nominatim', role: 'Place search' },
]

export default function AboutPage() {
  return (
    <>
      <Seo
        title="About SRANS — Smarter, Safer Daily Commutes"
        description="SRANS connects government agencies and commuters: live alerts for infrastructure work, utility projects, diversions and floods, with AI guidance on the safest route."
        path="/about"
      />

      <section className="mk-hero">
        <div className="container">
          <span className="eyebrow on-dark">About SRANS</span>
          <h1>Giving commuters back the time disruptions take away</h1>
          <p className="mk-lead">
            Roads change every day — metro work, pipeline digs, maintenance, diversions and monsoon flooding. SRANS brings
            all of it into one place and tells you, in plain language, how to get around it.
          </p>
        </div>
      </section>

      <section className="mk-section" aria-labelledby="mission-title">
        <div className="container mk-split">
          <div>
            <div className="mk-head">
              <span className="eyebrow">Our mission</span>
              <h2 id="mission-title">Bridge the gap between the people fixing the roads and the people using them</h2>
            </div>
            <ul className="mk-list">
              <li><i className="fas fa-circle-check" aria-hidden="true"></i><span>When a road closes for infrastructure work, a utility project or a natural disaster, agencies publish it on SRANS in seconds.</span></li>
              <li><i className="fas fa-circle-check" aria-hidden="true"></i><span>Citizens report what they see on the ground; officials verify it — with AI help — before it becomes public.</span></li>
              <li><i className="fas fa-circle-check" aria-hidden="true"></i><span>Commuters get a live map, a risk score for every saved route and an AI briefing before they leave home.</span></li>
            </ul>
          </div>
          <div className="mk-figure">
            <OptionalImg src="/images/about-city.webp" alt="Municipal worker placing a diversion barricade beside a waterlogged city road" width={1600} height={1000} />
          </div>
        </div>
      </section>

      <section className="mk-section alt" aria-labelledby="values-title">
        <div className="container">
          <div className="mk-head center">
            <span className="eyebrow">What we stand for</span>
            <h2 id="values-title">Principles behind every feature</h2>
          </div>
          <div className="mk-cards" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
            {VALUES.map(v => (
              <article key={v.title} className="mk-card">
                <span className="mk-card-icon" aria-hidden="true"><i className={`fas ${v.icon}`}></i></span>
                <h3>{v.title}</h3>
                <p>{v.text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="mk-section" aria-labelledby="tech-title">
        <div className="container">
          <div className="mk-head">
            <span className="eyebrow">Technology</span>
            <h2 id="tech-title">Built on open, reliable foundations</h2>
            <p>Open map data and free routing keep SRANS independent; a fast LLM keeps the AI responsive.</p>
          </div>
          <div className="mk-tech">
            {TECH.map(t => (
              <div key={t.name} className="mk-tech-item">
                <strong>{t.name}</strong>
                <span>{t.role}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

    </>
  )
}
