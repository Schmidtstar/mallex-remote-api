
import React, { createContext, useContext, useMemo, ReactNode } from 'react'
import { useAuth } from './AuthContext'

type AdminCtx = {
  isAdmin: boolean
}

const AdminContext = createContext<AdminCtx>({ isAdmin: false })

export const useAdmin = () => useContext(AdminContext)

export function AdminProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  
  const isAdmin = useMemo(() => {
    const adminEmails = (import.meta.env.VITE_ADMIN_EMAILS ?? '')
      .split(',')
      .map(s => s.trim().toLowerCase())
      .filter(Boolean)
    
    return !!(user?.email && adminEmails.includes(user.email.toLowerCase()))
  }, [user?.email])

  return (
    <AdminContext.Provider value={{ isAdmin }}>
      {children}
    </AdminContext.Provider>
  )
}
