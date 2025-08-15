
import React, { useState, useEffect } from 'react'
import styles from './AppIntro.module.css'

interface AppIntroProps {
  onComplete: () => void
}

export const AppIntro: React.FC<AppIntroProps> = ({ onComplete }) => {
  const [currentStep, setCurrentStep] = useState(0)

  useEffect(() => {
    const timeouts: NodeJS.Timeout[] = []

    // Step 1: Dramatic entrance with thunder
    timeouts.push(setTimeout(() => setCurrentStep(1), 800))
    
    // Step 2: MALLEX mit explosiver Animation
    timeouts.push(setTimeout(() => setCurrentStep(2), 2500))
    
    // Step 3: "den olympischen Saufspielen" erscheint
    timeouts.push(setTimeout(() => setCurrentStep(3), 4500))
    
    // Step 4: "MUT RAUSCH EHRE KAMPF" mit Explosion
    timeouts.push(setTimeout(() => setCurrentStep(4), 6500))
    
    // Step 5: Final flash und fade out
    timeouts.push(setTimeout(() => setCurrentStep(5), 8500))
    timeouts.push(setTimeout(() => onComplete(), 10000))

    return () => {
      timeouts.forEach(timeout => clearTimeout(timeout))
    }
  }, [onComplete])

  return (
    <div className={`${styles.introContainer} ${currentStep === 5 ? styles.fadeOut : ''}`}>
      {/* Thunder flash effect */}
      <div className={`${styles.thunderFlash} ${currentStep >= 1 ? styles.active : ''}`}></div>
      
      {/* Particle explosions */}
      <div className={`${styles.particles} ${currentStep >= 2 ? styles.explode : ''}`}>
        {Array.from({ length: 50 }).map((_, i) => (
          <div key={i} className={styles.particle} style={{ 
            '--delay': `${i * 0.05}s`,
            '--angle': `${i * 7.2}deg`
          } as React.CSSProperties}></div>
        ))}
      </div>

      <div className={styles.content}>
        {/* Dramatic entrance text */}
        <div className={`${styles.entrance} ${currentStep >= 1 ? styles.visible : ''}`}>
          <div className={styles.entranceText}>WILLKOMMEN ZU</div>
        </div>

        {/* MALLEX mit dramatischer Animation */}
        <div className={`${styles.appName} ${currentStep >= 2 ? styles.visible : ''}`}>
          <span className={styles.letter} style={{ animationDelay: '0s' }}>M</span>
          <span className={styles.letter} style={{ animationDelay: '0.1s' }}>A</span>
          <span className={styles.letter} style={{ animationDelay: '0.2s' }}>L</span>
          <span className={styles.letter} style={{ animationDelay: '0.3s' }}>L</span>
          <span className={styles.letter} style={{ animationDelay: '0.4s' }}>E</span>
          <span className={styles.letter} style={{ animationDelay: '0.5s' }}>X</span>
        </div>

        {/* Subtitle: den olympischen Saufspielen */}
        <div className={`${styles.subtitle1} ${currentStep >= 3 ? styles.visible : ''}`}>
          <span className={styles.word} style={{ animationDelay: '0s' }}>den</span>
          <span className={styles.word} style={{ animationDelay: '0.2s' }}>olympischen</span>
          <span className={styles.word} style={{ animationDelay: '0.4s' }}>Saufspielen</span>
        </div>

        {/* Values mit explosiver Animation */}
        <div className={`${styles.values} ${currentStep >= 4 ? styles.visible : ''}`}>
          <span className={styles.value} style={{ animationDelay: '0s' }}>MUT</span>
          <span className={styles.value} style={{ animationDelay: '0.2s' }}>RAUSCH</span>
          <span className={styles.value} style={{ animationDelay: '0.4s' }}>EHRE</span>
          <span className={styles.value} style={{ animationDelay: '0.6s' }}>KAMPF</span>
        </div>

        {/* Epic lightning effects */}
        <div className={`${styles.lightning} ${currentStep >= 2 ? styles.active : ''}`}></div>
        <div className={`${styles.lightningBolt} ${currentStep >= 2 ? styles.strike : ''}`}></div>
      </div>

      {/* Screen shake effect */}
      <div className={`${styles.screenShake} ${currentStep === 2 || currentStep === 4 ? styles.shake : ''}`}></div>
    </div>
  )
}
