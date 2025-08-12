import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { useAuth } from './AuthContext'
import { db } from '@/lib/firebase'
import { doc, getDoc } from 'firebase/firestore'

type AdminCtx = {
  isAdmin: boolean
  loading: boolean
}

const AdminContext = createContext<AdminCtx>({ isAdmin: false, loading: true })

export function useAdmin() {
  const context = useContext(AdminContext)
  if (!context) {
    throw new Error('useAdmin must be used within an AdminProvider')
  }
  return context
}

export function useIsAdmin() {
  const { isAdmin } = useAdmin()
  return isAdmin
}

export function AdminProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const [isAdmin, setIsAdmin] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    async function checkAdminStatus() {
      setLoading(true)
      setIsAdmin(false)

      if (!user?.uid) {
        if (!cancelled) setLoading(false)
        return
      }

      try {
        // UID-basiert: admins/{uid}
        const adminDocRef = doc(db, 'admins', user.uid)
        const adminDoc = await getDoc(adminDocRef)
        if (!cancelled) setIsAdmin(adminDoc.exists())
      } catch (error) {
        console.warn('Error checking admin status:', error)
        if (!cancelled) setIsAdmin(false)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    checkAdminStatus()
    return () => { cancelled = true }
  }, [user?.uid])

  return (
    <AdminContext.Provider value={{ isAdmin, loading }}>
      {children}
    </AdminContext.Provider>
  )
}