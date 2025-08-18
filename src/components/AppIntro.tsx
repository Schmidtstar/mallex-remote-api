
import React, { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import styles from './AppIntro.module.css'

interface AppIntroProps {
  onComplete?: () => void
}

export function AppIntro({ onComplete }: AppIntroProps = {}) {
  const { t } = useTranslation()
  const [showTemple, setShowTemple] = useState(true)
  const [doorsOpen, setDoorsOpen] = useState(false)
  const [showEmergingText, setShowEmergingText] = useState(false)
  const [showClickOverlay, setShowClickOverlay] = useState(true)

  useEffect(() => {
    // Automatically start the intro sequence after a short delay
    const clickTimeout = setTimeout(() => {
      handleStartIntro()
    }, 1000)

    return () => clearTimeout(clickTimeout)
  }, [])

  const handleStartIntro = () => {
    setShowClickOverlay(false)
    
    // Open doors after 800ms
    setTimeout(() => {
      setDoorsOpen(true)
    }, 800)

    // Show emerging text after doors open (1800ms total)
    setTimeout(() => {
      setShowEmergingText(true)
    }, 1800)

    // Complete intro after full animation (6000ms total)
    setTimeout(() => {
      setShowTemple(false)
      if (onComplete) {
        onComplete()
      }
    }, 6000)
  }

  const handleSkip = () => {
    setShowTemple(false)
    if (onComplete) {
      onComplete()
    }
  }

  if (!showTemple) {
    return null
  }

  return (
    <div className={styles.stage}>
      {/* Himmel und Wolken */}
      <div className={styles.sky}>
        <div className={styles.clouds}></div>
      </div>

      {/* Tempel */}
      <div className={styles.temple}>
        {/* Tempel-Kopf mit Titel */}
        <div className={styles.pediment}>
          <div className={styles.frieze}></div>
          <h1 className={styles.title}>
            {t('app.title', 'Olympische Saufspiele')}
          </h1>
        </div>

        {/* Türen */}
        <div className={`${styles.door} ${styles.left} ${doorsOpen ? styles.open : ''}`}></div>
        <div className={`${styles.door} ${styles.right} ${doorsOpen ? styles.open : ''}`}></div>
      </div>

      {/* Emergierender Text */}
      {showEmergingText && (
        <div className={styles.emergingText}>
          <h1>Willkommen bei den</h1>
          <h2>legendären</h2>
          <h3>Olympischen Saufspielen!</h3>
        </div>
      )}

      {/* Click Overlay */}
      {showClickOverlay && (
        <div className={styles.clickOverlay} onClick={handleStartIntro}>
          <p>Klicken Sie, um zu beginnen...</p>
        </div>
      )}

      {/* Skip Button */}
      {!showClickOverlay && (
        <button 
          className={styles.skipButton}
          onClick={handleSkip}
          aria-label={t('intro.skip', 'Intro überspringen')}
        >
          {t('intro.skip', 'Überspringen')}
        </button>
      )}
    </div>
  )
}

export default AppIntro
