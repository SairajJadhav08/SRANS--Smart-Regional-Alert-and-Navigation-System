import { Link } from 'react-router-dom'
import Seo from '../components/Seo'
import { OptionalImg } from '../components/ui'
import '../styles/pages/marketing.css'

interface Feature { icon: string; title: string; text: string; ai?: boolean }

const COMMUTER: Feature[] = [
  { icon: 'fa-map-location-dot', title: 'Live disruption map', text: 'Every active alert on one map, colour-coded by type, with the affected radius drawn around each incident.' },
  { icon: 'fa-diamond-turn-right', title: 'Turn-by-turn routing', text: 'OpenStreetMap routing that highlights any alert within 500 m of your actual road path.' },
  { icon: 'fa-route', title: 'Saved routes', text: 'Save home-to-office and other regular trips and open them with one tap.' },
  { icon: 'fa-flag', title: 'Report incidents', text: 'Pin a pothole, waterlogging or blockage on the map. Officials review it before it goes public.' },
]

const AI: Feature[] = [
  { icon: 'fa-sun', title: 'AI commute briefing', text: 'A short, plain-language summary of disruptions around your location every time you open SRANS.', ai: true },
  { icon: 'fa-gauge-high', title: 'Route risk score', text: 'Each saved route is scored 0–100 from alerts along its corridor, with advice on when to leave.', ai: true },
  { icon: 'fa-comments', title: 'In-journey co-pilot', text: 'Ask questions while navigating. Answers use your route, your current step and nearby alerts.', ai: true },
  { icon: 'fa-magnifying-glass-location', title: 'Smart alert search', text: 'Describe what you are worried about in your own words and get the matching alerts.', ai: true },
  { icon: 'fa-lightbulb', title: 'Alert explainer', text: 'Turns an official notice into who is affected, the expected delay and what to do.', ai: true },
  { icon: 'fa-satellite-dish', title: 'Hazard detection', text: 'Scans your area for likely seasonal and time-of-day hazards that have not been reported yet.', ai: true },
]

const AGENCY: Feature[] = [
  { icon: 'fa-pen-nib', title: 'AI alert drafter', text: 'Paste rough field notes; get a clear, categorised public alert with severity and duration.', ai: true },
  { icon: 'fa-list-check', title: 'Citizen report triage', text: 'Credibility score, severity, duplicate detection and a cleaned-up version ready to publish.', ai: true },
  { icon: 'fa-tower-broadcast', title: 'Situation report', text: 'A control-room briefing of the last 48 hours with key developments and recommended actions.', ai: true },
  { icon: 'fa-chart-line', title: 'Analytics & insights', text: 'Trends, hotspots and a 3-day outlook generated from your region’s incident history.', ai: true },
  { icon: 'fa-bullhorn', title: 'Emergency broadcast', text: 'Administrators can push a red banner to every user instantly for life-safety events.' },
  { icon: 'fa-user-shield', title: 'Verified agencies', text: 'Only administrator-verified government accounts can publish official alerts.' },
]

const PLATFORM: Feature[] = [
  { icon: 'fa-mobile-screen', title: 'Installable app', text: 'Works on any phone or laptop and can be installed to the home screen as a PWA.' },
  { icon: 'fa-bell', title: 'Browser notifications', text: 'Get notified when a new alert is published, even while SRANS is in the background.' },
  { icon: 'fa-earth-asia', title: 'Open map data', text: 'Built on OpenStreetMap, free routing and geocoding services — no lock-in.' },
  { icon: 'fa-universal-access', title: 'Accessible by design', text: 'Keyboard navigation, screen-reader labels and reduced-motion support throughout.' },
]

function Cards({ items, three = false, four = false }: { items: Feature[]; three?: boolean; four?: boolean }) {
  return (
    <div className={`mk-cards${three ? ' three' : ''}${four ? ' four' : ''}`}>
      {items.map(f => (
        <article key={f.title} className="mk-card">
          <span className={`mk-card-icon${f.ai ? ' ai' : ''}`} aria-hidden="true"><i className={`fas ${f.icon}`}></i></span>
          <h3>{f.title}</h3>
          <p>{f.text}</p>
        </article>
      ))}
    </div>
  )
}

export default function FeaturesPage() {
  return (
    <>
      <Seo
        title="Features — AI Route Risk, Live Alerts & Agency Tools"
        description="Explore SRANS features: live disruption map, AI commute briefings, route risk scores, an in-journey AI co-pilot, citizen reporting and AI tools for government agencies."
        path="/features"
      />

      <section className="mk-hero center">
        <div className="container">
          <span className="eyebrow on-dark">Features</span>
          <h1>Everything you need to get around disruptions</h1>
          <p className="mk-lead">
            Live alerts, safe routing and AI that turns hundreds of notices into a clear plan — for commuters and the
            agencies that keep the roads running.
          </p>
          <div className="btn-group">
            <Link to="/register" className="btn btn-signal btn-lg">Get started free</Link>
            <Link to="/map" className="btn btn-outline-white btn-lg">Open the live map</Link>
          </div>
        </div>
      </section>

      <section className="mk-section" aria-labelledby="f-commuter">
        <div className="container mk-split">
          <div>
            <div className="mk-head">
              <span className="eyebrow">For commuters</span>
              <h2 id="f-commuter">See the road before you’re on it</h2>
              <p>The live map and route planner show exactly where construction, diversions and flooding are — and whether they touch your route.</p>
            </div>
            <Cards items={COMMUTER} />
          </div>
          <div className="mk-figure">
            <OptionalImg src="/images/features-commuter.webp" alt="Phone showing a safe route around construction and flood alerts" width={1280} height={960} />
          </div>
        </div>
      </section>

      <section className="mk-section alt" aria-labelledby="f-ai">
        <div className="container">
          <div className="mk-head center">
            <span className="ai-chip on-light"><i className="fas fa-wand-magic-sparkles" aria-hidden="true"></i> Powered by Groq</span>
            <h2 id="f-ai">AI that reads every alert for you</h2>
            <p>Six AI features built into the commute — each grounded in the live alerts for your area.</p>
          </div>
          <Cards items={AI} three />
        </div>
      </section>

      <section className="mk-section" aria-labelledby="f-agency">
        <div className="container mk-split reverse">
          <div>
            <div className="mk-head">
              <span className="eyebrow">For government agencies</span>
              <h2 id="f-agency">A command center for the people who fix the roads</h2>
              <p>Publish faster, review citizen reports with confidence and brief your team in seconds.</p>
            </div>
            <Cards items={AGENCY} />
          </div>
          <div className="mk-figure">
            <OptionalImg src="/images/agency-control-room.webp" alt="City traffic control room with a live incident map" width={1920} height={1080} />
          </div>
        </div>
      </section>

      <section className="mk-section alt" aria-labelledby="f-platform">
        <div className="container">
          <div className="mk-head center">
            <span className="eyebrow">Platform</span>
            <h2 id="f-platform">Fast, open and built for every device</h2>
          </div>
          <Cards items={PLATFORM} four />
        </div>
      </section>
    </>
  )
}
