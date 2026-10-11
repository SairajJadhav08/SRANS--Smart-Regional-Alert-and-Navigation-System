import { useState } from 'react'
import type { ReactNode, ImgHTMLAttributes } from 'react'
import { typeMeta } from '../../lib/alertMeta'
import type { RiskLevel } from '../../types'

// Small presentational building blocks shared by the signed-in screens.
// Styles live in src/styles/app.css.

export function BrandMark({ size = 'md' }: { size?: 'md' | 'lg' }) {
  return <span className={`brand-mark${size === 'lg' ? ' lg' : ''}`} aria-hidden="true" />
}

export function AiChip({ label = 'AI', onLight = false }: { label?: string; onLight?: boolean }) {
  return (
    <span className={`ai-chip${onLight ? ' on-light' : ''}`}>
      <i className="fas fa-wand-magic-sparkles" aria-hidden="true"></i> {label}
    </span>
  )
}

export function AiShimmer({ lines = 4, onLight = false }: { lines?: number; onLight?: boolean }) {
  return (
    <div className={`ai-shimmer${onLight ? ' on-light' : ''}`} aria-label="AI is thinking" role="status">
      {Array.from({ length: lines }).map((_, i) => (
        <span key={i} style={{ width: `${[92, 78, 85, 60, 70][i % 5]}%` }} />
      ))}
    </div>
  )
}

export function TypeIcon({ type, size }: { type: string; size?: number }) {
  const m = typeMeta(type)
  return (
    <span
      className={`type-icon ${m.cls}`}
      style={size ? { width: size, height: size } : undefined}
      aria-hidden="true"
    >
      <i className={`fas ${m.icon}`}></i>
    </span>
  )
}

export function TypeBadge({ type }: { type: string }) {
  const m = typeMeta(type)
  return <span className={`badge ${m.badge}`}>{m.label}</span>
}

export function RiskGauge({ score, level }: { score: number; level: RiskLevel }) {
  return (
    <div
      className={`risk-gauge risk-${level}`}
      style={{ ['--risk' as string]: score }}
      data-score={score}
      role="img"
      aria-label={`Risk score ${score} out of 100, ${level}`}
    />
  )
}

export function Kpi({
  label, value, icon, tone = 'ink', foot,
}: { label: string; value: ReactNode; icon: string; tone?: string; foot?: ReactNode }) {
  return (
    <div className="kpi">
      <div className="kpi-top">
        <span className="kpi-label">{label}</span>
        <span className={`kpi-icon ${tone}`} aria-hidden="true"><i className={`fas ${icon}`}></i></span>
      </div>
      <div className="kpi-value">{value}</div>
      {foot && <div className="kpi-foot">{foot}</div>}
    </div>
  )
}

export function EmptyState({
  icon, title, children, action,
}: { icon: string; title: string; children?: ReactNode; action?: ReactNode }) {
  return (
    <div className="empty-state">
      <div className="empty-state-icon" aria-hidden="true"><i className={`fas ${icon}`}></i></div>
      <h3>{title}</h3>
      {children && <p>{children}</p>}
      {action}
    </div>
  )
}

export function PageHead({
  title, subtitle, eyebrow, actions,
}: { title: string; subtitle?: ReactNode; eyebrow?: ReactNode; actions?: ReactNode }) {
  return (
    <div className="app-page-head">
      <div>
        {eyebrow && <div className="eyebrow mb-2">{eyebrow}</div>}
        <h1>{title}</h1>
        {subtitle && <p>{subtitle}</p>}
      </div>
      {actions && <div className="btn-group">{actions}</div>}
    </div>
  )
}

// Image slot for artwork listed in IMAGE_PROMPTS.md. Until the file exists the
// slot renders nothing (or `fallback`), so layouts never show a broken image.
export function OptionalImg({
  fallback = null, onMissing, ...img
}: ImgHTMLAttributes<HTMLImageElement> & { fallback?: ReactNode; onMissing?: () => void }) {
  const [missing, setMissing] = useState(false)
  if (missing) return <>{fallback}</>
  return (
    <img
      loading="lazy"
      decoding="async"
      {...img}
      onError={() => { setMissing(true); onMissing?.() }}
    />
  )
}
