import { useState } from 'react'
import type { FormEvent } from 'react'
import { sendContact } from '../api'
import Seo from '../components/Seo'
import '../styles/pages/marketing.css'

const SUBJECTS = ['General question', 'Agency onboarding', 'Report a problem', 'Partnership', 'Feedback']

const FAQ = [
  { q: 'How do I get my agency verified?', a: 'Register a government account with your agency and department, then contact us from your official email. An administrator verifies the account, usually within one working day.' },
  { q: 'An alert on the map is wrong or outdated.', a: 'Use “Report a problem” below with the alert title and location, or report it from the app. The publishing agency is notified to correct or remove it.' },
  { q: 'Which cities does SRANS cover?', a: 'SRANS works anywhere OpenStreetMap does. Alert coverage depends on the agencies and citizens publishing in your region.' },
]

export default function ContactPage() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [subject, setSubject] = useState(SUBJECTS[0])
  const [message, setMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setSending(true)
    setError(null)
    try {
      await sendContact({ name: name.trim(), email: email.trim(), subject, message: message.trim() })
      setSent(true)
      setName(''); setEmail(''); setMessage(''); setSubject(SUBJECTS[0])
    } catch (err) {
      setError(err instanceof Error && err.message ? err.message : 'Could not send your message. Please email us directly.')
    } finally {
      setSending(false)
    }
  }

  return (
    <>
      <Seo
        title="Contact SRANS — Support & Agency Onboarding"
        description="Contact the SRANS team for support, government agency onboarding, partnerships or feedback. Based in Pune, Maharashtra, India."
        path="/contact"
      />

      <section className="mk-hero" style={{ paddingBottom: 'var(--space-20)' }}>
        <div className="container">
          <span className="eyebrow on-dark">Contact</span>
          <h1>Let’s talk</h1>
          <p className="mk-lead">Questions, agency onboarding or feedback on an alert — we reply within one working day.</p>
        </div>
      </section>

      <section className="mk-section" style={{ paddingTop: 0 }}>
        <div className="container mk-contact">
          <div className="mk-contact-card">
            {sent ? (
              <div className="empty-state" role="status">
                <div className="empty-state-icon" style={{ background: 'var(--color-primary-light)', color: 'var(--color-primary-strong)' }} aria-hidden="true">
                  <i className="fas fa-paper-plane"></i>
                </div>
                <h2 style={{ fontSize: 'var(--text-xl)', fontWeight: 800 }}>Message sent</h2>
                <p>Thanks for reaching out. We will get back to you within one working day.</p>
                <button type="button" className="btn btn-secondary" onClick={() => setSent(false)}>Send another message</button>
              </div>
            ) : (
              <form onSubmit={submit}>
                <h2 className="mb-2" style={{ fontSize: 'var(--text-xl)', fontWeight: 800 }}>Send us a message</h2>
                <p className="text-secondary text-sm mb-6">All fields are required.</p>

                {error && (
                  <div className="alert-banner is-danger mb-5" role="alert">
                    <i className="fas fa-circle-exclamation" aria-hidden="true"></i><span>{error}</span>
                  </div>
                )}

                <div className="grid grid-2" style={{ gap: 'var(--space-4)' }}>
                  <div className="field mb-0">
                    <label className="label" htmlFor="c-name">Name</label>
                    <input id="c-name" className="input" autoComplete="name" value={name} onChange={e => setName(e.target.value)} required />
                  </div>
                  <div className="field mb-0">
                    <label className="label" htmlFor="c-email">Email</label>
                    <input id="c-email" className="input" type="email" autoComplete="email" value={email} onChange={e => setEmail(e.target.value)} required />
                  </div>
                </div>

                <div className="field mt-4">
                  <span className="label" id="c-subject-label">Topic</span>
                  <div className="pill-filters" role="radiogroup" aria-labelledby="c-subject-label">
                    {SUBJECTS.map(s => (
                      <button key={s} type="button" role="radio" aria-checked={subject === s}
                        className={`pill${subject === s ? ' active' : ''}`} onClick={() => setSubject(s)}>{s}</button>
                    ))}
                  </div>
                </div>

                <div className="field">
                  <label className="label" htmlFor="c-message">Message</label>
                  <textarea id="c-message" className="textarea" rows={5} value={message} onChange={e => setMessage(e.target.value)}
                    placeholder="How can we help?" maxLength={2000} required />
                </div>

                <button type="submit" className="btn btn-primary btn-lg btn-full" disabled={sending}>
                  {sending ? <span className="spinner" /> : <>Send message <i className="fas fa-paper-plane" aria-hidden="true"></i></>}
                </button>
              </form>
            )}
          </div>

          <aside className="mk-contact-info" aria-label="Contact details">
            <div className="mk-contact-item">
              <span className="mk-card-icon ink" aria-hidden="true"><i className="fas fa-envelope"></i></span>
              <div>
                <h3>Email</h3>
                <a href="mailto:sairajjadhav433@gmail.com">sairajjadhav433@gmail.com</a>
              </div>
            </div>
            <div className="mk-contact-item">
              <span className="mk-card-icon ink" aria-hidden="true"><i className="fas fa-phone"></i></span>
              <div>
                <h3>Phone</h3>
                <a href="tel:+919356860010">+91-9356860010</a>
                <p>Mon–Sat, 10:00–18:00 IST</p>
              </div>
            </div>
            <div className="mk-contact-item">
              <span className="mk-card-icon ink" aria-hidden="true"><i className="fas fa-location-dot"></i></span>
              <div>
                <h3>Location</h3>
                <p>Pune, Maharashtra, India</p>
              </div>
            </div>

            <div className="mk-contact-card" style={{ padding: 'var(--space-5)', boxShadow: 'none' }}>
              <h2 className="mb-3" style={{ fontSize: 'var(--text-base)', fontWeight: 800 }}>Common questions</h2>
              <div className="flex-col gap-2">
                {FAQ.map(f => (
                  <details key={f.q} className="lp-faq-item" style={{ padding: 'var(--space-3) var(--space-4)' }}>
                    <summary><h3 style={{ fontSize: 'var(--text-sm)' }}>{f.q}</h3><i className="fas fa-plus" aria-hidden="true"></i></summary>
                    <p>{f.a}</p>
                  </details>
                ))}
              </div>
            </div>
          </aside>
        </div>
      </section>
    </>
  )
}
