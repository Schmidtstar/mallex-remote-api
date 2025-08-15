import React, { createContext, useContext, ReactNode } from 'react'
import { useAuth } from './AuthContext'

interface AdminContextType {
  isAdmin: boolean
  loading: boolean
}

const AdminContext = createContext<AdminContextType | null>(null)

export function AdminProvider({ children }: { children: ReactNode }) {
  const { isAdmin, loading } = useAuth()

  return (
    <AdminContext.Provider value={{ isAdmin, loading }}>
      {children}
    </AdminContext.Provider>
  )
}

export function useIsAdmin(): boolean {
  const { isAdmin } = useAuth()
  return isAdmin
}

export function useAdminContext(): AdminContextType {
  const context = useContext(AdminContext)
  if (!context) {
    throw new Error('useAdminContext must be used within AdminProvider')
  }
  return context
}