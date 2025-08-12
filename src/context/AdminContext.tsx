import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { useAuth } from './AuthContext'
import { db } from '@/lib/firebase'
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
        const snap = await getDoc(doc(db, 'admins', user.uid))  // ✅ Single doc read
        if (!cancelled) setIsAdmin(snap.exists())
      } catch (e) {
        console.warn('Admin check failed (this is expected if not admin):', e)
        if (!cancelled) setIsAdmin(false)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    checkAdmin()
    return () => { cancelled = true }
  }, [user?.uid])

  return <AdminContext.Provider value={{ isAdmin, loading }}>{children}</AdminContext.Provider>
}