
import React, { useState, useEffect } from 'react'
import styles from './IntroScreen.module.css'

interface IntroScreenProps {
  onComplete: () => void
}

export const IntroScreen: React.FC<IntroScreenProps> = ({ onComplete }) => {
  const [stage, setStage] = useState(0)
  
  useEffect(() => {
    const timer1 = setTimeout(() => setStage(1), 800)
    const timer2 = setTimeout(() => setStage(2), 2200)
    const timer3 = setTimeout(() => setStage(3), 3500)
    const timer4 = setTimeout(() => setStage(4), 4800)
    const timer5 = setTimeout(() => onComplete(), 6500)
    
    return () => {
      clearTimeout(timer1)
      clearTimeout(timer2)
      clearTimeout(timer3)
      clearTimeout(timer4)
      clearTimeout(timer5)
    }
  }, [onComplete])
  
  return (
    <div className={styles.intro}>
      {/* Kolosseum Hintergrund */}
      <div className={styles.colosseumBackground}>
        <div className={styles.arena}></div>
        <div className={styles.arches}>
          <div className={styles.arch}></div>
          <div className={styles.arch}></div>
          <div className={styles.arch}></div>
          <div className={styles.arch}></div>
          <div className={styles.arch}></div>
        </div>
        <div className={styles.crowd}>
          <div className={styles.crowdSection}></div>
          <div className={styles.crowdSection}></div>
          <div className={styles.crowdSection}></div>
        </div>
      </div>
      
      {/* Partikel und Atmosphäre */}
      <div className={styles.atmosphere}>
        <div className={styles.torchFlames}></div>
        <div className={styles.goldDust}></div>
        <div className={styles.wine}></div>
      </div>
      
      <div className={styles.content}>
        {/* Gladiator Helm Animation */}
        <div className={`${styles.helmet} ${stage >= 1 ? styles.visible : ''}`}>
          ⚔️
        </div>
        
        {/* Haupttitel */}
        <div className={`${styles.title} ${stage >= 2 ? styles.visible : ''}`}>
          <span className={styles.letter}>M</span>
          <span className={styles.letter}>A</span>
          <span className={styles.letter}>L</span>
          <span className={styles.letter}>L</span>
          <span className={styles.letter}>E</span>
          <span className={styles.letter}>X</span>
        </div>
        
        {/* Untertitel mit Saufspiel-Bezug */}
        <div className={`${styles.subtitle} ${stage >= 3 ? styles.visible : ''}`}>
          <div className={styles.drinkingCup}>🍷</div>
          DIE OLYMPISCHEN SAUFSPIELE
          <div className={styles.drinkingCup}>🍺</div>
        </div>
        
        {/* Gladiator Slogan */}
        <div className={`${styles.tagline} ${stage >= 4 ? styles.visible : ''}`}>
          <div className={styles.gladiatorQuote}>
            "Mögen die Spiele beginnen!"
          </div>
          <div className={styles.attributes}>
            💪 MUT • 🍻 RAUSCH • 🏆 EHRE
          </div>
        </div>
        
        {/* Arena Tor öffnet sich */}
        <div className={`${styles.arenaGate} ${stage >= 4 ? styles.opening : ''}`}>
          <div className={styles.gateLeft}></div>
          <div className={styles.gateRight}></div>
        </div>
      </div>
      
      {/* Crowd Cheering Sound Effect Indicator */}
      <div className={`${styles.crowdCheer} ${stage >= 3 ? styles.active : ''}`}>
        <span>🎺</span>
        <span>📯</span>
        <span>🥁</span>
      </div>
    </div>
  )
}
