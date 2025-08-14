
import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useIsAdmin } from '../../context/AdminContext'
import { useState, useEffect } from 'react'
import { doc, getDoc } from 'firebase/firestore'
import { db } from '../../lib/firebase'

export default function RequireAdmin() {
  const { user, loading } = useAuth()
  const [independentIsAdmin, setIndependentIsAdmin] = useState(false)
  const [adminCheckLoading, setAdminCheckLoading] = useState(true)
  
  // Try to use context first, with fallback
  let contextIsAdmin = false
  try {
    contextIsAdmin = typeof useIsAdmin === 'function' ? useIsAdmin() : false
  } catch (error) {
    console.log('Admin context not available, using independent check')
  }

  // Independent admin check as fallback
  useEffect(() => {
    const checkAdminIndependently = async () => {
      if (!user?.uid) {
        setIndependentIsAdmin(false)
        setAdminCheckLoading(false)
        return
      }

      try {
        // Check localStorage for dev admin
        const localAdmin = localStorage.getItem('mallex_dev_admin')
        if (localAdmin === user.uid) {
          setIndependentIsAdmin(true)
          setAdminCheckLoading(false)
          return
        }

        // Check Firebase
        const snap = await getDoc(doc(db, 'admins', user.uid))
        setIndependentIsAdmin(snap.exists())
      } catch (error: any) {
        if (error?.code !== 'permission-denied') {
          console.warn('Independent admin check failed:', error?.code)
        }
        setIndependentIsAdmin(false)
      } finally {
        setAdminCheckLoading(false)
      }
    }

    checkAdminIndependently()
  }, [user?.uid])

  // Use context admin status if available, otherwise use independent check
  const finalIsAdmin = contextIsAdmin || independentIsAdmin
  const finalLoading = loading || adminCheckLoading

  if (finalLoading) return null
  if (!user) return <Navigate to="/auth" replace />
  if (!finalIsAdmin) return <Navigate to="/" replace />

  return <Outlet />
}
