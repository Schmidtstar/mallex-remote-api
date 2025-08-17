
import { FirebaseRetryManager } from './firebase-retry'
import { doc, getDoc, setDoc, onSnapshot, Unsubscribe } from 'firebase/firestore'
import { db } from './firebase'

interface PlayerUpdate {
  id: string
  arenaPoints: number
  lastUpdated: number
}

export class FirebaseOptimizer {
  private static connectionCache = new Map<string, any>()
  private static listenerCache = new Map<string, Unsubscribe>()
  
  // Optimized Firebase Operations mit Caching
  static async getPlayerWithCache(playerId: string): Promise<any> {
    const cacheKey = `player_${playerId}`
    const cached = this.connectionCache.get(cacheKey)
    
    if (cached && Date.now() - cached.timestamp < 30000) { // 30s Cache
      return cached.data
    }
    
    try {
      const result = await FirebaseRetryManager.withRetry(async () => {
        const playerRef = doc(db, 'players', playerId)
        const playerDoc = await getDoc(playerRef)
        return playerDoc.exists() ? playerDoc.data() : null
      })
      
      this.connectionCache.set(cacheKey, {
        data: result,
        timestamp: Date.now()
      })
      
      return result
    } catch (error) {
      console.warn('📱 Firebase optimized get failed, using cache:', error)
      return cached?.data || null
    }
  }
  
  // Batch Player Updates für bessere Performance
  static async batchUpdatePlayers(updates: PlayerUpdate[]): Promise<void> {
    const batchPromises = updates.map(update => 
      FirebaseRetryManager.withRetry(async () => {
        const playerRef = doc(db, 'players', update.id)
        await setDoc(playerRef, {
          arenaPoints: update.arenaPoints,
          updatedAt: new Date(update.lastUpdated)
        }, { merge: true })
      })
    )
    
    await Promise.allSettled(batchPromises)
  }
  
  // Optimized Listener Management
  static setupOptimizedListener(playerId: string, callback: (data: any) => void): Unsubscribe {
    // Cleanup existing listener
    const existingListener = this.listenerCache.get(playerId)
    if (existingListener) {
      existingListener()
    }
    
    const playerRef = doc(db, 'players', playerId)
    const unsubscribe = onSnapshot(playerRef, 
      (doc) => {
        if (doc.exists()) {
          callback(doc.data())
        }
      },
      (error) => {
        console.warn(`🔥 Optimized listener error for ${playerId}:`, error)
        // Auto-retry once after 2 seconds
        setTimeout(() => {
          this.setupOptimizedListener(playerId, callback)
        }, 2000)
      }
    )
    
    this.listenerCache.set(playerId, unsubscribe)
    return unsubscribe
  }
  
  // Memory Cleanup
  static cleanup(): void {
    this.connectionCache.clear()
    this.listenerCache.forEach(unsubscribe => unsubscribe())
    this.listenerCache.clear()
  }
}

// Performance Monitor für Development
export const performanceMonitor = {
  startTiming: (operation: string) => {
    if (import.meta.env.DEV) {
      console.time(`⏱️ ${operation}`)
    }
  },
  
  endTiming: (operation: string) => {
    if (import.meta.env.DEV) {
      console.timeEnd(`⏱️ ${operation}`)
    }
  },
  
  logMetric: (metric: string, value: number) => {
    if (import.meta.env.DEV && value > 500) {
      console.warn(`🐌 Performance Warning - ${metric}: ${value}ms`)
    }
  }
}
