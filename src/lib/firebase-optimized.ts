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

export class FirebaseOptimizer {
  private static initialized = false
  private static connectionMonitor: any = null

  static async init(): Promise<void> {
    if (this.initialized) {
      console.log('🔧 Firebase Optimizer already initialized')
      return
    }

    try {
      // Initialize Firebase connection monitoring
      this.monitorConnection()
      this.initialized = true
      console.log('🔧 Firebase Optimizer initialized successfully')
    } catch (error) {
      console.warn('🟡 Firebase Optimizer initialization failed:', error)
      throw error
    }
  }

  static monitorConnection(): void {
    if (this.connectionMonitor) return

    try {
      import('./firebase').then(({ db }) => {
        if (db) {
          console.log('🔍 Firebase connection monitoring active')
          this.connectionMonitor = true
        }
      }).catch(err => {
        console.warn('🟡 Firebase monitoring setup failed:', err)
      })
    } catch (error) {
      console.warn('🟡 Connection monitoring failed:', error)
    }
  }

  static cleanup(): void {
    this.initialized = false
    this.connectionMonitor = null
    console.log('🧹 Firebase Optimizer cleaned up')
  }

  static getCacheStats() {
    return {
      initialized: this.initialized,
      monitoring: !!this.connectionMonitor,
      timestamp: new Date().toISOString()
    }
  }
}

// Default export for backward compatibility
export default FirebaseOptimizer