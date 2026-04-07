import React from 'react'

export default function ContactPage() {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // Handle form submission logic here
    alert('Thank you for your message. We will get back to you soon!')
  }

  return (
    <>
      {/* Hero Section */}
      <section className="hero is-primary">
        <div className="hero-body">
          <div className="container has-text-centered">
            <h1 className="title is-1">Contact Us</h1>
            <h2 className="subtitle is-4">Get in touch with our team</h2>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section className="section">
        <div className="container">
          <div className="columns is-centered">
            <div className="column is-10">
              <div className="columns">
                {/* Contact Form */}
                <div className="column is-7">
                  <div className="card">
                    <div className="card-content">
                      <h3 className="title is-4 mb-5">Send us a Message</h3>

                      <form onSubmit={handleSubmit}>
                        <div className="field">
                          <label className="label">Name</label>
                          <div className="control has-icons-left">
                            <input className="input" type="text" name="name" placeholder="Your name" required />
                            <span className="icon is-small is-left">
                              <i className="fas fa-user"></i>
                            </span>
                          </div>
                        </div>

                        <div className="field">
                          <label className="label">Email</label>
                          <div className="control has-icons-left">
                            <input className="input" type="email" name="email" placeholder="Your email" required />
                            <span className="icon is-small is-left">
                              <i className="fas fa-envelope"></i>
                            </span>
                          </div>
                        </div>

                        <div className="field">
                          <label className="label">Subject</label>
                          <div className="control has-icons-left">
                            <div className="select is-fullwidth">
                              <select name="subject">
                                <option value="General Inquiry">General Inquiry</option>
                                <option value="Technical Support">Technical Support</option>
                                <option value="Partnership">Partnership</option>
                                <option value="Government Registration">Government Registration</option>
                                <option value="Feedback">Feedback</option>
                              </select>
                            </div>
                            <span className="icon is-small is-left">
                              <i className="fas fa-folder"></i>
                            </span>
                          </div>
                        </div>

                        <div className="field">
                          <label className="label">Message</label>
                          <div className="control">
                            <textarea className="textarea" name="message" placeholder="Your message" rows={5} required></textarea>
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

                        <div className="field">
                          <div className="control">
                            <button type="submit" className="button is-primary is-fullwidth">
                              <span className="icon">
                                <i className="fas fa-paper-plane"></i>
                              </span>
                              <span>Send Message</span>
                            </button>
                          </div>
                        </div>
                      </form>
                    </div>
                  </div>
                </div>

                {/* Contact Information */}
                <div className="column is-5">
                  <div className="card">
                    <div className="card-content">
                      <h3 className="title is-4 mb-5">Contact Information</h3>

                      <div className="content">
                        <div className="info-item mb-4">
                          <div className="is-flex">
                            <span className="icon has-text-primary mr-3">
                              <i className="fas fa-map-marker-alt fa-lg"></i>
                            </span>
                            <div>
                              <strong>Address</strong>
                              <p>123 Main Street<br />City, State 00000</p>
                            </div>
                          </div>
                        </div>

                        <div className="info-item mb-4">
                          <div className="is-flex">
                            <span className="icon has-text-primary mr-3">
                              <i className="fas fa-phone fa-lg"></i>
                            </span>
                            <div>
                              <strong>Phone</strong>
                              <p>+1-555-000-0000</p>
                            </div>
                          </div>
                        </div>

                        <div className="info-item mb-4">
                          <div className="is-flex">
                            <span className="icon has-text-primary mr-3">
                              <i className="fas fa-envelope fa-lg"></i>
                            </span>
                            <div>
                              <strong>Email</strong>
                              <p>contact@example.com</p>
                            </div>
                          </div>
                        </div>

                        <div className="info-item mb-4">
                          <div className="is-flex">
                            <span className="icon has-text-primary mr-3">
                              <i className="fas fa-clock fa-lg"></i>
                            </span>
                            <div>
                              <strong>Hours</strong>
                              <p>Monday - Friday: 9:00 AM - 5:00 PM<br />Saturday &amp; Sunday: Closed</p>
                            </div>
                          </div>
                        </div>
                      </div>

                      <hr />

                      <h4 className="title is-5">Connect With Us</h4>
                      <div className="social-icons has-text-centered">
                        <a href="https://github.com/SairajJadhav08" target="_blank" rel="noreferrer" className="icon is-large has-text-dark">
                          <i className="fab fa-github fa-2x"></i>
                        </a>
                        <a href="https://www.linkedin.com/in/sairaj-jadhav-/" target="_blank" rel="noreferrer" className="icon is-large has-text-link">
                          <i className="fab fa-linkedin fa-2x"></i>
                        </a>
                        <a href="https://www.instagram.com/sairajjadhav08/" target="_blank" rel="noreferrer" className="icon is-large has-text-danger">
                          <i className="fab fa-instagram fa-2x"></i>
                        </a>
                        <a href="https://x.com/BuildsbySairaj" target="_blank" rel="noreferrer" className="icon is-large has-text-dark">
                          <i className="fab fa-x-twitter fa-2x"></i>
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

      {/* FAQ Section */}
      <section className="section">
        <div className="container">
          <h3 className="title is-3 has-text-centered mb-6">Frequently Asked Questions</h3>

          <div className="columns is-centered">
            <div className="column is-10">
              <div className="content">
                <div className="box mb-4">
                  <h4 className="title is-5">How do I report an inaccurate alert?</h4>
                  <p>If you notice an alert that contains inaccurate information, please contact us immediately through the form above or email us at <a href="mailto:sairajjadhav433@gmail.com">sairajjadhav433@gmail.com</a> with details about the alert.</p>
                </div>

                <div className="box mb-4">
                  <h4 className="title is-5">How can my government agency become a partner?</h4>
                  <p>We welcome partnerships with government agencies. Please select "Partnership" in the contact form above, and our team will reach out to discuss collaboration opportunities.</p>
                </div>

                <div className="box mb-4">
                  <h4 className="title is-5">Is the service available in my region?</h4>
                  <p>We are continually expanding our coverage. Contact us to inquire about availability in your specific region or to request service expansion.</p>
                </div>

                <div className="box">
                  <h4 className="title is-5">How do I get technical support?</h4>
                  <p>For technical issues or questions, select "Technical Support" in the contact form. Our support team typically responds within 24 hours on business days.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
