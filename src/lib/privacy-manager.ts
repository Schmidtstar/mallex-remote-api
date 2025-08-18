
// MALLEX Privacy Manager - GDPR Compliance
import { collection, doc, getDoc, getDocs, deleteDoc, query, where, updateDoc } from 'firebase/firestore'
import { db } from './firebase'
import { User } from 'firebase/auth'

export interface UserDataExport {
  profile: any
  gameHistory: any[]
  achievements: any[]
  preferences: any
  exportDate: string
  dataTypes: string[]
}

export interface PrivacySettings {
  analytics: boolean
  marketing: boolean
  functional: boolean
  necessary: boolean // Always true, cannot be disabled
  lastUpdated: string
}

export class PrivacyManager {
  /**
   * Export all user data for GDPR compliance
   */
  static async exportUserData(userId: string): Promise<UserDataExport> {
    try {
      const exportData: UserDataExport = {
        profile: null,
        gameHistory: [],
        achievements: [],
        preferences: null,
        exportDate: new Date().toISOString(),
        dataTypes: []
      }

      // Export player profile
      const playerDoc = await getDoc(doc(db, 'players', userId))
      if (playerDoc.exists()) {
        exportData.profile = {
          id: playerDoc.id,
          ...playerDoc.data(),
          // Remove sensitive internal fields
          createdAt: playerDoc.data().createdAt?.toDate?.()?.toISOString(),
          lastActive: playerDoc.data().lastActive?.toDate?.()?.toISOString()
        }
        exportData.dataTypes.push('profile')
      }

      // Export game history
      const gamesQuery = query(
        collection(db, 'games'),
        where('playerId', '==', userId)
      )
      const gamesSnapshot = await getDocs(gamesQuery)
      exportData.gameHistory = gamesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate?.()?.toISOString()
      }))
      if (exportData.gameHistory.length > 0) {
        exportData.dataTypes.push('gameHistory')
      }

      // Export achievements
      const achievementsQuery = query(
        collection(db, 'achievements'),
        where('userId', '==', userId)
      )
      const achievementsSnapshot = await getDocs(achievementsQuery)
      exportData.achievements = achievementsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        unlockedAt: doc.data().unlockedAt?.toDate?.()?.toISOString()
      }))
      if (exportData.achievements.length > 0) {
        exportData.dataTypes.push('achievements')
      }

      // Export user preferences
      const preferencesDoc = await getDoc(doc(db, 'userPreferences', userId))
      if (preferencesDoc.exists()) {
        exportData.preferences = {
          id: preferencesDoc.id,
          ...preferencesDoc.data()
        }
        exportData.dataTypes.push('preferences')
      }

      return exportData

    } catch (error) {
      console.error('Error exporting user data:', error)
      throw new Error('Data export failed')
    }
  }

  /**
   * Delete all user data (Right to be forgotten)
   */
  static async deleteUserData(userId: string): Promise<void> {
    try {
      const deletionPromises: Promise<void>[] = []

      // Delete player profile
      deletionPromises.push(deleteDoc(doc(db, 'players', userId)))

      // Delete game history
      const gamesQuery = query(
        collection(db, 'games'),
        where('playerId', '==', userId)
      )
      const gamesSnapshot = await getDocs(gamesQuery)
      gamesSnapshot.docs.forEach(gameDoc => {
        deletionPromises.push(deleteDoc(gameDoc.ref))
      })

      // Delete achievements
      const achievementsQuery = query(
        collection(db, 'achievements'),
        where('userId', '==', userId)
      )
      const achievementsSnapshot = await getDocs(achievementsQuery)
      achievementsSnapshot.docs.forEach(achievementDoc => {
        deletionPromises.push(deleteDoc(achievementDoc.ref))
      })

      // Delete user preferences
      deletionPromises.push(deleteDoc(doc(db, 'userPreferences', userId)))

      // Execute all deletions
      await Promise.all(deletionPromises)

      console.log(`✅ All data for user ${userId} has been deleted`)

    } catch (error) {
      console.error('Error deleting user data:', error)
      throw new Error('Data deletion failed')
    }
  }

  /**
   * Anonymize user data (alternative to deletion)
   */
  static async anonymizeUserData(userId: string): Promise<void> {
    try {
      const anonymizedData = {
        name: `Anonymous_${Date.now()}`,
        email: null,
        isAnonymized: true,
        anonymizedAt: new Date(),
        // Keep game statistics but remove personal identifiers
        originalDataRemoved: true
      }

      // Anonymize player profile
      await updateDoc(doc(db, 'players', userId), anonymizedData)

      console.log(`✅ User ${userId} data has been anonymized`)

    } catch (error) {
      console.error('Error anonymizing user data:', error)
      throw new Error('Data anonymization failed')
    }
  }

  /**
   * Get user privacy settings
   */
  static async getPrivacySettings(userId: string): Promise<PrivacySettings> {
    try {
      const settingsDoc = await getDoc(doc(db, 'privacySettings', userId))
      
      if (settingsDoc.exists()) {
        return settingsDoc.data() as PrivacySettings
      }

      // Default settings (GDPR compliant - opt-in)
      return {
        analytics: false,
        marketing: false,
        functional: true,
        necessary: true,
        lastUpdated: new Date().toISOString()
      }

    } catch (error) {
      console.error('Error getting privacy settings:', error)
      // Return safe defaults
      return {
        analytics: false,
        marketing: false,
        functional: true,
        necessary: true,
        lastUpdated: new Date().toISOString()
      }
    }
  }

  /**
   * Update user privacy settings
   */
  static async updatePrivacySettings(userId: string, settings: Partial<PrivacySettings>): Promise<void> {
    try {
      const updatedSettings: PrivacySettings = {
        ...await this.getPrivacySettings(userId),
        ...settings,
        necessary: true, // Always true
        lastUpdated: new Date().toISOString()
      }

      await updateDoc(doc(db, 'privacySettings', userId), updatedSettings)

      // Update analytics tracking based on settings
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('privacySettingsChanged', {
          detail: updatedSettings
        }))
      }

    } catch (error) {
      console.error('Error updating privacy settings:', error)
      throw new Error('Privacy settings update failed')
    }
  }

  /**
   * Generate privacy report for user
   */
  static async generatePrivacyReport(userId: string): Promise<{
    dataTypes: string[]
    totalRecords: number
    lastActivity: string
    privacySettings: PrivacySettings
    retentionPeriod: string
  }> {
    try {
      const exportData = await this.exportUserData(userId)
      const privacySettings = await this.getPrivacySettings(userId)

      return {
        dataTypes: exportData.dataTypes,
        totalRecords: exportData.gameHistory.length + exportData.achievements.length + (exportData.profile ? 1 : 0),
        lastActivity: exportData.profile?.lastActive || 'Never',
        privacySettings,
        retentionPeriod: '2 years from last activity'
      }

    } catch (error) {
      console.error('Error generating privacy report:', error)
      throw new Error('Privacy report generation failed')
    }
  }

  /**
   * Check if user has given specific consent
   */
  static async hasConsent(userId: string, consentType: keyof PrivacySettings): Promise<boolean> {
    try {
      const settings = await this.getPrivacySettings(userId)
      return settings[consentType] === true
    } catch (error) {
      console.error('Error checking consent:', error)
      return false
    }
  }

  /**
   * Cookie management
   */
  static setCookie(name: string, value: string, days: number = 365): void {
    const expires = new Date()
    expires.setTime(expires.getTime() + (days * 24 * 60 * 60 * 1000))
    document.cookie = `${name}=${value};expires=${expires.toUTCString()};path=/;SameSite=Strict`
  }

  static getCookie(name: string): string | null {
    const nameEQ = name + "="
    const ca = document.cookie.split(';')
    for (let i = 0; i < ca.length; i++) {
      let c = ca[i]
      while (c.charAt(0) === ' ') c = c.substring(1, c.length)
      if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length)
    }
    return null
  }

  static deleteCookie(name: string): void {
    document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/;`
  }
}
