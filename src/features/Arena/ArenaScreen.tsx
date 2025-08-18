import { useState, useEffect, useMemo, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { doc, setDoc, getDoc, increment } from 'firebase/firestore'
import { db } from '../../lib/firebase'
import { categories } from './categories'
import { challenges } from './challenges'
import { listApprovedTasks } from '../../lib/tasksApi'
import { usePlayersContext } from '../../context/PlayersContext'
// Swipe functionality handled internally
import styles from '../../layouts/TabLayout.module.css'
import { useAuth } from '../../context/AuthContext'
import ErrorBoundary from '../../components/ErrorBoundary'
import { MonitoringService } from '../../lib/monitoring'
import { SecurityLayer } from '../../lib/security'
import { FirebaseOptimizer } from '../../lib/firebase-optimized'
import { AchievementSystem, NotificationData } from '../../lib/achievement-system'
import AchievementNotification from '../../components/AchievementNotification'
import { SoundManager } from '../../lib/sound-manager'
import PerformanceMonitor from '../../lib/performance-monitor'

type GameState = 'idle' | 'playing' | 'task-revealed' | 'waiting-action' | 'drinking-result'

export function ArenaScreen() {
  const { t } = useTranslation()
  const { players, updatePlayerArenaPoints } = usePlayersContext() // Destructure updatePlayerArenaPoints here
  const { user } = useAuth()
  const announcementRef = useRef<HTMLDivElement>(null) // Ref for announcement element

  // Game State
  const [gameState, setGameState] = useState<GameState>('idle')
  const [currentRound, setCurrentRound] = useState(0)

  // Current Game Data
  const [selectedCategory, setSelectedCategory] = useState<string>('')
  const [selectedPlayer, setSelectedPlayer] = useState<string>('')
  const [currentTask, setCurrentTask] = useState<string>('')

  // Oracle Animation State
  const [isSpinning, setIsSpinning] = useState(false)
  const [spinningCategory, setSpinningCategory] = useState<string>('')

  // Anti-Repeat System
  const [recentTasks, setRecentTasks] = useState<string[]>([])
  const MAX_RECENT_TASKS = 5

  // Drinking Game Data
  const [drinkingSips, setDrinkingSips] = useState<number>(0)
  const [taskResult, setTaskResult] = useState<'success' | 'failed' | ''>('')

  // Arena Round Players (excludes players from current round)
  const [excludedPlayers, setExcludedPlayers] = useState<string[]>([])

  // Task Data
  const [firestoreTasks, setFirestoreTasks] = useState<{[key: string]: string[]}>({})
  const [loadingTasks, setLoadingTasks] = useState(false)

  // Achievement Notification State
  const [achievementNotification, setAchievementNotification] = useState<NotificationData | null>(null)
  const [gameStartTime, setGameStartTime] = useState<number>(0) // Track game start time for duration

  // Screen Reader Announcement State
  const [announcement, setAnnouncement] = useState<string>('')

  // Game in progress state (for button disabling)
  const gameInProgressRef = useRef(false)
  const resultDisplayedRef = useRef(false)

  // Mock for currentChallenge and currentPlayer for the handleChoice function context
  // In a real scenario, these would be properly managed state or props.
  const [currentChallenge, setCurrentChallenge] = useState<{ correct: string, difficulty: string, id: string, text: string }>({ correct: '', difficulty: '', id: '', text: '' })
  const [currentPlayer, setCurrentPlayer] = useState<any>(null) // Replace 'any' with your player type if available


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
          if (import.meta.env.DEV) {
            console.error(`Error loading tasks for ${category.id}:`, error)
          }
          tasksByCategory[category.id] = []
        }
      }

      setFirestoreTasks(tasksByCategory)
      setLoadingTasks(false)
    }

    loadAllTasks()
  }, [])

  // Helper function for screen reader announcements
  const announceToScreenReader = (message: string) => {
    setAnnouncement(message)
    // Clear announcement after a short delay to allow screen reader to pick it up
    setTimeout(() => setAnnouncement(''), 100)
  }

  const getRandomCategory = () => {
    const randomIndex = Math.floor(Math.random() * categories.length)
    return categories[randomIndex]
  }

  const getRandomPlayer = () => {
    // Filter out excluded players from arena round
    const availablePlayers = players.filter(player => !excludedPlayers.includes(player.name))

    if (availablePlayers.length === 0) {
      // If all players are excluded, reset exclusions and use all players
      setExcludedPlayers([])
      return players.length > 0 ? players[0].name : 'Spieler'
    }

    const randomIndex = Math.floor(Math.random() * availablePlayers.length)
    return availablePlayers[randomIndex].name
  }

  const removePlayerFromRound = (playerName: string) => {
    setExcludedPlayers(prev => [...prev, playerName])
    announceToScreenReader(`${playerName} wurde aus der aktuellen Arena-Runde entfernt.`)

    // If current player is removed, go to next round
    if (selectedPlayer === playerName && gameState !== 'idle') {
      nextRound()
    }
  }

  const addPlayerBackToRound = (playerName: string) => {
    setExcludedPlayers(prev => prev.filter(name => name !== playerName))
    announceToScreenReader(`${playerName} wurde wieder in die Arena-Runde aufgenommen.`)
  }

  const getRandomTask = (categoryId: string) => {
    // Load hidden static tasks from localStorage
    const hiddenTasksData = localStorage.getItem('mallex_hidden_static_tasks')
    const hiddenTasks = hiddenTasksData ? new Set(JSON.parse(hiddenTasksData)) : new Set()

    // Filter out hidden static tasks
    const staticTasks = (challenges[categoryId] || []).filter(taskKey => !hiddenTasks.has(taskKey))
    const dynamicTasks = firestoreTasks[categoryId] || []
    let allTasks = [...staticTasks, ...dynamicTasks]

    if (allTasks.length === 0) return 'Keine Aufgabe verfügbar'

    // Anti-Repeat Filter: Entferne kürzlich gespielte Aufgaben
    const availableTasks = allTasks.filter(task => {
      // We need to be careful here. If a task is dynamic, it might not have a translation key in `t`.
      // For simplicity in filtering, we'll assume static tasks are translated.
      const translatedTask = staticTasks.includes(task) ? t(task) : task
      return !recentTasks.includes(translatedTask)
    })

    // Falls alle Aufgaben kürzlich gespielt wurden, nehme alle
    const tasksToChooseFrom = availableTasks.length > 0 ? availableTasks : allTasks

    const randomIndex = Math.floor(Math.random() * tasksToChooseFrom.length)
    const selectedTask = tasksToChooseFrom[randomIndex]

    // Translate and return
    const translatedTask = staticTasks.includes(selectedTask) ? t(selectedTask) : selectedTask

    // Aktualisiere Recent Tasks
    setRecentTasks(prev => {
      const updated = [translatedTask, ...prev].slice(0, MAX_RECENT_TASKS)
      return updated
    })

    return translatedTask
  }

  const startGame = () => {
    const endTimer = MonitoringService.startTimer('arena_game_start')
    MonitoringService.trackUserAction('arena_start', { playersCount: players.length })

    try {
      const category = getRandomCategory()
      const player = getRandomPlayer()
      const task = getRandomTask(category.id)

      // Set current challenge details for handleChoice
      setCurrentChallenge({
        id: category.id, // Assuming category.id can be used as challenge id for now
        text: task,
        correct: task, // Placeholder: In a real game, 'correct' would be defined
        difficulty: 'medium' // Placeholder: In a real game, difficulty would be defined
      })
      setCurrentPlayer(players.find(p => p.name === player)) // Set current player for handleChoice context


      setSelectedCategory(category.id)
      setSelectedPlayer(player)
      setCurrentTask(task)
      setCurrentRound(1)
      setGameState('playing')
      setGameStartTime(Date.now()) // Track start time

      // Sound Effect für Arena-Start
      SoundManager.playArenaStart()

      // Announce game start to screen reader
      announceToScreenReader(`Arena gestartet. Runde 1. Spieler ${player} ist an der Reihe.`)

      endTimer()
    } catch (error) {
      MonitoringService.trackError(error as Error, { context: 'arena_start' })
      console.error('❌ Arena start failed:', error)
      announceToScreenReader('Fehler beim Starten der Arena.')
    }
  }

  const revealTask = () => {
    setIsSpinning(true)
    let spinCounter = 0

    // Haptic Feedback for Mobile
    if ('vibrate' in navigator) {
      navigator.vibrate(100)
    }

    // Start the spinning animation
    const spinInterval = setInterval(() => {
      spinCounter += 1
      const categoryIndex = (spinCounter - 1) % categories.length
      setSpinningCategory(categories[categoryIndex].id)

      // Stop after 8 spins (4 seconds with 0.5s intervals) - Optimized for better UX
      if (spinCounter >= 8) {
        clearInterval(spinInterval)
        setIsSpinning(false)
        setGameState('task-revealed') // Changed from waiting-action to task-revealed for clarity

        // Final haptic feedback
        if ('vibrate' in navigator) {
          navigator.vibrate([50, 100, 50])
        }
        // Announce task revealed
        const revealedCategoryName = t(`arena.categories.${spinningCategory}`)
        announceToScreenReader(`Aufgabe enthüllt: Kategorie ${revealedCategoryName}.`)
      }
    }, 500)
  }

  const waitForAction = () => {
    setGameState('waiting-action')
    // Announce state change
    announceToScreenReader(`Spieler ${selectedPlayer} wird zur Aktion aufgefordert.`)
  }

  const generateRandomSips = () => {
    return Math.floor(Math.random() * 5) + 1; // 1-5 Schlücke
  }

  const updatePlayerPoints = async (playerName: string, pointsToAdd: number) => {
    try {
      // Using the destructured updatePlayerArenaPoints from context
      await updatePlayerArenaPoints(playerName, pointsToAdd)
      console.log(`✅ ${playerName} erhält ${pointsToAdd} Arena-Punkte (Real-time Sync aktiv)!`)

      // Announce points update
      announceToScreenReader(`${playerName} hat ${pointsEarned} Punkte erhalten.`)

      // Validation: Check if points were saved correctly
      const updatedPlayer = players.find(p => p.name.toLowerCase() === playerName.toLowerCase())
      if (updatedPlayer) {
        console.log(`🔍 Validation: ${playerName} now has ${updatedPlayer.arenaPoints} points`)
      } else {
        console.warn(`⚠️ Player ${playerName} not found after update!`)
      }

    } catch (error) {
      console.error('❌ Arena points update failed:', error)
      alert(`Fehler beim Speichern der Punkte für ${playerName}. Bitte versuche es erneut.`)
      announceToScreenReader(`Fehler beim Speichern der Punkte für ${playerName}.`)
    }
  }

  const handleTaskSuccess = async () => {
    const sips = generateRandomSips()
    const arenaPoints = Math.floor(Math.random() * 3) + 1 // 1-3 Punkte für Erfolg

    // Award arena points to the player
    await updatePlayerPoints(selectedPlayer, arenaPoints)

    setDrinkingSips(sips)
    setTaskResult('success')
    setGameState('drinking-result')

    // Sound Effect für richtige Antwort
    SoundManager.playCorrectAnswer()
    // Announce result
    announceToScreenReader(`${selectedPlayer} hat die Aufgabe erfolgreich abgeschlossen. Sie müssen ${sips} Schlücke ${sips === 1 ? '' : ''} trinken.`)
  }

  const handleTaskFailed = async () => {
    const sips = generateRandomSips()
    const arenaPoints = 1 // 1 Punkt für den Versuch, auch bei Niederlage

    // Award small arena points even for trying
    await updatePlayerPoints(selectedPlayer, arenaPoints)

    setDrinkingSips(sips)
    setTaskResult('failed')
    setGameState('drinking-result')

    // Sound Effect für falsche Antwort
    SoundManager.playWrongAnswer()
    // Announce result
    announceToScreenReader(`${selectedPlayer} hat die Aufgabe nicht erfolgreich abgeschlossen. Sie müssen ${sips} Schlücke ${sips === 1 ? '' : ''} trinken.`)
  }

  const handleTaskSkipped = () => {
    // Bei übersprungenen Aufgaben direkt zur nächsten Runde
    announceToScreenReader(`${selectedPlayer} hat die Aufgabe übersprungen.`)
    nextRound()
  }

  const nextRound = () => {
    const category = getRandomCategory()
    const player = getRandomPlayer()
    const task = getRandomTask(category.id)

    // Set current challenge details for handleChoice
    setCurrentChallenge({
      id: category.id,
      text: task,
      correct: task, // Placeholder
      difficulty: 'medium' // Placeholder
    })
    setCurrentPlayer(players.find(p => p.name === player))

    setSelectedCategory(category.id)
    setSelectedPlayer(player)
    setCurrentTask(task)
    setCurrentRound(prev => prev + 1)
    setGameState('playing')

    // Reset drinking game state
    setDrinkingSips(0)
    setTaskResult('')
    setGameStartTime(Date.now()) // Reset game start time for the new round

    // Announce next round
    announceToScreenReader(`Neue Runde gestartet. Runde ${currentRound + 1}. Spieler ${player} ist an der Reihe.`)
  }

  const endGame = () => {
    setGameState('idle')
    setCurrentRound(0)
    setSelectedCategory('')
    setSelectedPlayer('')
    setCurrentTask('')
    setDrinkingSips(0)
    setTaskResult('')
    setExcludedPlayers([]) // Reset excluded players
    setAchievementNotification(null) // Clear any pending notifications
    announceToScreenReader('Arena-Spiel beendet.')
  }

  // Memoize mobile detection to prevent re-calculations
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 768)

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768)
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const renderGameContent = () => {

    switch (gameState) {
      case 'idle':
        return (
          <div style={{ textAlign: 'center', padding: '10px' }}>
            {/* Kompakter Header */}
            <div style={{ 
              fontSize: window.innerWidth < 768 ? '3rem' : '6rem', 
              marginBottom: '0.5rem',
              textShadow: '0 0 30px rgba(218, 165, 32, 0.8)',
              animation: 'pulse 2s infinite'
            }}>
              ⚡🏛️⚡
            </div>
            <h1 style={{ 
              color: 'var(--ancient-gold)', 
              marginBottom: '1rem',
              background: 'var(--gradient-gold)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              fontSize: window.innerWidth < 768 ? '1.4rem' : '2.5rem',
              fontWeight: 'bold',
              textShadow: '2px 2px 4px rgba(0,0,0,0.8)',
              lineHeight: '1.2'
            }}>
              ⚔️ MALLEX ARENA ⚔️
            </h1>

            {/* Mobile: Kompakter Status */}
            <div style={{
              background: 'linear-gradient(135deg, rgba(218,165,32,0.2), rgba(205,127,50,0.1))',
              backdropFilter: 'var(--glass-blur)',
              border: '2px solid var(--ancient-gold)',
              borderRadius: 'var(--radius)',
              padding: window.innerWidth < 768 ? '1rem' : '2.5rem',
              marginBottom: '1rem',
              position: 'relative',
              boxShadow: '0 10px 30px rgba(218,165,32,0.3)'
            }}>
              {window.innerWidth >= 768 && (
                <div style={{ 
                  position: 'absolute',
                  top: '10px',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  fontSize: '1.2rem',
                  opacity: 0.7
                }}>
                  🌿 ⚱️ 🌿
                </div>
              )}

              <div style={{ fontSize: window.innerWidth < 768 ? '2rem' : '3rem', marginBottom: '0.5rem' }}>🏺</div>

              <div style={{
                background: 'var(--glass-background)',
                padding: window.innerWidth < 768 ? '1rem' : '1.5rem',
                borderRadius: 'var(--radius)',
                border: '1px solid rgba(218,165,32,0.3)'
              }}>
                <h3 style={{ 
                  color: 'var(--olympic-victory)', 
                  marginBottom: '0.5rem',
                  fontSize: window.innerWidth < 768 ? '1rem' : '1.4rem'
                }}>
                  ⚡ GLADIATOREN ⚡
                </h3>
                <p style={{ 
                  fontSize: window.innerWidth < 768 ? '0.9rem' : '1.3rem', 
                  color: 'var(--ancient-marble)',
                  fontWeight: 'bold'
                }}>
                  {players.length > 0 
                    ? `🏆 ${players.length} HELDEN BEREIT!` 
                    : '💀 KEINE KÄMPFER!'
                  }
                </p>
              </div>
            </div>

            {/* Arena Fighters Info */}
            {players.length > 0 && (
              <div style={{
                background: 'var(--glass-background)',
                backdropFilter: 'var(--glass-blur)',
                border: '2px solid var(--ancient-bronze)',
                borderRadius: 'var(--radius)',
                padding: window.innerWidth < 768 ? '1rem' : '1.5rem',
                marginBottom: '1rem',
                maxWidth: '500px',
                width: '100%'
              }}>
                <h3 style={{ 
                  color: 'var(--ancient-gold)', 
                  marginBottom: '1rem',
                  fontSize: window.innerWidth < 768 ? '1rem' : '1.2rem',
                  textAlign: 'center'
                }}>
                  ⚔️ ARENA-KÄMPFER ⚔️
                </h3>

                <div style={{
                  display: 'grid',
                  gridTemplateColumns: window.innerWidth < 768 ? '1fr 1fr' : 'repeat(auto-fit, minmax(150px, 1fr))',
                  gap: '0.5rem',
                  marginBottom: '1rem'
                }}>
                  {players.filter(p => !excludedPlayers.includes(p.name)).map(player => (
                    <div
                      key={player.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.5rem',
                        padding: '0.5rem',
                        background: 'rgba(218, 165, 32, 0.1)',
                        border: '1px solid var(--ancient-gold)',
                        borderRadius: '8px',
                        transition: 'all 0.3s ease'
                      }}
                    >
                      <span style={{
                        color: 'var(--ancient-gold)',
                        fontWeight: 'bold',
                        fontSize: window.innerWidth < 768 ? '0.8rem' : '0.9rem'
                      }}>
                        ⚜️ {player.name}
                      </span>
                    </div>
                  ))}
                </div>

                <div style={{
                  textAlign: 'center',
                  fontSize: '0.8rem',
                  color: 'var(--ancient-bronze)',
                  fontStyle: 'italic'
                }}>
                  🏛️ Spieler in der Halle der Legenden verwalten
                </div>
              </div>
            )}

            {/* Start Button - Mobile optimiert */}
            <button
              onClick={startGame}
              disabled={loadingTasks || players.length === 0 || players.filter(p => !excludedPlayers.includes(p.name)).length === 0}
              style={{
                padding: window.innerWidth < 768 ? '15px 25px' : '25px 50px',
                fontSize: window.innerWidth < 768 ? '1.1rem' : '1.8rem',
                background: (players.length === 0 || players.filter(p => !excludedPlayers.includes(p.name)).length === 0)
                  ? 'linear-gradient(135deg, var(--ancient-stone), #6B6B6B)' 
                  : 'linear-gradient(135deg, var(--olympic-flame), var(--ancient-gold))',
                color: (players.length === 0 || players.filter(p => !excludedPlayers.includes(p.name)).length === 0) ? 'var(--ancient-marble)' : 'var(--ancient-night)',
                border: `3px solid ${(players.length === 0 || players.filter(p => !excludedPlayers.includes(p.name)).length === 0) ? 'var(--ancient-stone)' : 'var(--olympic-victory)'}`,
                borderRadius: 'var(--radius)',
                cursor: (players.length === 0 || players.filter(p => !excludedPlayers.includes(p.name)).length === 0) ? 'not-allowed' : 'pointer',
                opacity: (players.length === 0 || players.filter(p => !excludedPlayers.includes(p.name)).length === 0) ? 0.6 : 1,
                fontWeight: 'bold',
                textShadow: '2px 2px 4px rgba(0,0,0,0.8)',
                boxShadow: (players.length > 0 && players.filter(p => !excludedPlayers.includes(p.name)).length > 0)
                  ? '0 10px 25px rgba(255,107,53,0.5), inset 0 2px 10px rgba(255,215,0,0.3)' 
                  : 'none',
                transition: 'all 0.3s ease',
                textTransform: 'uppercase',
                letterSpacing: '1px',
                width: window.innerWidth < 768 ? '100%' : 'auto',
                maxWidth: '300px'
              }}
              aria-label={loadingTasks 
                ? 'Warte auf die Lade der Aufgaben' 
                : players.filter(p => !excludedPlayers.includes(p.name)).length === 0
                  ? 'Keine aktiven Kämpfer verfügbar'
                  : 'Starte das Arena-Spiel'
              }
            >
              {loadingTasks 
                ? '⏳ BEREIT...' 
                : players.filter(p => !excludedPlayers.includes(p.name)).length === 0
                  ? '💀 KEINE AKTIVEN KÄMPFER'
                  : '🎯 IN DIE ARENA!'
              }
            </button>

            {players.length > 0 && (
              <div style={{
                marginTop: '1rem',
                color: 'var(--ancient-bronze)',
                fontSize: window.innerWidth < 768 ? '0.8rem' : '1rem',
                fontStyle: 'italic'
              }}>
                ⚡ Mögen die Götter mit euch sein ⚡
              </div>
            )}
          </div>
        )

      case 'playing':
        return (
          <div style={{ textAlign: 'center', padding: '10px' }}>
            {/* Kompakter Runden-Header */}
            <div style={{ 
              background: 'linear-gradient(135deg, var(--olympic-flame), var(--ancient-gold))', 
              color: 'var(--ancient-night)', 
              padding: isMobile ? '8px 15px' : '15px 30px', 
              borderRadius: 'var(--radius)',
              marginBottom: '1rem',
              display: 'inline-block',
              border: '2px solid var(--olympic-victory)',
              boxShadow: '0 5px 20px rgba(255,107,53,0.5)',
              fontWeight: 'bold',
              fontSize: isMobile ? '0.9rem' : '1.2rem',
              textTransform: 'uppercase'
            }}>
              ⚔️ RUNDE {currentRound} ⚔️
            </div>

            {/* Nur Spieler anzeigen - Kategorie wird erst beim Enthüllen gezeigt */}
            <div style={{
              background: 'linear-gradient(135deg, rgba(255,107,53,0.3), rgba(218,165,32,0.2))',
              padding: isMobile ? '1rem' : '2rem',
              borderRadius: 'var(--radius)',
              marginBottom: '1rem',
              border: '2px solid var(--ancient-gold)',
              position: 'relative'
            }}>
              {!isMobile && (
                <div style={{ 
                  position: 'absolute',
                  top: '10px',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  fontSize: '1.5rem',
                  opacity: 0.6
                }}>
                  🏛️
                </div>
              )}

              <div style={{
                background: 'var(--glass-background)',
                backdropFilter: 'var(--glass-blur)',
                padding: isMobile ? '1rem' : '2rem',
                borderRadius: 'var(--radius)',
                border: '1px solid rgba(255,215,0,0.3)'
              }}>
                <div style={{ fontSize: isMobile ? '1.8rem' : '3rem', marginBottom: '0.5rem' }}>⚡</div>
                <h3 style={{ 
                  marginBottom: '0.5rem', 
                  fontSize: isMobile ? '1rem' : '1.8rem',
                  color: 'var(--ancient-gold)',
                  fontWeight: 'bold'
                }}>
                  🎯 {selectedPlayer.toUpperCase()}! 🎯
                </h3>
              </div>
            </div>

            {/* Verstecktes Orakel mit Spinning Animation */}
            <div style={{
              background: isSpinning 
                ? 'linear-gradient(135deg, rgba(218,165,32,0.4), rgba(255,215,0,0.3))'
                : 'linear-gradient(135deg, rgba(0,0,0,0.8), rgba(26,26,46,0.9))',
              padding: isMobile ? '1.5rem 1rem' : '3rem 2rem',
              borderRadius: 'var(--radius)',
              marginBottom: '1rem',
              border: isSpinning 
                ? '3px solid var(--olympic-victory)' 
                : '3px solid var(--ancient-bronze)',
              boxShadow: isSpinning 
                ? '0 10px 30px rgba(218,165,32,0.7), 0 0 50px rgba(255,215,0,0.5)'
                : '0 10px 30px rgba(0,0,0,0.7)',
              position: 'relative',
              transition: 'all 0.3s ease'
            }}>
              <div style={{ 
                position: 'absolute',
                top: '-8px',
                left: '50%',
                transform: 'translateX(-50%)',
                background: isSpinning ? 'var(--olympic-victory)' : 'var(--ancient-night)',
                padding: '3px 10px',
                borderRadius: '15px',
                border: isSpinning ? '2px solid var(--ancient-gold)' : '2px solid var(--ancient-bronze)',
                transition: 'all 0.3s ease'
              }}>
                <span style={{ 
                  color: isSpinning ? 'var(--ancient-night)' : 'var(--ancient-bronze)', 
                  fontSize: isMobile ? '0.7rem' : '0.9rem',
                  fontWeight: 'bold'
                }}>
                  {isSpinning ? '⚡ ORAKEL AKTIV ⚡' : '🔮 ORAKEL 🔮'}
                </span>
              </div>

              <div style={{ 
                fontSize: isMobile ? '2.5rem' : '4rem', 
                marginBottom: '0.5rem', 
                opacity: 0.8,
                transform: isSpinning ? 'rotate(360deg)' : 'rotate(0deg)',
                transition: isSpinning ? 'transform 0.5s linear' : 'transform 0.3s ease',
                animation: isSpinning ? 'spin-oracle 0.5s linear infinite' : 'none'
              }}>
                {isSpinning ? '🌀' : '📜'}
              </div>

              <div style={{
                background: isSpinning 
                  ? 'rgba(218,165,32,0.4)'
                  : 'rgba(139,125,107,0.3)',
                padding: isMobile ? '1rem' : '2rem',
                borderRadius: 'var(--radius)',
                border: isSpinning 
                  ? '2px solid var(--olympic-victory)'
                  : '2px dashed var(--ancient-stone)',
                minHeight: isMobile ? '60px' : '80px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.3s ease'
              }}>
                {isSpinning ? (
                  <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '0.5rem'
                  }}>
                    <p style={{ 
                      fontSize: isMobile ? '1.1rem' : '1.8rem',
                      color: 'var(--olympic-victory)',
                      fontWeight: 'bold',
                      textTransform: 'uppercase',
                      textShadow: '2px 2px 4px rgba(0,0,0,0.8)',
                      animation: 'pulse 0.5s ease-in-out infinite alternate'
                    }}>
                      {t(`arena.categories.${spinningCategory}`)}
                    </p>
                    <div style={{
                      fontSize: isMobile ? '0.8rem' : '1rem',
                      color: 'var(--ancient-gold)',
                      fontStyle: 'italic'
                    }}>
                      🔄 Die Götter entscheiden...
                    </div>
                  </div>
                ) : (
                  <p style={{ 
                    fontSize: isMobile ? '1.2rem' : '2rem',
                    color: 'var(--ancient-stone)',
                    opacity: 0.5,
                    fontFamily: 'monospace',
                    letterSpacing: isMobile ? '2px' : '3px'
                  }}>
                    ? ? ? ? ?
                  </p>
                )}
              </div>

              <div style={{
                marginTop: '1rem',
                color: isSpinning ? 'var(--olympic-victory)' : 'var(--ancient-bronze)',
                fontSize: isMobile ? '0.8rem' : '1.1rem',
                fontStyle: 'italic',
                fontWeight: isSpinning ? 'bold' : 'normal',
                transition: 'all 0.3s ease'
              }}>
                {isSpinning ? '⚡ Das Schicksal erwacht! ⚡' : 'Wage es zu enthüllen?'}
              </div>
            </div>

            {/* Enthüllen Button - Touch optimiert */}
            <button
              onClick={revealTask}
              disabled={isSpinning}
              style={{
                padding: isMobile ? '15px 25px' : '20px 40px',
                fontSize: isMobile ? '1.1rem' : '1.4rem',
                background: isSpinning 
                  ? 'linear-gradient(135deg, #666, #888)'
                  : 'linear-gradient(135deg, var(--ancient-wine), #8B0000)',
                color: 'var(--ancient-marble)',
                border: `3px solid ${isSpinning ? '#888' : 'var(--olympic-flame)'}`,
                borderRadius: 'var(--radius)',
                cursor: isSpinning ? 'not-allowed' : 'pointer',
                fontWeight: 'bold',
                textTransform: 'uppercase',
                letterSpacing: '1px',
                boxShadow: isSpinning 
                  ? '0 4px 15px rgba(0,0,0,0.3)'
                  : '0 8px 25px rgba(114,47,55,0.6)',
                transition: 'all 0.3s ease',
                width: isMobile ? '100%' : 'auto',
                maxWidth: '280px',
                touchAction: 'manipulation',
                opacity: isSpinning ? 0.6 : 1
              }}
              aria-label="Schicksal enthüllen"
            >
              {isSpinning ? 'พร ORAKEL ARBEITET...' : '⚡ SCHICKSAL ENTHÜLLEN ⚡'}
            </button>
          </div>
        )

      case 'task-revealed':
        return (
          <div style={{ textAlign: 'center', padding: '10px' }}>
            {/* Kompakter Runden-Header */}
            <div style={{ 
              background: 'linear-gradient(135deg, var(--olympic-flame), var(--ancient-gold))', 
              color: 'var(--ancient-night)', 
              padding: isMobile ? '8px 15px' : '15px 30px', 
              borderRadius: 'var(--radius)',
              marginBottom: '1rem',
              display: 'inline-block',
              border: '2px solid var(--olympic-victory)',
              boxShadow: '0 5px 20px rgba(255,107,53,0.5)',
              fontWeight: 'bold',
              fontSize: isMobile ? '0.9rem' : '1.2rem',
              textTransform: 'uppercase'
            }}>
              ⚔️ RUNDE {currentRound} ⚔️
            </div>

            {/* Spieler & Kategorie Info - Kompakt */}
            <div style={{
              background: 'linear-gradient(135deg, rgba(255,107,53,0.2), rgba(218,165,32,0.1))',
              padding: isMobile ? '1rem' : '2rem',
              borderRadius: 'var(--radius)',
              marginBottom: '1rem',
              border: '2px solid var(--ancient-gold)'
            }}>
              <div style={{ fontSize: isMobile ? '2rem' : '3rem', marginBottom: '0.5rem' }}>⚡</div>
              <h3 style={{ 
                marginBottom: '0.5rem', 
                fontSize: isMobile ? '1rem' : '1.6rem',
                color: 'var(--olympic-victory)',
                fontWeight: 'bold'
              }}>
                🎯 {selectedPlayer.toUpperCase()}! 🎯
              </h3>
              <div style={{ 
                fontSize: isMobile ? '0.9rem' : '1.2rem',
                color: 'var(--ancient-gold)',
                fontWeight: 'bold',
                textTransform: 'uppercase',
                marginTop: '0.5rem'
              }}>
                🎭 {t(`arena.categories.${selectedCategory}`)} 🎭
              </div>
            </div>

            {/* Aufgaben-Anzeige - Mobile kompakt */}
            <div style={{
              background: 'linear-gradient(135deg, rgba(218,165,32,0.3), rgba(255,215,0,0.2))',
              padding: isMobile ? '1.5rem' : '2.5rem',
              borderRadius: 'var(--radius)',
              marginBottom: '1.5rem',
              border: '3px solid var(--olympic-victory)',
              boxShadow: '0 15px 40px rgba(218,165,32,0.4)',
              position: 'relative'
            }}>
              {!isMobile && (
                <div style={{ 
                  position: 'absolute',
                  top: '10px',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  fontSize: '1.2rem',
                  opacity: 0.6
                }}>
                  🌿 ⚱️ 🌿
                </div>
              )}

              <div style={{ fontSize: isMobile ? '2rem' : '2.5rem', marginBottom: '1rem' }}>📜</div>

              <div style={{
                background: 'var(--glass-background)',
                backdropFilter: 'var(--glass-blur)',
                padding: isMobile ? '1rem' : '2rem',
                borderRadius: 'var(--radius)',
                border: '2px solid rgba(255,215,0,0.5)',
                minHeight: isMobile ? '60px' : '100px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <p style={{ 
                  fontSize: isMobile ? '0.95rem' : '1.3rem',
                  color: 'var(--ancient-marble)',
                  fontWeight: '600',
                  lineHeight: '1.4',
                  textAlign: 'center'
                }}>
                  {currentTask}
                </p>
              </div>

              <div style={{
                marginTop: '1rem',
                color: 'var(--olympic-flame)',
                fontSize: isMobile ? '0.8rem' : '1.1rem',
                fontStyle: 'italic',
                fontWeight: 'bold'
              }}>
                🔥 Das Urteil der Götter! 🔥
              </div>
            </div>

            {/* Action Buttons - Touch optimiert */}
            <div style={{ 
              display: 'flex', 
              flexDirection: 'column', 
              gap: isMobile ? '10px' : '15px',
              maxWidth: isMobile ? '100%' : '400px',
              margin: '0 auto'
            }}>
              <button
                onClick={waitForAction}
                style={{
                  padding: isMobile ? '15px 25px' : '20px 40px',
                  fontSize: isMobile ? '1rem' : '1.3rem',
                  background: 'linear-gradient(135deg, var(--olympic-victory), #DAA520)',
                  color: 'var(--ancient-night)',
                  border: `3px solid var(--olympic-flame)`,
                  borderRadius: 'var(--radius)',
                  cursor: 'pointer',
                  fontWeight: 'bold',
                  textTransform: 'uppercase',
                  boxShadow: '0 8px 25px rgba(218,165,32,0.4)',
                  transition: 'all 0.3s ease',
                  touchAction: 'manipulation'
                }}
                aria-label={`Ich bin bereit für die Aufgabe: ${currentTask}`}
              >
                ⚡ ICH BIN BEREIT ⚡
              </button>

              <button
                onClick={handleTaskSkipped}
                style={{
                  padding: isMobile ? '12px 20px' : '18px 28px',
                  fontSize: isMobile ? '0.85rem' : '1.1rem',
                  background: 'linear-gradient(135deg, #FF9800, #F57C00)',
                  color: 'white',
                  border: '3px solid #FF8F00',
                  borderRadius: 'var(--radius)',
                  cursor: 'pointer',
                  fontWeight: 'bold',
                  textTransform: 'uppercase',
                  boxShadow: '0 6px 20px rgba(255,152,0,0.4)',
                  transition: 'all 0.3s ease',
                  touchAction: 'manipulation'
                }}
                aria-label="Überspringe die aktuelle Aufgabe"
              >
                ⏭️ NÄCHSTE PRÜFUNG! ⏭️
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
                  marginTop: '10px',
                  fontWeight: 'bold',
                  textTransform: 'uppercase',
                  transition: 'all 0.3s ease',
                  touchAction: 'manipulation'
                }}
                aria-label="Arena-Spiel verlassen"
              >
                💀 ARENA VERLASSEN 💀
              </button>
            </div>
          </div>
        )

      case 'waiting-action':
        return (
          <div style={{ textAlign: 'center', padding: '10px' }}>
            {/* Kompakter Runden-Header */}
            <div style={{ 
              background: 'linear-gradient(135deg, var(--olympic-flame), var(--ancient-gold))', 
              color: 'var(--ancient-night)', 
              padding: isMobile ? '8px 15px' : '15px 30px', 
              borderRadius: 'var(--radius)',
              marginBottom: '1rem',
              display: 'inline-block',
              border: '2px solid var(--olympic-victory)',
              boxShadow: '0 5px 20px rgba(255,107,53,0.5)',
              fontWeight: 'bold',
              fontSize: isMobile ? '0.8rem' : '1.1rem',
              textTransform: 'uppercase'
            }}>
              ⚔️ RUNDE {currentRound} ⚔️
            </div>

            {/* Spieler & Kategorie Info - Kompakt */}
            <div style={{
              background: 'linear-gradient(135deg, rgba(255,107,53,0.2), rgba(218,165,32,0.1))',
              padding: isMobile ? '1rem' : '2rem',
              borderRadius: 'var(--radius)',
              marginBottom: '1rem',
              border: '2px solid var(--ancient-gold)'
            }}>
              <div style={{ fontSize: isMobile ? '2rem' : '3rem', marginBottom: '0.5rem' }}>⚡</div>
              <h3 style={{ 
                marginBottom: '0.5rem', 
                fontSize: isMobile ? '1rem' : '1.6rem',
                color: 'var(--olympic-victory)',
                fontWeight: 'bold'
              }}>
                🏛️ {selectedPlayer.toUpperCase()}! 🏛️
              </h3>
              <div style={{ 
                fontSize: isMobile ? '0.9rem' : '1.2rem',
                color: 'var(--ancient-gold)',
                fontWeight: 'bold',
                textTransform: 'uppercase',
                marginTop: '0.5rem'
              }}>
                🎭 {t(`arena.categories.${selectedCategory}`)} 🎭
              </div>
            </div>

            {/* Aufgaben-Anzeige - Mobile kompakt */}
            <div style={{
              background: 'linear-gradient(135deg, rgba(218,165,32,0.3), rgba(255,215,0,0.2))',
              padding: isMobile ? '1.5rem' : '2.5rem',
              borderRadius: 'var(--radius)',
              marginBottom: '1.5rem',
              border: '3px solid var(--olympic-victory)',
              boxShadow: '0 15px 40px rgba(218,165,32,0.4)',
              position: 'relative'
            }}>
              {!isMobile && (
                <div style={{ 
                  position: 'absolute',
                  top: '10px',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  fontSize: '1.2rem',
                  opacity: 0.6
                }}>
                  🌿 ⚱️ 🌿
                </div>
              )}

              <div style={{ fontSize: isMobile ? '2rem' : '2.5rem', marginBottom: '1rem' }}>📜</div>

              <div style={{
                background: 'var(--glass-background)',
                backdropFilter: 'var(--glass-blur)',
                padding: isMobile ? '1rem' : '2rem',
                borderRadius: 'var(--radius)',
                border: '2px solid rgba(255,215,0,0.5)',
                minHeight: isMobile ? '60px' : '100px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <p style={{ 
                  fontSize: isMobile ? '0.95rem' : '1.3rem',
                  color: 'var(--ancient-marble)',
                  fontWeight: '600',
                  lineHeight: '1.4',
                  textAlign: 'center'
                }}>
                  {currentTask}
                </p>
              </div>

              <div style={{
                marginTop: '1rem',
                color: 'var(--olympic-flame)',
                fontSize: isMobile ? '0.8rem' : '1.1rem',
                fontStyle: 'italic',
                fontWeight: 'bold'
              }}>
                🔥 Das Urteil der Götter! 🔥
              </div>
            </div>

            {/* Göttliches Urteil - Kompakt */}
            <h2 style={{ 
              margin: '1rem 0 1.5rem',
              color: 'var(--ancient-gold)',
              fontSize: isMobile ? '1.2rem' : '2rem',
              fontWeight: 'bold',
              textShadow: '2px 2px 4px rgba(0,0,0,0.7)',
              textTransform: 'uppercase'
            }}>
              ⚖️ URTEIL ⚖️
            </h2>

            {/* Action Buttons - Touch optimiert */}
            <div style={{ 
              display: 'flex', 
              flexDirection: 'column', 
              gap: isMobile ? '10px' : '15px',
              maxWidth: isMobile ? '100%' : '400px',
              margin: '0 auto'
            }}>
              <button
                onClick={handleTaskSuccess}
                style={{
                  padding: isMobile ? '12px 20px' : '20px 30px',
                  fontSize: isMobile ? '0.9rem' : '1.2rem',
                  background: 'linear-gradient(135deg, #4CAF50, #2E7D32)',
                  color: 'white',
                  border: '3px solid #388E3C',
                  borderRadius: 'var(--radius)',
                  cursor: 'pointer',
                  fontWeight: 'bold',
                  textTransform: 'uppercase',
                  boxShadow: '0 8px 25px rgba(76,175,80,0.4)',
                  transition: 'all 0.3s ease',
                  touchAction: 'manipulation'
                }}
                aria-label="Aufgabe erfolgreich abgeschlossen"
              >
                🏆 TRIUMPH! 🏆
              </button>

              <button
                onClick={handleTaskFailed}
                style={{
                  padding: isMobile ? '12px 20px' : '20px 30px',
                  fontSize: isMobile ? '0.9rem' : '1.2rem',
                  background: 'linear-gradient(135deg, #F44336, #C62828)',
                  color: 'white',
                  border: '3px solid #D32F2F',
                  borderRadius: 'var(--radius)',
                  cursor: 'pointer',
                  fontWeight: 'bold',
                  textTransform: 'uppercase',
                  boxShadow: '0 8px 25px rgba(244,67,54,0.4)',
                  transition: 'all 0.3s ease',
                  touchAction: 'manipulation'
                }}
                aria-label="Aufgabe fehlgeschlagen"
              >
                💀 NIEDERLAGE! 💀
              </button>

              <button
                onClick={handleTaskSkipped}
                style={{
                  padding: isMobile ? '12px 20px' : '18px 28px',
                  fontSize: isMobile ? '0.85rem' : '1.1rem',
                  background: 'linear-gradient(135deg, #FF9800, #F57C00)',
                  color: 'white',
                  border: '3px solid #FF8F00',
                  borderRadius: 'var(--radius)',
                  cursor: 'pointer',
                  fontWeight: 'bold',
                  textTransform: 'uppercase',
                  boxShadow: '0 6px 20px rgba(255,152,0,0.4)',
                  transition: 'all 0.3s ease',
                  touchAction: 'manipulation'
                }}
                aria-label="Überspringe die aktuelle Aufgabe"
              >
                ⏭️ NÄCHSTE PRÜFUNG! ⏭️
              </button>

              <button
                onClick={endGame}
                style={{
                  padding: isMobile ? '10px 15px' : '15px 25px',
                  fontSize: isMobile ? '0.8rem' : '1rem',
                  background: 'transparent',
                  color: 'var(--ancient-stone)',
                  border: '2px solid var(--ancient-stone)',
                  borderRadius: 'var(--radius)',
                  cursor: 'pointer',
                  marginTop: '10px',
                  fontWeight: 'bold',
                  textTransform: 'uppercase',
                  transition: 'all 0.3s ease',
                  touchAction: 'manipulation'
                }}
                aria-label="Arena-Spiel verlassen"
              >
                💀 ARENA VERLASSEN 💀
              </button>
            </div>
          </div>
        )

      case 'drinking-result':
        return (
          <div style={{ textAlign: 'center', padding: '10px' }}>
            <div style={{ 
              background: 'var(--gradient-gold)', 
              color: 'var(--ancient-night)', 
              padding: isMobile ? '10px 20px' : '15px 30px', 
              borderRadius: 'var(--radius)',
              marginBottom: '1rem',
              display: 'inline-block',
              border: '2px solid var(--ancient-gold)',
              fontWeight: 'bold',
              fontSize: isMobile ? '1rem' : '1.2rem'
            }}>
              🏛️Runde {currentRound} - Olympisches Urteil! 🍷
            </div>

            <div style={{
              background: taskResult === 'success' 
                ? 'linear-gradient(135deg, rgba(255, 215, 0, 0.2), rgba(218, 165, 32, 0.1))'
                : 'linear-gradient(135deg, rgba(205, 127, 50, 0.2), rgba(139, 125, 107, 0.1))',
              padding: isMobile ? '20px' : '30px',
              borderRadius: 'var(--radius)',
              marginBottom: '1rem',
              border: `3px solid ${taskResult === 'success' ? 'var(--olympic-victory)' : 'var(--ancient-bronze)'}`,
              backdropFilter: 'var(--glass-blur)',
              position: 'relative'
            }}>
              <div style={{ fontSize: isMobile ? '3rem' : '5rem', marginBottom: '15px' }}>
                {taskResult === 'success' ? '🏆' : '⚱️'}
              </div>

              {taskResult === 'success' && (
                <div style={{ 
                  position: 'absolute',
                  top: '10px',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  fontSize: '2rem'
                }}>
                  🌿 🌿 🌿
                </div>
              )}

              <h2 style={{ 
                color: taskResult === 'success' ? 'var(--olympic-victory)' : 'var(--ancient-bronze)',
                marginBottom: '20px',
                fontSize: isMobile ? '1.4rem' : '1.8rem',
                fontWeight: 'bold'
              }}>
                {taskResult === 'success' ? '🎊 Olympischer Sieg! 🎊' : '⚔️ Ehrenvolle Niederlage ⚔️'}
              </h2>

              <div style={{
                background: taskResult === 'success' ? '#4CAF50' : '#F44336',
                color: 'white',
                padding: isMobile ? '15px' : '20px',
                borderRadius: 'var(--radius)',
                fontSize: isMobile ? '1.1rem' : '1.3rem',
                fontWeight: 'bold'
              }}>
                <div style={{ fontSize: isMobile ? '1.5rem' : '2rem', marginBottom: '10px' }}>🥃</div>
                <div>
                  {drinkingSips} {drinkingSips === 1 ? 'Schluck' : 'Schlücke'}
                </div>
              </div>

              <p style={{ 
                marginTop: '20px', 
                fontSize: isMobile ? '1rem' : '1.2rem',
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
                padding: isMobile ? '15px 25px' : '20px 40px',
                fontSize: isMobile ? '1rem' : '1.3rem',
                background: 'var(--primary)',
                color: 'var(--bg)',
                border: 'none',
                borderRadius: 'var(--radius)',
                cursor: 'pointer',
                marginBottom: '1rem',
                fontWeight: 'bold',
                textTransform: 'uppercase',
                letterSpacing: '1px'
              }}
              aria-label="Starte die nächste Runde"
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
                aria-label="Spiel beenden"
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
    <div 
      style={{
        padding: window.innerWidth < 768 ? '10px' : '24px',
        textAlign: 'center',
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'flex-start',
        alignItems: 'center',
        paddingTop: window.innerWidth < 768 ? '20px' : '50px',
        paddingBottom: window.innerWidth < 768 ? '80px' : '24px' // Platz für Bottom Nav
      }}
      role="main"
      aria-labelledby="arena-title"
    >
      {/* Screen Reader Announcements */}
      <div 
        ref={announcementRef}
        aria-live="assertive" 
        aria-atomic="true"
        style={{ 
          position: 'absolute', 
          left: '-9999px',
          width: '1px',
          height: '1px',
          overflow: 'hidden' 
        }}
      >
        {announcement}
      </div>

      {/* Notification */}
      {achievementNotification && (
        <AchievementNotification
          notification={achievementNotification}
          onClose={() => setAchievementNotification(null)}
        />
      )}

      {renderGameContent()}
    </div>
  )
}

export default ArenaScreen