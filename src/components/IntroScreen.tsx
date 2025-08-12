
import React, { useState, useEffect } from 'react'
import styles from './IntroScreen.module.css'

interface IntroScreenProps {
  onComplete: () => void
}

export const IntroScreen: React.FC<IntroScreenProps> = ({ onComplete }) => {
  const [stage, setStage] = useState(0)
  
  useEffect(() => {
    const timer1 = setTimeout(() => setStage(1), 500)   // Kolosseum erscheint
    const timer2 = setTimeout(() => setStage(2), 1200)  // MALLEX Titel
    const timer3 = setTimeout(() => setStage(3), 2500)  // Olympische Saufspiele EXPLOSION
    const timer4 = setTimeout(() => setStage(4), 4500)  // Gladiator Spruch
    const timer5 = setTimeout(() => setStage(5), 6000)  // Arena Tor öffnet
    const timer6 = setTimeout(() => onComplete(), 8000) // Längere Pause für den Effekt
    
    return () => {
      clearTimeout(timer1)
      clearTimeout(timer2)
      clearTimeout(timer3)
      clearTimeout(timer4)
      clearTimeout(timer5)
      clearTimeout(timer6)
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
            <div className={styles.drinkItem} style={{transform: 'rotate(0deg) translateX(120px)'}}>🍺</div>
            <div className={styles.drinkItem} style={{transform: 'rotate(45deg) translateX(120px)'}}>🍷</div>
            <div className={styles.drinkItem} style={{transform: 'rotate(90deg) translateX(120px)'}}>🍻</div>
            <div className={styles.drinkItem} style={{transform: 'rotate(135deg) translateX(120px)'}}>🥂</div>
            <div className={styles.drinkItem} style={{transform: 'rotate(180deg) translateX(120px)'}}>🍾</div>
            <div className={styles.drinkItem} style={{transform: 'rotate(225deg) translateX(120px)'}}>🍸</div>
            <div className={styles.drinkItem} style={{transform: 'rotate(270deg) translateX(120px)'}}>🥃</div>
            <div className={styles.drinkItem} style={{transform: 'rotate(315deg) translateX(120px)'}}>🍺</div>
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
        
        {/* Arena Tor öffnet sich */}
        <div className={`${styles.arenaGate} ${stage >= 5 ? styles.opening : ''}`}>
          <div className={styles.gateLeft}></div>
          <div className={styles.gateRight}></div>
          <div className={styles.gateGlow}></div>
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
