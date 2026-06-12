import React, { useState } from 'react'

export default function ContactPage() {
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitted(true)
    setTimeout(() => setSubmitted(false), 5000)
  }

  return (
    <>
      {/* Hero */}
      <div className="page-header bg-white" style={{ paddingTop: 'var(--space-16)', paddingBottom: 'var(--space-16)' }}>
        <div className="container text-center" style={{ maxWidth: '600px', margin: '0 auto' }}>
          <div className="icon-box primary mb-6 mx-auto" style={{ width: '56px', height: '56px', fontSize: '24px', margin: '0 auto var(--space-6)' }}>
            <i className="fas fa-envelope-open-text"></i>
          </div>
          <h1 className="font-display font-bold" style={{ fontSize: 'var(--text-4xl)', marginBottom: 'var(--space-4)' }}>Get In Touch</h1>
          <p className="text-secondary text-lg">Have a question or want to collaborate? We'd love to hear from you.</p>
        </div>
      </div>

      {/* Contact Section */}
      <section className="section pt-0">
        <div className="container" style={{ maxWidth: '1100px', margin: '0 auto' }}>
          <div className="grid contact-grid" style={{ gap: 'var(--space-8)', alignItems: 'start' }}>

            {/* Form */}
            <div className="card">
              <div className="card-header">
                <h3>Send a Message</h3>
              </div>
              <div className="card-body">
                <p className="text-secondary text-sm mb-6">Fill out the form and we'll get back to you within 24 hours.</p>

                {submitted && (
                  <div className="alert-banner is-success mb-6">
                    <i className="fas fa-check-circle"></i>
                    <div>
                      <strong>Message sent!</strong>
                      <p className="mt-1">We'll get back to you shortly.</p>
                    </div>
                    <button className="btn-icon btn-sm btn-ghost ml-auto" onClick={() => setSubmitted(false)}>
                      <i className="fas fa-times"></i>
                    </button>
                  </div>
                )}

                <form onSubmit={handleSubmit}>
                  <div className="grid grid-2 mb-0">
                    <div className="field">
                      <label className="label">Name</label>
                      <div className="input-icon">
                        <i className="fas fa-user icon-left"></i>
                        <input className="input" type="text" placeholder="Your name" required />
                      </div>
                    </div>
                    <div className="field">
                      <label className="label">Email</label>
                      <div className="input-icon">
                        <i className="fas fa-envelope icon-left"></i>
                        <input className="input" type="email" placeholder="Your email" required />
                      </div>
                    </div>
                  </div>

                  <div className="field">
                    <label className="label">Subject</label>
                    <div className="select-wrapper">
                      <select className="input select-field">
                        <option>General Inquiry</option>
                        <option>Technical Support</option>
                        <option>Partnership</option>
                        <option>Government Registration</option>
                        <option>Feedback</option>
                      </select>
                    </div>
                  </div>

                  <div className="field">
                    <label className="label">Message</label>
                    <textarea className="textarea" placeholder="Write your message here..." rows={5} required></textarea>
                  </div>

                  <div className="field">
                    <label className="flex gap-2 items-center text-sm text-secondary cursor-pointer">
                      <input type="checkbox" required style={{ accentColor: 'var(--color-primary)' }} />
                      <span>I agree to the <a href="#">privacy policy</a> and <a href="#">terms of service</a></span>
                    </label>
                  </div>

                  <button type="submit" className="btn btn-primary btn-full btn-lg mt-2">
                    <i className="fas fa-paper-plane"></i> Send Message
                  </button>
                </form>
              </div>
            </div>

            {/* Info Column */}
            <div className="flex-col gap-6">
              <div className="card">
                <div className="card-header"><h3>Contact Information</h3></div>
                <div className="card-body">
                  <div className="flex-col gap-5">
                    {[
                      { icon: 'fa-envelope', label: 'Email', value: 'sairajjadhav433@gmail.com', href: 'mailto:sairajjadhav433@gmail.com' },
                      { icon: 'fa-phone', label: 'Phone', value: '+91-9356860010', href: 'tel:+919356860010' },
                      { icon: 'fa-map-marker-alt', label: 'Location', value: 'Pune, Maharashtra, India' },
                      { icon: 'fa-clock', label: 'Availability', value: 'Mon – Fri, 9 AM – 6 PM IST' },
                    ].map((item, i) => (
                      <div key={i} className="flex gap-4 items-start">
                        <div className="icon-box-sm primary" style={{ flexShrink: 0 }}>
                          <i className={`fas ${item.icon}`}></i>
                        </div>
                        <div>
                          <p className="text-xs text-muted font-medium mb-1" style={{ textTransform: 'uppercase', letterSpacing: '0.05em' }}>{item.label}</p>
                          {item.href ? (
                            <a href={item.href} className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>{item.value}</a>
                          ) : (
                            <p className="font-semibold text-sm">{item.value}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="card">
                <div className="card-header"><h3>Connect With Me</h3></div>
                <div className="card-body">
                  <div className="flex gap-3 flex-wrap">
                    {[
                      { icon: 'fab fa-github', href: 'https://github.com/SairajJadhav08', label: 'GitHub' },
                      { icon: 'fab fa-linkedin-in', href: 'https://www.linkedin.com/in/sairaj-jadhav-/', label: 'LinkedIn' },
                      { icon: 'fab fa-instagram', href: 'https://www.instagram.com/sairajjadhav08/', label: 'Instagram' },
                      { icon: 'fab fa-x-twitter', href: 'https://x.com/BuildsbySairaj', label: 'X / Twitter' },
                    ].map((s, i) => (
                      <a key={i} href={s.href} target="_blank" rel="noreferrer" className="social-icon" title={s.label}>
                        <i className={s.icon}></i>
                      </a>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="section bg-subtle">
        <div className="container" style={{ maxWidth: '900px', margin: '0 auto' }}>
          <h2 className="font-display font-bold text-3xl text-center mb-8" style={{ marginBottom: 'var(--space-10)' }}>Frequently Asked Questions</h2>

          <div className="grid grid-2">
            {[
              { q: 'How do I report an inaccurate alert?', a: 'Contact us immediately via the form above or email sairajjadhav433@gmail.com with details about the alert.', icon: 'fa-flag' },
              { q: 'How can my government agency become a partner?', a: 'Select "Partnership" in the contact form and our team will reach out to discuss collaboration opportunities.', icon: 'fa-handshake' },
              { q: 'Is the service available in my region?', a: 'We are continually expanding coverage. Contact us to inquire about availability or request expansion.', icon: 'fa-globe' },
              { q: 'How do I get technical support?', a: 'Select "Technical Support" in the form. We typically respond within 24 hours on business days.', icon: 'fa-headset' },
            ].map((faq, i) => (
              <div key={i} className="card h-full">
                <div className="card-body">
                  <div className="flex gap-4 items-start">
                    <div className="icon-box-sm primary" style={{ flexShrink: 0 }}>
                      <i className={`fas ${faq.icon}`}></i>
                    </div>
                    <div>
                      <h4 className="font-semibold mb-2">{faq.q}</h4>
                      <p className="text-secondary text-sm" style={{ lineHeight: 1.6 }}>{faq.a}</p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  )
}
