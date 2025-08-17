
import React from 'react'
import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { EnhancedLoadingSpinner } from '../../components/EnhancedLoadingSpinner'

function RequireAdmin() {
  const { user, loading, isAdmin } = useAuth()

  if (loading) {
    return <EnhancedLoadingSpinner variant="admin" size="large" />
  }

  if (!user) return <Navigate to="/auth" replace />
  if (!isAdmin) return <Navigate to="/arena" replace />

  return <Outlet />
}

// Fixed: Proper default export
const RequireAdminComponent = RequireAdmin
export default RequireAdminComponent
export { RequireAdmin }
