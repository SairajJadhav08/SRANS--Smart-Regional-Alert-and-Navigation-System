import { useNavigate } from 'react-router-dom'
import { createAlert } from '../api'
import Seo from '../components/Seo'
import { PageHead } from '../components/ui'
import AlertForm from '../components/AlertForm'

export default function NewAlertPage() {
  const navigate = useNavigate()

  return (
    <div className="app-page">
      <Seo title="Publish alert" noindex />
      <PageHead
        title="Publish an alert"
        subtitle="Official alerts appear instantly on the public map, the alert feed and commuters' route risk scores."
      />
      <AlertForm
        mode="create"
        onSubmit={async data => {
          await createAlert(data)
          window.dispatchEvent(new Event('alert:created'))
          navigate('/dashboard')
        }}
      />
    </div>
  )
}
