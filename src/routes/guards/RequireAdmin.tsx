
import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

export default function RequireAdmin() {
  const { user, loading, isAdmin } = useAuth()

  if (loading) return null
  if (!user) return <Navigate to="/auth" replace />
  if (!isAdmin) return <Navigate to="/" replace />

  return <Outlet />
}
