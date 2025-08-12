
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
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
    async function checkAdminStatus() {
      setLoading(true)
      setIsAdmin(false)

      if (!user?.uid) {
        setLoading(false)
        return
      }

      try {
        // Check if user's UID exists in admins collection
        const adminDocRef = doc(db, 'admins', user.uid)
        const adminDoc = await getDoc(adminDocRef)
        setIsAdmin(adminDoc.exists())
      } catch (error) {
        console.error('Error checking admin status:', error)
        // Fallback: Check if email matches jp-s97@web.de on error
        if (user?.email) {
          setIsAdmin(user.email.toLowerCase() === 'jp-s97@web.de')
        }
      }

      setLoading(false)
    }

    checkAdminStatus()
  }, [user?.uid, user?.email])

  return (
    <AdminContext.Provider value={{ isAdmin, loading }}>
      {children}
    </AdminContext.Provider>
  )
}
