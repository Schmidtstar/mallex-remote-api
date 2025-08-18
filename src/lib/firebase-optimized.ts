
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
export const db = initializeFirestore(app, {
  cacheSizeBytes: CACHE_SIZE_UNLIMITED,
  experimentalForceLongPolling: false, // Für bessere Performance
  ignoreUndefinedProperties: true
})

// Query-Cache für wiederverwendbare Queries
const queryCache = new Map<string, any>()
const CACHE_TTL = 5 * 60 * 1000 // 5 Minuten

// Optimierte Query-Builder
export class FirebaseOptimizer {
  private static lastNetworkState = true

  // Intelligenter Query-Builder mit automatischem Caching
  static async optimizedQuery<T>(
    collectionName: string,
    orderField?: string,
    limitCount?: number,
    useCache = true
  ): Promise<T[]> {
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
            this.optimizedRealtime(collectionName, callback, orderField, limitCount)
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

  static getCacheStats() {
    return {
      size: queryCache.size,
      keys: Array.from(queryCache.keys()),
      totalSize: JSON.stringify(Array.from(queryCache.values())).length
    }
  }
}

// Automatische Netzwerk-Überwachung
if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    FirebaseOptimizer.toggleNetworkState(true)
  })

  window.addEventListener('offline', () => {
    FirebaseOptimizer.toggleNetworkState(false)
  })

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

export default FirebaseOptimizer
