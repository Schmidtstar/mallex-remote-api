
// MALLEX Real-time Features
import { doc, onSnapshot, collection, query, where, orderBy, limit } from 'firebase/firestore'
import { db } from './firebase'

export class RealTimeFeatures {
  private static listeners = new Map<string, () => void>()
  
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
