import {
  collection,
  query,
  orderBy,
  limit,
  getDocs,
  onSnapshot,
  QuerySnapshot,
  DocumentData,
  enableNetwork,
  disableNetwork,
  getFirestore,
  connectFirestoreEmulator,
  initializeFirestore,
  CACHE_SIZE_UNLIMITED
} from 'firebase/firestore'
import { app } from './firebase'

// Optimierte Firestore-Instanz mit erweiterten Cache-Einstellungen
let optimizedDb: any

try {
  optimizedDb = initializeFirestore(app, {
    cacheSizeBytes: CACHE_SIZE_UNLIMITED,
    experimentalForceLongPolling: false, // Für bessere Performance
    ignoreUndefinedProperties: true
  })
} catch (error) {
  // Falls bereits initialisiert, verwende bestehende Instanz
  optimizedDb = getFirestore(app)
  console.log('🔄 Using existing Firestore instance')
}

export const db = optimizedDb

// Query-Cache für wiederverwendbare Queries
const queryCache = new Map<string, any>()
const CACHE_DURATION = 5 * 60 * 1000 // 5 Minuten

// Optimierte Firebase-Klasse
class FirebaseOptimizerClass {
  private static retryCount = 0
  private static maxRetries = 3
  private static backoffDelay = 1000

  static async init() {
    try {
      // Netzwerk-Status prüfen
      if (!navigator.onLine) {
        await this.waitForConnection()
      }

      // Cache warming für bessere Performance
      await this.warmCache()

      console.log('🔥 FirebaseOptimizer initialized')
      return true
    } catch (error) {
      console.error('❌ FirebaseOptimizer failed:', error)

      if (this.retryCount < this.maxRetries) {
        this.retryCount++
        console.log(`🔄 Retrying FirebaseOptimizer (${this.retryCount}/${this.maxRetries})`)
        await new Promise(resolve => setTimeout(resolve, this.backoffDelay * this.retryCount))
        return this.init()
      }

      throw error
    }
  }

  private static async waitForConnection(): Promise<void> {
    return new Promise((resolve) => {
      const checkConnection = () => {
        if (navigator.onLine) {
          resolve()
        } else {
          setTimeout(checkConnection, 1000)
        }
      }
      checkConnection()
    })
  }

  private static async warmCache() {
    try {
      // Pre-load kritische Queries
      await Promise.all([
        getCachedQuery('players-leaderboard'),
        getCachedQuery('user-settings')
      ])
    } catch (error) {
      console.warn('⚠️ Cache warming failed:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        code: (error as any)?.code || 'unknown',
        stack: error instanceof Error ? error.stack : undefined
      })
    }
  }
}

// Single named export
export const FirebaseOptimizer = FirebaseOptimizerClass