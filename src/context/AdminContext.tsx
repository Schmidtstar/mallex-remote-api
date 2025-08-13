import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { useAuth } from './AuthContext'
import { db } from '../lib/firebase'
import { doc, getDoc } from 'firebase/firestore'

type AdminCtx = { isAdmin: boolean; loading: boolean }
const AdminContext = createContext<AdminCtx>({ isAdmin: false, loading: true })

export const useAdmin = () => useContext(AdminContext)
export const useIsAdmin = () => useAdmin().isAdmin

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
          if (isFirebaseAdmin) {
            console.log('✅ Admin verified via Firebase')
          }
        }
      } catch (error: any) {
        // Permission denied is EXPECTED for non-admins - don't log as error
        if (error?.code === 'permission-denied') {
          // This is normal - user is simply not an admin
          if (!cancelled) setIsAdmin(false)
          return // Silent exit for permission-denied
        }

        // Only log actual unexpected errors
        console.warn('Unexpected Firebase admin check error:', error?.code || error?.message)
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