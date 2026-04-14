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
      <section className="hero is-primary is-medium">
        <div className="hero-body">
          <div className="container has-text-centered">
            <span className="icon is-large mb-4" style={{ fontSize: '3rem', opacity: 0.9 }}>
              <i className="fas fa-envelope-open-text"></i>
            </span>
            <h1 className="title is-1 mt-3">Get In Touch</h1>
            <h2 className="subtitle is-5 mt-2" style={{ opacity: 0.85 }}>
              Have a question or want to collaborate? We'd love to hear from you.
            </h2>
          </div>
        </div>
      </section>

      {/* Main Contact Section */}
      <section className="section">
        <div className="container">
          <div className="columns is-centered">
            <div className="column is-10">
              <div className="columns is-variable is-6">

                {/* Contact Form */}
                <div className="column is-7">
                  <div className="card">
                    <div className="card-content p-5">
                      <h3 className="title is-4 mb-1">Send a Message</h3>
                      <p className="subtitle is-6 has-text-grey mb-5">Fill out the form and I'll get back to you shortly.</p>

                      {submitted && (
                        <div className="notification is-success is-light mb-4">
                          <button className="delete" onClick={() => setSubmitted(false)}></button>
                          <span className="icon-text">
                            <span className="icon"><i className="fas fa-check-circle"></i></span>
                            <span>Message sent! I'll get back to you soon.</span>
                          </span>
                        </div>
                      )}

                      <form onSubmit={handleSubmit}>
                        <div className="columns">
                          <div className="column">
                            <div className="field">
                              <label className="label">Name</label>
                              <div className="control has-icons-left">
                                <input className="input" type="text" placeholder="Your name" required />
                                <span className="icon is-small is-left"><i className="fas fa-user"></i></span>
                              </div>
                            </div>
                          </div>
                          <div className="column">
                            <div className="field">
                              <label className="label">Email</label>
                              <div className="control has-icons-left">
                                <input className="input" type="email" placeholder="Your email" required />
                                <span className="icon is-small is-left"><i className="fas fa-envelope"></i></span>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="field">
                          <label className="label">Subject</label>
                          <div className="control has-icons-left">
                            <div className="select is-fullwidth">
                              <select>
                                <option>General Inquiry</option>
                                <option>Technical Support</option>
                                <option>Partnership</option>
                                <option>Government Registration</option>
                                <option>Feedback</option>
                              </select>
                            </div>
                            <span className="icon is-small is-left"><i className="fas fa-tag"></i></span>
                          </div>
                        </div>

                        <div className="field">
                          <label className="label">Message</label>
                          <div className="control">
                            <textarea className="textarea" placeholder="Write your message here..." rows={5} required></textarea>
                          </div>
                        </div>

                        <div className="field">
                          <div className="control">
                            <label className="checkbox">
                              <input type="checkbox" required />
                              {' '}I agree to the <a href="#">privacy policy</a> and <a href="#">terms of service</a>
                            </label>
                          </div>
                        </div>

                        <div className="field mt-4">
                          <div className="control">
                            <button type="submit" className="button is-primary is-fullwidth">
                              <span className="icon"><i className="fas fa-paper-plane"></i></span>
                              <span>Send Message</span>
                            </button>
                          </div>
                        </div>
                      </form>
                    </div>
                  </div>
                </div>

                {/* Contact Info */}
                <div className="column is-5">
                  <div className="card mb-4">
                    <div className="card-content p-5">
                      <h3 className="title is-4 mb-4">Contact Information</h3>

                      <div className="contact-info-card">
                        <div className="contact-info-icon">
                          <i className="fas fa-envelope"></i>
                        </div>
                        <div className="contact-info-text">
                          <small>Email</small>
                          <strong>
                            <a href="mailto:sairajjadhav433@gmail.com" style={{ color: 'inherit' }}>
                              sairajjadhav433@gmail.com
                            </a>
                          </strong>
                        </div>
                      </div>

                      <div className="contact-info-card">
                        <div className="contact-info-icon">
                          <i className="fas fa-phone"></i>
                        </div>
                        <div className="contact-info-text">
                          <small>Phone</small>
                          <strong>
                            <a href="tel:+919356860010" style={{ color: 'inherit' }}>
                              +91-9356860010
                            </a>
                          </strong>
                        </div>
                      </div>

                      <div className="contact-info-card">
                        <div className="contact-info-icon">
                          <i className="fas fa-map-marker-alt"></i>
                        </div>
                        <div className="contact-info-text">
                          <small>Location</small>
                          <strong>Pune, Maharashtra, India</strong>
                        </div>
                      </div>

                      <div className="contact-info-card">
                        <div className="contact-info-icon">
                          <i className="fas fa-clock"></i>
                        </div>
                        <div className="contact-info-text">
                          <small>Availability</small>
                          <strong>Mon – Fri, 9 AM – 6 PM IST</strong>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Social Links */}
                  <div className="card">
                    <div className="card-content p-5">
                      <h4 className="title is-5 mb-4">Connect With Me</h4>
                      <div className="is-flex is-flex-wrap-wrap" style={{ gap: '8px' }}>
                        <a href="https://github.com/SairajJadhav08" target="_blank" rel="noreferrer" className="social-btn" title="GitHub">
                          <i className="fab fa-github"></i>
                        </a>
                        <a href="https://www.linkedin.com/in/sairaj-jadhav-/" target="_blank" rel="noreferrer" className="social-btn" title="LinkedIn">
                          <i className="fab fa-linkedin-in"></i>
                        </a>
                        <a href="https://www.instagram.com/sairajjadhav08/" target="_blank" rel="noreferrer" className="social-btn" title="Instagram">
                          <i className="fab fa-instagram"></i>
                        </a>
                        <a href="https://x.com/BuildsbySairaj" target="_blank" rel="noreferrer" className="social-btn" title="X / Twitter">
                          <i className="fab fa-x-twitter"></i>
                        </a>
                      </div>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="section has-background-light">
        <div className="container">
          <h3 className="title is-3 has-text-centered mb-6">Frequently Asked Questions</h3>
          <div className="columns is-centered">
            <div className="column is-10">
              <div className="columns is-multiline">
                {[
                  {
                    q: 'How do I report an inaccurate alert?',
                    a: 'Contact us immediately via the form above or email sairajjadhav433@gmail.com with details about the alert.',
                    icon: 'fa-flag'
                  },
                  {
                    q: 'How can my government agency become a partner?',
                    a: 'Select "Partnership" in the contact form and our team will reach out to discuss collaboration opportunities.',
                    icon: 'fa-handshake'
                  },
                  {
                    q: 'Is the service available in my region?',
                    a: 'We are continually expanding coverage. Contact us to inquire about availability or request expansion.',
                    icon: 'fa-globe'
                  },
                  {
                    q: 'How do I get technical support?',
                    a: 'Select "Technical Support" in the form. We typically respond within 24 hours on business days.',
                    icon: 'fa-headset'
                  },
                ].map((faq, i) => (
                  <div className="column is-6" key={i}>
                    <div className="box" style={{ height: '100%' }}>
                      <div className="is-flex" style={{ gap: '12px' }}>
                        <span style={{
                          width: 36, height: 36, borderRadius: 8, flexShrink: 0,
                          background: 'linear-gradient(135deg,#4a7bab,#2c4c7c)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white'
                        }}>
                          <i className={`fas ${faq.icon}`}></i>
                        </span>
                        <div>
                          <p className="has-text-weight-semibold mb-1">{faq.q}</p>
                          <p className="is-size-6 has-text-grey">{faq.a}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
