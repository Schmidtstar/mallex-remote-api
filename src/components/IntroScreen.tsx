
import React, { useState, useEffect } from 'react'
import styles from './IntroScreen.module.css'

interface IntroScreenProps {
  onComplete: () => void
}

export const IntroScreen: React.FC<IntroScreenProps> = ({ onComplete }) => {
  const [stage, setStage] = useState(0)
  
  useEffect(() => {
    const timer1 = setTimeout(() => setStage(1), 1000)   // Logo erscheint
    const timer2 = setTimeout(() => setStage(2), 2500)   // Titel erscheint
    const timer3 = setTimeout(() => onComplete(), 4500)  // Ende
    
    return () => {
      clearTimeout(timer1)
      clearTimeout(timer2)
      clearTimeout(timer3)
    }
  }, [onComplete])
  
  return (
    <div className={styles.intro}>
      <div className={styles.content}>
        {/* Einfaches Logo */}
        <div className={`${styles.logo} ${stage >= 1 ? styles.visible : ''}`}>
          🍺
        </div>
        
        {/* Sauberer Titel */}
        <div className={`${styles.title} ${stage >= 2 ? styles.visible : ''}`}>
          <h1 className={styles.titleText}>MALLEX</h1>
          <p className={styles.subtitle}>Trinkspiele Arena</p>
        </div>
      </div>
    </div>
  )
}
