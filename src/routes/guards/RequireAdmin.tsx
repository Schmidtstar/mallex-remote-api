import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useIsAdmin } from '../../context/AdminContext'

export default function RequireAdmin() {
  const { user, loading } = useAuth()
  const isAdmin = useIsAdmin()

  if (loading) return null
  if (!user) return <Navigate to="/auth" replace />
  if (!isAdmin) return <Navigate to="/" replace />

  return <Outlet />
}