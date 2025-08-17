import { collection, doc, getDoc, getDocs, query, where, deleteDoc, writeBatch } from 'firebase/firestore'
import { deleteUser, User } from 'firebase/auth'
import { db, auth } from './firebase'
import { MonitoringService } from './monitoring'

export interface UserDataExport {
  userData: any
  playerData: any
  gameHistory: any[]
  suggestions: any[]
  adminActions: any[]
  exportDate: string
  gdprCompliance: boolean
}

export interface PrivacySettings {
  analytics: boolean
  marketing: boolean
  necessary: boolean
  performance: boolean
  lastUpdated: Date
  consentVersion: string
}

export class PrivacyManager {
  private static readonly CONSENT_VERSION = '1.0.0'
  private static readonly EXPORT_TIMEOUT = 30000 // 30 Sekunden
  private static readonly STORAGE_KEY = 'mallex_privacy_settings'
  private static readonly COOKIE_CONSENT_KEY = 'mallex_cookie_consent'

  /**
   * Exportiert alle Benutzerdaten GDPR-konform
   */
  static async exportUserData(userId: string): Promise<UserDataExport> {
    try {
      MonitoringService.trackUserAction('gdpr_data_export_started', { userId })

      const exportData: UserDataExport = {
        userData: null,
        playerData: null,
        gameHistory: [],
        suggestions: [],
        adminActions: [],
        exportDate: new Date().toISOString(),
        gdprCompliance: true
      }

      // 1. User Authentication Data
      const user = auth.currentUser
      if (user && user.uid === userId) {
        exportData.userData = {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName,
          createdAt: user.metadata.creationTime,
          lastSignIn: user.metadata.lastSignInTime,
          emailVerified: user.emailVerified
        }
      }

      // 2. Player Game Data
      const playerDoc = await getDoc(doc(db, 'players', userId))
      if (playerDoc.exists()) {
        exportData.playerData = {
          id: playerDoc.id,
          ...playerDoc.data(),
          exportNote: 'Alle Ihre Spieldaten und Punkte'
        }
      }

      // 3. Game History (falls vorhanden)
      const gameHistoryQuery = query(
        collection(db, 'gameHistory'),
        where('userId', '==', userId)
      )
      const gameHistorySnapshot = await getDocs(gameHistoryQuery)
      exportData.gameHistory = gameHistorySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }))

      // 4. Task Suggestions
      const suggestionsQuery = query(
        collection(db, 'taskSuggestions'),
        where('createdBy', '==', userId)
      )
      const suggestionsSnapshot = await getDocs(suggestionsQuery)
      exportData.suggestions = suggestionsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }))

      // 5. Admin Actions (falls Admin)
      const adminActionsQuery = query(
        collection(db, 'adminActions'),
        where('adminId', '==', userId)
      )
      const adminActionsSnapshot = await getDocs(adminActionsQuery)
      exportData.adminActions = adminActionsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }))

      MonitoringService.trackUserAction('gdpr_data_export_completed', {
        userId,
        dataSize: JSON.stringify(exportData).length
      })

      return exportData

    } catch (error) {
      MonitoringService.trackError('gdpr_export_failed', { userId, error: error.message })
      throw new Error(`Datenexport fehlgeschlagen: ${error.message}`)
    }
  }

  /**
   * Löscht alle Benutzerdaten GDPR-konform
   */
  static async deleteUserData(userId: string, deleteAuth = false): Promise<void> {
    try {
      MonitoringService.trackUserAction('gdpr_data_deletion_started', { userId })

      const batch = writeBatch(db)
      let deletedItems = 0

      // 1. Player Data löschen
      const playerRef = doc(db, 'players', userId)
      const playerDoc = await getDoc(playerRef)
      if (playerDoc.exists()) {
        batch.delete(playerRef)
        deletedItems++
      }

      // 2. Game History löschen
      const gameHistoryQuery = query(
        collection(db, 'gameHistory'),
        where('userId', '==', userId)
      )
      const gameHistorySnapshot = await getDocs(gameHistoryQuery)
      gameHistorySnapshot.docs.forEach(doc => {
        batch.delete(doc.ref)
        deletedItems++
      })

      // 3. Task Suggestions löschen
      const suggestionsQuery = query(
        collection(db, 'taskSuggestions'),
        where('createdBy', '==', userId)
      )
      const suggestionsSnapshot = await getDocs(suggestionsQuery)
      suggestionsSnapshot.docs.forEach(doc => {
        batch.delete(doc.ref)
        deletedItems++
      })

      // 4. Admin Actions anonymisieren (nicht löschen für Audit-Trail)
      const adminActionsQuery = query(
        collection(db, 'adminActions'),
        where('adminId', '==', userId)
      )
      const adminActionsSnapshot = await getDocs(adminActionsQuery)
      adminActionsSnapshot.docs.forEach(doc => {
        batch.update(doc.ref, {
          adminId: '[DELETED_USER]',
          adminName: '[DELETED]',
          gdprDeleted: true,
          deletedAt: new Date()
        })
        deletedItems++
      })

      // 5. Privacy Settings löschen
      const privacyRef = doc(db, 'privacySettings', userId)
      const privacyDoc = await getDoc(privacyRef)
      if (privacyDoc.exists()) {
        batch.delete(privacyRef)
        deletedItems++
      }

      // Batch-Löschung ausführen
      await batch.commit()

      // 6. Firebase Auth Account löschen (optional)
      if (deleteAuth) {
        const user = auth.currentUser
        if (user && user.uid === userId) {
          await deleteUser(user)
        }
      }

      MonitoringService.trackUserAction('gdpr_data_deletion_completed', {
        userId,
        deletedItems,
        authDeleted: deleteAuth
      })

    } catch (error) {
      MonitoringService.trackError('gdpr_deletion_failed', { userId, error: error.message })
      throw new Error(`Datenlöschung fehlgeschlagen: ${error.message}`)
    }
  }

  /**
   * Anonymisiert Benutzerdaten (Alternative zur Löschung)
   */
  static async anonymizeUserData(userId: string): Promise<void> {
    try {
      MonitoringService.trackUserAction('gdpr_data_anonymization_started', { userId })

      const batch = writeBatch(db)
      const anonymousId = `anon_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

      // Player Data anonymisieren
      const playerRef = doc(db, 'players', userId)
      const playerDoc = await getDoc(playerRef)
      if (playerDoc.exists()) {
        const playerData = playerDoc.data()
        batch.update(playerRef, {
          name: '[ANONYMIZED_USER]',
          email: '[ANONYMIZED]',
          userId: anonymousId,
          anonymized: true,
          anonymizedAt: new Date(),
          originalPoints: playerData.arenaPoints // Punkte behalten für Statistiken
        })
      }

      // Task Suggestions anonymisieren
      const suggestionsQuery = query(
        collection(db, 'taskSuggestions'),
        where('createdBy', '==', userId)
      )
      const suggestionsSnapshot = await getDocs(suggestionsQuery)
      suggestionsSnapshot.docs.forEach(doc => {
        batch.update(doc.ref, {
          createdBy: anonymousId,
          createdByName: '[ANONYMIZED]',
          anonymized: true,
          anonymizedAt: new Date()
        })
      })

      await batch.commit()

      MonitoringService.trackUserAction('gdpr_data_anonymization_completed', {
        userId,
        anonymousId
      })

    } catch (error) {
      MonitoringService.trackError('gdpr_anonymization_failed', { userId, error: error.message })
      throw new Error(`Datenanonymisierung fehlgeschlagen: ${error.message}`)
    }
  }

  /**
   * Speichert Cookie-/Privacy-Einstellungen
   */
  static async savePrivacySettings(userId: string, settings: Partial<PrivacySettings>): Promise<void> {
    try {
      const privacySettings: PrivacySettings = {
        analytics: settings.analytics ?? false,
        marketing: settings.marketing ?? false,
        necessary: true, // Immer erforderlich
        performance: settings.performance ?? false,
        lastUpdated: new Date(),
        consentVersion: this.CONSENT_VERSION
      }

      const privacyRef = doc(db, 'privacySettings', userId)
      await privacyRef.set(privacySettings)

      MonitoringService.trackUserAction('privacy_settings_updated', {
        userId,
        settings: privacySettings
      })

    } catch (error) {
      MonitoringService.trackError('privacy_settings_failed', { userId, error: error.message })
      throw error
    }
  }

  /**
   * Lädt gespeicherte Privacy-Einstellungen
   */
  static async getPrivacySettings(userId: string): Promise<PrivacySettings | null> {
    try {
      const privacyDoc = await getDoc(doc(db, 'privacySettings', userId))

      if (privacyDoc.exists()) {
        return privacyDoc.data() as PrivacySettings
      }

      return null

    } catch (error) {
      MonitoringService.trackError('privacy_settings_load_failed', { userId, error: error.message })
      return null
    }
  }

  /**
   * Prüft ob User GDPR-Consent gegeben hat
   */
  static async hasValidConsent(userId: string): Promise<boolean> {
    const settings = await this.getPrivacySettings(userId)

    if (!settings) return false

    // Prüfe ob Consent-Version aktuell ist
    return settings.consentVersion === this.CONSENT_VERSION
  }

  /**
   * Erstellt GDPR-konformen Datenexport als Download
   */
  static downloadUserData(exportData: UserDataExport, filename?: string): void {
    const jsonString = JSON.stringify(exportData, null, 2)
    const blob = new Blob([jsonString], { type: 'application/json' })
    const url = URL.createObjectURL(blob)

    const link = document.createElement('a')
    link.href = url
    link.download = filename || `mallex-datenexport-${new Date().toISOString().split('T')[0]}.json`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)

    MonitoringService.trackUserAction('gdpr_data_downloaded')
  }

  /**
   * Generiert GDPR-Report für Admins
   */
  static async generateGDPRReport(): Promise<any> {
    try {
      const report = {
        timestamp: new Date().toISOString(),
        totalUsers: 0,
        anonymizedUsers: 0,
        deletedUsers: 0,
        consentVersions: {},
        privacySettingsStats: {
          analytics: 0,
          marketing: 0,
          performance: 0
        }
      }

      // Statistiken sammeln (ohne persönliche Daten)
      const playersSnapshot = await getDocs(collection(db, 'players'))
      report.totalUsers = playersSnapshot.size
      report.anonymizedUsers = playersSnapshot.docs.filter(doc => doc.data().anonymized).length

      const privacySnapshot = await getDocs(collection(db, 'privacySettings'))
      privacySnapshot.docs.forEach(doc => {
        const data = doc.data()

        // Consent-Versionen zählen
        const version = data.consentVersion || 'unknown'
        report.consentVersions[version] = (report.consentVersions[version] || 0) + 1

        // Privacy-Einstellungen zählen
        if (data.analytics) report.privacySettingsStats.analytics++
        if (data.marketing) report.privacySettingsStats.marketing++
        if (data.performance) report.privacySettingsStats.performance++
      })

      return report

    } catch (error) {
      MonitoringService.trackError('gdpr_report_generation_failed', { error: error.message })
      throw error
    }
  }

  // --- New GDPR Functions ---

  static getConsentStatus(): PrivacySettings {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY)
      if (stored) {
        return JSON.parse(stored)
      }
    } catch (error) {
      console.warn('Error reading privacy settings:', error)
    }

    return {
      analytics: false,
      marketing: false,
      necessary: true, // Always required
      performance: false,
      lastUpdated: new Date(),
      consentVersion: this.CONSENT_VERSION
    }
  }

  // GDPR Data Export (Art. 20)
  static async exportUserData(userId: string): Promise<any> {
    try {
      const { getUserProfile } = await import('./userApi')
      const { db } = await import('./firebase')
      const { collection, query, where, getDocs, doc } = await import('firebase/firestore')

      console.log('🔒 GDPR: Exporting user data for:', userId)

      // User Profile
      const profile = await getUserProfile(userId)

      // Game History
      const gameHistoryQuery = query(
        collection(db, 'gameHistory'),
        where('userId', '==', userId)
      )
      const gameHistorySnapshot = await getDocs(gameHistoryQuery)
      const gameHistory = gameHistorySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }))

      // Achievements (if available)
      const achievementsQuery = query(
        collection(db, 'achievements'),
        where('userId', '==', userId)
      )
      const achievementsSnapshot = await getDocs(achievementsQuery)
      const achievements = achievementsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }))

      // Privacy Settings
      const privacySettings = this.getConsentStatus()

      // Task Suggestions (if any)
      const taskSuggestionsQuery = query(
        collection(db, 'taskSuggestions'),
        where('userId', '==', userId) // Assuming userId is used here
      )
      const taskSuggestionsSnapshot = await getDocs(taskSuggestionsQuery)
      const taskSuggestions = taskSuggestionsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }))

      const exportData = {
        profile,
        gameHistory,
        achievements,
        taskSuggestions,
        preferences: {
          privacy: privacySettings,
          language: localStorage.getItem('i18nextLng') || 'de'
        },
        metadata: {
          exportDate: new Date().toISOString(),
          userId,
          version: '1.0.0'
        }
      }

      console.log('✅ GDPR: User data exported successfully', {
        profileExists: !!profile,
        gameHistoryCount: gameHistory.length,
        achievementsCount: achievements.length,
        taskSuggestionsCount: taskSuggestions.length
      })

      return exportData

    } catch (error) {
      console.error('❌ GDPR: Data export failed:', error)
      throw new Error('Data export failed: ' + (error as Error).message)
    }
  }

  // GDPR Data Deletion (Art. 17)
  static async deleteUserData(userId: string): Promise<void> {
    try {
      const { db, auth } = await import('./firebase')
      const {
        collection,
        query,
        where,
        getDocs,
        deleteDoc,
        doc,
        writeBatch
      } = await import('firebase/firestore')
      const { deleteUser } = await import('firebase/auth')

      console.log('🔒 GDPR: Starting account deletion for:', userId)

      const batch = writeBatch(db)

      // Delete user profile
      const userProfileRef = doc(db, 'users', userId)
      batch.delete(userProfileRef)

      // Delete game history
      const gameHistoryQuery = query(
        collection(db, 'gameHistory'),
        where('userId', '==', userId)
      )
      const gameHistorySnapshot = await getDocs(gameHistoryQuery)
      gameHistorySnapshot.docs.forEach((doc) => {
        batch.delete(doc.ref)
      })

      // Delete achievements
      const achievementsQuery = query(
        collection(db, 'achievements'),
        where('userId', '==', userId)
      )
      const achievementsSnapshot = await getDocs(achievementsQuery)
      achievementsSnapshot.docs.forEach((doc) => {
        batch.delete(doc.ref)
      })

      // Delete task suggestions
      const taskSuggestionsQuery = query(
        collection(db, 'taskSuggestions'),
        where('userId', '==', userId) // Assuming userId is used here
      )
      const taskSuggestionsSnapshot = await getDocs(taskSuggestionsQuery)
      taskSuggestionsSnapshot.docs.forEach((doc) => {
        batch.delete(doc.ref)
      })

      // Execute batch deletion
      await batch.commit()

      // Delete Firebase Auth user
      if (auth.currentUser && auth.currentUser.uid === userId) {
        await deleteUser(auth.currentUser)
      }

      // Clear local storage
      this.clearAllLocalData()

      console.log('✅ GDPR: Account deletion completed successfully')

    } catch (error) {
      console.error('❌ GDPR: Account deletion failed:', error)
      throw new Error('Account deletion failed: ' + (error as Error).message)
    }
  }

  // Clear all cookies and local data
  static clearAllCookies(): void {
    // Clear all cookies
    document.cookie.split(";").forEach((cookie) => {
      const eqPos = cookie.indexOf("=")
      const name = eqPos > -1 ? cookie.substr(0, eqPos) : cookie
      document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`
      document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;domain=${window.location.hostname}`
      document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;domain=.${window.location.hostname}`
    })

    this.clearAllLocalData()

    console.log('🍪 All cookies and local data cleared')
  }

  private static clearAllLocalData(): void {
    // Clear localStorage
    localStorage.clear()

    // Clear sessionStorage
    sessionStorage.clear()

    // Clear IndexedDB (Firebase cache)
    if ('indexedDB' in window) {
      indexedDB.deleteDatabase('firebaseLocalStorageDb')
    }
  }
}