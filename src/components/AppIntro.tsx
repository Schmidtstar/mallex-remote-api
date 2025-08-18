
import React, { useState, useEffect, useCallback, useRef } from 'react'
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
  
  // Refs to prevent multiple executions
  const isCompleted = useRef(false)
  const timersRef = useRef<NodeJS.Timeout[]>([])

  // Stable completion handler
  const handleComplete = useCallback(() => {
    if (isCompleted.current) return
    
    console.log('🎬 Intro completion triggered')
    isCompleted.current = true
    
    // Clear all timers
    timersRef.current.forEach(timer => clearTimeout(timer))
    timersRef.current = []
    
    setCurrentPhase('complete')
    
    // Call onComplete after state update
    setTimeout(() => {
      onComplete?.()
    }, 100)
  }, [onComplete])

  // Stable skip handler
  const handleSkip = useCallback(() => {
    if (!canSkip || isCompleted.current) return
    
    setIsSkipping(true)
    setTimeout(() => {
      handleComplete()
    }, 300)
  }, [canSkip, handleComplete])

  // Phase management - single source of truth
  useEffect(() => {
    if (isCompleted.current) return

    const phaseTimings = {
      loading: 1500,
      logo: 2500, 
      temple: 3000,
      welcome: 6000 // Longer for user interaction
    }

    const currentTiming = phaseTimings[currentPhase as keyof typeof phaseTimings]
    if (!currentTiming) return

    const timer = setTimeout(() => {
      if (isCompleted.current) return

      switch (currentPhase) {
        case 'loading':
          setCurrentPhase('logo')
          setCanSkip(true)
          break
        case 'logo':
          setCurrentPhase('temple')
          break
        case 'temple':
          setCurrentPhase('welcome')
          break
        case 'welcome':
          // Auto-complete after welcome phase if user doesn't click
          handleComplete()
          break
      }
    }, currentTiming)

    timersRef.current.push(timer)

    return () => {
      clearTimeout(timer)
      timersRef.current = timersRef.current.filter(t => t !== timer)
    }
  }, [currentPhase, handleComplete])

  // ESC key support
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && canSkip) {
        handleSkip()
      }
    }

    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [canSkip, handleSkip])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      timersRef.current.forEach(timer => clearTimeout(timer))
      timersRef.current = []
    }
  }, [])

  // Don't render if completed
  if (currentPhase === 'complete' || isCompleted.current) {
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
                onClick={handleComplete}
                disabled={isCompleted.current}
              >
                Arena betreten
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Skip-Button */}
      {canSkip && !isSkipping && !isCompleted.current && (
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
      {import.meta.env.DEV && !isCompleted.current && (
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
