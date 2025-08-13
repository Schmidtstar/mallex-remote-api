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
  tasksCompleted: number
  rank: number
  status: string
  roles: string[]
}

interface UserManagement {
  users: UserStats[]
  bannedUsers: Set<string>
  moderators: Set<string>
}

interface AdminSettingsContextType {
  appSettings: AppSettings
  userManagement: UserManagement
  loading: boolean
  error: string | null
  updateAppSettings: (newSettings: Partial<AppSettings>) => Promise<void>
  refreshUsers: () => Promise<void>
  sendSystemNotification: (userId: string, message: string) => Promise<void>
  deleteUser: (userId: string) => Promise<void>
  toggleUserAdmin: (userId: string, isAdmin: boolean) => Promise<void>
  banUser: (userId: string, reason?: string) => Promise<void>
  unbanUser: (userId: string) => Promise<void>
  suspendUser: (userId: string, reason?: string) => Promise<void>
  promoteToModerator: (userId: string) => Promise<void>
  demoteFromModerator: (userId: string) => Promise<void>
  promoteToAdmin: (userEmail: string) => Promise<void>
  revokeAdmin: (userIdOrEmail: string) => Promise<void>
  getAdminList: () => Promise<any[]>
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

function useAdminSettings() {
  const context = useContext(AdminSettingsContext)
  if (!context) {
    throw new Error('useAdminSettings must be used within AdminSettingsProvider')
  }
  return context
}

interface AdminSettingsProviderProps {
  children: ReactNode
}

export { useAdminSettings }

export const AdminSettingsProvider: React.FC<AdminSettingsProviderProps> = ({ children }) => {
  const [appSettings, setAppSettings] = useState<AppSettings>(defaultSettings)
  const [users, setUsers] = useState<UserStats[]>([])
  const [bannedUsers, setBannedUsers] = useState<Set<string>>(new Set())
  const [moderators, setModerators] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Load settings from Firebase
  useEffect(() => {
    const settingsRef = doc(db, 'adminSettings', 'app')

    const unsubscribe = onSnapshot(settingsRef, (doc) => {
      if (doc.exists()) {
        const data = doc.data()
        setAppSettings({ ...defaultSettings, ...data })
        console.log('✅ Admin settings loaded:', data)
      } else {
        console.log('📋 Admin settings not accessible - using defaults')
        setAppSettings(defaultSettings)
      }
      setLoading(false)
    }, (error) => {
      console.log('📋 Admin settings not accessible - using defaults')
      setAppSettings(defaultSettings)
      setLoading(false)
    })

    return unsubscribe
  }, [])

  // Load users from Firebase
  const refreshUsers = async () => {
    try {
      setLoading(true)
      setError(null)
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
          level: data.level || 1,
          tasksCompleted: data.tasksCompleted || data.totalTasks || 0,
          rank: data.rank || 999,
          status: data.status || 'active',
          roles: data.roles || ['user']
        })
      })

      setUsers(usersData)
      console.log('✅ Users loaded successfully:', usersData.length)
    } catch (error: any) {
      if (error?.code === 'permission-denied') {
        console.log('📋 User management not accessible - admin permissions required')
        setUsers([]) // Set empty array instead of error
      } else {
        console.error('Failed to refresh users:', error)
        setError('Fehler beim Laden der Benutzer')
      }
    } finally {
      setLoading(false)
    }
  }

  // Update settings
  const updateAppSettings = async (newSettings: Partial<AppSettings>) => {
    try {
      const settingsRef = doc(db, 'adminSettings', 'app')
      await setDoc(settingsRef, { ...appSettings, ...newSettings }, { merge: true })
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

  // Ban user
  const banUser = async (userId: string, reason: string = 'Admin action') => {
    try {
      const userRef = doc(db, 'users', userId)
      await updateDoc(userRef, { status: 'banned', banReason: reason })
      setBannedUsers(prev => new Set([...prev, userId]))
      console.log('✅ User banned:', { userId, reason })
    } catch (error) {
      console.error('Failed to ban user:', error)
      setError('Fehler beim Sperren des Benutzers')
    }
  }

  // Unban user
  const unbanUser = async (userId: string) => {
    try {
      const userRef = doc(db, 'users', userId)
      await updateDoc(userRef, { status: 'active', banReason: null })
      setBannedUsers(prev => {
        const newSet = new Set(prev)
        newSet.delete(userId)
        return newSet
      })
      console.log('✅ User unbanned:', userId)
    } catch (error) {
      console.error('Failed to unban user:', error)
      setError('Fehler beim Entsperren des Benutzers')
    }
  }

  // Suspend user
  const suspendUser = async (userId: string, reason: string = 'Admin action') => {
    try {
      const userRef = doc(db, 'users', userId)
      await updateDoc(userRef, { status: 'suspended', suspensionReason: reason })
      console.log('✅ User suspended:', { userId, reason })
    } catch (error) {
      console.error('Failed to suspend user:', error)
      setError('Fehler beim Suspendieren des Benutzers')
    }
  }

  // Promote to moderator
  const promoteToModerator = async (userId: string) => {
    try {
      const userRef = doc(db, 'users', userId)
      await updateDoc(userRef, { roles: ['user', 'moderator'] })
      setModerators(prev => new Set([...prev, userId]))
      console.log('✅ User promoted to moderator:', userId)
    } catch (error) {
      console.error('Failed to promote to moderator:', error)
      setError('Fehler beim Befördern zum Moderator')
    }
  }

  // Demote from moderator
  const demoteFromModerator = async (userId: string) => {
    try {
      const userRef = doc(db, 'users', userId)
      await updateDoc(userRef, { roles: ['user'] })
      setModerators(prev => {
        const newSet = new Set(prev)
        newSet.delete(userId)
        return newSet
      })
      console.log('✅ User demoted from moderator:', userId)
    } catch (error) {
      console.error('Failed to demote from moderator:', error)
      setError('Fehler beim Degradieren vom Moderator')
    }
  }

  // Promote to admin
  const promoteToAdmin = async (userEmail: string) => {
    try {
      // Find user by email
      const usersRef = collection(db, 'users')
      const q = query(usersRef)
      const snapshot = await getDocs(q)
      
      let targetUserId = null
      snapshot.forEach((doc) => {
        if (doc.data().email === userEmail) {
          targetUserId = doc.id
        }
      })

      if (targetUserId) {
        const adminRef = doc(db, 'admins', targetUserId)
        await setDoc(adminRef, {
          email: userEmail,
          promotedAt: serverTimestamp(),
          promotedBy: auth.currentUser?.email || 'Unknown'
        })
        console.log('✅ User promoted to admin:', userEmail)
      } else {
        throw new Error('User not found')
      }
    } catch (error) {
      console.error('Failed to promote to admin:', error)
      setError('Fehler beim Ernennen zum Admin')
    }
  }

  // Revoke admin
  const revokeAdmin = async (userIdOrEmail: string) => {
    try {
      await deleteDoc(doc(db, 'admins', userIdOrEmail))
      console.log('✅ Admin privileges revoked:', userIdOrEmail)
    } catch (error) {
      console.error('Failed to revoke admin:', error)
      setError('Fehler beim Entziehen der Admin-Rechte')
    }
  }

  // Get admin list
  const getAdminList = async () => {
    try {
      const adminsRef = collection(db, 'admins')
      const snapshot = await getDocs(adminsRef)
      const adminList: any[] = []
      snapshot.forEach((doc) => {
        adminList.push({ id: doc.id, ...doc.data() })
      })
      return adminList
    } catch (error) {
      console.error('Failed to get admin list:', error)
      return []
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

  const userManagement: UserManagement = {
    users: users || [],
    bannedUsers: bannedUsers || new Set(),
    moderators: moderators || new Set()
  }

  const value: AdminSettingsContextType = {
    appSettings,
    userManagement,
    loading,
    error,
    updateAppSettings,
    refreshUsers,
    sendSystemNotification,
    deleteUser,
    toggleUserAdmin,
    banUser,
    unbanUser,
    suspendUser,
    promoteToModerator,
    demoteFromModerator,
    promoteToAdmin,
    revokeAdmin,
    getAdminList
  }

  return (
    <AdminSettingsContext.Provider value={value}>
      {children}
    </AdminSettingsContext.Provider>
  )
}