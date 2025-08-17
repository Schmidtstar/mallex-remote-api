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
  userId?: string; // Added userId for consistency with save function
  analytics: boolean;
  marketing: boolean;
  performance: boolean;
  necessary: boolean;
  lastUpdated: Date;
  consentVersion: string;
  ipAddress?: string; // Added for new fields
  userAgent?: string; // Added for new fields
  gdprCompliant?: boolean; // Added for new fields
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
      const errorMessage = error instanceof Error ? error.message : 'Unbekannter Fehler'
      MonitoringService.trackError('gdpr_export_failed', { userId, error: errorMessage })
      throw new Error(`Datenexport fehlgeschlagen: ${errorMessage}`)
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

      // Clear local storage
      this.clearAllLocalData()

      MonitoringService.trackUserAction('gdpr_data_deletion_completed', {
        userId,
        deletedItems,
        authDeleted: deleteAuth
      })

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unbekannter Fehler'
      MonitoringService.trackError('gdpr_deletion_failed', { userId, error: errorMessage })
      throw new Error(`Datenlöschung fehlgeschlagen: ${errorMessage}`)
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
      const errorMessage = error instanceof Error ? error.message : 'Unbekannter Fehler'
      MonitoringService.trackError('gdpr_anonymization_failed', { userId, error: errorMessage })
      throw new Error(`Datenanonymisierung fehlgeschlagen: ${errorMessage}`)
    }
  }

  /**
   * Speichert Cookie-/Privacy-Einstellungen
   */
  static async savePrivacySettings(userId: string, settings: Partial<PrivacySettings>): Promise<void> {
    try {
      const privacySettings: PrivacySettings = {
        userId,
        analytics: settings.analytics ?? false,
        marketing: settings.marketing ?? false,
        performance: settings.performance ?? false,
        necessary: true, // Immer true für notwendige Cookies
        lastUpdated: new Date(),
        consentVersion: '2.0',
        ipAddress: '', // In production durch echte IP ersetzen
        userAgent: navigator.userAgent,
        gdprCompliant: true
      }

      // Lokale Kopie speichern (als Fallback)
      localStorage.setItem(`privacy_${userId}`, JSON.stringify(privacySettings))

      try {
        // Firebase versuchen
        const { db } = await import('./firebase')
        const { doc, setDoc } = await import('firebase/firestore')
        const privacyRef = doc(db, 'privacy', userId)

        await setDoc(privacyRef, privacySettings, { merge: true })
        console.log('✅ Privacy settings saved to Firebase')
      } catch (firebaseError) {
        const errorMessage = firebaseError instanceof Error ? firebaseError.message : 'Firebase-Fehler'

        // Check if it's a permission error
        if (errorMessage.includes('permission') || errorMessage.includes('insufficient')) {
          console.warn('⚠️ Firebase permissions insufficient, using localStorage only')
          // Privacy settings are already saved in localStorage above
          return
        }

        MonitoringService.trackError(firebaseError, { userId, error: errorMessage })
        throw new Error('Fehler beim Speichern der Privacy-Einstellungen')
      }

      MonitoringService.trackUserAction('privacy_settings_updated')
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unbekannter Fehler'
      MonitoringService.trackError(error, { userId, error: errorMessage })
      throw new Error('Fehler beim Speichern der Privacy-Einstellungen')
    }
  }

  /**
   * Lädt gespeicherte Privacy-Einstellungen
   */
  static async getPrivacySettings(userId: string): Promise<PrivacySettings | null> {
    try {
      // Zuerst Firebase versuchen
      try {
        const { db } = await import('./firebase')
        const { doc, getDoc } = await import('firebase/firestore')
        const privacyRef = doc(db, 'privacy', userId)
        const privacySnap = await getDoc(privacyRef)

        if (privacySnap.exists()) {
          const data = privacySnap.data() as PrivacySettings
          // Date objects konvertieren
          if (data.lastUpdated && typeof data.lastUpdated !== 'object') {
            data.lastUpdated = new Date(data.lastUpdated)
          }
          return data
        }
      } catch (firebaseError) {
        console.warn('⚠️ Firebase load failed, using localStorage fallback:', firebaseError)
      }

      // Fallback: localStorage
      const localData = localStorage.getItem(`privacy_${userId}`)
      if (localData) {
        try {
          const parsed = JSON.parse(localData) as PrivacySettings
          if (parsed.lastUpdated) {
            parsed.lastUpdated = new Date(parsed.lastUpdated)
          }
          return parsed
        } catch (parseError) {
          console.error('Fehler beim Parsen der lokalen Privacy-Daten:', parseError)
        }
      }

      return null
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unbekannter Fehler'
      console.error('Fehler beim Laden der Privacy-Einstellungen:', error)
      MonitoringService.trackError('privacy_settings_load_failed', { userId, error: errorMessage })
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
      const errorMessage = error instanceof Error ? error.message : 'Unbekannter Fehler'
      MonitoringService.trackError('gdpr_report_generation_failed', { error: errorMessage })
      throw error
    }
  }

  /**
   * Lädt Consent-Status aus localStorage
   */
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

  /**
   * Löscht alle Cookies und lokale Daten
   */
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

  /**
   * Löscht alle lokalen Daten
   */
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