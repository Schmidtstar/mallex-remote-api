
import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { doc, onSnapshot, setDoc } from 'firebase/firestore'
import { db } from '../lib/firebase'
import { useAuth } from './AuthContext'
import { useIsAdmin } from './AdminContext'

export interface AdminSettings {
  moderationEnabled: boolean
  autoApproveFromTrustedUsers: boolean
  allowAnonymousSubmissions: boolean
  maxTasksPerUser: number
  pointsPerTask: number
  dailyTaskLimit: number
  weeklyTaskLimit: number
  requireImageForTasks: boolean
  maintenanceMode: boolean
  notificationSettings: {
    newTaskSubmissions: boolean
    userReports: boolean
    systemAlerts: boolean
  }
}

interface AdminSettingsContextType {
  settings: AdminSettings
  loading: boolean
  error: string | null
  updateSettings: (newSettings: Partial<AdminSettings>) => Promise<void>
  resetToDefaults: () => Promise<void>
}

const defaultSettings: AdminSettings = {
  moderationEnabled: true,
  autoApproveFromTrustedUsers: false,
  allowAnonymousSubmissions: false,
  maxTasksPerUser: 5,
  pointsPerTask: 10,
  dailyTaskLimit: 3,
  weeklyTaskLimit: 15,
  requireImageForTasks: false,
  maintenanceMode: false,
  notificationSettings: {
    newTaskSubmissions: true,
    userReports: true,
    systemAlerts: true
  }
}

const AdminSettingsContext = createContext<AdminSettingsContextType | undefined>(undefined)

interface AdminSettingsProviderProps {
  children: ReactNode
}

function AdminSettingsProvider({ children }: AdminSettingsProviderProps) {
  const [settings, setSettings] = useState<AdminSettings>(defaultSettings)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { user } = useAuth()
  const isAdmin = useIsAdmin()

  useEffect(() => {
    if (!user?.uid || !isAdmin) {
      console.log('📋 Admin settings not accessible - using defaults')
      setSettings(defaultSettings)
      setLoading(false)
      return
    }

    const settingsRef = doc(db, 'admin', 'settings')

    const unsubscribe = onSnapshot(
      settingsRef,
      (doc) => {
        if (doc.exists()) {
          const data = doc.data()
          setSettings({ ...defaultSettings, ...data })
        } else {
          setSettings(defaultSettings)
        }
        setLoading(false)
        setError(null)
      },
      (err) => {
        console.error('Error loading admin settings:', err)
        setError('Fehler beim Laden der Admin-Einstellungen')
        setSettings(defaultSettings)
        setLoading(false)
      }
    )

    return unsubscribe
  }, [user?.uid, isAdmin])

  const updateSettings = async (newSettings: Partial<AdminSettings>) => {
    if (!user || !isAdmin) {
      throw new Error('Keine Admin-Berechtigung')
    }

    try {
      setLoading(true)
      const settingsRef = doc(db, 'admin', 'settings')
      const updatedSettings = { ...settings, ...newSettings }
      await setDoc(settingsRef, updatedSettings, { merge: true })
      setSettings(updatedSettings)
    } catch (error) {
      console.error('Failed to update settings:', error)
      setError('Fehler beim Speichern der Einstellungen')
      throw error
    } finally {
      setLoading(false)
    }
  }

  const resetToDefaults = async () => {
    if (!user || !isAdmin) {
      throw new Error('Keine Admin-Berechtigung')
    }

    try {
      setLoading(true)
      const settingsRef = doc(db, 'admin', 'settings')
      await setDoc(settingsRef, defaultSettings)
      setSettings(defaultSettings)
    } catch (error) {
      console.error('Failed to reset settings:', error)
      setError('Fehler beim Zurücksetzen der Einstellungen')
      throw error
    } finally {
      setLoading(false)
    }
  }

  return (
    <AdminSettingsContext.Provider
      value={{
        settings,
        loading,
        error,
        updateSettings,
        resetToDefaults
      }}
    >
      {children}
    </AdminSettingsContext.Provider>
  )
}

function useAdminSettings() {
  const context = useContext(AdminSettingsContext)
  if (context === undefined) {
    throw new Error('useAdminSettings must be used within an AdminSettingsProvider')
  }
  return context
}

export { useAdminSettings }
export default AdminSettingsProvider
