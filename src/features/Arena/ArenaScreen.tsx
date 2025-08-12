
import React, { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { categories } from './categories'
import { challenges } from './challenges'
import { listApprovedTasks } from '../../lib/tasksApi'
import { usePlayersContext } from '../../context/PlayersContext'
import { useSwipe } from '../../hooks/useSwipe'
import styles from '../../layouts/TabLayout.module.css'

type GameState = 'idle' | 'playing' | 'task-revealed' | 'waiting-action' | 'drinking-result'

export function ArenaScreen() {
  const { t } = useTranslation()
  const { players } = usePlayersContext()
  
  // Game State
  const [gameState, setGameState] = useState<GameState>('idle')
  const [currentRound, setCurrentRound] = useState(0)
  
  // Current Game Data
  const [selectedCategory, setSelectedCategory] = useState<string>('')
  const [selectedPlayer, setSelectedPlayer] = useState<string>('')
  const [currentTask, setCurrentTask] = useState<string>('')
  
  // Drinking Game Data
  const [drinkingSips, setDrinkingSips] = useState<number>(0)
  const [taskResult, setTaskResult] = useState<'success' | 'failed' | ''>('')
  
  // Task Data
  const [firestoreTasks, setFirestoreTasks] = useState<{[key: string]: string[]}>({})
  const [loadingTasks, setLoadingTasks] = useState(false)

  // Load all tasks for all categories on mount
  useEffect(() => {
    const loadAllTasks = async () => {
      setLoadingTasks(true)
      const tasksByCategory: {[key: string]: string[]} = {}
      
      for (const category of categories) {
        try {
          const categoryTasks = await listApprovedTasks(category.id as any)
          tasksByCategory[category.id] = categoryTasks.map(task => task.text)
        } catch (error) {
          console.error(`Error loading tasks for ${category.id}:`, error)
          tasksByCategory[category.id] = []
        }
      }
      
      setFirestoreTasks(tasksByCategory)
      setLoadingTasks(false)
    }

    loadAllTasks()
  }, [])

  const getRandomCategory = () => {
    const randomIndex = Math.floor(Math.random() * categories.length)
    return categories[randomIndex]
  }

  const getRandomPlayer = () => {
    if (players.length === 0) return 'Spieler'
    const randomIndex = Math.floor(Math.random() * players.length)
    return players[randomIndex].name
  }

  const getRandomTask = (categoryId: string) => {
    const staticTasks = challenges[categoryId] || []
    const dynamicTasks = firestoreTasks[categoryId] || []
    const allTasks = [...staticTasks, ...dynamicTasks]

    if (allTasks.length === 0) return 'Keine Aufgabe verfügbar'

    const randomIndex = Math.floor(Math.random() * allTasks.length)
    const selectedTask = allTasks[randomIndex]

    // If it's a static task (i18n key), translate it. Otherwise, use as-is (Firestore text)
    return staticTasks.includes(selectedTask) ? t(selectedTask) : selectedTask
  }

  const startGame = () => {
    const category = getRandomCategory()
    const player = getRandomPlayer()
    const task = getRandomTask(category.id)

    setSelectedCategory(category.id)
    setSelectedPlayer(player)
    setCurrentTask(task)
    setCurrentRound(1)
    setGameState('playing')
  }

  const revealTask = () => {
    setGameState('task-revealed')
  }

  const waitForAction = () => {
    setGameState('waiting-action')
  }

  const generateRandomSips = () => {
    return Math.floor(Math.random() * 5) + 1; // 1-5 Schlücke
  }

  const handleTaskSuccess = () => {
    const sips = generateRandomSips()
    setDrinkingSips(sips)
    setTaskResult('success')
    setGameState('drinking-result')
  }

  const handleTaskFailed = () => {
    const sips = generateRandomSips()
    setDrinkingSips(sips)
    setTaskResult('failed')
    setGameState('drinking-result')
  }

  const handleTaskSkipped = () => {
    // Bei übersprungenen Aufgaben direkt zur nächsten Runde
    nextRound()
  }

  const nextRound = () => {
    const category = getRandomCategory()
    const player = getRandomPlayer()
    const task = getRandomTask(category.id)

    setSelectedCategory(category.id)
    setSelectedPlayer(player)
    setCurrentTask(task)
    setCurrentRound(prev => prev + 1)
    setGameState('playing')
    
    // Reset drinking game state
    setDrinkingSips(0)
    setTaskResult('')
  }

  const endGame = () => {
    setGameState('idle')
    setCurrentRound(0)
    setSelectedCategory('')
    setSelectedPlayer('')
    setCurrentTask('')
    setDrinkingSips(0)
    setTaskResult('')
  }

  const renderGameContent = () => {
    switch (gameState) {
      case 'idle':
        return (
          <div style={{ textAlign: 'center' }}>
            <h2 style={{ color: 'var(--primary)', marginBottom: '2rem' }}>
              Bereit für MALLEX?
            </h2>
            <p style={{ marginBottom: '2rem', fontSize: '1.1rem' }}>
              {players.length > 0 
                ? `${players.length} Spieler bereit!` 
                : 'Keine Spieler in den Legenden. Füge welche hinzu!'
              }
            </p>
            <button
              onClick={startGame}
              disabled={loadingTasks || players.length === 0}
              style={{
                padding: '20px 40px',
                fontSize: '1.5rem',
                background: players.length === 0 ? '#666' : 'var(--primary)',
                color: 'var(--bg)',
                border: 'none',
                borderRadius: 'var(--radius)',
                cursor: players.length === 0 ? 'not-allowed' : 'pointer',
                opacity: players.length === 0 ? 0.6 : 1
              }}
            >
              {loadingTasks ? 'Lade Aufgaben...' : 'Spiel starten!'}
            </button>
          </div>
        )

      case 'playing':
        return (
          <div style={{ textAlign: 'center' }}>
            <div style={{ 
              background: 'var(--primary)', 
              color: 'var(--bg)', 
              padding: '10px 20px', 
              borderRadius: 'var(--radius)',
              marginBottom: '2rem',
              display: 'inline-block'
            }}>
              Runde {currentRound}
            </div>
            
            <h2 style={{ color: 'var(--primary)', marginBottom: '1rem' }}>
              {t(`arena.categories.${selectedCategory}`)}
            </h2>
            
            <div style={{
              background: 'rgba(var(--primary-rgb), 0.1)',
              padding: '20px',
              borderRadius: 'var(--radius)',
              marginBottom: '2rem'
            }}>
              <h3 style={{ marginBottom: '10px', fontSize: '1.3rem' }}>
                🎯 {selectedPlayer} ist dran!
              </h3>
            </div>

            <div className={styles.challengeCard}>
              <p className={styles.challengeText} style={{ opacity: 0.3 }}>
                ***
              </p>
            </div>

            <button
              onClick={revealTask}
              style={{
                padding: '16px 32px',
                fontSize: '1.2rem',
                background: 'var(--primary)',
                color: 'var(--bg)',
                border: 'none',
                borderRadius: 'var(--radius)',
                cursor: 'pointer',
                marginTop: '1rem'
              }}
            >
              Aufgabe aufdecken
            </button>
          </div>
        )

      case 'task-revealed':
        return (
          <div style={{ textAlign: 'center' }}>
            <div style={{ 
              background: 'var(--primary)', 
              color: 'var(--bg)', 
              padding: '10px 20px', 
              borderRadius: 'var(--radius)',
              marginBottom: '2rem',
              display: 'inline-block'
            }}>
              Runde {currentRound} - {t(`arena.categories.${selectedCategory}`)}
            </div>
            
            <div style={{
              background: 'rgba(var(--primary-rgb), 0.1)',
              padding: '20px',
              borderRadius: 'var(--radius)',
              marginBottom: '2rem'
            }}>
              <h3 style={{ marginBottom: '10px', fontSize: '1.3rem' }}>
                🎯 {selectedPlayer}
              </h3>
            </div>

            <div className={styles.challengeCard}>
              <p className={`${styles.challengeText} ${styles.revealed}`}>
                {currentTask}
              </p>
            </div>

            <button
              onClick={waitForAction}
              style={{
                padding: '16px 32px',
                fontSize: '1.2rem',
                background: 'var(--accent)',
                color: 'var(--bg)',
                border: 'none',
                borderRadius: 'var(--radius)',
                cursor: 'pointer',
                marginTop: '2rem'
              }}
            >
              Los geht's! 🚀
            </button>
          </div>
        )

      case 'waiting-action':
        return (
          <div style={{ textAlign: 'center' }}>
            <div style={{ 
              background: 'var(--primary)', 
              color: 'var(--bg)', 
              padding: '10px 20px', 
              borderRadius: 'var(--radius)',
              marginBottom: '2rem',
              display: 'inline-block'
            }}>
              Runde {currentRound} - {t(`arena.categories.${selectedCategory}`)}
            </div>
            
            <div style={{
              background: 'rgba(var(--primary-rgb), 0.1)',
              padding: '20px',
              borderRadius: 'var(--radius)',
              marginBottom: '2rem'
            }}>
              <h3 style={{ marginBottom: '10px', fontSize: '1.3rem' }}>
                🎯 {selectedPlayer}
              </h3>
            </div>

            <div className={styles.challengeCard}>
              <p className={`${styles.challengeText} ${styles.revealed}`} style={{ fontSize: '0.9rem', opacity: 0.8 }}>
                {currentTask}
              </p>
            </div>

            <h3 style={{ margin: '2rem 0 1rem', color: 'var(--primary)' }}>
              Wie ist es gelaufen?
            </h3>

            <div style={{ 
              display: 'flex', 
              flexDirection: 'column', 
              gap: '15px',
              maxWidth: '300px',
              margin: '0 auto'
            }}>
              <button
                onClick={handleTaskSuccess}
                style={{
                  padding: '15px 25px',
                  fontSize: '1.1rem',
                  background: '#4CAF50',
                  color: 'white',
                  border: 'none',
                  borderRadius: 'var(--radius)',
                  cursor: 'pointer'
                }}
              >
                ✅ Aufgabe erfüllt
              </button>
              
              <button
                onClick={handleTaskFailed}
                style={{
                  padding: '15px 25px',
                  fontSize: '1.1rem',
                  background: '#F44336',
                  color: 'white',
                  border: 'none',
                  borderRadius: 'var(--radius)',
                  cursor: 'pointer'
                }}
              >
                ❌ Aufgabe gescheitert
              </button>
              
              <button
                onClick={handleTaskSkipped}
                style={{
                  padding: '15px 25px',
                  fontSize: '1.1rem',
                  background: '#FF9800',
                  color: 'white',
                  border: 'none',
                  borderRadius: 'var(--radius)',
                  cursor: 'pointer'
                }}
              >
                ⏭️ Aufgabe übersprungen
              </button>
              
              <button
                onClick={endGame}
                style={{
                  padding: '10px 20px',
                  fontSize: '0.9rem',
                  background: 'transparent',
                  color: 'var(--text-secondary)',
                  border: '1px solid var(--text-secondary)',
                  borderRadius: 'var(--radius)',
                  cursor: 'pointer',
                  marginTop: '10px'
                }}
              >
                Spiel beenden
              </button>
            </div>
          </div>
        )

      case 'drinking-result':
        return (
          <div style={{ textAlign: 'center' }}>
            <div style={{ 
              background: 'var(--primary)', 
              color: 'var(--bg)', 
              padding: '10px 20px', 
              borderRadius: 'var(--radius)',
              marginBottom: '2rem',
              display: 'inline-block'
            }}>
              Runde {currentRound} - Trinkspiel! 🍺
            </div>

            <div style={{
              background: taskResult === 'success' ? 'rgba(76, 175, 80, 0.1)' : 'rgba(244, 67, 54, 0.1)',
              padding: '30px',
              borderRadius: 'var(--radius)',
              marginBottom: '2rem',
              border: `2px solid ${taskResult === 'success' ? '#4CAF50' : '#F44336'}`
            }}>
              <div style={{ fontSize: '4rem', marginBottom: '10px' }}>
                {taskResult === 'success' ? '🎉' : '💔'}
              </div>
              
              <h2 style={{ 
                color: taskResult === 'success' ? '#4CAF50' : '#F44336',
                marginBottom: '20px',
                fontSize: '1.5rem'
              }}>
                {taskResult === 'success' ? 'Aufgabe erfüllt!' : 'Aufgabe gescheitert!'}
              </h2>
              
              <div style={{
                background: taskResult === 'success' ? '#4CAF50' : '#F44336',
                color: 'white',
                padding: '20px',
                borderRadius: 'var(--radius)',
                fontSize: '1.3rem',
                fontWeight: 'bold'
              }}>
                <div style={{ fontSize: '2rem', marginBottom: '10px' }}>🥃</div>
                <div>
                  {drinkingSips} {drinkingSips === 1 ? 'Schluck' : 'Schlücke'}
                </div>
              </div>

              <p style={{ 
                marginTop: '20px', 
                fontSize: '1.2rem',
                color: taskResult === 'success' ? '#4CAF50' : '#F44336',
                fontWeight: '600'
              }}>
                {taskResult === 'success' 
                  ? `${selectedPlayer} darf ${drinkingSips} ${drinkingSips === 1 ? 'Schluck' : 'Schlücke'} verteilen!` 
                  : `${selectedPlayer} muss ${drinkingSips} ${drinkingSips === 1 ? 'Schluck' : 'Schlücke'} trinken!`
                }
              </p>
            </div>

            <button
              onClick={nextRound}
              style={{
                padding: '20px 40px',
                fontSize: '1.3rem',
                background: 'var(--primary)',
                color: 'var(--bg)',
                border: 'none',
                borderRadius: 'var(--radius)',
                cursor: 'pointer',
                marginBottom: '1rem'
              }}
            >
              Nächste Runde! 🎮
            </button>

            <div>
              <button
                onClick={endGame}
                style={{
                  padding: '10px 20px',
                  fontSize: '0.9rem',
                  background: 'transparent',
                  color: 'var(--text-secondary)',
                  border: '1px solid var(--text-secondary)',
                  borderRadius: 'var(--radius)',
                  cursor: 'pointer'
                }}
              >
                Spiel beenden
              </button>
            </div>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <div style={{
      padding: '24px',
      textAlign: 'center',
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center'
    }}>
      <h1 style={{ color: 'var(--primary)', marginBottom: '2rem', fontSize: '2.5rem' }}>
        MALLEX Arena
      </h1>

      {renderGameContent()}
    </div>
  )
}
