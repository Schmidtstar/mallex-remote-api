
import React, { useState, useEffect, useCallback, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import styles from './AppIntro.module.css'

interface AppIntroProps {
  onComplete?: () => void
}

type IntroPhase = 'loading' | 'logo' | 'temple' | 'features' | 'enter' | 'complete'

export function AppIntro({ onComplete }: AppIntroProps = {}) {
  const { t } = useTranslation()
  const [currentPhase, setCurrentPhase] = useState<IntroPhase>('loading')
  const [canSkip, setCanSkip] = useState(false)
  const [isSkipping, setIsSkipping] = useState(false)
  const [progress, setProgress] = useState(0)
  
  const isCompleted = useRef(false)
  const timersRef = useRef<NodeJS.Timeout[]>([])

  const handleComplete = useCallback(() => {
    if (isCompleted.current) return
    
    console.log('🎬 Intro Abgeschlossen')
    isCompleted.current = true
    
    timersRef.current.forEach(timer => clearTimeout(timer))
    timersRef.current = []
    
    setCurrentPhase('complete')
    
    setTimeout(() => {
      onComplete?.()
    }, 200)
  }, [onComplete])

  const handleSkip = useCallback(() => {
    if (!canSkip || isCompleted.current) return
    
    setIsSkipping(true)
    setTimeout(() => {
      handleComplete()
    }, 500)
  }, [canSkip, handleComplete])

  // Phase-Management mit verbessertem Timing
  useEffect(() => {
    if (isCompleted.current) return

    const phaseTimings = {
      loading: 3000,   // 3s - Olympische Ringe + Aufbau-Animation
      logo: 2500,      // 2.5s - Logo mit goldenen Effekten
      temple: 3000,    // 3s - Tempel mit Säulen-Animation
      features: 4000,  // 4s - Feature-Showcase
      enter: 0         // Unbegrenzt - Warten auf User-Input
    }

    const currentTiming = phaseTimings[currentPhase as keyof typeof phaseTimings]
    if (currentTiming === 0) return // Enter-Phase wartet auf User

    // Progress-Update
    const phases = Object.keys(phaseTimings)
    const currentIndex = phases.indexOf(currentPhase)
    setProgress((currentIndex + 1) / phases.length * 100)

    const timer = setTimeout(() => {
      if (isCompleted.current) return

      switch (currentPhase) {
        case 'loading':
          setCurrentPhase('logo')
          break
        case 'logo':
          setCurrentPhase('temple')
          setCanSkip(true) // Skip ab Tempel-Phase
          break
        case 'temple':
          setCurrentPhase('features')
          break
        case 'features':
          setCurrentPhase('enter')
          break
      }
    }, currentTiming)

    timersRef.current.push(timer)

    return () => {
      clearTimeout(timer)
      timersRef.current = timersRef.current.filter(t => t !== timer)
    }
  }, [currentPhase])

  // Keyboard-Support
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && canSkip) {
        handleSkip()
      }
      if (e.key === 'Enter' && currentPhase === 'enter') {
        handleComplete()
      }
    }

    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [canSkip, currentPhase, handleSkip, handleComplete])

  // Cleanup
  useEffect(() => {
    return () => {
      timersRef.current.forEach(timer => clearTimeout(timer))
      timersRef.current = []
    }
  }, [])

  if (currentPhase === 'complete' || isCompleted.current) {
    return null
  }

  return (
    <div className={`${styles.introContainer} ${styles[`phase-${currentPhase}`]} ${isSkipping ? styles.skipping : ''}`}>
      
      {/* Animierter Hintergrund */}
      <div className={styles.backgroundCanvas}>
        <div className={styles.starField}></div>
        <div className={styles.mountains}></div>
        <div className={styles.clouds}></div>
        <div className={styles.godRays}></div>
      </div>

      {/* Hauptinhalt */}
      <div className={styles.mainContent}>

        {/* PHASE 1: Loading - Olympische Ringe */}
        {currentPhase === 'loading' && (
          <div className={styles.loadingPhase}>
            <div className={styles.olympicRings}>
              <div className={`${styles.ring} ${styles.ringBlue}`}></div>
              <div className={`${styles.ring} ${styles.ringYellow}`}></div>
              <div className={`${styles.ring} ${styles.ringBlack}`}></div>
              <div className={`${styles.ring} ${styles.ringGreen}`}></div>
              <div className={`${styles.ring} ${styles.ringRed}`}></div>
            </div>
            <div className={styles.loadingText}>
              <h2>Die Götter erwachen...</h2>
              <div className={styles.loadingDots}>
                <span></span><span></span><span></span>
              </div>
            </div>
          </div>
        )}

        {/* PHASE 2: Logo - Majestätisches Erscheinen */}
        {currentPhase === 'logo' && (
          <div className={styles.logoPhase}>
            <div className={styles.logoContainer}>
              <div className={styles.logoIcon}>🏛️</div>
              <h1 className={styles.mainTitle}>OLYMPIA</h1>
              <div className={styles.subtitle}>Saufspiele der Götter</div>
              <div className={styles.goldenBorder}></div>
            </div>
          </div>
        )}

        {/* PHASE 3: Temple - Tempel mit Säulen-Aufbau */}
        {currentPhase === 'temple' && (
          <div className={styles.templePhase}>
            <div className={styles.templeStructure}>
              <div className={styles.templeRoof}>
                <div className={styles.roofTriangle}></div>
                <div className={styles.templeText}>ARENA DER CHAMPIONS</div>
              </div>
              
              <div className={styles.columnRow}>
                {Array.from({ length: 6 }, (_, i) => (
                  <div 
                    key={i} 
                    className={styles.column}
                    style={{ animationDelay: `${i * 0.3}s` }}
                  ></div>
                ))}
              </div>
              
              <div className={styles.templeDoors}>
                <div className={`${styles.door} ${styles.leftDoor}`}></div>
                <div className={`${styles.door} ${styles.rightDoor}`}></div>
              </div>
              
              <div className={styles.templeBase}></div>
            </div>
          </div>
        )}

        {/* PHASE 4: Features - Was erwartet dich */}
        {currentPhase === 'features' && (
          <div className={styles.featuresPhase}>
            <h2 className={styles.featuresTitle}>Was erwartet dich?</h2>
            <div className={styles.featuresGrid}>
              <div className={`${styles.feature} ${styles.feature1}`}>
                <div className={styles.featureIcon}>⚔️</div>
                <h3>Epische Challenges</h3>
                <p>Teste deine Grenzen in legendären Wettkämpfen</p>
              </div>
              <div className={`${styles.feature} ${styles.feature2}`}>
                <div className={styles.featureIcon}>🏆</div>
                <h3>Ruhmreiche Siege</h3>
                <p>Erklimme die Rangliste und werde zur Legende</p>
              </div>
              <div className={`${styles.feature} ${styles.feature3}`}>
                <div className={styles.featureIcon}>🎭</div>
                <h3>Unvergessliche Momente</h3>
                <p>Erschaffe Geschichten, die in Erinnerung bleiben</p>
              </div>
            </div>
          </div>
        )}

        {/* PHASE 5: Enter - Call to Action */}
        {currentPhase === 'enter' && (
          <div className={styles.enterPhase}>
            <div className={styles.enterContainer}>
              <h1 className={styles.enterTitle}>Bereit für den Olymp?</h1>
              <p className={styles.enterDescription}>
                Tritt ein in die Arena der Götter und beweise deinen Mut
              </p>
              
              <button 
                className={styles.enterButton}
                onClick={handleComplete}
                disabled={isCompleted.current}
              >
                <span className={styles.buttonIcon}>⚡</span>
                <span>Arena betreten</span>
                <div className={styles.buttonGlow}></div>
              </button>
              
              <div className={styles.enterHint}>
                <kbd>Enter</kbd> oder klicken zum Fortfahren
              </div>
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

      {/* Progress-Bar */}
      <div className={styles.progressContainer}>
        <div 
          className={styles.progressBar}
          style={{ width: `${progress}%` }}
        ></div>
        <div className={styles.progressText}>
          {currentPhase === 'enter' ? 'Bereit!' : 'Lade...'}
        </div>
      </div>

      {/* Phase-Indikatoren */}
      <div className={styles.phaseIndicators}>
        {['loading', 'logo', 'temple', 'features', 'enter'].map((phase, index) => (
          <div
            key={phase}
            className={`${styles.indicator} ${
              currentPhase === phase ? styles.active : 
              ['loading', 'logo', 'temple', 'features', 'enter'].indexOf(currentPhase) > index ? styles.completed : ''
            }`}
          ></div>
        ))}
      </div>

    </div>
  )
}

export default AppIntro
