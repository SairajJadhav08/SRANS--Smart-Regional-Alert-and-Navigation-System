import { useState } from 'react'
import { getAiExplainAlert } from '../../api'
import type { AlertExplanation } from '../../types'
import { readCache, writeCache } from '../../lib/aiCache'
import { AiShimmer } from '../ui'

// "Explain with AI" button that expands into a plain-language impact summary.
export default function AlertExplainer({ alertId, compact = false }: { alertId: number; compact?: boolean }) {
  const cacheKey = `explain:${alertId}`
  const [data, setData] = useState<AlertExplanation | null>(() => readCache<AlertExplanation>(cacheKey, 30 * 60_000))
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const explain = async () => {
    setOpen(true)
    if (data) return
    setLoading(true)
    setError(null)
    try {
      const res = await getAiExplainAlert(alertId)
      setData(res.data)
      writeCache(cacheKey, res.data)
    } catch (err: any) {
      setError(err?.response?.data?.message || 'AI could not explain this alert right now.')
    } finally {
      setLoading(false)
    }
  }

  if (!open) {
    return (
      <button type="button" className={`btn btn-ai ${compact ? 'btn-sm' : ''}`} onClick={explain}>
        <i className="fas fa-wand-magic-sparkles" aria-hidden="true"></i> Explain impact
      </button>
    )
  }

  return (
    <div className="ai-inline" aria-live="polite">
      <div className="flex-between mb-2">
        <span className="ai-chip on-light"><i className="fas fa-wand-magic-sparkles" aria-hidden="true"></i> What this means for you</span>
        <button type="button" className="btn btn-ghost btn-sm" onClick={() => setOpen(false)} aria-label="Hide explanation">
          <i className="fas fa-xmark"></i>
        </button>
      </div>
      {loading && <AiShimmer lines={3} onLight />}
      {error && <p className="text-danger text-sm">{error}</p>}
      {data && (
        <>
          <p>{data.impact}</p>
          <div className="flex flex-wrap gap-2 mt-2">
            {data.who_affected && <span className="badge badge-neutral"><i className="fas fa-users" aria-hidden="true"></i> {data.who_affected}</span>}
            {data.expected_delay && <span className="badge badge-signal"><i className="fas fa-clock" aria-hidden="true"></i> {data.expected_delay}</span>}
          </div>
          {data.advice.length > 0 && (
            <ul>{data.advice.map(a => <li key={a}>{a}</li>)}</ul>
          )}
        </>
      )}
    </div>
  )
}
