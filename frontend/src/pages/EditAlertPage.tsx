import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { getAlert, updateAlert } from '../api'
import type { AlertPayload } from '../api'
import Seo from '../components/Seo'
import { EmptyState, PageHead } from '../components/ui'
import AlertForm from '../components/AlertForm'

export default function EditAlertPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const alertId = Number(id)
  const [initial, setInitial] = useState<AlertPayload | null>(null)
  const [loading, setLoading] = useState(!!alertId)
  const [notFound, setNotFound] = useState(!alertId)

  useEffect(() => {
    if (!alertId) return
    getAlert(alertId)
      .then(res => setInitial({
        title: res.data.title,
        description: res.data.description,
        alert_type: res.data.alert_type,
        location_lat: res.data.location_lat,
        location_lng: res.data.location_lng,
      }))
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false))
  }, [alertId])

  return (
    <div className="app-page">
      <Seo title="Edit alert" noindex />
      <PageHead title="Edit alert" subtitle="Changes are published immediately to the map and alert feed." />
      {loading ? (
        <div className="skeleton" style={{ height: 480 }} />
      ) : notFound || !initial ? (
        <div className="panel">
          <EmptyState icon="fa-circle-exclamation" title="Alert not found"
            action={<Link to="/dashboard" className="btn btn-primary btn-sm">Back to Command Center</Link>}>
            It may have been deleted or you may not have access to it.
          </EmptyState>
        </div>
      ) : (
        <AlertForm
          mode="edit"
          initial={initial}
          onSubmit={async data => {
            await updateAlert(Number(id), data)
            window.dispatchEvent(new CustomEvent('toast:show', { detail: { message: 'Alert updated', type: 'success' } }))
            navigate('/dashboard')
          }}
        />
      )}
    </div>
  )
}
