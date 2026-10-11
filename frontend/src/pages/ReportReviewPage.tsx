import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { getReports, approveReport, rejectReport, getAiTriageReport } from '../api'
import type { Report, ReportTriage } from '../types'
import { timeAgo, typeMeta } from '../lib/alertMeta'
import Seo from '../components/Seo'
import { AiShimmer, EmptyState, PageHead, TypeIcon } from '../components/ui'
import '../styles/pages/review.css'

type Status = 'pending' | 'approved' | 'rejected'

const REC_META: Record<ReportTriage['recommendation'], { label: string; cls: string; icon: string }> = {
  approve: { label: 'Approve', cls: 'rec-approve', icon: 'fa-circle-check' },
  reject: { label: 'Reject', cls: 'rec-reject', icon: 'fa-circle-xmark' },
  merge: { label: 'Duplicate — merge', cls: 'rec-merge', icon: 'fa-code-merge' },
  needs_info: { label: 'Needs more info', cls: 'rec-info', icon: 'fa-circle-question' },
}

const SEV_CLS: Record<string, string> = {
  low: 'badge-success', moderate: 'badge-warning', high: 'badge-signal', critical: 'badge-danger',
}

function credLevel(score: number) {
  return score >= 70 ? 'low' : score >= 45 ? 'moderate' : score >= 25 ? 'high' : 'severe'
}

export default function ReportReviewPage() {
  const [reports, setReports] = useState<Report[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<Status>('pending')
  const [busyId, setBusyId] = useState<number | null>(null)
  const [notes, setNotes] = useState<Record<number, string>>({})
  const [triage, setTriage] = useState<Record<number, ReportTriage>>({})
  const [triaging, setTriaging] = useState<Record<number, boolean>>({})
  const [triageErr, setTriageErr] = useState<Record<number, string>>({})
  const [useAiText, setUseAiText] = useState<Record<number, boolean>>({})

  useEffect(() => {
    getReports()
      .then(r => setReports(Array.isArray(r.data) ? (r.data as Report[]) : []))
      .catch(() => setReports([]))
      .finally(() => setLoading(false))
  }, [])

  const counts = useMemo(() => ({
    pending: reports.filter(r => r.status === 'pending').length,
    approved: reports.filter(r => r.status === 'approved').length,
    rejected: reports.filter(r => r.status === 'rejected').length,
  }), [reports])

  const list = reports.filter(r => r.status === tab)

  const toast = (message: string, type: 'success' | 'danger' | 'info' = 'success') =>
    window.dispatchEvent(new CustomEvent('toast:show', { detail: { message, type } }))

  const runTriage = async (id: number) => {
    setTriaging(p => ({ ...p, [id]: true }))
    setTriageErr(p => ({ ...p, [id]: '' }))
    try {
      const res = await getAiTriageReport(id)
      setTriage(p => ({ ...p, [id]: res.data }))
      setUseAiText(p => ({ ...p, [id]: true }))
    } catch (err: any) {
      setTriageErr(p => ({ ...p, [id]: err?.response?.data?.message || 'AI triage unavailable right now.' }))
    } finally {
      setTriaging(p => ({ ...p, [id]: false }))
    }
  }

  const approve = async (r: Report) => {
    setBusyId(r.id)
    const t = triage[r.id]
    const overrides = t && useAiText[r.id]
      ? { title: t.suggested_title, description: t.suggested_description, alert_type: t.suggested_type }
      : undefined
    try {
      const res = await approveReport(r.id, notes[r.id], overrides)
      setReports(prev => prev.map(x => x.id === r.id ? { ...x, status: 'approved', review_note: notes[r.id] || null, promoted_to: res.data?.alert_id ?? null } : x))
      toast('Report approved and published as an official alert')
    } catch (err: any) {
      toast(err?.response?.data?.message || 'Failed to approve report', 'danger')
    } finally {
      setBusyId(null)
    }
  }

  const reject = async (r: Report, noteOverride?: string) => {
    setBusyId(r.id)
    const note = noteOverride ?? notes[r.id]
    try {
      await rejectReport(r.id, note)
      setReports(prev => prev.map(x => x.id === r.id ? { ...x, status: 'rejected', review_note: note || null } : x))
      toast(noteOverride ? 'Marked as duplicate' : 'Report rejected', 'info')
    } catch {
      toast('Failed to reject report', 'danger')
    } finally {
      setBusyId(null)
    }
  }

  return (
    <div className="app-page">
      <Seo title="Report Review" noindex />
      <PageHead
        title="Citizen report review"
        subtitle="Verify community reports before they become public alerts. AI triage checks credibility, severity and duplicates."
        actions={<Link to="/dashboard" className="btn btn-secondary"><i className="fas fa-tower-broadcast" aria-hidden="true"></i> Command Center</Link>}
      />

      <div className="tabs-list review-tabs" role="tablist" aria-label="Report status">
        {(['pending', 'approved', 'rejected'] as Status[]).map(s => (
          <button key={s} type="button" role="tab" aria-selected={tab === s} className={`tab-btn${tab === s ? ' active' : ''}`} onClick={() => setTab(s)}>
            {s === 'pending' ? 'Pending' : s === 'approved' ? 'Published' : 'Rejected'}
            <span className={`badge ${s === 'pending' && counts.pending ? 'badge-signal' : 'badge-neutral'}`}>{counts[s]}</span>
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex-col gap-3">{[0, 1, 2].map(i => <div key={i} className="skeleton" style={{ height: 140 }} />)}</div>
      ) : list.length === 0 ? (
        <div className="panel">
          <EmptyState icon={tab === 'pending' ? 'fa-inbox' : 'fa-folder-open'} title={tab === 'pending' ? 'Queue is clear' : 'Nothing here yet'}>
            {tab === 'pending' ? 'No citizen reports are waiting for review.' : `No ${tab === 'approved' ? 'published' : 'rejected'} reports.`}
          </EmptyState>
        </div>
      ) : (
        <ul className="review-list">
          {list.map(r => {
            const t = triage[r.id]
            const rec = t ? REC_META[t.recommendation] : null
            return (
              <li key={r.id} className="panel review-card">
                <div className="review-main">
                  <div className="review-head">
                    <TypeIcon type={r.report_type} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <h2 className="review-title">{r.title}</h2>
                      <div className="review-meta">
                        <span>{typeMeta(r.report_type).label}</span>
                        <span><i className="fas fa-user" aria-hidden="true"></i> {r.user?.username ?? 'Citizen'}</span>
                        <span><i className="fas fa-clock" aria-hidden="true"></i> {timeAgo(r.created_at)}</span>
                        <Link to={`/map?lat=${r.location_lat}&lng=${r.location_lng}`} className="mono">
                          <i className="fas fa-location-dot" aria-hidden="true"></i> {r.location_lat.toFixed(4)}, {r.location_lng.toFixed(4)}
                        </Link>
                      </div>
                    </div>
                  </div>
                  <p className="review-desc">{r.description}</p>

                  {r.status === 'pending' ? (
                    <div className="review-actions">
                      <label htmlFor={`note-${r.id}`} className="sr-only">Review note</label>
                      <input
                        id={`note-${r.id}`}
                        className="input"
                        placeholder="Optional note to the reporter"
                        value={notes[r.id] ?? ''}
                        onChange={e => setNotes(p => ({ ...p, [r.id]: e.target.value }))}
                      />
                      <button type="button" className="btn btn-primary" onClick={() => approve(r)} disabled={busyId === r.id}>
                        {busyId === r.id ? <span className="spinner" /> : <><i className="fas fa-check" aria-hidden="true"></i> Approve &amp; publish</>}
                      </button>
                      <button type="button" className="btn btn-danger-light" onClick={() => reject(r)} disabled={busyId === r.id}>
                        <i className="fas fa-xmark" aria-hidden="true"></i> Reject
                      </button>
                    </div>
                  ) : (
                    <div className="review-outcome">
                      {r.review_note && <p><i className="fas fa-comment-dots" aria-hidden="true"></i> {r.review_note}</p>}
                      {r.promoted_to && <p className="is-success"><i className="fas fa-circle-check" aria-hidden="true"></i> Published as alert #{r.promoted_to}</p>}
                    </div>
                  )}
                </div>

                {r.status === 'pending' && (
                  <aside className="review-ai" aria-live="polite">
                    {!t && !triaging[r.id] && (
                      <div className="review-ai-empty">
                        <span className="ai-chip on-light"><i className="fas fa-wand-magic-sparkles" aria-hidden="true"></i> AI triage</span>
                        <p>Check credibility, severity and whether this duplicates an existing alert.</p>
                        <button type="button" className="btn btn-ai btn-sm" onClick={() => runTriage(r.id)}>
                          <i className="fas fa-wand-magic-sparkles" aria-hidden="true"></i> Run triage
                        </button>
                        {triageErr[r.id] && <p className="text-danger text-xs">{triageErr[r.id]}</p>}
                      </div>
                    )}
                    {triaging[r.id] && <AiShimmer lines={5} onLight />}
                    {t && rec && (
                      <div className="review-ai-result">
                        <div className="flex-between gap-2">
                          <span className="ai-chip on-light"><i className="fas fa-wand-magic-sparkles" aria-hidden="true"></i> AI triage</span>
                          <button type="button" className="btn btn-ghost btn-sm" onClick={() => runTriage(r.id)} aria-label="Re-run triage" title="Re-run">
                            <i className="fas fa-rotate"></i>
                          </button>
                        </div>

                        <div className="review-ai-scores">
                          <div className={`risk-gauge risk-${credLevel(t.credibility)}`} style={{ ['--risk' as string]: t.credibility }} data-score={t.credibility}
                            role="img" aria-label={`Credibility ${t.credibility} out of 100`} />
                          <div className="flex-col gap-1">
                            <span className="text-xs text-muted">Credibility</span>
                            <span className={`rec-chip ${rec.cls}`}><i className={`fas ${rec.icon}`} aria-hidden="true"></i> {rec.label}</span>
                            <span className="text-xs">Severity <span className={`badge ${SEV_CLS[t.severity] ?? 'badge-neutral'}`}>{t.severity}</span></span>
                          </div>
                        </div>

                        {t.reasoning && <p className="review-ai-reason">{t.reasoning}</p>}

                        {t.duplicate_of && (
                          <div className="review-ai-dup">
                            <i className="fas fa-code-merge" aria-hidden="true"></i>
                            <span>Likely duplicate of <strong>#{t.duplicate_of.id}</strong> “{t.duplicate_of.title}”</span>
                            <button type="button" className="btn btn-secondary btn-sm" disabled={busyId === r.id}
                              onClick={() => reject(r, `Duplicate of existing alert #${t.duplicate_of!.id}`)}>
                              Mark duplicate
                            </button>
                          </div>
                        )}

                        <div className="review-ai-rewrite">
                          <label className="checkbox-label">
                            <input type="checkbox" checked={!!useAiText[r.id]} onChange={e => setUseAiText(p => ({ ...p, [r.id]: e.target.checked }))} />
                            <span>Publish with AI-cleaned wording ({typeMeta(t.suggested_type).label})</span>
                          </label>
                          <div className="review-ai-preview">
                            <strong>{t.suggested_title}</strong>
                            <p>{t.suggested_description}</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </aside>
                )}
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
