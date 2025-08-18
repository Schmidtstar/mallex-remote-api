import React from 'react'
import styles from './EnhancedLoadingSpinner.module.css'

interface LoadingSpinnerProps {
  message?: string
  size?: 'small' | 'medium' | 'large'
  variant?: 'default' | 'arena' | 'achievements' | 'minimal' | 'auth' | 'legends' | 'leaderboard' | 'tasks' | 'suggest' | 'admin' | 'general' | 'startup'
}

export const EnhancedLoadingSpinner: React.FC<LoadingSpinnerProps> = ({ 
  message = 'Laden...', 
  size = 'medium',
  variant = 'default'
}) => {
  const variantMessages = {
  auth: 'Anmeldung wird verarbeitet...',
  arena: 'Arena wird geladen...',
  legends: 'Legenden werden geladen...',
  leaderboard: 'Rangliste wird aktualisiert...',
  tasks: 'Aufgaben werden geladen...',
  suggest: 'Vorschläge werden verarbeitet...',
  admin: 'Admin-Bereich wird geladen...',
  general: 'Wird geladen...',
  startup: 'MALLEX wird initialisiert...'
}

  const getIcon = () => {
    switch (variant) {
      case 'arena': return '⚔️'
      case 'achievements': return '🏆'
      case 'minimal': return '⚡'
      case 'auth': return '🔒'
      case 'legends': return '✨'
      case 'leaderboard': return '👑'
      case 'tasks': return '✅'
      case 'suggest': return '💡'
      case 'admin': return '⚙️'
      case 'general': return '⏳'
      case 'startup': return '🏛️'
      default: return '🏛️'
    }
  }

  const getLoadingText = () => {
    switch (variant) {
      case 'arena': return 'Arena wird vorbereitet...'
      case 'achievements': return 'Erfolge werden geladen...'
      case 'minimal': return 'Laden...'
      case 'auth': return variantMessages.auth
      case 'legends': return variantMessages.legends
      case 'leaderboard': return variantMessages.leaderboard
      case 'tasks': return variantMessages.tasks
      case 'suggest': return variantMessages.suggest
      case 'admin': return variantMessages.admin
      case 'general': return variantMessages.general
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