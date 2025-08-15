
import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

function RequireAdmin() {
  const { user, loading, isAdmin } = useAuth()

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
        color: '#ffffff'
      }}>
        🔄 Lädt Admin-Berechtigung...
      </div>
    )
  }

  if (!user) return <Navigate to="/auth" replace />
  if (!isAdmin) return <Navigate to="/arena" replace />

  return <Outlet />
}

export default RequireAdmin
