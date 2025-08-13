import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { useAuth } from './AuthContext'
import { useIsAdmin } from './AdminContext'
import { db } from '../lib/firebase'
import { 
  doc, 
  getDoc, 
  setDoc, 
  collection, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  serverTimestamp, 
  deleteDoc,
  updateDoc
} from 'firebase/firestore'

interface AppSettings {
  maintenanceMode: boolean
  registrationEnabled: true
  guestAccessEnabled: true
  maxTasksPerUser: number
  taskCooldownMinutes: number
  leaderboardVisible: boolean
  announcementText: string
  announcementActive: boolean
  appTheme: 'dark' | 'light' | 'auto'
  featuresEnabled: {
    arena: boolean
    tasks: boolean
    leaderboard: boolean
    suggestions: boolean
    legends: boolean
  }
}

interface UserManagement {
  users: AdminUser[]
  bannedUsers: Set<string>
  moderators: Set<string>
}

interface AdminUser {
  uid: string
  email?: string
  displayName?: string
  createdAt?: any
  lastActive?: any
  tasksCompleted?: number
  rank?: number
  status: 'active' | 'banned' | 'suspended'
  roles: string[]
}

interface AdminSettingsContextType {
  appSettings: AppSettings
  userManagement: UserManagement
  loading: boolean
  updateAppSettings: (settings: Partial<AppSettings>) => Promise<void>
  banUser: (uid: string, reason?: string) => Promise<void>
  unbanUser: (uid: string) => Promise<void>
  suspendUser: (uid: string, reason?: string) => Promise<void>
  promoteToModerator: (uid: string) => Promise<void>
  demoteFromModerator: (uid: string) => Promise<void>
  deleteUser: (uid: string) => Promise<void>
  sendSystemNotification: (userId: string, message: string) => Promise<void>
  refreshUsers: () => Promise<void>
  promoteToAdmin: (userIdOrEmail: string) => Promise<void>
  revokeAdmin: (userIdOrEmail: string) => Promise<void>
  getAdminList: () => Promise<any[]>
}

const defaultAppSettings: AppSettings = {
  maintenanceMode: false,
  registrationEnabled: true,
  guestAccessEnabled: true,
  maxTasksPerUser: 50,
  taskCooldownMinutes: 5,
  leaderboardVisible: true,
  announcementText: '',
  announcementActive: false,
  appTheme: 'dark',
  featuresEnabled: {
    arena: true,
    tasks: true,
    leaderboard: true,
    suggestions: true,
    legends: true
  }
}

const AdminSettingsContext = createContext<AdminSettingsContextType | null>(null)

// Hook mit konsistentem Export für Fast Refresh
function useAdminSettings() {
  const context = useContext(AdminSettingsContext)
  if (!context) {
    throw new Error('useAdminSettings must be used within AdminSettingsProvider')
  }
  return context
}

export { useAdminSettings }

export function AdminSettingsProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const isAdmin = useIsAdmin()
  const [appSettings, setAppSettings] = useState<AppSettings>(defaultAppSettings)
  const [userManagement, setUserManagement] = useState<UserManagement>({
    users: [],
    bannedUsers: new Set(),
    moderators: new Set()
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!isAdmin || !user?.uid) {
      setLoading(false)
      return
    }

    loadAdminData()
  }, [isAdmin, user?.uid])

  const loadAdminData = async () => {
    setLoading(true)
    try {
      // Load app settings with error handling
      try {
        const settingsDoc = await getDoc(doc(db, 'adminSettings', 'appConfig'))
        if (settingsDoc.exists()) {
          setAppSettings({ ...defaultAppSettings, ...settingsDoc.data() })
        }
      } catch (settingsError: any) {
        if (settingsError?.code === 'permission-denied') {
          console.log('📋 Admin settings not accessible - using defaults')
        } else {
          console.warn('Settings load error:', settingsError?.code)
        }
      }

      // Load users with error handling
      try {
        await refreshUsers()
      } catch (usersError: any) {
        if (usersError?.code === 'permission-denied') {
          console.log('👥 User management not accessible')
        } else {
          console.warn('Users load error:', usersError?.code)
        }
      }
    } catch (error) {
      console.error('Unexpected admin data load error:', error)
    } finally {
      setLoading(false)
    }
  }

  const refreshUsers = async () => {
    try {
      const usersSnapshot = await getDocs(collection(db, 'users'))
      const bannedSnapshot = await getDocs(collection(db, 'bannedUsers'))
      const moderatorsSnapshot = await getDocs(collection(db, 'moderators'))

      const users: AdminUser[] = []
      usersSnapshot.forEach(doc => {
        const data = doc.data()
        users.push({
          uid: doc.id,
          email: data.email,
          displayName: data.displayName,
          createdAt: data.createdAt,
          lastActive: data.lastActive,
          tasksCompleted: data.tasksCompleted || 0,
          rank: data.rank || 0,
          status: 'active',
          roles: data.roles || ['user']
        })
      })

      const bannedUsers = new Set<string>()
      bannedSnapshot.forEach(doc => bannedUsers.add(doc.id))

      const moderators = new Set<string>()
      moderatorsSnapshot.forEach(doc => moderators.add(doc.id))

      setUserManagement({ users, bannedUsers, moderators })
    } catch (error) {
      console.error('Failed to refresh users:', error)
    }
  }

  const updateAppSettings = async (newSettings: Partial<AppSettings>) => {
    try {
      const updatedSettings = { ...appSettings, ...newSettings }
      await setDoc(doc(db, 'adminSettings', 'appConfig'), {
        ...updatedSettings,
        updatedBy: user?.uid,
        updatedAt: serverTimestamp()
      })
      setAppSettings(updatedSettings)
      console.log('✅ App settings updated')
    } catch (error) {
      console.error('Failed to update app settings:', error)
      throw error
    }
  }

  const banUser = async (uid: string, reason?: string) => {
    try {
      await setDoc(doc(db, 'bannedUsers', uid), {
        bannedBy: user?.uid,
        bannedAt: serverTimestamp(),
        reason: reason || 'Verstoß gegen Nutzungsbedingungen'
      })

      // Update user status
      await updateDoc(doc(db, 'users', uid), {
        status: 'banned',
        bannedAt: serverTimestamp()
      })

      await refreshUsers()
      console.log('✅ User banned:', uid)
    } catch (error) {
      console.error('Failed to ban user:', error)
      throw error
    }
  }

  const unbanUser = async (uid: string) => {
    try {
      await deleteDoc(doc(db, 'bannedUsers', uid))
      await updateDoc(doc(db, 'users', uid), {
        status: 'active',
        unbannedAt: serverTimestamp()
      })
      await refreshUsers()
      console.log('✅ User unbanned:', uid)
    } catch (error) {
      console.error('Failed to unban user:', error)
      throw error
    }
  }

  const suspendUser = async (uid: string, reason?: string) => {
    try {
      await updateDoc(doc(db, 'users', uid), {
        status: 'suspended',
        suspendedBy: user?.uid,
        suspendedAt: serverTimestamp(),
        suspensionReason: reason
      })
      await refreshUsers()
      console.log('✅ User suspended:', uid)
    } catch (error) {
      console.error('Failed to suspend user:', error)
      throw error
    }
  }

  const promoteToModerator = async (uid: string) => {
    try {
      await setDoc(doc(db, 'moderators', uid), {
        promotedBy: user?.uid,
        promotedAt: serverTimestamp()
      })
      await updateDoc(doc(db, 'users', uid), {
        roles: ['user', 'moderator']
      })
      await refreshUsers()
      console.log('✅ User promoted to moderator:', uid)
    } catch (error) {
      console.error('Failed to promote user:', error)
      throw error
    }
  }

  const demoteFromModerator = async (uid: string) => {
    try {
      await deleteDoc(doc(db, 'moderators', uid))
      await updateDoc(doc(db, 'users', uid), {
        roles: ['user']
      })
      await refreshUsers()
      console.log('✅ User demoted from moderator:', uid)
    } catch (error) {
      console.error('Failed to demote user:', error)
      throw error
    }
  }

  const deleteUser = async (uid: string) => {
    try {
      // This is a dangerous operation - should be used carefully
      await deleteDoc(doc(db, 'users', uid))
      await deleteDoc(doc(db, 'bannedUsers', uid)).catch(() => {}) // Ignore if doesn't exist
      await deleteDoc(doc(db, 'moderators', uid)).catch(() => {}) // Ignore if doesn't exist

      await refreshUsers()
      console.log('✅ User deleted:', uid)
    } catch (error) {
      console.error('Failed to delete user:', error)
      throw error
    }
  }

  const sendSystemNotification = async (userId: string, message: string) => {
    if (!isAdmin) throw new Error('Only admins can send notifications')

    try {
      const notification = {
        message,
        timestamp: serverTimestamp(),
        type: 'system',
        read: false
      }

      if (userId === 'all') {
        // Send to all users
        const batch = collection(db, 'notifications')
        userManagement.users.forEach(async (targetUser) => {
          await setDoc(doc(batch, `${targetUser.uid}_${Date.now()}`), {
            ...notification,
            userId: targetUser.uid
          })
        })
      } else {
        // Send to specific user
        await setDoc(doc(db, 'notifications', `${userId}_${Date.now()}`), {
          ...notification,
          userId
        })
      }

      console.log('✅ System notification sent')
    } catch (error) {
      console.error('Failed to send notification:', error)
      throw error
    }
  }

  const promoteToAdmin = async (userIdOrEmail: string) => {
    if (!isAdmin) throw new Error('Only admins can promote other admins')

    try {
      // Find user by email or UID
      let targetUser = userManagement.users.find(u => 
        u.uid === userIdOrEmail || u.email === userIdOrEmail
      )

      if (!targetUser && userIdOrEmail.includes('@')) {
        // If email provided but user not found, create admin entry anyway
        await setDoc(doc(db, 'admins', userIdOrEmail), {
          email: userIdOrEmail,
          promotedBy: user?.uid,
          promotedAt: serverTimestamp(),
          type: 'email_based'
        })
        console.log('✅ Email added to admin list:', userIdOrEmail)
        return
      }

      if (!targetUser) {
        throw new Error('User not found')
      }

      // Add to admins collection
      await setDoc(doc(db, 'admins', targetUser.uid), {
        email: targetUser.email,
        displayName: targetUser.displayName,
        promotedBy: user?.uid,
        promotedAt: serverTimestamp(),
        type: 'user_based'
      })

      console.log('✅ User promoted to admin:', targetUser.email)
      await refreshUsers()
    } catch (error) {
      console.error('Failed to promote to admin:', error)
      throw error
    }
  }

  const revokeAdmin = async (userIdOrEmail: string) => {
    if (!isAdmin) throw new Error('Only admins can revoke admin access')

    try {
      // Try to delete by UID first, then by email
      try {
        await deleteDoc(doc(db, 'admins', userIdOrEmail))
      } catch {
        // If UID fails, try finding by email
        const adminQuery = query(
          collection(db, 'admins'),
          where('email', '==', userIdOrEmail)
        )
        const adminSnap = await getDocs(adminQuery)

        if (!adminSnap.empty) {
          await deleteDoc(adminSnap.docs[0].ref)
        }
      }

      console.log('✅ Admin access revoked for:', userIdOrEmail)
      await refreshUsers()
    } catch (error) {
      console.error('Failed to revoke admin:', error)
      throw error
    }
  }

  const getAdminList = async () => {
    if (!isAdmin) return []

    try {
      const adminSnap = await getDocs(collection(db, 'admins'))
      return adminSnap.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }))
    } catch (error) {
      console.error('Failed to load admin list:', error)
      return []
    }
  }


  const value: AdminSettingsContextType = {
    appSettings,
    userManagement,
    loading,
    updateAppSettings,
    banUser,
    unbanUser,
    suspendUser,
    promoteToModerator,
    demoteFromModerator,
    deleteUser,
    sendSystemNotification,
    refreshUsers,
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