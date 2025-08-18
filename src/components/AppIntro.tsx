
import React, { useState, useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import styles from './AppIntro.module.css'

interface AppIntroProps {
  onComplete?: () => void
}

export function AppIntro({ onComplete }: AppIntroProps = {}) {
  const { t } = useTranslation()
  const [phase, setPhase] = useState<'initial' | 'cosmic' | 'temple' | 'revelation' | 'complete'>('initial')
  const [showControls, setShowControls] = useState(false)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animationRef = useRef<number>()
  
  // Partikel-System für kosmische Effekte
  useEffect(() => {
    if (phase === 'cosmic' && canvasRef.current) {
      const canvas = canvasRef.current
      const ctx = canvas.getContext('2d')
      if (!ctx) return

      canvas.width = window.innerWidth
      canvas.height = window.innerHeight

      const particles: Array<{
        x: number
        y: number
        vx: number
        vy: number
        size: number
        color: string
        alpha: number
      }> = []

      // Erstelle Partikel
      for (let i = 0; i < 150; i++) {
        particles.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          vx: (Math.random() - 0.5) * 2,
          vy: (Math.random() - 0.5) * 2,
          size: Math.random() * 3 + 1,
          color: ['#ffd166', '#4ecdc4', '#45b7d1', '#ff6b6b'][Math.floor(Math.random() * 4)],
          alpha: Math.random()
        })
      }

      const animate = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height)
        
        particles.forEach(particle => {
          particle.x += particle.vx
          particle.y += particle.vy
          particle.alpha += (Math.random() - 0.5) * 0.02
          
          if (particle.x < 0 || particle.x > canvas.width) particle.vx *= -1
          if (particle.y < 0 || particle.y > canvas.height) particle.vy *= -1
          
          ctx.globalAlpha = Math.max(0, Math.min(1, particle.alpha))
          ctx.fillStyle = particle.color
          ctx.beginPath()
          ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2)
          ctx.fill()
        })
        
        animationRef.current = requestAnimationFrame(animate)
      }
      
      animate()
    }

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [phase])

  // Automatische Sequenz
  useEffect(() => {
    const timers: NodeJS.Timeout[] = []

    if (phase === 'initial') {
      timers.push(setTimeout(() => setPhase('cosmic'), 1000))
      timers.push(setTimeout(() => setShowControls(true), 2000))
    }
    
    if (phase === 'cosmic') {
      timers.push(setTimeout(() => setPhase('temple'), 3000))
    }
    
    if (phase === 'temple') {
      timers.push(setTimeout(() => setPhase('revelation'), 4000))
    }
    
    if (phase === 'revelation') {
      timers.push(setTimeout(() => setPhase('complete'), 6000))
    }
    
    if (phase === 'complete') {
      timers.push(setTimeout(() => {
        if (onComplete) onComplete()
      }, 2000))
    }

    return () => timers.forEach(clearTimeout)
  }, [phase, onComplete])

  const handleSkip = () => {
    setPhase('complete')
    setTimeout(() => {
      if (onComplete) onComplete()
    }, 500)
  }

  const handleQuickStart = () => {
    setPhase('revelation')
  }

  if (phase === 'complete') {
    return null
  }

  return (
    <div className={`${styles.epicStage} ${styles[phase]}`}>
      {/* Kosmischer Hintergrund mit Partikeln */}
      {phase === 'cosmic' && (
        <canvas 
          ref={canvasRef}
          className={styles.cosmicCanvas}
          aria-hidden="true"
        />
      )}

      {/* Dynamischer Hintergrund */}
      <div className={styles.dynamicBackground}>
        <div className={styles.gradientLayer}></div>
        <div className={styles.noiseLayer}></div>
        {phase === 'temple' && <div className={styles.templeGlow}></div>}
      </div>

      {/* Hauptinhalt basierend auf Phase */}
      <div className={styles.contentContainer}>
        {phase === 'initial' && (
          <div className={styles.initialPhase}>
            <div className={styles.logoReveal}>
              <span className={styles.logoIcon}>🏛️</span>
              <h1 className={styles.logoText}>OLYMPIA</h1>
            </div>
          </div>
        )}

        {phase === 'cosmic' && (
          <div className={styles.cosmicPhase}>
            <div className={styles.cosmicTitle}>
              <h1>Die Götter erwachen...</h1>
              <div className={styles.cosmicSubtitle}>
                <span>Bereite dich vor auf</span>
                <span className={styles.highlight}>legendäre Spiele</span>
              </div>
            </div>
          </div>
        )}

        {phase === 'temple' && (
          <div className={styles.templePhase}>
            <div className={styles.templeStructure}>
              <div className={styles.templePediment}>
                <div className={styles.templeTitle}>
                  OLYMPISCHE SAUFSPIELE
                </div>
              </div>
              <div className={styles.templeColumns}>
                {[...Array(6)].map((_, i) => (
                  <div key={i} className={styles.column} style={{ animationDelay: `${i * 0.1}s` }}></div>
                ))}
              </div>
              <div className={styles.templeDoors}>
                <div className={`${styles.door} ${styles.doorLeft}`}></div>
                <div className={`${styles.door} ${styles.doorRight}`}></div>
              </div>
            </div>
          </div>
        )}

        {phase === 'revelation' && (
          <div className={styles.revelationPhase}>
            <div className={styles.revelationContent}>
              <h1 className={styles.revelationTitle}>
                Willkommen in der Arena der Götter
              </h1>
              <div className={styles.revelationFeatures}>
                <div className={styles.feature}>
                  <span className={styles.featureIcon}>⚔️</span>
                  <span>Epische Challenges</span>
                </div>
                <div className={styles.feature}>
                  <span className={styles.featureIcon}>🏆</span>
                  <span>Legendäre Rankings</span>
                </div>
                <div className={styles.feature}>
                  <span className={styles.featureIcon}>🎭</span>
                  <span>Mythische Achievements</span>
                </div>
              </div>
              <button 
                className={styles.enterButton}
                onClick={handleQuickStart}
              >
                <span>Arena betreten</span>
                <span className={styles.buttonGlow}></span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Moderne Steuerung */}
      {showControls && (
        <div className={styles.modernControls}>
          <button 
            className={styles.skipButton}
            onClick={handleSkip}
            aria-label="Intro überspringen"
          >
            <span>Überspringen</span>
            <kbd>ESC</kbd>
          </button>
          
          {phase === 'cosmic' && (
            <button 
              className={styles.quickStartButton}
              onClick={handleQuickStart}
            >
              <span>Schnellstart</span>
              <span className={styles.sparkle}>✨</span>
            </button>
          )}
        </div>
      )}

      {/* Fortschrittsindikator */}
      <div className={styles.progressContainer}>
        <div className={styles.progressBar} data-phase={phase}></div>
      </div>
    </div>
  )
}

export default AppIntro
