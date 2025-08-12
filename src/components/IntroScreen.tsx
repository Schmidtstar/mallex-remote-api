
import React, { useState, useEffect } from 'react'
import styles from './IntroScreen.module.css'

interface IntroScreenProps {
  onComplete: () => void
}

export const IntroScreen: React.FC<IntroScreenProps> = ({ onComplete }) => {
  const [stage, setStage] = useState(0)
  
  useEffect(() => {
    const timer1 = setTimeout(() => setStage(1), 500)
    const timer2 = setTimeout(() => setStage(2), 1500)
    const timer3 = setTimeout(() => setStage(3), 2500)
    const timer4 = setTimeout(() => onComplete(), 4500)
    
    return () => {
      clearTimeout(timer1)
      clearTimeout(timer2)
      clearTimeout(timer3)
      clearTimeout(timer4)
    }
  }, [onComplete])
  
  return (
    <div className={styles.intro}>
      <div className={styles.background}>
        <div className={styles.particles}></div>
        <div className={styles.columns}>
          <div className={styles.column}></div>
          <div className={styles.column}></div>
          <div className={styles.column}></div>
        </div>
      </div>
      
      <div className={styles.content}>
        <div className={`${styles.title} ${stage >= 1 ? styles.visible : ''}`}>
          <span className={styles.letter}>M</span>
          <span className={styles.letter}>A</span>
          <span className={styles.letter}>L</span>
          <span className={styles.letter}>L</span>
          <span className={styles.letter}>E</span>
          <span className={styles.letter}>X</span>
        </div>
        
        <div className={`${styles.subtitle} ${stage >= 2 ? styles.visible : ''}`}>
          Die Olympischen Trinkspiele
        </div>
        
        <div className={`${styles.tagline} ${stage >= 3 ? styles.visible : ''}`}>
          Ehre • Mut • Rausch
        </div>
      </div>
    </div>
  )
}
