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

class FirebaseOptimizerImpl {
  private static instance: FirebaseOptimizerImpl
  private isOnline = true
  private connectionListeners: (() => void)[] = []
  private lastNetworkState = true // Added to track network state for toggling

  static getInstance(): FirebaseOptimizerImpl {
    if (!this.instance) {
      this.instance = new FirebaseOptimizerImpl()
    }
    return this.instance
  }

  static init(): Promise<void> {
    console.log('🔧 FirebaseOptimizer initialized')
    this.getInstance().monitorConnection()
    return Promise.resolve()
  }

  static monitorConnection(): void {
    this.getInstance().monitorConnection()
  }

  static getCacheStats(): any {
    return this.getInstance().getCacheStats()
  }

  static cleanup(): void {
    this.getInstance().cleanup()
  }

  static async optimizedQuery<T>(
    collectionName: string,
    orderField?: string,
    limitCount?: number,
    useCache = true
  ): Promise<T[]> {
    return this.getInstance().optimizedQuery<T>(collectionName, orderField, limitCount, useCache)
  }

  private monitorConnection(): void {
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => {
        this.isOnline = true
        console.log('🌐 Firebase connection restored')
        // Re-enable network if it was disabled
        if (!this.lastNetworkState) {
          this.toggleNetworkState(true)
        }
        this.connectionListeners.forEach(listener => listener())
      })

      window.addEventListener('offline', () => {
        this.isOnline = false
        console.log('📴 Firebase connection lost - using cache')
        // Disable network if it was enabled
        if (this.lastNetworkState) {
          this.toggleNetworkState(false)
        }
      })
      console.log('🔍 Firebase connection monitoring active')
    }
  }

  private getCacheStats(): any {
    return {
      size: queryCache.size,
      isOnline: this.isOnline,
      lastUpdate: new Date().toISOString()
    }
  }

  private cleanup(): void {
    queryCache.clear()
    this.connectionListeners = []
    // Consider disabling network if it was enabled on cleanup
    if (this.lastNetworkState) {
      this.toggleNetworkState(false)
    }
  }

  private async optimizedQuery<T>(
    collectionName: string,
    orderField?: string,
    limitCount?: number,
    useCache = true
  ): Promise<T[]> {
    // Early return if offline and no cache
    if (!this.isOnline && useCache) {
      const cacheKey = `${collectionName}_${orderField || 'none'}_${limitCount || 'all'}`
      if (queryCache.has(cacheKey)) {
        console.log(`🔄 Offline: Using cache for ${cacheKey}`)
        return queryCache.get(cacheKey).data
      }
    }
    const cacheKey = `${collectionName}_${orderField || 'none'}_${limitCount || 'all'}`

    // Cache-Check
    if (useCache && queryCache.has(cacheKey)) {
      const cached = queryCache.get(cacheKey)
      if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
        console.log(`⚡ Cache hit for ${collectionName}`)
        return cached.data
      }
    }

    try {
      // Firestore query with better error handling
      if (!db) throw new Error('Firestore not available')

      let queryRef = collection(db, collectionName)

      if (orderField) {
        queryRef = query(queryRef, orderBy(orderField, 'desc')) as any
      }

      if (limitCount) {
        queryRef = query(queryRef, limit(limitCount)) as any
      }

      const snapshot = await getDocs(queryRef)
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as T[]

      // Cache successful result
      if (useCache) {
        queryCache.set(cacheKey, {
          data,
          timestamp: Date.now()
        })
      }

      console.log(`🔥 Firestore query successful: ${collectionName} (${data.length} items)`)
      return data

    } catch (error: any) {
      console.warn(`🟡 Firestore query failed for ${collectionName}:`, error?.code || error?.message)

      // Return cached data if available
      if (useCache && queryCache.has(cacheKey)) {
        console.log(`🔄 Fallback to cache for ${collectionName}`)
        return queryCache.get(cacheKey).data
      }

      // Return empty array as last resort
      return []
    }
  }

  // Realtime-Subscription mit Reconnection-Logic (moved to class methods)
  static optimizedRealtime<T>(
    collectionName: string,
    callback: (data: T[]) => void,
    orderField?: string,
    limitCount?: number
  ): () => void {
    return this.getInstance().optimizedRealtime<T>(collectionName, callback, orderField, limitCount)
  }

  private optimizedRealtime<T>(
    collectionName: string,
    callback: (data: T[]) => void,
    orderField?: string,
    limitCount?: number
  ): () => void {
    let q = collection(db, collectionName)

    if (orderField) {
      q = query(q, orderBy(orderField, 'desc'))
    }

    if (limitCount) {
      q = query(q, limit(limitCount))
    }

    const unsubscribe = onSnapshot(
      q,
      (snapshot: QuerySnapshot<DocumentData>) => {
        const data = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as T[]

        callback(data)
        console.log(`🔄 Realtime update: ${collectionName} (${data.length} items)`)
      },
      (error) => {
        console.error(`❌ Realtime subscription error:`, error)

        // Automatischer Reconnect bei Netzwerkfehlern
        if (error.code === 'unavailable') {
          setTimeout(() => {
            console.log('🔄 Attempting to reconnect...')
            // Check if connection is restored before retrying
            if (this.isOnline) {
              // Re-subscribe to the same data
              this.optimizedRealtime(collectionName, callback, orderField, limitCount)
            }
          }, 5000)
        }
      }
    )

    return unsubscribe
  }

  // Netzwerk-Status Management
  private async toggleNetworkState(enable: boolean): Promise<void> {
    if (this.lastNetworkState === enable) return

    try {
      if (enable) {
        await enableNetwork(db)
        console.log('🌐 Firestore network enabled')
      } else {
        await disableNetwork(db)
        console.log('📴 Firestore network disabled')
      }
      this.lastNetworkState = enable
    } catch (error) {
      console.error('Network toggle failed:', error)
    }
  }

  // Cache-Management
  static clearCache(): void {
    queryCache.clear()
    console.log('🗑️ Query cache cleared')
  }

  static resetCaches(): void {
    this.clearCache()
  }

  // Add listener for connection changes
  static addConnectionListener(listener: () => void): void {
    this.getInstance().connectionListeners.push(listener)
  }
}

// Export the class as FirebaseOptimizer
export const FirebaseOptimizer = {
  // Initialization method
  async init() {
    try {
      console.log('🔧 Firebase Optimizer initializing...')

      // Initialize connection monitoring via the instance
      FirebaseOptimizerImpl.getInstance().monitorConnection()

      console.log('✅ Firebase Optimizer initialized successfully')
      return true
    } catch (error) {
      console.warn('⚠️ Firebase Optimizer init failed:', error)
      throw error
    }
  },

  // Connection monitoring
  monitorConnection() {
    // This method is already defined within the class
    FirebaseOptimizerImpl.monitorConnection()
  },

  // Get cache statistics
  getCacheStats() {
    return FirebaseOptimizerImpl.getCacheStats()
  },

  // Clean up resources
  cleanup() {
    FirebaseOptimizerImpl.cleanup()
  },

  // Optimized query function
  optimizedQuery: FirebaseOptimizerImpl.optimizedQuery,

  // Optimized realtime subscription function
  optimizedRealtime: FirebaseOptimizerImpl.optimizedRealtime,

  // Add listener for connection changes
  addConnectionListener: FirebaseOptimizerImpl.addConnectionListener,

  // Method to clear the query cache
  clearCache: FirebaseOptimizerImpl.clearCache,

  // Method to reset all caches
  resetCaches: FirebaseOptimizerImpl.resetCaches
}

// Default export für bessere Kompatibilität
export default FirebaseOptimizerImpl

// Named function exports (if still needed, but better to use class methods)
export const init = FirebaseOptimizer.init
export const cleanup = FirebaseOptimizer.cleanup
export const getCacheStats = FirebaseOptimizer.getCacheStats
export const optimizedQuery = FirebaseOptimizer.optimizedQuery
export const optimizedRealtime = FirebaseOptimizer.optimizedRealtime
export const addConnectionListener = FirebaseOptimizer.addConnectionListener

// Initialize connection monitoring on app start
if (typeof window !== 'undefined') {
  FirebaseOptimizer.init()

  // Periodische Cache-Bereinigung (moved into the class or managed differently)
  setInterval(() => {
    const now = Date.now()
    for (const [key, value] of queryCache.entries()) {
      if (now - value.timestamp > CACHE_DURATION * 2) {
        queryCache.delete(key)
      }
    }
  }, 10 * 60 * 1000) // Alle 10 Minuten
}