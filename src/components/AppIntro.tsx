
import React, { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import styles from './AppIntro.module.css'

// Move constants outside component to avoid TDZ
const INTRO_STEPS = [
  'welcome',
  'features', 
  'navigation',
  'ready'
] as const

const ANIMATION_DURATION = 300

export function AppIntro() {
  const { t } = useTranslation()
  const [currentStep, setCurrentStep] = useState(0)
  const [isVisible, setIsVisible] = useState(true)
  const [isAnimating, setIsAnimating] = useState(false)

  useEffect(() => {
    // Auto-advance steps
    const timer = setTimeout(() => {
      if (currentStep < INTRO_STEPS.length - 1) {
        handleNext()
      }
    }, 3000)

    return () => clearTimeout(timer)
  }, [currentStep])

  const handleNext = () => {
    if (isAnimating) return
    
    setIsAnimating(true)
    
    setTimeout(() => {
      setCurrentStep(prev => Math.min(prev + 1, INTRO_STEPS.length - 1))
      setIsAnimating(false)
    }, ANIMATION_DURATION)
  }

  const handlePrevious = () => {
    if (isAnimating) return
    
    setIsAnimating(true)
    
    setTimeout(() => {
      setCurrentStep(prev => Math.max(prev - 1, 0))
      setIsAnimating(false)
    }, ANIMATION_DURATION)
  }

  const handleSkip = () => {
    setIsVisible(false)
  }

  if (!isVisible) {
    return null
  }

  const currentStepKey = INTRO_STEPS[currentStep]

  return (
    <div className={styles.overlay}>
      <div className={styles.container}>
        <div className={styles.content}>
          <h2 className={styles.title}>
            {t(`intro.${currentStepKey}.title`)}
          </h2>
          <p className={styles.description}>
            {t(`intro.${currentStepKey}.description`)}
          </p>
        </div>

        <div className={styles.navigation}>
          <button 
            className={styles.button}
            onClick={handlePrevious}
            disabled={currentStep === 0 || isAnimating}
          >
            {t('intro.previous')}
          </button>
          
          <div className={styles.indicators}>
            {INTRO_STEPS.map((_, index) => (
              <div
                key={index}
                className={`${styles.indicator} ${
                  index === currentStep ? styles.active : ''
                }`}
              />
            ))}
          </div>

          <button 
            className={styles.button}
            onClick={currentStep === INTRO_STEPS.length - 1 ? handleSkip : handleNext}
            disabled={isAnimating}
          >
            {currentStep === INTRO_STEPS.length - 1 
              ? t('intro.start') 
              : t('intro.next')
            }
          </button>
        </div>

        <button 
          className={styles.skipButton}
          onClick={handleSkip}
        >
          {t('intro.skip')}
        </button>
      </div>
    </div>
  )
}

export default AppIntro
