
import React, { useState, useEffect } from 'react'
import styles from './IntroScreen.module.css'

interface IntroScreenProps {
  onComplete: () => void
}

export const IntroScreen: React.FC<IntroScreenProps> = ({ onComplete }) => {
  const [stage, setStage] = useState(0)
  
  useEffect(() => {
    const timer1 = setTimeout(() => setStage(1), 800)    // Kolosseum erscheint
    const timer2 = setTimeout(() => setStage(2), 2500)   // Logo erscheint
    const timer3 = setTimeout(() => setStage(3), 4500)   // Olympische Trinkspiele EXPLOSION
    const timer4 = setTimeout(() => setStage(4), 7500)   // Tagline erscheint
    const timer5 = setTimeout(() => onComplete(), 12000) // Ende nach 12 Sekunden
    
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
      <div className={`${styles.colosseumBackground} ${stage >= 1 ? styles.visible : ''}`}>
        {/* Arena */}
        <div className={styles.arena}></div>
        
        {/* Bögen */}
        <div className={styles.arches}>
          <div className={styles.arch}></div>
          <div className={styles.arch}></div>
          <div className={styles.arch}></div>
          <div className={styles.arch}></div>
          <div className={styles.arch}></div>
        </div>
        
        {/* Zuschauer */}
        <div className={styles.crowd}>
          <div className={styles.crowdSection}></div>
          <div className={styles.crowdSection}></div>
          <div className={styles.crowdSection}></div>
          <div className={styles.crowdSection}></div>
          <div className={styles.crowdSection}></div>
        </div>
        
        {/* Atmosphäre */}
        <div className={styles.atmosphere}>
          <div className={styles.lightningBolts}></div>
          <div className={styles.torchFlames}></div>
          <div className={styles.goldDust}></div>
          <div className={styles.wine}></div>
        </div>
      </div>
      
      {/* Publikums-Jubel */}
      <div className={`${styles.crowdCheer} ${stage >= 3 ? 'active' : ''}`}>
        <span>🍺</span>
        <span>🏆</span>
        <span>⚔️</span>
        <span>🍷</span>
        <span>🔥</span>
      </div>
      
      {/* Donner-Effekt */}
      <div className={`${styles.thunderEffect} ${stage >= 3 ? 'active' : ''}`}>⚡</div>
      
      <div className={styles.content}>
        {/* Logo */}
        <div className={`${styles.logo} ${stage >= 2 ? styles.visible : ''}`}>
          ⚔️🍺
        </div>
        
        {/* OLYMPISCHE TRINKSPIELE */}
        <div className={`${styles.olympicDrinkingGames} ${stage >= 3 ? styles.explosion : ''}`}>
          {/* NEUES BIERGLAS MIT GIESSPIEL */}
          <div className={styles.beerPouringScene}>
            <div className={styles.tiltingBeerGlass}>🍺</div>
            <div className={styles.pouringBeer}></div>
            <div className={styles.cheeringPlayers}>
              <div className={styles.cheeringPlayer}>🙋‍♂️</div>
              <div className={styles.cheeringPlayer}>🙋‍♀️</div>
              <div className={styles.cheeringPlayer}>🙋‍♂️</div>
              <div className={styles.cheeringPlayer}>🙋‍♀️</div>
            </div>
          </div>
          
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
            <span className={styles.olympicLine1}>OLYMPISCHE</span>
            <span className={styles.olympicLine2}>SAUF</span>
            <span className={styles.olympicLine3}>SPIELE</span>
          </div>
          
          {/* Explosions-Partikel */}
          <div className={styles.explosionParticles}>
            <div className={styles.particle}>🍺</div>
            <div className={styles.particle}>🏆</div>
            <div className={styles.particle}>⚔️</div>
            <div className={styles.particle}>🍷</div>
            <div className={styles.particle}>🔥</div>
            <div className={styles.particle}>🥇</div>
            <div className={styles.particle}>🍻</div>
            <div className={styles.particle}>⚡</div>
          </div>
        </div>
        
        {/* Gladiator-Tagline */}
        <div className={`${styles.tagline} ${stage >= 4 ? styles.visible : ''}`}>
          <div className={styles.gladiatorQuote}>
            "Wer nicht trinkt, ehrt die Götter nicht!"
          </div>
          <div className={styles.attributes}>
            - Mut • Ehre • Alkohol -
          </div>
        </div>
      </div>
    </div>
  )
}
