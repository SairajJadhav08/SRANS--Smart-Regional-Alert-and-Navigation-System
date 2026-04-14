import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

export default function SuperuserRoute() {
  const { isLoggedIn, isSuperuser } = useAuth()
  if (!isLoggedIn) return <Navigate to="/login" replace />
  if (!isSuperuser) return <Navigate to="/" replace />
  return <Outlet />
}
