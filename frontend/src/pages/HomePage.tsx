import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import Seo from '../components/Seo'
import { getAlerts } from '../api'
import type { Alert } from '../types'
import { typeMeta, timeAgo, ALERT_TYPES } from '../lib/alertMeta'
import { AiChip, OptionalImg, TypeIcon } from '../components/ui'
import '../styles/pages/marketing.css'
import './HomePage.css'

const COMMUTER_AI = [
  {
    icon: 'fa-sun',
    title: 'AI morning briefing',
    text: 'A plain-language summary of every disruption around you, generated fresh each time you open SRANS.',
  },
  {
    icon: 'fa-gauge-high',
    title: 'Route risk score',
    text: 'Each saved route gets a 0–100 risk score from live alerts along its corridor, plus when to leave.',
  },
  {
    icon: 'fa-comments',
    title: 'In-journey co-pilot',
    text: 'Ask questions while you drive. The co-pilot knows your route, your next turn and what lies ahead.',
  },
  {
    icon: 'fa-magnifying-glass-location',
    title: 'Smart alert search',
    text: 'Search the way you speak — “flooding near the station” — and get the alerts that actually matter.',
  },
  {
    icon: 'fa-lightbulb',
    title: 'Alert explainer',
    text: 'Turn an official notice into what it means for you: who is affected, expected delay and what to do.',
  },
  {
    icon: 'fa-satellite-dish',
    title: 'Hazard detection',
    text: 'AI scans your surroundings for likely seasonal and time-of-day hazards that are not reported yet.',
  },
]

const AGENCY_AI = [
  { icon: 'fa-pen-nib', title: 'AI alert drafter', text: 'Turn rough field notes into a clear, categorised public alert in one click.' },
  { icon: 'fa-list-check', title: 'Report triage', text: 'Credibility, severity and duplicate checks for every citizen report.' },
  { icon: 'fa-tower-broadcast', title: 'Situation report', text: 'A live control-room briefing with recommended actions for your region.' },
  { icon: 'fa-chart-line', title: 'Trend insights', text: 'AI reads 14 days of incidents to surface peaks, hotspots and a 3-day outlook.' },
]

const HAZARD_COPY: Record<string, { title: string; text: string }> = {
  Traffic: { title: 'Accidents & diversions', text: 'Collisions, signal failures, congestion and police diversions.' },
  Construction: { title: 'Road & utility works', text: 'Metro and flyover work, pipeline digs, resurfacing and closures.' },
  Weather: { title: 'Flooding & weather', text: 'Waterlogging, landslides, fog and storm warnings.' },
  Emergency: { title: 'Emergencies', text: 'Fires, collapses, VIP movement and public-safety incidents.' },
}

const STEPS = [
  {
    img: '/images/step-report.webp',
    alt: 'A citizen reporting a road hazard on their phone',
    title: 'Disruptions are reported',
    text: 'Agencies publish official alerts. Citizens report what they see, and officials verify it with AI triage.',
  },
  {
    img: '/images/step-analyse.webp',
    alt: 'AI analysing alerts along a route on a city map',
    title: 'AI analyses your route',
    text: 'Every alert along your corridor is scored by distance, recency and severity to find the best way through.',
  },
  {
    img: '/images/step-route.webp',
    alt: 'A car following a safe route around a closed road',
    title: 'You get a clear plan',
    text: 'A briefing, a risk score and turn-by-turn navigation around affected areas — before you leave home.',
  },
]

const FAQS = [
  {
    q: 'What is SRANS?',
    a: 'SRANS (Smart Regional Alert & Navigation System) is a free web platform that combines official and citizen-reported alerts for road construction, utility work, traffic diversions, flooding and emergencies with AI-powered route guidance for daily commuters.',
  },
  {
    q: 'How does the AI choose a safer route?',
    a: 'SRANS checks live alerts along the corridor between your start and destination, scores the route from 0 to 100 based on how close, how recent and how severe each disruption is, and uses a large language model on Groq to explain the risk and recommend when to leave or which areas to avoid.',
  },
  {
    q: 'Who publishes the alerts?',
    a: 'Verified government agencies publish official alerts. Citizens can report incidents, which officials review — with AI triage — before they become public alerts.',
  },
  {
    q: 'Is SRANS free to use?',
    a: 'Yes. Browsing the live map and alerts is open to everyone. A free account unlocks saved routes, AI briefings, route risk scores and the AI travel assistant.',
  },
  {
    q: 'Can my department use SRANS?',
    a: 'Yes. Register a government account with your agency details. Once an administrator verifies it, you get the Command Center, AI alert drafting, report triage and analytics.',
  },
]

export default function HomePage() {
  const [live, setLive] = useState<Alert[] | null>(null)
  const [showcase, setShowcase] = useState(true)

  useEffect(() => {
    getAlerts()
      .then(res => setLive(Array.isArray(res.data) ? res.data.slice(0, 4) : []))
      .catch(() => setLive([]))
  }, [])

  const faqJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: FAQS.map(f => ({
      '@type': 'Question',
      name: f.q,
      acceptedAnswer: { '@type': 'Answer', text: f.a },
    })),
  }

  return (
    <>
      <Seo path="/" />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />

      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <section className="lp-hero" aria-labelledby="hero-title">
        <div className="lp-hero-grid-bg" aria-hidden="true" />
        <div className="container lp-hero-inner">
          <div className="lp-hero-copy">
            <span className="lp-pill">
              <span className="live-dot" aria-hidden="true" /> Live regional monitoring · AI-powered
            </span>
            <h1 id="hero-title">
              Navigate around disruptions <span className="lp-accent">before they reach you.</span>
            </h1>
            <p className="lp-lead">
              SRANS brings road construction, utility work, diversions and flood alerts into one live map — and uses
              AI to tell you which route is safest and when to leave.
            </p>
            <div className="btn-group lp-hero-ctas">
              <Link to="/register" className="btn btn-signal btn-lg">
                Get started free <i className="fas fa-arrow-right" aria-hidden="true"></i>
              </Link>
              <Link to="/map" className="btn btn-outline-white btn-lg">
                <i className="fas fa-map-location-dot" aria-hidden="true"></i> Explore live map
              </Link>
            </div>
            <ul className="lp-hero-points">
              <li><i className="fas fa-circle-check" aria-hidden="true"></i> Official agency alerts</li>
              <li><i className="fas fa-circle-check" aria-hidden="true"></i> Citizen reports, AI-triaged</li>
              <li><i className="fas fa-circle-check" aria-hidden="true"></i> Free for commuters</li>
            </ul>
          </div>

          {/* Hero visual: real street photo with live product cards on top */}
          <div className="lp-preview" aria-hidden="true">
            <figure className="lp-photo">
              <img
                src="/images/hero-poster.webp"
                alt=""
                width={1920}
                height={1080}
                fetchPriority="high"
                decoding="async"
              />
              <span className="lp-photo-tag"><span className="live-dot" /> Live · Metro work zone</span>
              <span className="lp-photo-marker">
                <span className="lp-photo-ring" />
                <i className="fas fa-helmet-safety"></i>
              </span>
            </figure>

            <div className="lp-float lp-float-brief">
              <div className="flex-between mb-2">
                <AiChip label="Morning briefing" />
                <span className="lp-float-time">7:42 AM</span>
              </div>
              <p className="lp-float-title">Minor disruptions on your way to work</p>
              <ul>
                <li>Pipeline work narrows the main road near the university</li>
                <li>Waterlogging reported at the railway underpass</li>
                <li>Leave by <strong>8:10 AM</strong> to arrive on time</li>
              </ul>
            </div>

            <div className="lp-float lp-float-risk">
              <div className="risk-gauge risk-moderate" style={{ ['--risk' as string]: 38 }} data-score="38" />
              <div>
                <p className="lp-float-label">Home → Office</p>
                <p className="risk-label risk-moderate">Moderate risk</p>
                <p className="lp-float-sub">2 alerts within 2 km of route</p>
              </div>
            </div>
          </div>
        </div>

        {/* Real, live alerts from the public feed */}
        {live && live.length > 0 && (
          <div className="container">
            <div className="lp-live">
              <div className="lp-live-label">
                <span className="live-dot" aria-hidden="true" /> Live now
              </div>
              <ul className="lp-live-list">
                {live.map(a => (
                  <li key={a.id}>
                    <Link to="/alerts" className="lp-live-item">
                      <TypeIcon type={a.alert_type} size={30} />
                      <span className="lp-live-text">
                        <span className="lp-live-title">{a.title}</span>
                        <span className="lp-live-meta">{typeMeta(a.alert_type).label} · {timeAgo(a.created_at)}</span>
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </section>

      {/* ── Built for ───────────────────────────────────────────────────── */}
      <section className="lp-audience-strip" aria-label="Who SRANS is for">
        <div className="container">
          <p>Built for</p>
          <ul>
            <li><i className="fas fa-person-walking-luggage" aria-hidden="true"></i> Daily commuters</li>
            <li><i className="fas fa-building-columns" aria-hidden="true"></i> Municipal corporations</li>
            <li><i className="fas fa-traffic-light" aria-hidden="true"></i> Traffic police</li>
            <li><i className="fas fa-house-flood-water" aria-hidden="true"></i> Disaster management cells</li>
            <li><i className="fas fa-plug-circle-bolt" aria-hidden="true"></i> Utility departments</li>
          </ul>
        </div>
      </section>

      {/* ── Hazard categories: image-led cards ─────────────────────────── */}
      <section className="lp-section" aria-labelledby="hazards-title">
        <div className="container">
          <div className="lp-head-row">
            <div>
              <span className="eyebrow">One map for every disruption</span>
              <h2 id="hazards-title">Every reason your road might be blocked today</h2>
            </div>
            <p>
              Four colour-coded categories, published by verified agencies and confirmed citizen reports — all on one live map.
            </p>
          </div>
          <ul className="lp-hz-row">
            {ALERT_TYPES.map(t => {
              const m = typeMeta(t)
              return (
                <li key={t}>
                  <Link to="/alerts" className="lp-hz" style={{ ['--hz' as string]: m.color }}>
                    <OptionalImg
                      className="lp-hz-img"
                      src={`/images/hazard-${t.toLowerCase()}.webp`}
                      alt={`${m.label} disruption on a city road`}
                      width={640}
                      height={800}
                    />
                    <span className="lp-hz-shade" aria-hidden="true" />
                    <span className="lp-hz-chip"><i className={`fas ${m.icon}`} aria-hidden="true"></i> {m.label}</span>
                    <span className="lp-hz-body">
                      <span className="lp-hz-title">{HAZARD_COPY[t].title}</span>
                      <span className="lp-hz-text">{HAZARD_COPY[t].text}</span>
                    </span>
                  </Link>
                </li>
              )
            })}
          </ul>
        </div>
      </section>

      {/* ── AI for commuters: split layout ─────────────────────────────── */}
      <section className="lp-section lp-ai" aria-labelledby="ai-title">
        <div className="container lp-ai-split">
          <div className="lp-ai-intro">
            <AiChip label="Powered by Groq AI" onLight />
            <h2 id="ai-title">An AI co-pilot for your daily commute</h2>
            <p>SRANS reads every live alert so you don&apos;t have to — and turns hundreds of notices into one clear decision.</p>
            <figure className="lp-ai-figure">
              <OptionalImg src="/images/features-ai.webp" alt="AI connecting live alerts to a safe route" width={1280} height={960} />
            </figure>
            <Link to="/register" className="btn btn-ink btn-lg">
              Try the AI features free <i className="fas fa-arrow-right" aria-hidden="true"></i>
            </Link>
          </div>
          <ul className="lp-ai-list">
            {COMMUTER_AI.map(f => (
              <li key={f.title}>
                <span className="lp-ai-icon" aria-hidden="true"><i className={`fas ${f.icon}`}></i></span>
                <div>
                  <h3>{f.title}</h3>
                  <p>{f.text}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ── How it works ───────────────────────────────────────────────── */}
      <section className="lp-section" aria-labelledby="how-title">
        <div className="container">
          <div className="lp-head-row">
            <div>
              <span className="eyebrow">How SRANS works</span>
              <h2 id="how-title">From road disruption to safe route in seconds</h2>
            </div>
            <p>Three steps connect the people who fix the roads with the people who use them.</p>
          </div>
          <ol className="lp-steps">
            {STEPS.map((s, i) => (
              <li key={s.title}>
                <div className="lp-step-media">
                  <OptionalImg className="lp-step-img" src={s.img} alt={s.alt} width={640} height={400} />
                  <span className="lp-step-num">0{i + 1}</span>
                </div>
                <h3>{s.title}</h3>
                <p>{s.text}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* ── Product showcase (renders only once the screenshot exists) ───── */}
      {showcase && (
        <section className="lp-showcase" aria-labelledby="showcase-title">
          <div className="container">
            <div className="lp-section-head">
              <span className="eyebrow">See it in action</span>
              <h2 id="showcase-title">Your commute, briefed in one screen</h2>
              <p>Today&apos;s AI briefing, route risk scores and nearby alerts — the first thing you see when you sign in.</p>
            </div>
            <div className="lp-showcase-frame">
              <div className="lp-showcase-bar" aria-hidden="true"><span /><span /><span /></div>
              <OptionalImg
                src="/images/screenshot-today.webp"
                alt="SRANS Today screen showing an AI commute briefing, route risk scores and nearby alerts"
                width={1600}
                height={1000}
                onMissing={() => setShowcase(false)}
              />
            </div>
          </div>
        </section>
      )}

      {/* ── For agencies: split with framed photo ───────────────────────── */}
      <section className="lp-agency" aria-labelledby="agency-title">
        <div className="container lp-agency-inner">
          <div className="lp-agency-copy">
            <span className="eyebrow on-dark">For government agencies</span>
            <h2 id="agency-title">A command center for your city&apos;s roads</h2>
            <p>
              Publish alerts in seconds, review citizen reports with AI assistance and brief your control room with a live
              situation report — all from one dashboard.
            </p>
            <ul className="lp-agency-list">
              {AGENCY_AI.map(f => (
                <li key={f.title}>
                  <span className="lp-agency-icon" aria-hidden="true"><i className={`fas ${f.icon}`}></i></span>
                  <div>
                    <h3>{f.title}</h3>
                    <p>{f.text}</p>
                  </div>
                </li>
              ))}
            </ul>
            <Link to="/register" className="btn btn-signal btn-lg">
              Register your agency <i className="fas fa-arrow-right" aria-hidden="true"></i>
            </Link>
          </div>
          <figure className="lp-agency-figure">
            <OptionalImg src="/images/agency-control-room.webp" alt="City traffic and disaster-management control room" width={1920} height={1080} />
            <figcaption className="lp-agency-badge">
              <span className="ai-chip"><i className="fas fa-wand-magic-sparkles" aria-hidden="true"></i> AI situation report</span>
              <strong>Rain-related waterlogging is slowing two arterial roads.</strong>
              <span>3 recommended actions · generated from live alerts</span>
            </figcaption>
          </figure>
        </div>
      </section>

      {/* ── FAQ: two columns ───────────────────────────────────────────── */}
      <section className="lp-section" aria-labelledby="faq-title">
        <div className="container lp-faq">
          <div className="lp-faq-side">
            <span className="eyebrow">FAQ</span>
            <h2 id="faq-title">Questions, answered</h2>
            <p>Can&apos;t find what you need? Our team replies within one working day.</p>
            <Link to="/contact" className="btn btn-secondary">Contact us</Link>
          </div>
          <div className="lp-faq-list">
            {FAQS.map((f, i) => (
              <details key={f.q} className="lp-faq-item" open={i === 0}>
                <summary>
                  <h3>{f.q}</h3>
                  <i className="fas fa-plus" aria-hidden="true"></i>
                </summary>
                <p>{f.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>
    </>
  )
}
