
import React from 'react'
import styles from './EnhancedLoadingSpinner.module.css'

interface LoadingSpinnerProps {
  message?: string
  size?: 'small' | 'medium' | 'large'
  variant?: 'default' | 'arena' | 'achievements' | 'minimal'
}

export const EnhancedLoadingSpinner: React.FC<LoadingSpinnerProps> = ({ 
  message = 'Laden...', 
  size = 'medium',
  variant = 'default'
}) => {
  const getIcon = () => {
    switch (variant) {
      case 'arena': return '⚔️'
      case 'achievements': return '🏆'
      case 'minimal': return '⚡'
      default: return '🏛️'
    }
  }

  const getLoadingText = () => {
    switch (variant) {
      case 'arena': return 'Arena wird vorbereitet...'
      case 'achievements': return 'Erfolge werden geladen...'
      case 'minimal': return 'Laden...'
      default: return message
    }
  }

  return (
    <div className={`${styles.container} ${styles[size]} ${styles[variant]}`}>
      <div className={styles.iconContainer}>
        <div className={styles.icon}>
          {getIcon()}
        </div>
        <div className={styles.spinner}></div>
      </div>
      <div className={styles.message}>
        {getLoadingText()}
      </div>
      {variant === 'arena' && (
        <div className={styles.subMessage}>
          Die Götter bereiten deine Herausforderung vor...
        </div>
      )}
    </div>
  )
}
