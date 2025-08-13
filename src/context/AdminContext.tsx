import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { useAuth } from './AuthContext'
import { db } from '../lib/firebase'
import { doc, getDoc } from 'firebase/firestore'

type AdminCtx = { isAdmin: boolean; loading: boolean }
const AdminContext = createContext<AdminCtx>({ isAdmin: false, loading: true })

export function useAdmin() { return useContext(AdminContext) }
export function useIsAdmin() { return useAdmin().isAdmin }

export function AdminProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const [isAdmin, setIsAdmin] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    const checkAdmin = async () => {
      if (cancelled) return

      setLoading(true)
      setIsAdmin(false)

      if (!user?.uid) {
        if (!cancelled) setLoading(false)
        return
      }

      try {
        // Check localStorage first for dev testing
        const localAdmin = localStorage.getItem('mallex_dev_admin')
        if (localAdmin === user.uid) {
          console.log('🔧 Dev Admin mode active for:', user.uid)
          if (!cancelled) {
            setIsAdmin(true)
            setLoading(false)
          }
          return
        }

        // Try Firebase with comprehensive error handling
        const snap = await getDoc(doc(db, 'admins', user.uid))
        if (!cancelled) {
          const isFirebaseAdmin = snap.exists()
          setIsAdmin(isFirebaseAdmin)
          // Admin verified silently
        }
      } catch (error: any) {
        console.warn('Firebase admin check failed (expected if not admin):', error?.code || error?.message)

        // Prevent unhandled promise rejections
        if (error?.code === 'permission-denied') {
          console.log('🚫 Admin permission denied - user is not admin')
        }

        if (!cancelled) setIsAdmin(false)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    checkAdmin().catch(error => {
      console.error('Admin check promise caught:', error)
      if (!cancelled) {
        setIsAdmin(false)
        setLoading(false)
      }
    })

    return () => { cancelled = true }
  }, [user?.uid])

  return <AdminContext.Provider value={{ isAdmin, loading }}>{children}</AdminContext.Provider>
}