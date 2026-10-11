// Single source of truth for how each alert type looks across the app.
export interface AlertTypeMeta {
  label: string
  icon: string        // Font Awesome class
  cls: string         // .t-* colour class from styles/app.css
  color: string       // raw colour for maps / charts
  badge: string       // .badge-* class
}

export const ALERT_TYPE_META: Record<string, AlertTypeMeta> = {
  Traffic:      { label: 'Traffic',      icon: 'fa-car-burst',            cls: 't-traffic',      color: '#DC2626', badge: 'badge-danger' },
  Emergency:    { label: 'Emergency',    icon: 'fa-triangle-exclamation', cls: 't-emergency',    color: '#7C3AED', badge: 'badge-purple' },
  Construction: { label: 'Construction', icon: 'fa-helmet-safety',        cls: 't-construction', color: '#D97706', badge: 'badge-warning' },
  Weather:      { label: 'Weather',      icon: 'fa-cloud-showers-heavy',  cls: 't-weather',      color: '#2563EB', badge: 'badge-info' },
  Other:        { label: 'Other',        icon: 'fa-circle-info',          cls: 't-other',        color: '#687A75', badge: 'badge-neutral' },
}

export const ALERT_TYPES = ['Traffic', 'Emergency', 'Construction', 'Weather'] as const

export function typeMeta(type: string | undefined | null): AlertTypeMeta {
  return ALERT_TYPE_META[type ?? ''] ?? ALERT_TYPE_META.Other
}

export function timeAgo(iso: string | Date): string {
  const then = typeof iso === 'string' ? new Date(iso).getTime() : iso.getTime()
  const s = Math.max(0, Math.round((Date.now() - then) / 1000))
  if (s < 60) return 'just now'
  const m = Math.round(s / 60)
  if (m < 60) return `${m} min ago`
  const h = Math.round(m / 60)
  if (h < 24) return `${h} hr${h === 1 ? '' : 's'} ago`
  const d = Math.round(h / 24)
  if (d < 7) return `${d} day${d === 1 ? '' : 's'} ago`
  return new Date(then).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
}

export function greeting(date = new Date()): string {
  const h = date.getHours()
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  return 'Good evening'
}
