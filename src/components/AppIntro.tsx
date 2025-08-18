
import React, { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import styles from './AppIntro.module.css'

interface IntroConfig {
  userType: 'first_time' | 'returning' | 'admin' | 'premium'
  skipEnabled: boolean
  duration: number
  personalized: boolean
}

export function AppIntro({ onComplete }: { onComplete: () => void }) {
  const { user, isAdmin } = useAuth()
  const [showSkip, setShowSkip] = useState(false)
  const [introConfig, setIntroConfig] = useState<IntroConfig>({
    userType: 'first_time',
    skipEnabled: false,
    duration: 8000,
    personalized: false
  })
  const [currentStep, setCurrentStep] = useState(0)
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    // User-Type Detection
    const detectUserType = () => {
      const hasVisited = localStorage.getItem('mallex_visited')
      const lastVisit = localStorage.getItem('mallex_last_visit')
      const isPremium = localStorage.getItem('mallex_premium') === 'true'
      
      let userType: IntroConfig['userType'] = 'first_time'
      let duration = 8000
      
      if (isAdmin) {
        userType = 'admin'
        duration = 4000 // Kürzeres Intro für Admins
      } else if (isPremium) {
        userType = 'premium'
        duration = 5000
      } else if (hasVisited && lastVisit) {
        const daysSinceLastVisit = (Date.now() - parseInt(lastVisit)) / (1000 * 60 * 60 * 24)
        if (daysSinceLastVisit < 7) {
          userType = 'returning'
          duration = 3000 // Sehr kurzes Intro für wiederkehrende Nutzer
        }
      }

      setIntroConfig({
        userType,
        skipEnabled: true,
        duration,
        personalized: true
      })

      // Analytics tracking
      if (window.gtag) {
        window.gtag('event', 'intro_started', {
          user_type: userType,
          duration: duration
        })
      }
    }

    detectUserType()

    // Skip-Button nach 2s aktivieren
    const skipTimer = setTimeout(() => {
      setShowSkip(true)
    }, 2000)

    // Progress-Timer
    const progressInterval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          handleComplete()
          return 100
        }
        return prev + (100 / (introConfig.duration / 100))
      })
    }, 100)

    // Auto-Complete Timer
    const autoCompleteTimer = setTimeout(() => {
      handleComplete()
    }, introConfig.duration)

    return () => {
      clearTimeout(skipTimer)
      clearTimeout(autoCompleteTimer)
      clearInterval(progressInterval)
    }
  }, [introConfig.duration])

  const handleSkip = () => {
    if (window.gtag) {
      window.gtag('event', 'intro_skipped', {
        user_type: introConfig.userType,
        time_to_skip: Date.now() - startTime,
        skip_after_seconds: (Date.now() - startTime) / 1000
      })
    }
    handleComplete()
  }

  const handleComplete = () => {
    // Besuchsdaten speichern
    localStorage.setItem('mallex_visited', 'true')
    localStorage.setItem('mallex_last_visit', Date.now().toString())
    
    if (window.gtag) {
      window.gtag('event', 'intro_completed', {
        user_type: introConfig.userType,
        completion_method: showSkip ? 'manual' : 'auto'
      })
    }
    
    onComplete()
  }

  const getPersonalizedGreeting = () => {
    switch (introConfig.userType) {
      case 'admin':
        return {
          title: `Willkommen zurück, ${user?.displayName || 'Admin'}! 👑`,
          subtitle: 'Verwalte die olympischen Spiele',
          highlight: 'Admin-Dashboard bereit'
        }
      case 'premium':
        return {
          title: `Hey ${user?.displayName || 'Champion'}! ⭐`,
          subtitle: 'Premium-Features warten auf dich',
          highlight: 'Exklusive Inhalte verfügbar'
        }
      case 'returning':
        return {
          title: `Schön, dich wiederzusehen! 🎉`,
          subtitle: 'Lass uns weitermachen wo wir aufgehört haben',
          highlight: 'Neue Features entdecken'
        }
      default:
        return {
          title: 'Willkommen zu MALLEX! 🏛️',
          subtitle: 'Den olympischen Saufspielen',
          highlight: 'Lass die Spiele beginnen!'
        }
    }
  }

  const greeting = getPersonalizedGreeting()
  const startTime = React.useRef(Date.now()).current

  // Accessibility: Reduzierte Animationen wenn gewünscht
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

  return (
    <div className={`${styles.overlay} ${prefersReducedMotion ? styles.reducedMotion : ''}`}>
      <div className={styles.container}>
        {/* Progress Indicator */}
        <div className={styles.progressContainer}>
          <div 
            className={styles.progressBar}
            style={{ width: `${progress}%` }}
            role="progressbar"
            aria-valuenow={progress}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label="Intro-Fortschritt"
          />
        </div>

        {/* Skip Button */}
        {showSkip && introConfig.skipEnabled && (
          <button
            className={styles.skipButton}
            onClick={handleSkip}
            aria-label="Intro überspringen"
          >
            Überspringen →
          </button>
        )}

        {/* Hauptinhalt */}
        <div className={styles.content}>
          <div className={styles.logoContainer}>
            <h1 className={styles.logo}>MALLEX</h1>
            <div className={styles.subtitle}>
              {greeting.subtitle}
            </div>
          </div>

          {/* Personalisierte Begrüßung */}
          <div className={styles.greeting}>
            <h2 className={styles.greetingTitle}>
              {greeting.title}
            </h2>
            <p className={styles.greetingHighlight}>
              {greeting.highlight}
            </p>
          </div>

          {/* User-Type spezifische Hints */}
          {introConfig.userType === 'admin' && (
            <div className={styles.adminHints}>
              <p>💡 Neue Admin-Features verfügbar</p>
              <p>📊 Analytics-Dashboard erweitert</p>
            </div>
          )}

          {introConfig.userType === 'returning' && (
            <div className={styles.returningHints}>
              <p>🆕 Achievement-System hinzugefügt</p>
              <p>📱 Mobile-Optimierungen verfügbar</p>
            </div>
          )}

          {/* Accessibility-Hinweis */}
          {prefersReducedMotion && (
            <div className={styles.accessibilityNotice}>
              <p>♿ Reduzierte Animationen aktiv</p>
            </div>
          )}
        </div>

        {/* Quick-Start Button für returning users */}
        {introConfig.userType === 'returning' && (
          <button
            className={styles.quickStartButton}
            onClick={handleComplete}
            aria-label="Schnell starten"
          >
            Direkt zur Arena →
          </button>
        )}
      </div>
    </div>
  )
}
