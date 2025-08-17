
import React, { useState, useEffect } from 'react'
import styles from './ToastNotification.module.css'

export type ToastType = 'success' | 'error' | 'warning' | 'info'

interface Toast {
  id: string
  message: string
  type: ToastType
  duration?: number
}

interface ToastNotificationProps {
  toasts: Toast[]
  onRemove: (id: string) => void
}

export const ToastNotification: React.FC<ToastNotificationProps> = ({ toasts, onRemove }) => {
  useEffect(() => {
    toasts.forEach(toast => {
      if (toast.duration !== 0) {
        const timer = setTimeout(() => {
          onRemove(toast.id)
        }, toast.duration || 4000)
        
        return () => clearTimeout(timer)
      }
    })
  }, [toasts, onRemove])

  const getIcon = (type: ToastType) => {
    switch (type) {
      case 'success': return '✅'
      case 'error': return '❌'
      case 'warning': return '⚠️'
      case 'info': return 'ℹ️'
      default: return '📢'
    }
  }

  return (
    <div className={styles.toastContainer}>
      {toasts.map(toast => (
        <div
          key={toast.id}
          className={`${styles.toast} ${styles[toast.type]}`}
          onClick={() => onRemove(toast.id)}
        >
          <span className={styles.icon}>{getIcon(toast.type)}</span>
          <span className={styles.message}>{toast.message}</span>
          <button className={styles.closeButton} onClick={() => onRemove(toast.id)}>
            ×
          </button>
        </div>
      ))}
    </div>
  )
}

// Toast Manager Hook
export const useToast = () => {
  const [toasts, setToasts] = useState<Toast[]>([])

  const addToast = (message: string, type: ToastType = 'info', duration = 4000) => {
    const id = `toast_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    const toast: Toast = { id, message, type, duration }
    
    setToasts(prev => [...prev, toast])
    
    console.log(`🍞 Toast ${type}: ${message}`)
    return id
  }

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }

  const success = (message: string) => addToast(message, 'success')
  const error = (message: string) => addToast(message, 'error', 6000)
  const warning = (message: string) => addToast(message, 'warning', 5000)
  const info = (message: string) => addToast(message, 'info')

  return {
    toasts,
    addToast,
    removeToast,
    success,
    error,
    warning,
    info
  }
}
