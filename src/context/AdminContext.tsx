import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { useAuth } from './AuthContext'
import { db } from '@/lib/firebase'

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
    async function checkAdminStatus() {
      setLoading(true)
      setIsAdmin(false)

      if (!user?.email) {
        setLoading(false)
        return
      }

      try {
        // Import Firestore
        const { getFirestore, collection, query, where, getDocs } = await import('firebase/firestore')
        const firestoreDb = getFirestore(db.app) // Use db.app from the imported db object

        // Query admins collection for user's email
        const q = query(
          collection(firestoreDb, 'admins'),
          where('email', '==', user.email)
        )

        const querySnapshot = await getDocs(q)
        setIsAdmin(!querySnapshot.empty)
      } catch (error) {
        console.error('Error checking admin status:', error)
        // Fallback: Check if email matches jp-s97@web.de on error
        setIsAdmin(user.email.toLowerCase() === 'jp-s97@web.de')
      }

      setLoading(false)
    }

    checkAdminStatus()
  }, [user?.email])

  return (
    <AdminContext.Provider value={{ isAdmin, loading }}>
      {children}
    </AdminContext.Provider>
  )
}