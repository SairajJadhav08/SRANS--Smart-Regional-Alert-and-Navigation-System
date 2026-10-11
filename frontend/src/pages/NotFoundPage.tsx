import { Link } from 'react-router-dom'
import Seo from '../components/Seo'

export default function NotFoundPage() {
  return (
    <section className="section">
      <Seo title="Page not found" noindex />
      <div className="container" style={{ maxWidth: 560, textAlign: 'center', padding: 'var(--space-16) var(--space-6)' }}>
        <p className="eyebrow mb-4" style={{ justifyContent: 'center' }}>Error 404</p>
        <h1 style={{ fontSize: 'var(--text-4xl)', fontWeight: 800, letterSpacing: '-0.03em', marginBottom: 'var(--space-4)' }}>
          This road doesn&apos;t exist.
        </h1>
        <p className="text-secondary mb-8">
          The page you are looking for has moved or never existed. Let&apos;s get you back on a safe route.
        </p>
        <div className="btn-group" style={{ justifyContent: 'center' }}>
          <Link to="/" className="btn btn-primary btn-lg">Back to home</Link>
          <Link to="/map" className="btn btn-secondary btn-lg">Open live map</Link>
        </div>
      </div>
    </section>
  )
}
