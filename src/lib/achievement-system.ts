
import { collection, doc, getDoc, getDocs, query, where, writeBatch, orderBy, limit } from 'firebase/firestore'
import { db } from './firebase'
import { MonitoringService } from './monitoring'

export interface Achievement {
  id: string
  title: string
  description: string
  icon: string
  category: 'arena' | 'social' | 'legends' | 'consistency' | 'special'
  type: 'progress' | 'milestone' | 'streak' | 'total'
  requirement: {
    value: number
    metric: string // z.B. 'arenaPoints', 'gamesPlayed', 'consecutiveDays'
  }
  rewards: {
    points: number
    title?: string
    badge?: string
  }
  rarity: 'common' | 'rare' | 'epic' | 'legendary'
  unlockedAt?: Date
  progress?: number
}

export interface UserAchievements {
  userId: string
  achievements: Achievement[]
  totalPoints: number
  currentTitle: string
  unlockedCount: number
  lastUpdated: Date
}

export interface NotificationData {
  type: 'achievement' | 'title' | 'streak'
  title: string
  message: string
  icon: string
  points?: number
  showAnimation?: boolean
}

export class AchievementSystem {
  private static readonly ACHIEVEMENTS: Achievement[] = [
    // 🏆 Arena Achievements
    {
      id: 'first_victory',
      title: 'Erster Triumph',
      description: 'Gewinne dein erstes Arena-Duell',
      icon: '🥇',
      category: 'arena',
      requirement: { type: 'wins', value: 1 },
      reward: { arenaPoints: 5, title: 'Novize' }
    },
    {
      id: 'gladiator',
      title: 'Gladiator',
      description: 'Erreiche 10 Siege in der Arena',
      icon: '⚔️',
      category: 'arena',
      requirement: { type: 'wins', value: 10 },
      reward: { arenaPoints: 20, title: 'Gladiator' }
    },
    {
      id: 'champion',
      title: 'Champion der Arena',
      description: 'Erreiche 50 Siege in der Arena',
      icon: '👑',
      category: 'arena',
      requirement: { type: 'wins', value: 50 },
      reward: { arenaPoints: 100, title: 'Champion' }
    },
    {
      id: 'legend',
      title: 'Legende des Olymps',
      description: 'Erreiche 100 Siege in der Arena',
      icon: '🏛️',
      category: 'arena',
      requirement: { type: 'wins', value: 100 },
      reward: { arenaPoints: 250, title: 'Legende' }
    },

    // 🎯 Skill Achievements  
    {
      id: 'categories_master',
      title: 'Meister aller Kategorien',
      description: 'Spiele in allen 5 Kategorien',
      icon: '🎭',
      category: 'skill',
      requirement: { type: 'categories_played', value: 5 },
      reward: { arenaPoints: 30, title: 'Universalgelehrter' }
    },
    {
      id: 'streak_master',
      title: 'Siegesserie',
      description: 'Gewinne 5 Spiele in Folge',
      icon: '🔥',
      category: 'skill',
      requirement: { type: 'win_streak', value: 5 },
      reward: { arenaPoints: 25, title: 'Streaker' }
    },
    {
      id: 'comeback_king',
      title: 'Comeback-König',
      description: 'Gewinne nach 5 Niederlagen in Folge',
      icon: '💪',
      category: 'skill',
      requirement: { type: 'comeback', value: 1 },
      reward: { arenaPoints: 15, title: 'Unbesiegbar' }
    },

    // 🎉 Social Achievements
    {
      id: 'party_starter',
      title: 'Party-Starter',
      description: 'Spiele 10 verschiedene Aufgaben',
      icon: '🎉',
      category: 'social',
      requirement: { type: 'tasks_played', value: 10 },
      reward: { arenaPoints: 15, title: 'Entertainer' }
    },
    {
      id: 'social_butterfly',
      title: 'Gesellschaftsprofi',
      description: 'Spiele 100 verschiedene Aufgaben',
      icon: '🦋',
      category: 'social',
      requirement: { type: 'tasks_played', value: 100 },
      reward: { arenaPoints: 75, title: 'Sozialexperte' }
    },

    // ⏰ Time-based Achievements
    {
      id: 'weekend_warrior',
      title: 'Wochenend-Krieger',
      description: 'Spiele an 3 Wochenenden in Folge',
      icon: '🍺',
      category: 'time',
      requirement: { type: 'weekend_sessions', value: 3 },
      reward: { arenaPoints: 20, title: 'Partylöwe' }
    },
    {
      id: 'night_owl',
      title: 'Nachteule',
      description: 'Spiele nach 23:00 Uhr',
      icon: '🦉',
      category: 'time',
      requirement: { type: 'late_night_play', value: 1 },
      reward: { arenaPoints: 10, title: 'Nachtschwärmer' }
    },

    // 🏅 Special Achievements
    {
      id: 'beta_tester',
      title: 'Beta-Tester',
      description: 'Einer der ersten 100 Spieler',
      icon: '🧪',
      category: 'special',
      requirement: { type: 'early_adopter', value: 1 },
      reward: { arenaPoints: 50, title: 'Pionier' }
    },
    {
      id: 'feedback_hero',
      title: 'Feedback-Held',
      description: 'Sende 5 Aufgaben-Vorschläge ein',
      icon: '💡',
      category: 'special',
      requirement: { type: 'suggestions_sent', value: 5 },
      reward: { arenaPoints: 25, title: 'Ideengeber' }
    }
  ]
  private static readonly ACHIEVEMENTS: Achievement[] = [
    // Arena Achievements
    {
      id: 'first_victory',
      title: 'Erste Ehre',
      description: 'Gewinne dein erstes Arena-Duell',
      icon: '🥉',
      category: 'arena',
      type: 'milestone',
      requirement: { value: 1, metric: 'arenaWins' },
      rewards: { points: 50, title: 'Novize' },
      rarity: 'common'
    },
    {
      id: 'arena_warrior',
      title: 'Arena-Krieger',
      description: 'Gewinne 10 Arena-Duelle',
      icon: '⚔️',
      category: 'arena',
      type: 'milestone',
      requirement: { value: 10, metric: 'arenaWins' },
      rewards: { points: 200, title: 'Krieger' },
      rarity: 'rare'
    },
    {
      id: 'champion',
      title: 'Olympischer Champion',
      description: 'Erreiche 1000 Arena-Punkte',
      icon: '🏆',
      category: 'arena',
      type: 'milestone',
      requirement: { value: 1000, metric: 'arenaPoints' },
      rewards: { points: 500, title: 'Champion', badge: 'champion_crown' },
      rarity: 'epic'
    },
    {
      id: 'legendary_hero',
      title: 'Legendärer Held',
      description: 'Erreiche 5000 Arena-Punkte',
      icon: '👑',
      category: 'arena',
      type: 'milestone',
      requirement: { value: 5000, metric: 'arenaPoints' },
      rewards: { points: 1500, title: 'Legende', badge: 'legendary_crown' },
      rarity: 'legendary'
    },

    // Social Achievements
    {
      id: 'social_butterfly',
      title: 'Geselliger Geist',
      description: 'Spiele mit 5 verschiedenen Mitspielern',
      icon: '🦋',
      category: 'social',
      type: 'total',
      requirement: { value: 5, metric: 'uniqueOpponents' },
      rewards: { points: 150 },
      rarity: 'rare'
    },
    {
      id: 'task_creator',
      title: 'Aufgaben-Architekt',
      description: 'Erstelle 3 eigene Aufgaben',
      icon: '🏗️',
      category: 'social',
      type: 'total',
      requirement: { value: 3, metric: 'tasksCreated' },
      rewards: { points: 300, title: 'Architekt' },
      rarity: 'epic'
    },

    // Consistency Achievements
    {
      id: 'daily_devotion',
      title: 'Tägliche Hingabe',
      description: 'Spiele 7 Tage in Folge',
      icon: '🔥',
      category: 'consistency',
      type: 'streak',
      requirement: { value: 7, metric: 'consecutiveDays' },
      rewards: { points: 250 },
      rarity: 'rare'
    },
    {
      id: 'olympian_dedication',
      title: 'Olympische Hingabe',
      description: 'Spiele 30 Tage in Folge',
      icon: '🏛️',
      category: 'consistency',
      type: 'streak',
      requirement: { value: 30, metric: 'consecutiveDays' },
      rewards: { points: 1000, title: 'Olympier', badge: 'olympian_flame' },
      rarity: 'legendary'
    },

    // Special Achievements
    {
      id: 'perfect_score',
      title: 'Perfekte Ausführung',
      description: 'Erreiche eine perfekte Bewertung (100%)',
      icon: '💯',
      category: 'special',
      type: 'milestone',
      requirement: { value: 100, metric: 'perfectScore' },
      rewards: { points: 300 },
      rarity: 'epic'
    },
    {
      id: 'speed_demon',
      title: 'Blitz-Olympier',
      description: 'Gewinne ein Duell in unter 10 Sekunden',
      icon: '⚡',
      category: 'special',
      type: 'milestone',
      requirement: { value: 10, metric: 'fastestWin' },
      rewards: { points: 200 },
      rarity: 'rare'
    },

    // Hidden/Secret Achievements
    {
      id: 'night_owl',
      title: 'Nachteule',
      description: 'Spiele zwischen 2:00 und 4:00 Uhr',
      icon: '🦉',
      category: 'special',
      type: 'milestone',
      requirement: { value: 1, metric: 'nighttimePlay' },
      rewards: { points: 100 },
      rarity: 'rare'
    },
    {
      id: 'comeback_king',
      title: 'Comeback-König',
      description: 'Gewinne nach 3 Niederlagen in Folge',
      icon: '🔄',
      category: 'special',
      type: 'milestone',
      requirement: { value: 3, metric: 'comebackAfterLosses' },
      rewards: { points: 400, title: 'Comeback-König' },
      rarity: 'epic'
    }
  ]

  /**
   * Prüft und entsperrt neue Achievements basierend auf Spieler-Statistiken
   */
  static async checkAndUnlockAchievements(
    userId: string, 
    playerStats: any,
    gameResult?: any
  ): Promise<Achievement[]> {
    try {
      const userAchievements = await this.getUserAchievements(userId)
      const unlockedAchievementIds = userAchievements.achievements.map(a => a.id)
      const newlyUnlocked: Achievement[] = []

      for (const achievement of this.ACHIEVEMENTS) {
        // Skip bereits entsperrte Achievements
        if (unlockedAchievementIds.includes(achievement.id)) continue

        // Prüfe Requirement
        const currentValue = this.getMetricValue(playerStats, gameResult, achievement.requirement.metric)
        
        if (this.meetsRequirement(currentValue, achievement.requirement)) {
          const unlockedAchievement = {
            ...achievement,
            unlockedAt: new Date(),
            progress: 100
          }

          newlyUnlocked.push(unlockedAchievement)

          // Achievement in Firestore speichern
          await this.saveUnlockedAchievement(userId, unlockedAchievement)

          // Belohnungen vergeben
          await this.grantRewards(userId, achievement.rewards)

          MonitoringService.trackUserAction('achievement_unlocked', {
            userId,
            achievementId: achievement.id,
            category: achievement.category,
            rarity: achievement.rarity
          })
        }
      }

      return newlyUnlocked

    } catch (error) {
      MonitoringService.trackError('achievement_check_failed', { userId, error: error.message })
      return []
    }
  }

  /**
   * Berechnet Achievement-Progress für alle verfügbaren Achievements
   */
  static async calculateProgress(userId: string, playerStats: any): Promise<Achievement[]> {
    try {
      const userAchievements = await this.getUserAchievements(userId)
      const unlockedIds = userAchievements.achievements.map(a => a.id)

      return this.ACHIEVEMENTS.map(achievement => {
        if (unlockedIds.includes(achievement.id)) {
          // Bereits entsperrt
          const unlocked = userAchievements.achievements.find(a => a.id === achievement.id)
          return { ...achievement, ...unlocked, progress: 100 }
        }

        // Berechne aktuellen Progress
        const currentValue = this.getMetricValue(playerStats, null, achievement.requirement.metric)
        const progress = Math.min(100, (currentValue / achievement.requirement.value) * 100)

        return { ...achievement, progress }
      })

    } catch (error) {
      MonitoringService.trackError('achievement_progress_failed', { userId, error: error.message })
      return []
    }
  }

  /**
   * Holt Benutzer-Achievements aus Firestore
   */
  static async getUserAchievements(userId: string): Promise<UserAchievements> {
    try {
      const achievementsDoc = await getDoc(doc(db, 'userAchievements', userId))
      
      if (achievementsDoc.exists()) {
        return achievementsDoc.data() as UserAchievements
      }

      // Default leere Achievements
      return {
        userId,
        achievements: [],
        totalPoints: 0,
        currentTitle: 'Novize',
        unlockedCount: 0,
        lastUpdated: new Date()
      }

    } catch (error) {
      MonitoringService.trackError('get_user_achievements_failed', { userId, error: error.message })
      throw error
    }
  }

  /**
   * Speichert entsperrtes Achievement
   */
  private static async saveUnlockedAchievement(userId: string, achievement: Achievement): Promise<void> {
    try {
      const userAchievements = await this.getUserAchievements(userId)
      
      userAchievements.achievements.push(achievement)
      userAchievements.totalPoints += achievement.rewards.points
      userAchievements.unlockedCount += 1
      userAchievements.lastUpdated = new Date()

      // Titel aktualisieren falls neuer verfügbar
      if (achievement.rewards.title) {
        userAchievements.currentTitle = achievement.rewards.title
      }

      const achievementsRef = doc(db, 'userAchievements', userId)
      await achievementsRef.set(userAchievements)

    } catch (error) {
      MonitoringService.trackError('save_achievement_failed', { userId, error: error.message })
      throw error
    }
  }

  /**
   * Vergebe Belohnungen (Punkte, Titel)
   */
  private static async grantRewards(userId: string, rewards: any): Promise<void> {
    try {
      // Zusätzliche Arena-Punkte vergeben
      if (rewards.points > 0) {
        const playerRef = doc(db, 'players', userId)
        const playerDoc = await getDoc(playerRef)
        
        if (playerDoc.exists()) {
          const currentPoints = playerDoc.data().arenaPoints || 0
          await playerRef.update({
            arenaPoints: currentPoints + rewards.points,
            achievementPoints: (playerDoc.data().achievementPoints || 0) + rewards.points
          })
        }
      }

    } catch (error) {
      MonitoringService.trackError('grant_rewards_failed', { userId, error: error.message })
    }
  }

  /**
   * Holt Metrik-Wert aus Spieler-Statistiken
   */
  private static getMetricValue(playerStats: any, gameResult: any, metric: string): number {
    switch (metric) {
      case 'arenaPoints':
        return playerStats.arenaPoints || 0
      case 'arenaWins':
        return playerStats.arenaWins || 0
      case 'gamesPlayed':
        return playerStats.gamesPlayed || 0
      case 'tasksCreated':
        return playerStats.tasksCreated || 0
      case 'consecutiveDays':
        return this.calculateConsecutiveDays(playerStats.playDates || [])
      case 'perfectScore':
        return gameResult?.performance === 100 ? 100 : 0
      case 'fastestWin':
        return gameResult?.duration || 999
      case 'nighttimePlay':
        const hour = new Date().getHours()
        return (hour >= 2 && hour <= 4) ? 1 : 0
      case 'comebackAfterLosses':
        return this.checkComebackAfterLosses(playerStats.recentGames || []) ? 3 : 0
      default:
        return 0
    }
  }

  /**
   * Prüft ob Requirement erfüllt ist
   */
  private static meetsRequirement(currentValue: number, requirement: any): boolean {
    return currentValue >= requirement.value
  }

  /**
   * Berechnet aufeinanderfolgende Spieltage
   */
  private static calculateConsecutiveDays(playDates: string[]): number {
    if (!playDates || playDates.length === 0) return 0

    const sortedDates = playDates
      .map(date => new Date(date).toDateString())
      .sort()
      .reverse()

    let streak = 1
    const today = new Date().toDateString()
    
    if (sortedDates[0] !== today) return 0

    for (let i = 1; i < sortedDates.length; i++) {
      const currentDate = new Date(sortedDates[i])
      const previousDate = new Date(sortedDates[i - 1])
      const diffDays = Math.floor((previousDate.getTime() - currentDate.getTime()) / (1000 * 60 * 60 * 24))
      
      if (diffDays === 1) {
        streak++
      } else {
        break
      }
    }

    return streak
  }

  /**
   * Prüft Comeback nach Niederlagen
   */
  private static checkComebackAfterLosses(recentGames: any[]): boolean {
    if (recentGames.length < 4) return false

    const lastFour = recentGames.slice(-4)
    return (
      lastFour[0].result === 'win' &&
      lastFour[1].result === 'loss' &&
      lastFour[2].result === 'loss' &&
      lastFour[3].result === 'loss'
    )
  }

  /**
   * Generiert Achievement-Notification
   */
  static createAchievementNotification(achievement: Achievement): NotificationData {
    const rarityEmojis = {
      common: '🥉',
      rare: '🥈',
      epic: '🥇',
      legendary: '👑'
    }

    return {
      type: 'achievement',
      title: 'Achievement Unlocked!',
      message: `${achievement.icon} ${achievement.title}`,
      icon: rarityEmojis[achievement.rarity],
      points: achievement.rewards.points,
      showAnimation: true
    }
  }

  /**
   * Holt Leaderboard basierend auf Achievement-Punkten
   */
  static async getAchievementLeaderboard(limit = 20): Promise<any[]> {
    try {
      const achievementsQuery = query(
        collection(db, 'userAchievements'),
        orderBy('totalPoints', 'desc'),
        limit(limit)
      )

      const snapshot = await getDocs(achievementsQuery)
      return snapshot.docs.map((doc, index) => ({
        rank: index + 1,
        userId: doc.id,
        ...doc.data()
      }))

    } catch (error) {
      MonitoringService.trackError('achievement_leaderboard_failed', { error: error.message })
      return []
    }
  }

  /**
   * Holt alle verfügbaren Achievements
   */
  static getAllAchievements(): Achievement[] {
    return [...this.ACHIEVEMENTS]
  }

  /**
   * Holt Achievement nach ID
   */
  static getAchievementById(id: string): Achievement | undefined {
    return this.ACHIEVEMENTS.find(a => a.id === id)
  }
}
