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

// Define interfaces for settings and user data
interface AppSettings {
  maintenanceMode: boolean
  registrationEnabled: boolean
  guestAccessEnabled: boolean
  maxTasksPerUser: number
  taskCooldownMinutes: number
  announcementActive: boolean
  announcementText: string
  featuresEnabled: {
    arena: boolean
    tasks: boolean
    leaderboard: boolean
    legends: boolean
    notifications: boolean
  }
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
  error?: string | null
}

// Define context type
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

// Default settings for the app
const defaultSettings: AppSettings = {
  maintenanceMode: false,
  registrationEnabled: true,
  guestAccessEnabled: true,
  maxTasksPerUser: 50,
  taskCooldownMinutes: 5,
  announcementActive: false,
  announcementText: '',
  featuresEnabled: {
    arena: true,
    tasks: true,
    leaderboard: true,
    legends: true,
    notifications: true
  }
}

// Create the context
const AdminSettingsContext = createContext<AdminSettingsContextType | null>(null)

// Custom hook to use the context
function useAdminSettings() {
  const context = useContext(AdminSettingsContext)
  if (!context) {
    throw new Error('useAdminSettings must be used within AdminSettingsProvider')
  }
  return context
}

// Props for the provider
interface AdminSettingsProviderProps {
  children: ReactNode
}

// Export the hook and the provider component
export { useAdminSettings }

export const AdminSettingsProvider: React.FC<AdminSettingsProviderProps> = ({ children }) => {
  // State variables for app settings, user management, loading, and errors
  const [appSettings, setAppSettings] = useState<AppSettings>(defaultSettings)
  const [users, setUsers] = useState<UserStats[]>([])
  const [bannedUsers, setBannedUsers] = useState<Set<string>>(new Set())
  const [moderators, setModerators] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const user = auth.currentUser // Get the current authenticated user

  // Load settings from Firebase on component mount
  useEffect(() => {
    const settingsRef = doc(db, 'adminSettings', 'app')

    const unsubscribe = onSnapshot(settingsRef, (doc) => {
      if (doc.exists()) {
        const data = doc.data()
        
        // Migration: Map old settings to new structure
        const migratedSettings = {
          ...defaultSettings,
          ...data,
          // Map old fields to new structure
          registrationEnabled: data.allowRegistration ?? data.registrationEnabled ?? true,
          guestAccessEnabled: data.guestAccessEnabled ?? true,
          maxTasksPerUser: data.maxUsers ?? data.maxTasksPerUser ?? 50,
          taskCooldownMinutes: data.dailyTaskLimit ? Math.floor(24 * 60 / data.dailyTaskLimit) : data.taskCooldownMinutes ?? 5,
          announcementActive: data.announcements?.length > 0 ?? data.announcementActive ?? false,
          announcementText: data.announcements?.[0] ?? data.announcementText ?? '',
          featuresEnabled: data.featuresEnabled ?? defaultSettings.featuresEnabled
        }
        
        setAppSettings(migratedSettings)
        console.log('✅ Admin settings loaded and migrated:', migratedSettings)
      } else {
        console.log('📋 Admin settings not accessible - using defaults')
        setAppSettings(defaultSettings)
      }
      setLoading(false)
    }, (error) => {
      console.log('📋 Admin settings not accessible - using defaults:', error?.code)
      setAppSettings(defaultSettings)
      setLoading(false)
    })

    return unsubscribe // Cleanup subscription on unmount
  }, [])

  // Refresh users from Firebase
  const refreshUsers = async () => {
    if (!user?.uid) {
      console.warn('⚠️ No authenticated user for refreshUsers')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const usersRef = collection(db, 'users')
      const snapshot = await getDocs(usersRef)
      const userList: UserStats[] = [] // Use UserStats interface
      const banned = new Set<string>()
      const mods = new Set<string>()

      snapshot.forEach((doc) => {
        const userData = { uid: doc.id, ...doc.data() } as UserStats // Type assertion
        userList.push(userData)

        if (userData.status === 'banned') {
          banned.add(doc.id)
        }
        if (userData.roles?.includes('moderator')) {
          mods.add(doc.id)
        }
      })

      setUsers(userList)
      setBannedUsers(banned)
      setModerators(mods)
      console.log('✅ Users loaded successfully:', userList.length)
    } catch (error: any) {
      console.error('Failed to refresh users:', error)
      if (error?.code === 'permission-denied') {
        setError('Keine Berechtigung zum Laden der Benutzer. Admin-Rechte erforderlich.')
      } else {
        setError('Fehler beim Laden der Benutzer: ' + (error?.code || error?.message || 'Unbekannter Fehler'))
      }

      // Fallback: leere Arrays setzen statt undefined zu lassen
      setUsers([])
      setBannedUsers(new Set())
      setModerators(new Set())
    } finally {
      setLoading(false)
    }
  }

  // Update app settings
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

  // Send system notification to users
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
      throw error // Re-throw to allow caller to handle
    }
  }

  // Delete a user
  const deleteUser = async (userId: string) => {
    try {
      await deleteDoc(doc(db, 'users', userId))
      console.log('✅ User deleted:', userId)
      refreshUsers() // Refresh user list after deletion
    } catch (error) {
      console.error('Failed to delete user:', error)
      setError('Fehler beim Löschen des Benutzers')
    }
  }

  // Ban a user
  const banUser = async (userId: string, reason: string = 'Admin action') => {
    try {
      const userRef = doc(db, 'users', userId)
      await updateDoc(userRef, { status: 'banned', banReason: reason })
      setBannedUsers(prev => new Set([...prev, userId])) // Update local state
      console.log('✅ User banned:', { userId, reason })
    } catch (error) {
      console.error('Failed to ban user:', error)
      setError('Fehler beim Sperren des Benutzers')
    }
  }

  // Unban a user
  const unbanUser = async (userId: string) => {
    try {
      const userRef = doc(db, 'users', userId)
      await updateDoc(userRef, { status: 'active', banReason: null })
      setBannedUsers(prev => {
        const newSet = new Set(prev)
        newSet.delete(userId)
        return newSet
      }) // Update local state
      console.log('✅ User unbanned:', userId)
    } catch (error) {
      console.error('Failed to unban user:', error)
      setError('Fehler beim Entsperren des Benutzers')
    }
  }

  // Suspend a user
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

  // Promote a user to moderator
  const promoteToModerator = async (userId: string) => {
    try {
      const userRef = doc(db, 'users', userId)
      // Assuming roles is an array and we add 'moderator' to it
      await updateDoc(userRef, { roles: ['user', 'moderator'] })
      setModerators(prev => new Set([...prev, userId])) // Update local state
      console.log('✅ User promoted to moderator:', userId)
    } catch (error) {
      console.error('Failed to promote to moderator:', error)
      setError('Fehler beim Befördern zum Moderator')
    }
  }

  // Demote a user from moderator
  const demoteFromModerator = async (userId: string) => {
    try {
      const userRef = doc(db, 'users', userId)
      // Assuming roles is an array and we remove 'moderator' from it
      await updateDoc(userRef, { roles: ['user'] })
      setModerators(prev => {
        const newSet = new Set(prev)
        newSet.delete(userId)
        return newSet
      }) // Update local state
      console.log('✅ User demoted from moderator:', userId)
    } catch (error) {
      console.error('Failed to demote from moderator:', error)
      setError('Fehler beim Degradieren vom Moderator')
    }
  }

  // Promote a user to admin (by email)
  const promoteToAdmin = async (userEmail: string) => {
    try {
      // Find user by email in the 'users' collection
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
        // Create an entry in the 'admins' collection for the user
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

  // Revoke admin privileges
  const revokeAdmin = async (userIdOrEmail: string) => {
    try {
      // Assumes the doc ID in 'admins' collection is the user ID
      await deleteDoc(doc(db, 'admins', userIdOrEmail))
      console.log('✅ Admin privileges revoked:', userIdOrEmail)
    } catch (error) {
      console.error('Failed to revoke admin:', error)
      setError('Fehler beim Entziehen der Admin-Rechte')
    }
  }

  // Get the list of admins
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
      return [] // Return empty array on error
    }
  }

  // Toggle user's admin status directly in the 'users' collection
  const toggleUserAdmin = async (userId: string, isAdmin: boolean) => {
    try {
      const userRef = doc(db, 'users', userId)
      await updateDoc(userRef, { isAdmin })
      console.log('✅ User admin status updated:', { userId, isAdmin })
      refreshUsers() // Refresh user list to reflect changes
    } catch (error) {
      console.error('Failed to update user admin status:', error)
      setError('Fehler beim Aktualisieren des Admin-Status')
    }
  }

  // Load users on component mount
  useEffect(() => {
    refreshUsers()
  }, []) // Empty dependency array means this runs once on mount

  // Aggregate user data into the UserManagement interface
  const userManagement: UserManagement = {
    users: users || [],
    bannedUsers: bannedUsers || new Set(),
    moderators: moderators || new Set(),
    error: error
  }

  // Combine all context values
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

  // Provide the context value to children
  return (
    <AdminSettingsContext.Provider value={value}>
      {children}
    </AdminSettingsContext.Provider>
  )
}