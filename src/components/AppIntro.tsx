
import React, { useState, useEffect } from 'react'
import styles from './AppIntro.module.css'

interface AppIntroProps {
  onComplete: () => void
}

export const AppIntro: React.FC<AppIntroProps> = ({ onComplete }) => {
  const [currentStep, setCurrentStep] = useState(0)

  useEffect(() => {
    const timeouts: NodeJS.Timeout[] = []

    // Step 1: MALLEX erscheint
    timeouts.push(setTimeout(() => setCurrentStep(1), 500))
    
    // Step 2: "DIE OLYMPISCHEN SAUFSPIELE" erscheint
    timeouts.push(setTimeout(() => setCurrentStep(2), 2000))
    
    // Step 3: "MÖGEN DIE SPIELE BEGINNEN" erscheint
    timeouts.push(setTimeout(() => setCurrentStep(3), 3500))
    
    // Step 4: "MUT RAUSCH EHRE KAMPF" erscheint
    timeouts.push(setTimeout(() => setCurrentStep(4), 5000))
    
    // Step 5: Fade out und App starten
    timeouts.push(setTimeout(() => setCurrentStep(5), 7000))
    timeouts.push(setTimeout(() => onComplete(), 8000))

    return () => {
      timeouts.forEach(timeout => clearTimeout(timeout))
    }
  }, [onComplete])

  return (
    <div className={`${styles.introContainer} ${currentStep === 5 ? styles.fadeOut : ''}`}>
      <div className={styles.content}>
        {/* App Name */}
        <div className={`${styles.appName} ${currentStep >= 1 ? styles.visible : ''}`}>
          <span className={styles.letter} style={{ animationDelay: '0.1s' }}>M</span>
          <span className={styles.letter} style={{ animationDelay: '0.2s' }}>A</span>
          <span className={styles.letter} style={{ animationDelay: '0.3s' }}>L</span>
          <span className={styles.letter} style={{ animationDelay: '0.4s' }}>L</span>
          <span className={styles.letter} style={{ animationDelay: '0.5s' }}>E</span>
          <span className={styles.letter} style={{ animationDelay: '0.6s' }}>X</span>
        </div>

        {/* Subtitle 1 */}
        <div className={`${styles.subtitle1} ${currentStep >= 2 ? styles.visible : ''}`}>
          DIE OLYMPISCHEN SAUFSPIELE
        </div>

        {/* Subtitle 2 */}
        <div className={`${styles.subtitle2} ${currentStep >= 3 ? styles.visible : ''}`}>
          MÖGEN DIE SPIELE BEGINNEN
        </div>

        {/* Values */}
        <div className={`${styles.values} ${currentStep >= 4 ? styles.visible : ''}`}>
          <span className={styles.value} style={{ animationDelay: '0.1s' }}>MUT</span>
          <span className={styles.value} style={{ animationDelay: '0.3s' }}>RAUSCH</span>
          <span className={styles.value} style={{ animationDelay: '0.5s' }}>EHRE</span>
          <span className={styles.value} style={{ animationDelay: '0.7s' }}>KAMPF</span>
        </div>

        {/* Lightning effect */}
        <div className={`${styles.lightning} ${currentStep >= 1 ? styles.active : ''}`}></div>
      </div>
    </div>
  )
}
