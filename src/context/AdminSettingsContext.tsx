import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import {
  collection,
  doc,
  onSnapshot,
  setDoc,
  getDocs,
  query,
  orderBy,
  serverTimestamp,
  deleteDoc,
  updateDoc
} from 'firebase/firestore'
import { db, auth } from '../lib/firebase'

interface AppSettings {
  maintenanceMode: boolean
  allowRegistration: boolean
  maxUsers: number
  minTasksForReward: number
  dailyTaskLimit: number
  announcements: string[]
}

interface UserStats {
  uid: string
  email: string
  displayName: string
  isAdmin: boolean
  createdAt: any
  lastActive: any
  totalTasks: number
  totalPoints: number
  level: number
}

interface AdminSettingsContextType {
  settings: AppSettings
  users: UserStats[]
  loading: boolean
  error: string | null
  updateSettings: (newSettings: Partial<AppSettings>) => Promise<void>
  refreshUsers: () => Promise<void>
  sendSystemNotification: (userId: string, message: string) => Promise<void>
  deleteUser: (userId: string) => Promise<void>
  toggleUserAdmin: (userId: string, isAdmin: boolean) => Promise<void>
}

const defaultSettings: AppSettings = {
  maintenanceMode: false,
  allowRegistration: true,
  maxUsers: 100,
  minTasksForReward: 5,
  dailyTaskLimit: 10,
  announcements: []
}

const AdminSettingsContext = createContext<AdminSettingsContextType | null>(null)

export const useAdminSettings = () => {
  const context = useContext(AdminSettingsContext)
  if (!context) {
    throw new Error('useAdminSettings must be used within AdminSettingsProvider')
  }
  return context
}

interface AdminSettingsProviderProps {
  children: ReactNode
}

export const AdminSettingsProvider: React.FC<AdminSettingsProviderProps> = ({ children }) => {
  const [settings, setSettings] = useState<AppSettings>(defaultSettings)
  const [users, setUsers] = useState<UserStats[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Load settings from Firebase
  useEffect(() => {
    const settingsRef = doc(db, 'adminSettings', 'app')

    const unsubscribe = onSnapshot(settingsRef, (doc) => {
      if (doc.exists()) {
        const data = doc.data()
        setSettings({ ...defaultSettings, ...data })
        console.log('✅ Admin settings loaded:', data)
      } else {
        console.log('📋 Admin settings not accessible - using defaults')
        setSettings(defaultSettings)
      }
      setLoading(false)
    }, (error) => {
      console.log('📋 Admin settings not accessible - using defaults')
      setSettings(defaultSettings)
      setLoading(false)
    })

    return unsubscribe
  }, [])

  // Load users from Firebase
  const refreshUsers = async () => {
    try {
      setLoading(true)
      const usersRef = collection(db, 'users')
      const usersQuery = query(usersRef, orderBy('createdAt', 'desc'))
      const snapshot = await getDocs(usersQuery)

      const usersData: UserStats[] = []
      snapshot.forEach((doc) => {
        const data = doc.data()
        usersData.push({
          uid: doc.id,
          email: data.email || 'Unbekannt',
          displayName: data.displayName || 'Unbekannt',
          isAdmin: data.isAdmin || false,
          createdAt: data.createdAt || null,
          lastActive: data.lastActive || null,
          totalTasks: data.totalTasks || 0,
          totalPoints: data.totalPoints || 0,
          level: data.level || 1
        })
      })

      setUsers(usersData)
      console.log('✅ Users loaded successfully:', usersData.length)
    } catch (error) {
      console.error('Failed to refresh users:', error)
      setError('Fehler beim Laden der Benutzer')
    } finally {
      setLoading(false)
    }
  }

  // Update settings
  const updateSettings = async (newSettings: Partial<AppSettings>) => {
    try {
      const settingsRef = doc(db, 'adminSettings', 'app')
      await setDoc(settingsRef, { ...settings, ...newSettings }, { merge: true })
      console.log('✅ Settings updated:', newSettings)
    } catch (error) {
      console.error('Failed to update settings:', error)
      setError('Fehler beim Aktualisieren der Einstellungen')
    }
  }

  // Send system notification
  const sendSystemNotification = async (userId: string, message: string) => {
    try {
      const notification = {
        message,
        timestamp: serverTimestamp(),
        type: 'system' as const,
        read: false,
        fromAdmin: auth.currentUser?.email || 'Admin'
      }

      if (userId === 'all') {
        // Send to all users
        for (const targetUser of users) {
          await setDoc(doc(db, 'notifications', `${targetUser.uid}_${Date.now()}`), {
            ...notification,
            userId: targetUser.uid
          })
        }
      } else {
        // Send to specific user
        await setDoc(doc(db, 'notifications', `${userId}_${Date.now()}`), {
          ...notification,
          userId: userId
        })
      }

      console.log('✅ System notification sent:', { userId, message })
    } catch (error) {
      console.error('Failed to send notification:', error)
      throw error
    }
  }

  // Delete user
  const deleteUser = async (userId: string) => {
    try {
      await deleteDoc(doc(db, 'users', userId))
      console.log('✅ User deleted:', userId)
      refreshUsers()
    } catch (error) {
      console.error('Failed to delete user:', error)
      setError('Fehler beim Löschen des Benutzers')
    }
  }

  // Toggle user admin status
  const toggleUserAdmin = async (userId: string, isAdmin: boolean) => {
    try {
      const userRef = doc(db, 'users', userId)
      await updateDoc(userRef, { isAdmin })
      console.log('✅ User admin status updated:', { userId, isAdmin })
      refreshUsers()
    } catch (error) {
      console.error('Failed to update user admin status:', error)
      setError('Fehler beim Aktualisieren des Admin-Status')
    }
  }

  // Load users on mount
  useEffect(() => {
    refreshUsers()
  }, [])

  const value: AdminSettingsContextType = {
    settings,
    users,
    loading,
    error,
    updateSettings,
    refreshUsers,
    sendSystemNotification,
    deleteUser,
    toggleUserAdmin
  }

  return (
    <AdminSettingsContext.Provider value={value}>
      {children}
    </AdminSettingsContext.Provider>
  )
}