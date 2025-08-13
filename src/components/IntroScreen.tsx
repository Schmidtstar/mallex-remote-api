
import React, { useState, useEffect } from 'react'
import styles from './IntroScreen.module.css'

interface IntroScreenProps {
  onComplete: () => void
}

export const IntroScreen: React.FC<IntroScreenProps> = ({ onComplete }) => {
  const [stage, setStage] = useState(0)
  
  useEffect(() => {
    const timer1 = setTimeout(() => setStage(1), 800)    // Kolosseum erscheint
    const timer2 = setTimeout(() => setStage(2), 2500)   // Text erscheint
    const timer3 = setTimeout(() => onComplete(), 6000)  // Ende nach 6 Sekunden
    
    return () => {
      clearTimeout(timer1)
      clearTimeout(timer2)
      clearTimeout(timer3)
    }
  }, [onComplete])
  
  return (
    <div className={styles.intro}>
      {/* Mallorca Kolosseum Hintergrund */}
      <div className={`${styles.mallorcaColosseum} ${stage >= 1 ? styles.visible : ''}`}>
        {/* Strand-Arena */}
        <div className={styles.beachArena}></div>
        
        {/* Palmen-Säulen */}
        <div className={styles.palmColumns}>
          <div className={styles.palmColumn}>🌴</div>
          <div className={styles.palmColumn}>🌴</div>
          <div className={styles.palmColumn}>🌴</div>
          <div className={styles.palmColumn}>🌴</div>
          <div className={styles.palmColumn}>🌴</div>
        </div>
        
        {/* Mallorca Himmel */}
        <div className={styles.mallorcaSky}>
          <div className={styles.sun}>☀️</div>
          <div className={styles.clouds}>☁️</div>
        </div>
        
        {/* Strand-Details */}
        <div className={styles.beachDetails}>
          <div className={styles.beachBalls">🏖️</div>
          <div className={styles.cocktails">🍹</div>
          <div className={styles.umbrellas}>🏖️</div>
        </div>
      </div>
      
      <div className={styles.content}>
        {/* Haupttext */}
        <div className={`${styles.mainTitle} ${stage >= 2 ? styles.visible : ''}`}>
          <div className={styles.titleLine}>DIE OLYMPISCHE</div>
          <div className={styles.titleLine}>SAUF SPIELE</div>
          <div className={styles.titleLine}>IN MALLEX</div>
        </div>
      </div>
    </div>
  )
}
