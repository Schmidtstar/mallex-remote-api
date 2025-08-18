import React, { useState, useEffect, useCallback, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { IntroDebug } from './IntroDebug'

// CSS-Klassen direkt verwenden für bessere Performance und Debugging
const styles = {
  // Core Container
  introContainer: 'intro-container',
  backgroundCanvas: 'background-canvas',
  starField: 'star-field',
  mountains: 'mountains',
  clouds: 'clouds',
  godRays: 'god-rays',
  mainContent: 'main-content',
  skipButton: 'skip-button',
  
  // Phase-spezifische Styles
  loadingPhase: 'loading-phase',
  olympicRings: 'olympic-rings',
  ring: 'ring',
  ringBlue: 'ring-blue',
  ringYellow: 'ring-yellow',
  ringBlack: 'ring-black',
  ringGreen: 'ring-green',
  ringRed: 'ring-red',
  loadingText: 'loading-text',
  loadingDots: 'loading-dots',
  
  logoPhase: 'logo-phase',
  logoContainer: 'logo-container',
  logoIcon: 'logo-icon',
  mainTitle: 'main-title',
  subtitle: 'subtitle',
  goldenBorder: 'golden-border',
  
  templePhase: 'temple-phase',
  templeStructure: 'temple-structure',
  templeRoof: 'temple-roof',
  roofTriangle: 'roof-triangle',
  templeText: 'temple-text',
  columnRow: 'column-row',
  column: 'column',
  templeDoors: 'temple-doors',
  door: 'door',
  leftDoor: 'left-door',
  rightDoor: 'right-door',
  templeBase: 'temple-base',
  
  featuresPhase: 'features-phase',
  featuresTitle: 'features-title',
  featuresGrid: 'features-grid',
  feature: 'feature',
  feature1: 'feature-1',
  feature2: 'feature-2',
  feature3: 'feature-3',
  featureIcon: 'feature-icon',
  
  enterPhase: 'enter-phase',
  enterContainer: 'enter-container',
  enterTitle: 'enter-title',
  enterDescription: 'enter-description',
  enterButton: 'enter-button',
  buttonIcon: 'button-icon',
  buttonGlow: 'button-glow',
  enterHint: 'enter-hint',
  
  // Progress & Navigation
  progressContainer: 'progress-container',
  progressBar: 'progress-bar',
  progressText: 'progress-text',
  phaseIndicators: 'phase-indicators',
  indicator: 'indicator',
  active: 'active',
  completed: 'completed',
  skipping: 'skipping'
} as const

interface AppIntroProps {
  onComplete?: () => void
  userType?: 'first-time' | 'returning' | 'admin'
  showSkip?: boolean
}

type IntroPhase = 'loading' | 'logo' | 'temple' | 'features' | 'enter' | 'complete'

export function AppIntro({ onComplete, userType = 'first-time', showSkip = true }: AppIntroProps) {
  const { t } = useTranslation()
  const [currentPhase, setCurrentPhase] = useState<IntroPhase>('loading')
  
  // Debug-Logging
  useEffect(() => {
    console.log('🎬 AppIntro gestartet:', { userType, showSkip, currentPhase })
  }, [userType, showSkip, currentPhase])
  const [isSkipping, setIsSkipping] = useState(false)
  const [progress, setProgress] = useState(0)
  const [canSkip, setCanSkip] = useState(false)

  const isCompleted = useRef(false)
  const timersRef = useRef<NodeJS.Timeout[]>([])

  const handleComplete = useCallback(() => {
    if (isCompleted.current) return

    console.log('🎬 Intro Abgeschlossen - Weiterleitung zu Sprachauswahl')
    isCompleted.current = true

    timersRef.current.forEach(timer => clearTimeout(timer))
    timersRef.current = []

    setCurrentPhase('complete')

    setTimeout(() => {
      onComplete?.()
    }, 200)
  }, [onComplete])

  const handleSkip = useCallback(() => {
    setIsSkipping(true)
    setTimeout(onComplete, 500)
  }, [onComplete])

  // Keyboard-Navigation
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && showSkip) {
        handleSkip()
      }
      if (e.key === 'Enter' && currentPhase === 'enter') {
        onComplete()
      }
    }

    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [currentPhase, handleSkip, showSkip, onComplete])

  useEffect(() => {
    // Angepasste Timings basierend auf User-Type - ALLE Phasen aktiviert für episches Intro
    const timings = {
      'first-time': {
        loading: 2000,
        logo: 3000,
        temple: 4000,
        features: 3000,
        enter: 0
      },
      'returning': {
        loading: 1500,
        logo: 2500,
        temple: 3500, // Temple aktiviert für besseres Erlebnis
        features: 2500,
        enter: 0
      },
      'admin': {
        loading: 1000,
        logo: 2000,
        temple: 3000, // Temple auch für Admin aktiviert
        features: 2000,
        enter: 0
      }
    }

    const currentTimings = timings[userType]

    if (isSkipping) return

    const interval = setInterval(() => {
      setProgress(prev => Math.min(prev + 2, 100))
    }, 100)

    const timing = currentTimings[currentPhase]
    if (timing === 0) {
      // Skip-Phase sofort
      if (currentPhase === 'temple' && userType !== 'first-time') {
        setCurrentPhase('features')
        setProgress(70)
      } else if (currentPhase === 'features' && userType === 'admin') {
        setCurrentPhase('enter')
        setProgress(100)
      }
      return () => clearInterval(interval)
    }

    const timer = setTimeout(() => {
      if (currentPhase === 'loading') {
        setCurrentPhase('logo')
        setProgress(20)
      } else if (currentPhase === 'logo') {
        if (userType === 'first-time') {
          setCurrentPhase('temple')
          setProgress(40)
        } else {
          setCurrentPhase('features')
          setProgress(70)
        }
      } else if (currentPhase === 'temple') {
        setCurrentPhase('features')
        setProgress(70)
      } else if (currentPhase === 'features') {
        setCurrentPhase('enter')
        setProgress(100)
      }
    }, timing)

    timersRef.current.push(timer)

    return () => {
      clearTimeout(timer)
      clearInterval(interval)
      timersRef.current = timersRef.current.filter(t => t !== timer)
    }
  }, [currentPhase, userType, isSkipping, onComplete, handleSkip, showSkip])

  // Cleanup
  useEffect(() => {
    // Allow skipping after 2 seconds für bessere UX
    const skipTimer = setTimeout(() => {
      setCanSkip(true)
    }, 2000)

    return () => {
      clearTimeout(skipTimer)
      timersRef.current.forEach(timer => clearTimeout(timer))
      timersRef.current = []
    }
  }, [])

  if (currentPhase === 'complete' || isCompleted.current) {
    return null
  }

  return (
    <div className={`${styles.introContainer} ${styles[`phase-${currentPhase}`] || ''} ${isSkipping ? styles.skipping : ''}`}>
      <IntroDebug />
      {/* Skip-Button */}
      {showSkip && currentPhase !== 'enter' && (
        <button
          className={styles.skipButton}
          onClick={handleSkip}
          aria-label="Intro überspringen"
        >
          ⏭️ Überspringen <kbd>ESC</kbd>
        </button>
      )}

      {/* Hintergrund-Elemente */}
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