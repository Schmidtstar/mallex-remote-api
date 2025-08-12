
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
    // Load hidden static tasks from localStorage
    const hiddenTasksData = localStorage.getItem('mallex_hidden_static_tasks')
    const hiddenTasks = hiddenTasksData ? new Set(JSON.parse(hiddenTasksData)) : new Set()
    
    // Filter out hidden static tasks
    const staticTasks = (challenges[categoryId] || []).filter(taskKey => !hiddenTasks.has(taskKey))
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
            <div style={{ 
              fontSize: '6rem', 
              marginBottom: '1rem',
              textShadow: '0 0 30px rgba(218, 165, 32, 0.8)',
              animation: 'pulse 2s infinite'
            }}>
              ⚡🏛️⚡
            </div>
            <h1 style={{ 
              color: 'var(--ancient-gold)', 
              marginBottom: '2rem',
              background: 'var(--gradient-gold)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              fontSize: '2.5rem',
              fontWeight: 'bold',
              textShadow: '2px 2px 4px rgba(0,0,0,0.8)'
            }}>
              ⚔️ MALLEX ARENA ⚔️
            </h1>
            <h2 style={{ 
              color: 'var(--olympic-flame)', 
              marginBottom: '2rem',
              fontSize: '1.8rem',
              fontStyle: 'italic',
              textShadow: '1px 1px 3px rgba(255,107,53,0.7)'
            }}>
              🔥 DIE OLYMPISCHEN TRINKSPIELE DER ANTIKE 🔥
            </h2>
            
            <div style={{
              background: 'linear-gradient(135deg, rgba(218,165,32,0.2), rgba(205,127,50,0.1))',
              backdropFilter: 'var(--glass-blur)',
              border: '2px solid var(--ancient-gold)',
              borderRadius: 'var(--radius)',
              padding: '2.5rem',
              marginBottom: '2rem',
              position: 'relative',
              boxShadow: '0 10px 30px rgba(218,165,32,0.3)',
              overflow: 'hidden'
            }}>
              <div style={{ 
                position: 'absolute',
                top: '10px',
                left: '10px',
                right: '10px',
                fontSize: '1.5rem',
                opacity: 0.7
              }}>
                🌿 ⚱️ 🌿
              </div>
              
              <div style={{ fontSize: '3rem', marginBottom: '1.5rem' }}>🏺</div>
              
              <div style={{
                background: 'var(--glass-background)',
                padding: '1.5rem',
                borderRadius: 'var(--radius)',
                border: '1px solid rgba(218,165,32,0.3)'
              }}>
                <h3 style={{ 
                  color: 'var(--olympic-victory)', 
                  marginBottom: '1rem',
                  fontSize: '1.4rem'
                }}>
                  ⚡ GLADIATOREN-STATUS ⚡
                </h3>
                <p style={{ 
                  fontSize: '1.3rem', 
                  color: 'var(--ancient-marble)',
                  fontWeight: 'bold'
                }}>
                  {players.length > 0 
                    ? `🏆 ${players.length} LEGENDÄRE HELDEN BEREIT FÜR DIE ARENA!` 
                    : '💀 KEINE KÄMPFER VERFÜGBAR! BESUCHE DIE HALLE DER LEGENDEN!'
                  }
                </p>
              </div>
              
              <div style={{ 
                position: 'absolute',
                bottom: '10px',
                left: '50%',
                transform: 'translateX(-50%)',
                fontSize: '1.5rem',
                opacity: 0.7
              }}>
                ⚔️ 🛡️ ⚔️
              </div>
            </div>

            <div style={{ marginBottom: '2rem' }}>
              <div style={{ 
                color: 'var(--ancient-wine)', 
                fontSize: '1.2rem',
                marginBottom: '1rem',
                fontStyle: 'italic'
              }}>
                "Bei den Göttern des Olymps..."
              </div>
            </div>

            <button
              onClick={startGame}
              disabled={loadingTasks || players.length === 0}
              style={{
                padding: '25px 50px',
                fontSize: '1.8rem',
                background: players.length === 0 
                  ? 'linear-gradient(135deg, var(--ancient-stone), #6B6B6B)' 
                  : 'linear-gradient(135deg, var(--olympic-flame), var(--ancient-gold))',
                color: players.length === 0 ? 'var(--ancient-marble)' : 'var(--ancient-night)',
                border: `3px solid ${players.length === 0 ? 'var(--ancient-stone)' : 'var(--olympic-victory)'}`,
                borderRadius: 'var(--radius)',
                cursor: players.length === 0 ? 'not-allowed' : 'pointer',
                opacity: players.length === 0 ? 0.6 : 1,
                fontWeight: 'bold',
                textShadow: '2px 2px 4px rgba(0,0,0,0.8)',
                boxShadow: players.length > 0 
                  ? '0 10px 25px rgba(255,107,53,0.5), inset 0 2px 10px rgba(255,215,0,0.3)' 
                  : 'none',
                transition: 'all 0.3s ease',
                textTransform: 'uppercase',
                letterSpacing: '1px'
              }}
              onMouseEnter={(e) => {
                if (players.length > 0) {
                  e.target.style.transform = 'scale(1.05)';
                  e.target.style.boxShadow = '0 15px 35px rgba(255,107,53,0.7), inset 0 2px 10px rgba(255,215,0,0.4)';
                }
              }}
              onMouseLeave={(e) => {
                if (players.length > 0) {
                  e.target.style.transform = 'scale(1)';
                  e.target.style.boxShadow = '0 10px 25px rgba(255,107,53,0.5), inset 0 2px 10px rgba(255,215,0,0.3)';
                }
              }}
            >
              {loadingTasks 
                ? '⏳ DIE GÖTTER BEREITEN DIE PRÜFUNGEN VOR...' 
                : players.length === 0 
                  ? '💀 KEINE KÄMPFER BEREIT'
                  : '🎯 IN DIE ARENA! FÜR RUHM UND EHRE!'
              }
            </button>
            
            {players.length > 0 && (
              <div style={{
                marginTop: '1.5rem',
                color: 'var(--ancient-bronze)',
                fontSize: '1rem',
                fontStyle: 'italic'
              }}>
                ⚡ Mögen die Götter mit euch sein... ⚡
              </div>
            )}
          </div>
        )

      case 'playing':
        return (
          <div style={{ textAlign: 'center' }}>
            <div style={{ 
              background: 'linear-gradient(135deg, var(--olympic-flame), var(--ancient-gold))', 
              color: 'var(--ancient-night)', 
              padding: '15px 30px', 
              borderRadius: 'var(--radius)',
              marginBottom: '2rem',
              display: 'inline-block',
              border: '2px solid var(--olympic-victory)',
              boxShadow: '0 5px 20px rgba(255,107,53,0.5)',
              fontWeight: 'bold',
              fontSize: '1.2rem',
              textTransform: 'uppercase'
            }}>
              ⚔️ RUNDE {currentRound} - ARENA DER GÖTTER ⚔️
            </div>
            
            <div style={{
              background: 'linear-gradient(135deg, rgba(255,107,53,0.3), rgba(218,165,32,0.2))',
              padding: '2rem',
              borderRadius: 'var(--radius)',
              marginBottom: '2rem',
              border: '2px solid var(--ancient-gold)',
              position: 'relative',
              overflow: 'hidden'
            }}>
              <div style={{ 
                position: 'absolute',
                top: '10px',
                left: '50%',
                transform: 'translateX(-50%)',
                fontSize: '2rem',
                opacity: 0.6
              }}>
                🏛️
              </div>
              
              <h2 style={{ 
                color: 'var(--olympic-victory)', 
                marginBottom: '2rem',
                fontSize: '2rem',
                textShadow: '2px 2px 4px rgba(0,0,0,0.7)'
              }}>
                🎭 {t(`arena.categories.${selectedCategory}`).toUpperCase()} 🎭
              </h2>
              
              <div style={{
                background: 'var(--glass-background)',
                backdropFilter: 'var(--glass-blur)',
                padding: '2rem',
                borderRadius: 'var(--radius)',
                border: '1px solid rgba(255,215,0,0.3)',
                marginBottom: '1.5rem'
              }}>
                <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>⚡</div>
                <h3 style={{ 
                  marginBottom: '15px', 
                  fontSize: '1.8rem',
                  color: 'var(--ancient-gold)',
                  fontWeight: 'bold'
                }}>
                  🎯 {selectedPlayer.toUpperCase()} BETRITT DIE ARENA! 🎯
                </h3>
                <div style={{ 
                  color: 'var(--ancient-wine)', 
                  fontSize: '1.1rem',
                  fontStyle: 'italic'
                }}>
                  "Das Schicksal wird über dich richten..."
                </div>
              </div>
            </div>

            <div style={{
              background: 'linear-gradient(135deg, rgba(0,0,0,0.8), rgba(26,26,46,0.9))',
              padding: '3rem 2rem',
              borderRadius: 'var(--radius)',
              marginBottom: '2rem',
              border: '3px solid var(--ancient-bronze)',
              boxShadow: '0 10px 30px rgba(0,0,0,0.7), inset 0 0 50px rgba(139,125,107,0.2)',
              position: 'relative'
            }}>
              <div style={{ 
                position: 'absolute',
                top: '-10px',
                left: '50%',
                transform: 'translateX(-50%)',
                background: 'var(--ancient-night)',
                padding: '5px 15px',
                borderRadius: '20px',
                border: '2px solid var(--ancient-bronze)'
              }}>
                <span style={{ color: 'var(--ancient-bronze)', fontSize: '0.9rem' }}>
                  🔮 ORAKEL DER HERAUSFORDERUNG 🔮
                </span>
              </div>
              
              <div style={{ fontSize: '4rem', marginBottom: '1rem', opacity: 0.8 }}>📜</div>
              
              <div style={{
                background: 'rgba(139,125,107,0.3)',
                padding: '2rem',
                borderRadius: 'var(--radius)',
                border: '2px dashed var(--ancient-stone)',
                minHeight: '80px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <p style={{ 
                  fontSize: '2rem',
                  color: 'var(--ancient-stone)',
                  opacity: 0.5,
                  fontFamily: 'monospace',
                  letterSpacing: '3px'
                }}>
                  ? ? ? ? ?
                </p>
              </div>
              
              <div style={{
                marginTop: '1.5rem',
                color: 'var(--ancient-bronze)',
                fontSize: '1.1rem',
                fontStyle: 'italic'
              }}>
                Die Götter haben gesprochen... wage es zu enthüllen?
              </div>
            </div>

            <button
              onClick={revealTask}
              style={{
                padding: '20px 40px',
                fontSize: '1.4rem',
                background: 'linear-gradient(135deg, var(--ancient-wine), #8B0000)',
                color: 'var(--ancient-marble)',
                border: '3px solid var(--olympic-flame)',
                borderRadius: 'var(--radius)',
                cursor: 'pointer',
                marginTop: '1rem',
                fontWeight: 'bold',
                textTransform: 'uppercase',
                letterSpacing: '1px',
                boxShadow: '0 8px 25px rgba(114,47,55,0.6)',
                transition: 'all 0.3s ease',
                position: 'relative',
                overflow: 'hidden'
              }}
              onMouseEnter={(e) => {
                e.target.style.transform = 'scale(1.05)';
                e.target.style.boxShadow = '0 12px 35px rgba(114,47,55,0.8)';
                e.target.style.background = 'linear-gradient(135deg, #8B0000, var(--olympic-flame))';
              }}
              onMouseLeave={(e) => {
                e.target.style.transform = 'scale(1)';
                e.target.style.boxShadow = '0 8px 25px rgba(114,47,55,0.6)';
                e.target.style.background = 'linear-gradient(135deg, var(--ancient-wine), #8B0000)';
              }}
            >
              <span style={{ position: 'relative', zIndex: 1 }}>
                ⚡ SCHICKSAL ENTHÜLLEN ⚡
              </span>
            </button>
            
            <div style={{
              marginTop: '2rem',
              color: 'var(--ancient-stone)',
              fontSize: '0.9rem',
              fontStyle: 'italic'
            }}>
              🔥 Nur die Mutigen werden belohnt... oder verflucht 🔥
            </div>
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
              background: 'linear-gradient(135deg, var(--olympic-flame), var(--ancient-gold))', 
              color: 'var(--ancient-night)', 
              padding: '15px 30px', 
              borderRadius: 'var(--radius)',
              marginBottom: '2rem',
              display: 'inline-block',
              border: '2px solid var(--olympic-victory)',
              boxShadow: '0 5px 20px rgba(255,107,53,0.5)',
              fontWeight: 'bold',
              fontSize: '1.1rem',
              textTransform: 'uppercase'
            }}>
              ⚔️ RUNDE {currentRound} - {t(`arena.categories.${selectedCategory}`).toUpperCase()} ⚔️
            </div>
            
            <div style={{
              background: 'linear-gradient(135deg, rgba(255,107,53,0.2), rgba(218,165,32,0.1))',
              padding: '2rem',
              borderRadius: 'var(--radius)',
              marginBottom: '2rem',
              border: '2px solid var(--ancient-gold)',
              position: 'relative'
            }}>
              <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>⚡</div>
              <h3 style={{ 
                marginBottom: '10px', 
                fontSize: '1.6rem',
                color: 'var(--olympic-victory)',
                fontWeight: 'bold',
                textShadow: '1px 1px 2px rgba(0,0,0,0.7)'
              }}>
                🏛️ {selectedPlayer.toUpperCase()} KÄMPFT IN DER ARENA! 🏛️
              </h3>
              <div style={{ 
                color: 'var(--ancient-wine)', 
                fontSize: '1rem',
                fontStyle: 'italic'
              }}>
                "Die Götter beobachten jeden Schritt..."
              </div>
            </div>

            <div style={{
              background: 'linear-gradient(135deg, rgba(218,165,32,0.3), rgba(255,215,0,0.2))',
              padding: '2.5rem',
              borderRadius: 'var(--radius)',
              marginBottom: '2.5rem',
              border: '3px solid var(--olympic-victory)',
              boxShadow: '0 15px 40px rgba(218,165,32,0.4)',
              position: 'relative'
            }}>
              <div style={{ 
                position: 'absolute',
                top: '10px',
                left: '10px',
                right: '10px',
                fontSize: '1.5rem',
                opacity: 0.6
              }}>
                🌿 ⚱️ 🏺 ⚱️ 🌿
              </div>
              
              <div style={{ fontSize: '2.5rem', marginBottom: '1.5rem' }}>📜</div>
              
              <div style={{
                background: 'var(--glass-background)',
                backdropFilter: 'var(--glass-blur)',
                padding: '2rem',
                borderRadius: 'var(--radius)',
                border: '2px solid rgba(255,215,0,0.5)',
                minHeight: '100px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <p style={{ 
                  fontSize: '1.3rem',
                  color: 'var(--ancient-marble)',
                  fontWeight: '600',
                  lineHeight: '1.6',
                  textAlign: 'center'
                }}>
                  {currentTask}
                </p>
              </div>
              
              <div style={{
                marginTop: '1.5rem',
                color: 'var(--olympic-flame)',
                fontSize: '1.1rem',
                fontStyle: 'italic',
                fontWeight: 'bold'
              }}>
                🔥 Die Prüfung ist vollbracht! Das Urteil der Götter erwartet dich! 🔥
              </div>
            </div>

            <h2 style={{ 
              margin: '2rem 0 2rem',
              color: 'var(--ancient-gold)',
              fontSize: '2rem',
              fontWeight: 'bold',
              textShadow: '2px 2px 4px rgba(0,0,0,0.7)',
              textTransform: 'uppercase'
            }}>
              ⚖️ GÖTTLICHES URTEIL ⚖️
            </h2>

            <div style={{ 
              display: 'flex', 
              flexDirection: 'column', 
              gap: '20px',
              maxWidth: '400px',
              margin: '0 auto'
            }}>
              <button
                onClick={handleTaskSuccess}
                style={{
                  padding: '20px 30px',
                  fontSize: '1.3rem',
                  background: 'linear-gradient(135deg, #4CAF50, #2E7D32)',
                  color: 'white',
                  border: '3px solid #388E3C',
                  borderRadius: 'var(--radius)',
                  cursor: 'pointer',
                  fontWeight: 'bold',
                  textTransform: 'uppercase',
                  boxShadow: '0 8px 25px rgba(76,175,80,0.4)',
                  transition: 'all 0.3s ease'
                }}
                onMouseEnter={(e) => {
                  e.target.style.transform = 'scale(1.05)';
                  e.target.style.boxShadow = '0 12px 35px rgba(76,175,80,0.6)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.transform = 'scale(1)';
                  e.target.style.boxShadow = '0 8px 25px rgba(76,175,80,0.4)';
                }}
              >
                🏆 TRIUMPH! AUFGABE GEMEISTERT! 🏆
              </button>
              
              <button
                onClick={handleTaskFailed}
                style={{
                  padding: '20px 30px',
                  fontSize: '1.3rem',
                  background: 'linear-gradient(135deg, #F44336, #C62828)',
                  color: 'white',
                  border: '3px solid #D32F2F',
                  borderRadius: 'var(--radius)',
                  cursor: 'pointer',
                  fontWeight: 'bold',
                  textTransform: 'uppercase',
                  boxShadow: '0 8px 25px rgba(244,67,54,0.4)',
                  transition: 'all 0.3s ease'
                }}
                onMouseEnter={(e) => {
                  e.target.style.transform = 'scale(1.05)';
                  e.target.style.boxShadow = '0 12px 35px rgba(244,67,54,0.6)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.transform = 'scale(1)';
                  e.target.style.boxShadow = '0 8px 25px rgba(244,67,54,0.4)';
                }}
              >
                💀 NIEDERLAGE! AUFGABE GESCHEITERT! 💀
              </button>
              
              <button
                onClick={handleTaskSkipped}
                style={{
                  padding: '18px 28px',
                  fontSize: '1.2rem',
                  background: 'linear-gradient(135deg, #FF9800, #F57C00)',
                  color: 'white',
                  border: '3px solid #FF8F00',
                  borderRadius: 'var(--radius)',
                  cursor: 'pointer',
                  fontWeight: 'bold',
                  textTransform: 'uppercase',
                  boxShadow: '0 6px 20px rgba(255,152,0,0.4)',
                  transition: 'all 0.3s ease'
                }}
                onMouseEnter={(e) => {
                  e.target.style.transform = 'scale(1.05)';
                  e.target.style.boxShadow = '0 10px 30px rgba(255,152,0,0.6)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.transform = 'scale(1)';
                  e.target.style.boxShadow = '0 6px 20px rgba(255,152,0,0.4)';
                }}
              >
                ⏭️ VERWEIGERUNG - NÄCHSTE PRÜFUNG! ⏭️
              </button>
              
              <button
                onClick={endGame}
                style={{
                  padding: '15px 25px',
                  fontSize: '1rem',
                  background: 'transparent',
                  color: 'var(--ancient-stone)',
                  border: '2px solid var(--ancient-stone)',
                  borderRadius: 'var(--radius)',
                  cursor: 'pointer',
                  marginTop: '20px',
                  fontWeight: 'bold',
                  textTransform: 'uppercase',
                  transition: 'all 0.3s ease'
                }}
                onMouseEnter={(e) => {
                  e.target.style.background = 'var(--ancient-stone)';
                  e.target.style.color = 'var(--ancient-night)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.background = 'transparent';
                  e.target.style.color = 'var(--ancient-stone)';
                }}
              >
                💀 ARENA VERLASSEN 💀
              </button>
            </div>
            
            <div style={{
              marginTop: '2rem',
              color: 'var(--ancient-bronze)',
              fontSize: '1rem',
              fontStyle: 'italic'
            }}>
              ⚡ "Wähle weise, denn die Götter vergessen nichts..." ⚡
            </div>
          </div>
        )

      case 'drinking-result':
        return (
          <div style={{ textAlign: 'center' }}>
            <div style={{ 
              background: 'var(--gradient-gold)', 
              color: 'var(--ancient-night)', 
              padding: '15px 30px', 
              borderRadius: 'var(--radius)',
              marginBottom: '2rem',
              display: 'inline-block',
              border: '2px solid var(--ancient-gold)',
              fontWeight: 'bold'
            }}>
              🏛️ Runde {currentRound} - Olympisches Urteil! 🍷
            </div>

            <div style={{
              background: taskResult === 'success' 
                ? 'linear-gradient(135deg, rgba(255, 215, 0, 0.2), rgba(218, 165, 32, 0.1))'
                : 'linear-gradient(135deg, rgba(205, 127, 50, 0.2), rgba(139, 125, 107, 0.1))',
              padding: '30px',
              borderRadius: 'var(--radius)',
              marginBottom: '2rem',
              border: `3px solid ${taskResult === 'success' ? 'var(--olympic-victory)' : 'var(--ancient-bronze)'}`,
              backdropFilter: 'var(--glass-blur)',
              position: 'relative'
            }}>
              <div style={{ fontSize: '5rem', marginBottom: '15px' }}>
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
                fontSize: '1.8rem',
                fontWeight: 'bold'
              }}>
                {taskResult === 'success' ? '🎊 Olympischer Sieg! 🎊' : '⚔️ Ehrenvolle Niederlage ⚔️'}
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
