import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

export default function GovRoute() {
  const { isLoggedIn, isGovUser, isSuperuser } = useAuth()

  if (!isLoggedIn) {
    return <Navigate to="/login" replace />
  }

  // Superuser can access all gov routes
  if (!isGovUser && !isSuperuser) {
    return <Navigate to="/" replace />
  }

  return <Outlet />
}
