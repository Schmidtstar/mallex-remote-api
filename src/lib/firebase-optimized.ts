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
const CACHE_TTL = 5 * 60 * 1000 // 5 Minuten

// Optimierte Query-Builder
export class FirebaseOptimizer {
  private static lastNetworkState = true
  private static isOnline = true // Initial assume online

  // Connection monitoring
  static monitorConnection() {
    if (typeof window === 'undefined') return

    // Monitor online/offline status
    window.addEventListener('online', () => {
      this.isOnline = true
      console.log('🌐 Firebase connection restored')
      // Re-enable network if it was disabled
      if (!this.lastNetworkState) {
        this.toggleNetworkState(true)
      }
    })

    window.addEventListener('offline', () => {
      this.isOnline = false
      console.log('📡 Firebase connection lost')
      // Disable network if it was enabled
      if (this.lastNetworkState) {
        this.toggleNetworkState(false)
      }
    })

    console.log('🔍 Firebase connection monitoring active')
  }

  // Intelligenter Query-Builder mit automatischem Caching
  static async optimizedQuery<T>(
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
      if (Date.now() - cached.timestamp < CACHE_TTL) {
        console.log(`🚀 Cache hit for ${cacheKey}`)
        return cached.data
      }
    }

    try {
      let q = collection(db, collectionName)

      if (orderField) {
        q = query(q, orderBy(orderField, 'desc'))
      }

      if (limitCount) {
        q = query(q, limit(limitCount))
      }

      const snapshot = await getDocs(q)
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as T[]

      // Cache-Update
      if (useCache) {
        queryCache.set(cacheKey, {
          data,
          timestamp: Date.now()
        })
      }

      console.log(`✅ Firestore query successful: ${collectionName} (${data.length} items)`)
      return data

    } catch (error: any) {
      console.error(`❌ Firestore query failed:`, error)

      // Fallback auf Cache bei Netzwerkfehlern
      if (useCache && queryCache.has(cacheKey)) {
        console.log(`🔄 Using stale cache for ${cacheKey}`)
        return queryCache.get(cacheKey).data
      }

      throw error
    }
  }

  // Realtime-Subscription mit Reconnection-Logic
  static optimizedRealtime<T>(
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
              this.optimizedRealtime(collectionName, callback, orderField, limitCount)
            }
          }, 5000)
        }
      }
    )

    return unsubscribe
  }

  // Netzwerk-Status Management
  static async toggleNetworkState(enable: boolean) {
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
  static clearCache() {
    queryCache.clear()
    console.log('🗑️ Query cache cleared')
  }

  static resetCaches() {
    // Placeholder for potential future cache reset logic
    this.clearCache()
  }

  static getCacheStats() {
    return {
      size: queryCache.size,
      keys: Array.from(queryCache.keys()),
      totalSize: JSON.stringify(Array.from(queryCache.values())).length
    }
  }

  // Cleanup-Funktion
  static cleanup() {
    this.isOnline = false
    this.resetCaches()
    console.log('🧹 Firebase Optimizer cleaned up')
  }
}

// Initialize connection monitoring on component mount or app start
if (typeof window !== 'undefined') {
  FirebaseOptimizer.monitorConnection()

  // Periodische Cache-Bereinigung
  setInterval(() => {
    const now = Date.now()
    for (const [key, value] of queryCache.entries()) {
      if (now - value.timestamp > CACHE_TTL * 2) {
        queryCache.delete(key)
      }
    }
  }, 10 * 60 * 1000) // Alle 10 Minuten
}

// Default export für bessere Kompatibilität
export default FirebaseOptimizer

// Initialization method - Add as static method to the class
export class FirebaseOptimizerInit {
  static init() {
    console.log('🔧 FirebaseOptimizer initialized')
    FirebaseOptimizer.monitorConnection()
    return Promise.resolve()
  }
}

// Add init method to FirebaseOptimizer class
FirebaseOptimizer.init = () => {
  console.log('🔧 FirebaseOptimizer initialized')
  FirebaseOptimizer.monitorConnection()
  return Promise.resolve()
}

// Named function exports
export const init = () => {
  console.log('🔧 FirebaseOptimizer initialized')
  FirebaseOptimizer.monitorConnection()
  return Promise.resolve()
}
export const cleanup = FirebaseOptimizer.cleanup.bind(FirebaseOptimizer)
export const getCacheStats = FirebaseOptimizer.getCacheStats.bind(FirebaseOptimizer)