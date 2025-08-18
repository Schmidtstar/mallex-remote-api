import React, { useState, useEffect, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import styles from './AppIntro.module.css'

interface AppIntroProps {
  onComplete?: () => void
}

type IntroPhase = 'loading' | 'logo' | 'temple' | 'welcome' | 'complete'

export function AppIntro({ onComplete }: AppIntroProps = {}) {
  const { t } = useTranslation()
  const [currentPhase, setCurrentPhase] = useState<IntroPhase>('loading')
  const [canSkip, setCanSkip] = useState(false)
  const [isSkipping, setIsSkipping] = useState(false)
  const [isCompleted, setIsCompleted] = useState(false) // State to track completion

  // Fix intro completion handler and state management
  const handleComplete = useCallback(() => {
    if (isCompleted) return // Prevent double-execution

    console.log('🎬 Intro completion triggered')
    setIsCompleted(true)

    // Immediate completion without delay
    onComplete()
  }, [onComplete, isCompleted])

  // Phasen-Management mit klarem Timing
  useEffect(() => {
    const phaseTimings = {
      loading: 1500,
      logo: 2500,
      temple: 3000,
      welcome: 4000
    }

    const timer = setTimeout(() => {
      switch (currentPhase) {
        case 'loading':
          setCurrentPhase('logo')
          setCanSkip(true) // Skip ab Logo-Phase verfügbar
          break
        case 'logo':
          setCurrentPhase('temple')
          break
        case 'temple':
          setCurrentPhase('welcome')
          break
        case 'welcome':
          // Wenn der Benutzer auf "Arena betreten" klickt, wird handleComplete direkt aufgerufen
          // Hier muss nichts weiter passieren, da der Button die Logik übernimmt
          break
        case 'complete':
          // Wenn wir bereits im 'complete'-Zustand sind, tun wir nichts weiter
          break
      }
    }, phaseTimings[currentPhase as keyof typeof phaseTimings] || 2000)

    return () => clearTimeout(timer)
  }, [currentPhase, onComplete, isCompleted, handleComplete]) // handleComplete zu Abhängigkeiten hinzugefügt

  // Skip-Funktionalität
  const handleSkip = () => {
    if (!canSkip) return
    setIsSkipping(true)
    // Wenn geskippt wird, auch handleComplete aufrufen
    setTimeout(() => {
      handleComplete()
    }, 300)
  }

  // ESC-Key Support
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && canSkip) {
        handleSkip()
      }
    }

    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [canSkip, handleSkip]) // handleSkip zu Abhängigkeiten hinzugefügt

  // Simplify intro exit logic and improve state handling
  // Auto-complete nach maximaler Zeit (Fallback)
  useEffect(() => {
    const maxTimer = setTimeout(() => {
      if (!isCompleted) {
        console.log('🎬 Intro auto-complete (timeout)')
        handleComplete()
      }
    }, 8000) // 8 Sekunden Maximum (verkürzt)

    return () => clearTimeout(maxTimer)
  }, [handleComplete, isCompleted])

  if (currentPhase === 'complete') {
    return null
  }

  return (
    <div className={`${styles.introStage} ${styles[`phase-${currentPhase}`]} ${isSkipping ? styles.skipping : ''}`}>

      {/* Strukturierter Hintergrund */}
      <div className={styles.backgroundLayers}>
        <div className={styles.skyLayer}></div>
        <div className={styles.cloudsLayer}></div>
        <div className={styles.mountainsLayer}></div>
      </div>

      {/* Hauptcontent nach Phase */}
      <div className={styles.contentArea}>

        {/* PHASE 1: Loading */}
        {currentPhase === 'loading' && (
          <div className={styles.loadingPhase}>
            <div className={styles.loadingSpinner}>
              <div className={styles.olympicRings}>
                <div className={styles.ring}></div>
                <div className={styles.ring}></div>
                <div className={styles.ring}></div>
                <div className={styles.ring}></div>
                <div className={styles.ring}></div>
              </div>
            </div>
            <p className={styles.loadingText}>Die Götter erwachen...</p>
          </div>
        )}

        {/* PHASE 2: Logo Reveal */}
        {currentPhase === 'logo' && (
          <div className={styles.logoPhase}>
            <div className={styles.logoContainer}>
              <div className={styles.logoIcon}>🏛️</div>
              <h1 className={styles.logoTitle}>OLYMPIA</h1>
              <div className={styles.logoSubtitle}>Saufspiele der Götter</div>
            </div>
          </div>
        )}

        {/* PHASE 3: Temple Construction */}
        {currentPhase === 'temple' && (
          <div className={styles.templePhase}>
            <div className={styles.templeContainer}>

              {/* Tempel-Dach */}
              <div className={styles.templePediment}>
                <div className={styles.templeTitle}>OLYMPISCHE ARENA</div>
              </div>

              {/* Säulen */}
              <div className={styles.templeColumns}>
                {[1, 2, 3, 4, 5, 6].map(num => (
                  <div
                    key={num}
                    className={styles.column}
                    style={{ animationDelay: `${num * 0.2}s` }}
                  ></div>
                ))}
              </div>

              {/* Türen */}
              <div className={styles.templeDoors}>
                <div className={`${styles.door} ${styles.leftDoor}`}></div>
                <div className={`${styles.door} ${styles.rightDoor}`}></div>
              </div>

              {/* Eingangsbereich */}
              <div className={styles.templeEntrance}></div>
            </div>
          </div>
        )}

        {/* PHASE 4: Welcome */}
        {currentPhase === 'welcome' && (
          <div className={styles.welcomePhase}>
            <div className={styles.welcomeContainer}>
              <h1 className={styles.welcomeTitle}>
                Willkommen in der Arena
              </h1>
              <div className={styles.welcomeFeatures}>
                <div className={styles.feature}>
                  <span className={styles.featureIcon}>⚔️</span>
                  <span>Epische Challenges</span>
                </div>
                <div className={styles.feature}>
                  <span className={styles.featureIcon}>🏆</span>
                  <span>Ruhmreiche Siege</span>
                </div>
                <div className={styles.feature}>
                  <span className={styles.featureIcon}>🎭</span>
                  <span>Legendäre Geschichten</span>
                </div>
              </div>

              <button
                className={styles.enterButton}
                onClick={handleComplete} // Rufen Sie handleComplete auf, wenn der Button geklickt wird
              >
                Arena betreten
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Skip-Button (nur wenn verfügbar) */}
      {canSkip && !isSkipping && (
        <button
          className={styles.skipButton}
          onClick={handleSkip}
          aria-label="Intro überspringen"
        >
          <span>Überspringen</span>
          <kbd>ESC</kbd>
        </button>
      )}

      {/* Emergency Skip (Development only) */}
      {import.meta.env.DEV && (
        <button
          className={styles.emergencySkip}
          onClick={handleComplete}
          style={{
            position: 'fixed',
            top: '10px',
            right: '10px',
            background: 'red',
            color: 'white',
            border: 'none',
            padding: '5px 10px',
            borderRadius: '4px',
            fontSize: '12px',
            zIndex: 10000
          }}
        >
          DEV: Force Skip
        </button>
      )}


      {/* Fortschrittsindikator */}
      <div className={styles.progressIndicator}>
        <div className={styles.progressBar} data-phase={currentPhase}></div>
        <div className={styles.progressDots}>
          {['loading', 'logo', 'temple', 'welcome'].map(phase => (
            <div
              key={phase}
              className={`${styles.progressDot} ${currentPhase === phase ? styles.active : ''}`}
            ></div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default AppIntro