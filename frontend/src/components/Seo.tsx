import { useEffect } from 'react'

export const SITE_URL = 'https://srans-smart-regional-alert-and-navi.vercel.app'
const DEFAULT_TITLE = 'SRANS — AI Traffic Alerts & Smart Route Navigation'
const DEFAULT_DESCRIPTION =
  'SRANS is an AI-powered regional alert and navigation platform. Get live alerts for road construction, utility work, diversions and flooding, and AI-recommended safe routes for your daily commute.'

interface SeoProps {
  title?: string
  description?: string
  path?: string
  /** Signed-in and private screens should not be indexed */
  noindex?: boolean
}

function setMeta(attr: 'name' | 'property', key: string, content: string) {
  let el = document.head.querySelector<HTMLMetaElement>(`meta[${attr}="${key}"]`)
  if (!el) {
    el = document.createElement('meta')
    el.setAttribute(attr, key)
    document.head.appendChild(el)
  }
  el.setAttribute('content', content)
}

// Updates the static tags that ship in index.html so each route gets its own
// title, description, canonical URL and robots directive.
export default function Seo({ title, description, path, noindex }: SeoProps) {
  useEffect(() => {
    const fullTitle = title ? `${title} · SRANS` : DEFAULT_TITLE
    const desc = description ?? DEFAULT_DESCRIPTION
    const url = `${SITE_URL}${path ?? window.location.pathname}`

    document.title = fullTitle
    setMeta('name', 'description', desc)
    setMeta('property', 'og:title', fullTitle)
    setMeta('property', 'og:description', desc)
    setMeta('property', 'og:url', url)
    setMeta('name', 'twitter:title', fullTitle)
    setMeta('name', 'twitter:description', desc)
    setMeta('name', 'robots', noindex ? 'noindex, nofollow' : 'index, follow, max-image-preview:large')

    let canonical = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]')
    if (!canonical) {
      canonical = document.createElement('link')
      canonical.rel = 'canonical'
      document.head.appendChild(canonical)
    }
    canonical.href = url
  }, [title, description, path, noindex])

  return null
}
