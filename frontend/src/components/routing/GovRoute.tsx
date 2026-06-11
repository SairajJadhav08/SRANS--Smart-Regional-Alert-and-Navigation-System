import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

export default function GovRoute() {
  const { isLoggedIn, isGovUser, isSuperuser, user } = useAuth()

  console.log(`GovRoute Auth State - isLoggedIn: ${isLoggedIn}, isGovUser: ${isGovUser}, isSuperuser: ${isSuperuser}, user:`, JSON.stringify(user))

  if (!isLoggedIn) {
    return <Navigate to="/login" replace />
  }

  // Superuser can access all gov routes
  if (!isGovUser && !isSuperuser) {
    console.warn('Access denied to GovRoute, redirecting to home.')
    window.dispatchEvent(new CustomEvent('toast:show', {
      detail: { message: 'Access denied: Government verification is required.', type: 'danger' }
    }))
    return <Navigate to="/" replace />
  }

  return <Outlet />
}
