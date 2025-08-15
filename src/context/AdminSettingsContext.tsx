import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore'
import { db } from '../lib/firebase'
import { useAuth } from './AuthContext'

interface AppSettings {
  maintenanceMode: boolean
  moderationEnabled: boolean
  autoApproveFromTrustedUsers: boolean
  allowAnonymousSubmissions: boolean
  maxTasksPerUser: number
  pointsPerTask: number
  dailyTaskLimit: number
  weeklyTaskLimit: number
  requireImageForTasks: boolean
  notificationSettings: {
    newTaskSubmissions: boolean
    userReports: boolean
    systemAlerts: boolean
  }
}

interface AdminSettingsContextType {
  appSettings: AppSettings | null
  updateAppSettings: (updates: Partial<AppSettings>) => Promise<void>
  loading: boolean
  error: string | null
}

const defaultSettings: AppSettings = {
  maintenanceMode: false,
  moderationEnabled: true,
  autoApproveFromTrustedUsers: false,
  allowAnonymousSubmissions: true,
  maxTasksPerUser: 5,
  pointsPerTask: 10,
  dailyTaskLimit: 3,
  weeklyTaskLimit: 15,
  requireImageForTasks: false,
  notificationSettings: {
    newTaskSubmissions: true,
    userReports: true,
    systemAlerts: true
  }
}

const AdminSettingsContext = createContext<AdminSettingsContextType | null>(null)

export function AdminSettingsProvider({ children }: { children: ReactNode }) {
  const { isAdmin, user } = useAuth()
  const [appSettings, setAppSettings] = useState<AppSettings | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!isAdmin || !user) {
      setAppSettings(defaultSettings)
      setLoading(false)
      return
    }

    const loadSettings = async () => {
      try {
        setLoading(true)
        setError(null)

        const settingsDoc = await getDoc(doc(db, 'adminSettings', 'app'))

        if (settingsDoc.exists()) {
          const data = settingsDoc.data()
          setAppSettings({ ...defaultSettings, ...data })
          console.log('✅ Admin settings loaded from Firebase')
        } else {
          // Create default settings
          await setDoc(doc(db, 'adminSettings', 'app'), defaultSettings)
          setAppSettings(defaultSettings)
          console.log('🔧 Created default admin settings')
        }
      } catch (error: any) {
        console.warn('Admin settings load failed:', error?.code)
        setAppSettings(defaultSettings)
        setError('Settings konnten nicht geladen werden')
      } finally {
        setLoading(false)
      }
    }

    loadSettings()
  }, [isAdmin, user])

  const updateAppSettings = async (updates: Partial<AppSettings>) => {
    if (!isAdmin || !user || !appSettings) {
      throw new Error('Nicht berechtigt')
    }

    try {
      const newSettings = { ...appSettings, ...updates }

      await updateDoc(doc(db, 'adminSettings', 'app'), updates)
      setAppSettings(newSettings)

      console.log('✅ Settings updated:', Object.keys(updates))
    } catch (error: any) {
      console.error('Settings update failed:', error)
      throw new Error('Einstellungen konnten nicht gespeichert werden')
    }
  }

  return (
    <AdminSettingsContext.Provider value={{
      appSettings,
      updateAppSettings,
      loading,
      error
    }}>
      {children}
    </AdminSettingsContext.Provider>
  )
}

export function useAdminSettings() {
  const context = useContext(AdminSettingsContext)
  if (!context) {
    throw new Error('useAdminSettings must be used within AdminSettingsProvider')
  }
  return context
}

export default AdminSettingsProvider