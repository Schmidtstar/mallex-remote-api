import React, { useState, useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { useSwipe } from '../hooks/useSwipe'
import styles from './AppIntro.module.css'

interface AppIntroProps {
  onComplete: () => void
}

interface IntroStep {
  id: string
  title: string
  content: string
  icon: string
  animation?: string
  interactive?: boolean
  action?: () => void
}

export default function AppIntro({ onComplete }: AppIntroProps) {
  const { t } = useTranslation()
  const [currentStep, setCurrentStep] = useState(0)
  const [isVisible, setIsVisible] = useState(true)
  const [hasInteracted, setHasInteracted] = useState(false)
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set())
  const containerRef = useRef<HTMLDivElement>(null)

  // Enhanced steps mit progressive onboarding
  const steps: IntroStep[] = [
    {
      id: 'welcome',
      title: t('intro.welcome.title', 'Willkommen bei MALLEX'),
      content: t('intro.welcome.content', 'Deine olympische Trinkspiel-Arena wartet!'),
      icon: '🏛️',
      animation: 'fadeInUp'
    },
    {
      id: 'arena',
      title: t('intro.arena.title', 'Arena-Kämpfe'),
      content: t('intro.arena.content', 'Tritt gegen andere Gladiatoren an und sammle Punkte'),
      icon: '⚔️',
      animation: 'slideInLeft',
      interactive: true,
      action: () => {
        // Simuliere Arena-Action mit Animation
        const icon = containerRef.current?.querySelector(`.${styles.icon}`)
        icon?.classList.add(styles.bounce)
        setTimeout(() => icon?.classList.remove(styles.bounce), 600)
      }
    },
    {
      id: 'challenges',
      title: t('intro.challenges.title', 'Herausforderungen'),
      content: t('intro.challenges.content', 'Wähle aus verschiedenen Kategorien und Schwierigkeiten'),
      icon: '🎯',
      animation: 'slideInRight'
    },
    {
      id: 'features',
      title: t('intro.features.title', 'Funktionen entdecken'),
      content: t('intro.features.content', 'Leaderboards, Achievements und vieles mehr'),
      icon: '✨',
      animation: 'zoomIn'
    },
    {
      id: 'ready',
      title: t('intro.ready.title', 'Bereit für den Kampf?'),
      content: t('intro.ready.content', 'Lass uns deine Reise beginnen!'),
      icon: '🚀',
      animation: 'pulse'
    }
  ]

  // Swipe-Unterstützung für Touch-Geräte
  const swipeHandlers = useSwipe({
    onSwipeLeft: nextStep,
    onSwipeRight: prevStep,
    threshold: 50
  })

  useEffect(() => {
    // Auto-progression nach Interaktion
    if (hasInteracted && steps[currentStep].interactive) {
      const timer = setTimeout(() => {
        markStepCompleted(currentStep)
      }, 2000)
      return () => clearTimeout(timer)
    }
  }, [hasInteracted, currentStep])

  useEffect(() => {
    // Accessibility: Keyboard navigation
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === 'Space') {
        e.preventDefault()
        nextStep()
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault()
        prevStep()
      } else if (e.key === 'Escape') {
        e.preventDefault()
        skipIntro()
      }
    }

    document.addEventListener('keydown', handleKeyPress)
    return () => document.removeEventListener('keydown', handleKeyPress)
  }, [currentStep])

  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      markStepCompleted(currentStep)
      setCurrentStep(currentStep + 1)
      setHasInteracted(false)
    } else {
      completeIntro()
    }
  }

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
      setHasInteracted(false)
    }
  }

  const markStepCompleted = (stepIndex: number) => {
    setCompletedSteps(prev => new Set([...prev, stepIndex]))
  }

  const skipIntro = () => {
    setIsVisible(false)
    setTimeout(onComplete, 300)
  }

  const completeIntro = () => {
    // Speichere Intro-Completion im localStorage
    localStorage.setItem('mallex_intro_completed', 'true')
    localStorage.setItem('mallex_intro_completion_date', new Date().toISOString())

    setIsVisible(false)
    setTimeout(onComplete, 300)
  }

  const handleStepInteraction = () => {
    setHasInteracted(true)
    if (steps[currentStep].action) {
      steps[currentStep].action!()
    }
  }

  const goToStep = (stepIndex: number) => {
    setCurrentStep(stepIndex)
    setHasInteracted(false)
  }

  if (!isVisible) return null

  const currentStepData = steps[currentStep]
  const progress = ((currentStep + 1) / steps.length) * 100

  return (
    <div className={styles.overlay} role="dialog" aria-modal="true" aria-labelledby="intro-title">
      <div 
        className={styles.container} 
        ref={containerRef}
        {...swipeHandlers}
      >
        {/* Progress Bar */}
        <div className={styles.progressBar}>
          <div 
            className={styles.progressFill} 
            style={{ width: `${progress}%` }}
            role="progressbar"
            aria-valuenow={progress}
            aria-valuemin={0}
            aria-valuemax={100}
          />
        </div>

        {/* Step Content */}
        <div className={`${styles.step} ${styles[currentStepData.animation || 'fadeIn']}`}>
          <div 
            className={`${styles.icon} ${currentStepData.interactive ? styles.interactive : ''}`}
            onClick={currentStepData.interactive ? handleStepInteraction : undefined}
            role={currentStepData.interactive ? 'button' : 'presentation'}
            tabIndex={currentStepData.interactive ? 0 : -1}
          >
            {currentStepData.icon}
          </div>

          <h2 id="intro-title" className={styles.title}>
            {currentStepData.title}
          </h2>

          <p className={styles.content}>
            {currentStepData.content}
          </p>

          {currentStepData.interactive && !hasInteracted && (
            <div className={styles.interactionHint}>
              <span className={styles.tapHint}>
                {t('intro.tap_icon', 'Tippe auf das Symbol!')}
              </span>
            </div>
          )}
        </div>

        {/* Enhanced Navigation */}
        <div className={styles.navigation}>
          {/* Step Indicators */}
          <div className={styles.indicators} role="tablist">
            {steps.map((step, index) => (
              <button
                key={step.id}
                className={`${styles.indicator} ${
                  index === currentStep ? styles.active : ''
                } ${completedSteps.has(index) ? styles.completed : ''}`}
                onClick={() => goToStep(index)}
                role="tab"
                aria-selected={index === currentStep}
                aria-label={`${t('intro.step')} ${index + 1}: ${step.title}`}
              />
            ))}
          </div>

          {/* Control Buttons */}
          <div className={styles.buttons}>
            <button 
              onClick={skipIntro} 
              className={styles.skipButton}
              aria-label={t('intro.skip_aria', 'Einführung überspringen')}
            >
              {t('intro.skip', 'Überspringen')}
            </button>

            {currentStep > 0 && (
              <button 
                onClick={prevStep} 
                className={styles.prevButton}
                aria-label={t('intro.previous', 'Zurück')}
              >
                ← {t('intro.back', 'Zurück')}
              </button>
            )}

            <button 
              onClick={nextStep} 
              className={styles.nextButton}
              aria-label={
                currentStep < steps.length - 1 
                  ? t('intro.next_aria', 'Nächster Schritt') 
                  : t('intro.start_aria', 'MALLEX starten')
              }
            >
              {currentStep < steps.length - 1 
                ? `${t('intro.next', 'Weiter')} →` 
                : `${t('intro.start', 'Los geht\'s!')} 🚀`
              }
            </button>
          </div>
        </div>

        {/* Mobile Swipe Hint */}
        <div className={styles.swipeHint}>
          <span>← {t('intro.swipe', 'Wischen zum Navigieren')} →</span>
        </div>
      </div>
    </div>
  )
}