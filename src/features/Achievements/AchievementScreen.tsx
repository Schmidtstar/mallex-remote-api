
import React, { useState, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'
import { AchievementSystem, Achievement } from '../../lib/achievement-system'
import { MonitoringService } from '../../lib/monitoring'
import s from './AchievementScreen.module.css'

export const AchievementScreen: React.FC = () => {
  const { user } = useAuth()
  const [achievements, setAchievements] = useState<Achievement[]>([])
  const [userStats, setUserStats] = useState<any>(null)
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user) {
      loadAchievements()
    }
  }, [user])

  const loadAchievements = async () => {
    if (!user) return

    try {
      setLoading(true)

      // Lade Spieler-Statistiken für Progress-Berechnung
      const playerDoc = await import('../../lib/firebase').then(m => 
        import('firebase/firestore').then(f => f.getDoc(f.doc(m.db, 'players', user.uid)))
      )
      
      const playerStats = playerDoc.exists() ? playerDoc.data() : {}
      setUserStats(playerStats)

      // Berechne Achievement Progress
      const progressAchievements = await AchievementSystem.calculateProgress(user.uid, playerStats)
      setAchievements(progressAchievements)

      MonitoringService.trackUserAction('achievements_viewed')

    } catch (error) {
      console.error('Fehler beim Laden der Achievements:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredAchievements = achievements.filter(achievement => 
    selectedCategory === 'all' || achievement.category === selectedCategory
  )

  const categories = [
    { id: 'all', name: 'Alle', icon: '🏆' },
    { id: 'arena', name: 'Arena', icon: '⚔️' },
    { id: 'social', name: 'Sozial', icon: '👥' },
    { id: 'consistency', name: 'Beständigkeit', icon: '🔥' },
    { id: 'special', name: 'Spezial', icon: '✨' }
  ]

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'common': return '#94A3B8'
      case 'rare': return '#60A5FA'
      case 'epic': return '#A855F7'
      case 'legendary': return '#F59E0B'
      default: return '#6B7280'
    }
  }

  const getRarityGlow = (rarity: string) => {
    switch (rarity) {
      case 'common': return '0 0 10px rgba(148, 163, 184, 0.3)'
      case 'rare': return '0 0 15px rgba(96, 165, 250, 0.4)'
      case 'epic': return '0 0 20px rgba(168, 85, 247, 0.5)'
      case 'legendary': return '0 0 25px rgba(245, 158, 11, 0.6)'
      default: return 'none'
    }
  }

  if (!user) {
    return (
      <div className={s.container}>
        <div className={s.notLoggedIn}>
          <h2>🏆 Achievements</h2>
          <p>Melde dich an, um deine Erfolge zu verfolgen!</p>
        </div>
      </div>
    )
  }

  return (
    <div className={s.container}>
      <div className={s.header}>
        <h1>🏆 Achievements</h1>
        <p>Verfolge deine olympischen Erfolge</p>
        
        {userStats && (
          <div className={s.userStats}>
            <div className={s.stat}>
              <span className={s.statValue}>{achievements.filter(a => a.progress === 100).length}</span>
              <span className={s.statLabel}>Entsperrt</span>
            </div>
            <div className={s.stat}>
              <span className={s.statValue}>{userStats.achievementPoints || 0}</span>
              <span className={s.statLabel}>Achievement-Punkte</span>
            </div>
            <div className={s.stat}>
              <span className={s.statValue}>{userStats.currentTitle || 'Novize'}</span>
              <span className={s.statLabel}>Aktueller Titel</span>
            </div>
          </div>
        )}
      </div>

      {/* Kategorie-Filter */}
      <div className={s.categories}>
        {categories.map(category => (
          <button
            key={category.id}
            className={`${s.categoryBtn} ${selectedCategory === category.id ? s.active : ''}`}
            onClick={() => setSelectedCategory(category.id)}
          >
            <span className={s.categoryIcon}>{category.icon}</span>
            <span className={s.categoryName}>{category.name}</span>
          </button>
        ))}
      </div>

      {/* Achievement Liste */}
      {loading ? (
        <div className={s.loading}>
          <div className={s.spinner}></div>
          <p>Lade Achievements...</p>
        </div>
      ) : (
        <div className={s.achievementGrid}>
          {filteredAchievements.map(achievement => {
            const isUnlocked = achievement.progress === 100
            const progress = achievement.progress || 0

            return (
              <div
                key={achievement.id}
                className={`${s.achievementCard} ${isUnlocked ? s.unlocked : s.locked}`}
                style={{
                  borderColor: getRarityColor(achievement.rarity),
                  boxShadow: isUnlocked ? getRarityGlow(achievement.rarity) : 'none'
                }}
              >
                <div className={s.achievementIcon}>
                  {achievement.icon}
                  {isUnlocked && <div className={s.unlockedBadge}>✓</div>}
                </div>

                <div className={s.achievementInfo}>
                  <h3 className={s.achievementTitle}>
                    {achievement.title}
                    <span 
                      className={s.rarityBadge}
                      style={{ color: getRarityColor(achievement.rarity) }}
                    >
                      {achievement.rarity.toUpperCase()}
                    </span>
                  </h3>
                  
                  <p className={s.achievementDescription}>
                    {achievement.description}
                  </p>

                  <div className={s.achievementRewards}>
                    <span className={s.points}>+{achievement.rewards.points} Punkte</span>
                    {achievement.rewards.title && (
                      <span className={s.title}>Titel: {achievement.rewards.title}</span>
                    )}
                  </div>

                  {!isUnlocked && (
                    <div className={s.progressContainer}>
                      <div className={s.progressBar}>
                        <div 
                          className={s.progressFill}
                          style={{ 
                            width: `${progress}%`,
                            backgroundColor: getRarityColor(achievement.rarity)
                          }}
                        />
                      </div>
                      <span className={s.progressText}>{Math.round(progress)}%</span>
                    </div>
                  )}

                  {isUnlocked && achievement.unlockedAt && (
                    <div className={s.unlockedDate}>
                      Entsperrt: {new Date(achievement.unlockedAt).toLocaleDateString()}
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {filteredAchievements.length === 0 && !loading && (
        <div className={s.noAchievements}>
          <h3>Keine Achievements in dieser Kategorie</h3>
          <p>Spiele mehr, um neue Erfolge freizuschalten!</p>
        </div>
      )}
    </div>
  )
}

export default AchievementScreen
