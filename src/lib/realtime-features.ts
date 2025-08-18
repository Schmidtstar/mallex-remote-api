// MALLEX Real-time Features
import { doc, onSnapshot, collection, query, where, orderBy, limit } from 'firebase/firestore'
import { db } from './firebase'

export class RealTimeFeatures {
  private static listeners = new Map<string, () => void>()
  private ws: WebSocket | null = null
  private isConnected: boolean = false

  constructor() {
    this.setupWebSocket()
  }

  private setupWebSocket() {
    if (typeof window === 'undefined') return

    try {
      // Always skip WebSocket in development to avoid 0.0.0.0 blocking
      if (import.meta.env.DEV || 
          window.location.hostname.includes('replit') || 
          window.location.hostname === '0.0.0.0' ||
          window.location.hostname === 'localhost') {
        console.log('🔗 WebSocket skipped - using Firebase real-time instead (dev mode)')
        this.fallbackToPolling()
        return
      }

      // Use secure WebSocket in production, regular in development
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
      const host = window.location.host

      this.ws = new WebSocket(`${protocol}//${host}/ws`)

      this.ws.onopen = () => {
        console.log('🔗 WebSocket connected')
        this.isConnected = true
      }

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)
          this.handleRealtimeUpdate(data)
        } catch (error) {
          console.error('WebSocket message parse error:', error)
        }
      }

      this.ws.onerror = (error) => {
        console.warn('WebSocket not available, using polling fallback')
        this.fallbackToPolling()
      }

      this.ws.onclose = () => {
        console.log('🔗 WebSocket disconnected')
        this.isConnected = false
        this.fallbackToPolling()
      }
    } catch (error) {
      console.warn('WebSocket setup failed, using polling fallback:', error)
      this.fallbackToPolling()
    }
  }

  private fallbackToPolling() {
    // Use Firebase real-time listeners instead of WebSocket
    console.log('📡 Using Firebase real-time listeners as fallback')
    this.isConnected = true // Mark as connected for Firebase mode
  }

  private handleRealtimeUpdate(data: any) {
    // Placeholder for handling real-time updates from WebSocket
    // In a real application, this would dispatch actions or update state based on the data received.
    console.log('Real-time update received:', data);
  }

  // Live Arena Updates
  static subscribeToArenaUpdates(onUpdate: (data: any) => void) {
    const unsubscribe = onSnapshot(
      query(
        collection(db, 'arena_sessions'),
        where('active', '==', true),
        orderBy('createdAt', 'desc'),
        limit(10)
      ),
      (snapshot) => {
        const sessions = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }))
        onUpdate(sessions)
      }
    )

    this.listeners.set('arena_updates', unsubscribe)
    return unsubscribe
  }

  // Live Leaderboard Updates
  static subscribeToLeaderboard(onUpdate: (players: any[]) => void) {
    const unsubscribe = onSnapshot(
      query(
        collection(db, 'players'),
        orderBy('arenaPoints', 'desc'),
        limit(50)
      ),
      (snapshot) => {
        const players = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          rank: snapshot.docs.findIndex(d => d.id === doc.id) + 1
        }))

        console.log('📊 Live Leaderboard Update:', players.length, 'players')
        onUpdate(players)
      }
    )

    this.listeners.set('leaderboard', unsubscribe)
    return unsubscribe
  }

  // Achievement Notifications
  static subscribeToAchievements(userId: string, onAchievement: (achievement: any) => void) {
    const unsubscribe = onSnapshot(
      doc(db, 'achievements', userId),
      (doc) => {
        if (doc.exists()) {
          const achievements = doc.data()?.achievements || []
          const newAchievements = achievements.filter((a: any) => !a.notified)

          newAchievements.forEach((achievement: any) => {
            onAchievement(achievement)
            console.log('🏆 New Achievement:', achievement.title)
          })
        }
      }
    )

    this.listeners.set(`achievements_${userId}`, unsubscribe)
    return unsubscribe
  }

  // Cleanup all listeners
  static cleanup() {
    this.listeners.forEach((unsubscribe, key) => {
      console.log(`🧹 Cleaning up listener: ${key}`)
      unsubscribe()
    })
    this.listeners.clear()
  }
}