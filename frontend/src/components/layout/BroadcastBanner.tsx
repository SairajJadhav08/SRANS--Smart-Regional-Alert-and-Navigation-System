import { useState, useEffect } from 'react'
import { getActiveBroadcast } from '../../api'

export default function BroadcastBanner() {
  const [broadcast, setBroadcast] = useState<any>(null)
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    const check = async () => {
      try {
        const res = await getActiveBroadcast()
        if (res.data) {
          // Check if user dismissed this specific broadcast this session
          const key = `broadcast_dismissed_${res.data.id}`
          if (!sessionStorage.getItem(key)) {
            setBroadcast(res.data)
          }
        }
      } catch { /* no broadcast */ }
    }
    check()
    const interval = setInterval(check, 60000) // re-check every minute
    return () => clearInterval(interval)
  }, [])

  const handleDismiss = () => {
    if (broadcast) {
      sessionStorage.setItem(`broadcast_dismissed_${broadcast.id}`, '1')
    }
    setDismissed(true)
  }

  if (!broadcast || dismissed) return null

  return (
    <div className="broadcast-banner" role="alert" aria-live="assertive">
      <div className="broadcast-banner-inner">
        <div className="broadcast-icon">
          <i className="fas fa-broadcast-tower"></i>
        </div>
        <div className="broadcast-content">
          <span className="broadcast-label">EMERGENCY BROADCAST</span>
          <span className="broadcast-title">{broadcast.title}</span>
          <span className="broadcast-desc">{broadcast.description}</span>
        </div>
        <button
          className="broadcast-dismiss"
          onClick={handleDismiss}
          aria-label="Dismiss broadcast"
        >
          <i className="fas fa-times"></i>
        </button>
      </div>
    </div>
  )
}
