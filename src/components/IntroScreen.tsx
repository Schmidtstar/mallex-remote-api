
import React, { useState, useEffect } from 'react'
import styles from './IntroScreen.module.css'

interface IntroScreenProps {
  onComplete: () => void
}

export const IntroScreen: React.FC<IntroScreenProps> = ({ onComplete }) => {
  const [stage, setStage] = useState(0)
  
  useEffect(() => {
    const timer1 = setTimeout(() => setStage(1), 800)   // Kolosseum erscheint (länger)
    const timer2 = setTimeout(() => setStage(2), 2000)  // MALLEX Titel (mehr Zeit)
    const timer3 = setTimeout(() => setStage(3), 4000)  // Olympische Saufspiele EXPLOSION (mehr Zeit zum Lesen)
    const timer4 = setTimeout(() => setStage(4), 7000)  // Gladiator Spruch (mehr Zeit für Explosion)
    const timer5 = setTimeout(() => onComplete(), 11500) // Ende nach Gladiator Spruch (5+ Sekunden länger!)
    
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
      {/* Verstärkter Kolosseum Hintergrund */}
      <div className={`${styles.colosseumBackground} ${stage >= 1 ? styles.visible : ''}`}>
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
          <div className={styles.crowdSection}></div>
          <div className={styles.crowdSection}></div>
        </div>
      </div>
      
      {/* Verstärkte Atmosphäre */}
      <div className={styles.atmosphere}>
        <div className={styles.torchFlames}></div>
        <div className={styles.goldDust}></div>
        <div className={styles.wine}></div>
        <div className={styles.lightningBolts}></div>
      </div>
      
      <div className={styles.content}>
        {/* MALLEX Titel - kompakter */}
        <div className={`${styles.title} ${stage >= 2 ? styles.visible : ''}`}>
          <div className={styles.gladiatorHelm}>⚔️</div>
          <div className={styles.titleText}>
            <span className={styles.letter}>M</span>
            <span className={styles.letter}>A</span>
            <span className={styles.letter}>L</span>
            <span className={styles.letter}>L</span>
            <span className={styles.letter}>E</span>
            <span className={styles.letter}>X</span>
          </div>
        </div>
        
        {/* HAUPTATTRAKTION: Die Olympischen Saufspiele! */}
        <div className={`${styles.olympicDrinkingGames} ${stage >= 3 ? styles.explosion : ''}`}>
          {/* Bier und Wein Animation rings um den Text */}
          <div className={styles.drinkingRing}>
            <div className={styles.drinkItem} style={{transform: 'rotate(0deg) translateX(110px)'}}>🍺</div>
            <div className={styles.drinkItem} style={{transform: 'rotate(60deg) translateX(110px)'}}>🍷</div>
            <div className={styles.drinkItem} style={{transform: 'rotate(120deg) translateX(110px)'}}>🍻</div>
            <div className={styles.drinkItem} style={{transform: 'rotate(180deg) translateX(110px)'}}>🥂</div>
            <div className={styles.drinkItem} style={{transform: 'rotate(240deg) translateX(110px)'}}>🍾</div>
            <div className={styles.drinkItem} style={{transform: 'rotate(300deg) translateX(110px)'}}>🥃</div>
          </div>
          
          {/* Der Haupttext mit EXPLOSION */}
          <div className={styles.olympicTitle}>
            <div className={styles.olympicLine1}>DIE</div>
            <div className={styles.olympicLine2}>OLYMPISCHEN</div>
            <div className={styles.olympicLine3}>SAUFSPIELE</div>
          </div>
          
          {/* Explosions-Partikel */}
          <div className={styles.explosionParticles}>
            <div className={styles.particle}>✨</div>
            <div className={styles.particle}>💫</div>
            <div className={styles.particle}>⭐</div>
            <div className={styles.particle}>🎆</div>
            <div className={styles.particle}>🎇</div>
            <div className={styles.particle}>💥</div>
            <div className={styles.particle}>⚡</div>
            <div className={styles.particle}>🌟</div>
          </div>
        </div>
        
        {/* Gladiator Slogan */}
        <div className={`${styles.tagline} ${stage >= 4 ? styles.visible : ''}`}>
          <div className={styles.gladiatorQuote}>
            "MÖGEN DIE SPIELE BEGINNEN!"
          </div>
          <div className={styles.attributes}>
            💪 MUT • 🍻 RAUSCH • 🏆 EHRE • ⚔️ KAMPF
          </div>
        </div>
        
        
      </div>
      
      {/* Verstärkte Crowd */}
      <div className={`${styles.crowdCheer} ${stage >= 3 ? styles.active : ''}`}>
        <span>🎺</span>
        <span>📯</span>
        <span>🥁</span>
        <span>🏛️</span>
        <span>🏆</span>
      </div>
      
      {/* Donner Sound Effect Indicator */}
      <div className={`${styles.thunderEffect} ${stage >= 3 ? styles.active : ''}`}>
        ⚡💥⚡
      </div>
    </div>
  )
}
