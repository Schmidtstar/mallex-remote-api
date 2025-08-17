
import React, { useState, useEffect } from 'react'
import { Achievement, NotificationData } from '../lib/achievement-system'
import s from './AchievementNotification.module.css'

interface AchievementNotificationProps {
  notification: NotificationData | null
  onClose: () => void
}

export const AchievementNotification: React.FC<AchievementNotificationProps> = ({
  notification,
  onClose
}) => {
  const [isVisible, setIsVisible] = useState(false)
  const [isAnimating, setIsAnimating] = useState(false)

  useEffect(() => {
    if (notification) {
      setIsVisible(true)
      setIsAnimating(true)

      // Auto-close nach 4 Sekunden
      const timer = setTimeout(() => {
        handleClose()
      }, 4000)

      return () => clearTimeout(timer)
    }
  }, [notification])

  const handleClose = () => {
    setIsAnimating(false)
    setTimeout(() => {
      setIsVisible(false)
      onClose()
    }, 300)
  }

  if (!isVisible || !notification) return null

  return (
    <div className={`${s.overlay} ${isAnimating ? s.show : s.hide}`}>
      <div className={`${s.notification} ${s[notification.type]}`}>
        <div className={s.header}>
          <div className={s.icon}>{notification.icon}</div>
          <h3 className={s.title}>{notification.title}</h3>
          <button className={s.closeBtn} onClick={handleClose}>×</button>
        </div>

        <div className={s.content}>
          <div className={s.message}>{notification.message}</div>
          
          {notification.points && (
            <div className={s.points}>
              +{notification.points} Punkte 🏆
            </div>
          )}
        </div>

        {notification.showAnimation && (
          <div className={s.celebration}>
            <div className={s.confetti}>🎉</div>
            <div className={s.sparks}>✨</div>
          </div>
        )}

        <div className={s.progress}>
          <div className={s.progressBar}></div>
        </div>
      </div>
    </div>
  )
}

export default AchievementNotification
