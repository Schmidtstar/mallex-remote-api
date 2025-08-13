import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { collection, doc, onSnapshot, updateDoc, setDoc, getDoc } from 'firebase/firestore'
import { db } from '../lib/firebase'
import { useAuth } from './AuthContext'

interface AdminSettings {
  maxTasksPerUser: number
  moderationEnabled: boolean
  autoApproveFromTrustedUsers: boolean
  trustedUserIds: string[]
  taskCategories: string[]
  pointsPerTask: number
  bonusPointsForFirstSubmission: number
  dailyTaskLimit: number
  weeklyTaskLimit: number
  bannedWords: string[]
  minTaskDescriptionLength: number
  maxTaskDescriptionLength: number
  requireImageForTasks: boolean
  allowAnonymousSubmissions: boolean
  notificationSettings: {
    newTaskSubmissions: boolean
    userReports: boolean
    systemAlerts: boolean
  }
}

const defaultSettings: AdminSettings = {
  maxTasksPerUser: 5,
  moderationEnabled: true,
  autoApproveFromTrustedUsers: false,
  trustedUserIds: [],
  taskCategories: ['general', 'fitness', 'creative', 'learning', 'social'],
  pointsPerTask: 10,
  bonusPointsForFirstSubmission: 5,
  dailyTaskLimit: 3,
  weeklyTaskLimit: 15,
  bannedWords: [],
  minTaskDescriptionLength: 10,
  maxTaskDescriptionLength: 500,
  requireImageForTasks: false,
  allowAnonymousSubmissions: true,
  notificationSettings: {
    newTaskSubmissions: true,
    userReports: true,
    systemAlerts: true
  }
}

interface AdminSettingsContextType {
  settings: AdminSettings
  loading: boolean
  error: string | null
  updateSettings: (newSettings: Partial<AdminSettings>) => Promise<void>
  resetToDefaults: () => Promise<void>
  isAdmin: boolean
}

const AdminSettingsContext = createContext<AdminSettingsContextType | undefined>(undefined)

interface AdminSettingsProviderProps {
  children: ReactNode
}

function AdminSettingsProvider({ children }: AdminSettingsProviderProps) {
  const [settings, setSettings] = useState<AdminSettings>(defaultSettings)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { user, isAdmin } = useAuth()

  useEffect(() => {
    if (!user || !isAdmin) {
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
  }, [user, isAdmin])

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
      setError(null)
    } catch (err) {
      console.error('Error updating admin settings:', err)
      setError('Fehler beim Speichern der Einstellungen')
      throw err
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
      setError(null)
    } catch (err) {
      console.error('Error resetting admin settings:', err)
      setError('Fehler beim Zurücksetzen der Einstellungen')
      throw err
    } finally {
      setLoading(false)
    }
  }

  const value: AdminSettingsContextType = {
    settings,
    loading,
    error,
    updateSettings,
    resetToDefaults,
    isAdmin
  }

  return (
    <AdminSettingsContext.Provider value={value}>
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

// Clean exports for Fast Refresh compatibility
export { useAdminSettings }
export default AdminSettingsProvider