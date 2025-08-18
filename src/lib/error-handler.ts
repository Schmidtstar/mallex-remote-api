// MALLEX Critical Error Handler
import { MonitoringService } from './monitoring'

export interface ErrorContext {
  userId?: string
  action?: string
  component?: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  metadata?: Record<string, any>
}

export interface ErrorRecovery {
  canRecover: boolean
  recoveryAction?: () => Promise<void>
  fallbackUI?: React.ComponentType
  userMessage?: string
}

export class CriticalErrorHandler {
  private static errorQueue: Array<{ error: Error; context: ErrorContext; timestamp: number }> = []
  private static maxQueueSize = 50
  private static isOnline = navigator.onLine

  static init() {
    // Global error handlers
    window.addEventListener('error', this.handleGlobalError.bind(this))
    window.addEventListener('unhandledrejection', this.handleUnhandledRejection.bind(this))

    // Network status monitoring
    window.addEventListener('online', () => {
      this.isOnline = true
      this.processErrorQueue()
    })

    window.addEventListener('offline', () => {
      this.isOnline = false
    })

    console.log('🛡️ Critical Error Handler initialized')
  }

  static async handleError(error: Error, context: ErrorContext): Promise<ErrorRecovery> {
    const errorEntry = {
      error,
      context,
      timestamp: Date.now()
    }

    // Add to queue
    this.addToQueue(errorEntry)

    // Log to console (development)
    if (import.meta.env.DEV) {
      console.error(`🚨 ${context.severity.toUpperCase()} ERROR:`, {
        message: error.message,
        stack: error.stack,
        context
      })
    }

    // Send to monitoring (if online)
    if (this.isOnline) {
      try {
        await MonitoringService.trackError(error, context)
      } catch (monitoringError) {
        console.warn('Failed to track error:', monitoringError)
      }
    }

    // Determine recovery strategy
    return this.determineRecovery(error, context)
  }

  private static addToQueue(errorEntry: any) {
    this.errorQueue.push(errorEntry)

    // Maintain queue size
    if (this.errorQueue.length > this.maxQueueSize) {
      this.errorQueue.shift()
    }
  }

  private static async processErrorQueue() {
    if (!this.isOnline || this.errorQueue.length === 0) return

    const queueCopy = [...this.errorQueue]
    this.errorQueue = []

    for (const entry of queueCopy) {
      try {
        await MonitoringService.trackError(entry.error, entry.context)
      } catch (error) {
        // Re-add to queue if failed
        this.errorQueue.push(entry)
      }
    }
  }

  private static determineRecovery(error: Error, context: ErrorContext): ErrorRecovery {
    // Firebase connection errors
    if (error.message.includes('Firebase') || error.message.includes('firestore')) {
      return {
        canRecover: true,
        recoveryAction: async () => {
          const { FirebaseRetry } = await import('./firebase-retry')
          return FirebaseRetry.reconnect()
        },
        userMessage: '🔄 Verbindung wird wiederhergestellt...'
      }
    }

    // Network errors
    if (!navigator.onLine || error.message.includes('fetch')) {
      return {
        canRecover: true,
        recoveryAction: async () => {
          // Wait for network + retry
          await new Promise(resolve => {
            const checkOnline = () => {
              if (navigator.onLine) {
                resolve(void 0)
              } else {
                setTimeout(checkOnline, 1000)
              }
            }
            checkOnline()
          })
        },
        userMessage: '📶 Warte auf Internetverbindung...'
      }
    }

    // i18n errors
    if (error.message.includes('i18next') || error.message.includes('changeLanguage')) {
      return {
        canRecover: true,
        recoveryAction: async () => {
          // Reload i18n
          try {
            const { default: i18n } = await import('../i18n')
            await i18n.init()
          } catch (e) {
            console.warn('i18n recovery failed:', e)
          }
        },
        userMessage: '🌍 Sprach-System wird neu geladen...'
      }
    }

    // Sound system errors  
    if (error.message.includes('Decoding failed') || error.message.includes('sound')) {
      return {
        canRecover: true,
        recoveryAction: async () => {
          // Try to reinitialize sound system
          try {
            const { SoundManager } = await import('./sound-manager')
            await SoundManager.init()
          } catch (e) {
            console.warn('Sound system recovery failed (non-critical):', e)
          }
        },
        userMessage: '🔊 Audio-System wird repariert...'
      }
    }

    // Authentication errors
    if (error.message.includes('auth') || context.action?.includes('auth')) {
      return {
        canRecover: true,
        recoveryAction: async () => {
          localStorage.removeItem('mallex-auth-token')
          window.location.href = '/auth'
        },
        userMessage: '🔐 Bitte melde dich erneut an'
      }
    }

    // Memory/Performance errors
    if (error.message.includes('memory') || error.name === 'QuotaExceededError') {
      return {
        canRecover: true,
        recoveryAction: async () => {
          // Clear caches
          if ('caches' in window) {
            const cacheNames = await caches.keys()
            await Promise.all(cacheNames.map(name => caches.delete(name)))
          }

          // Clear localStorage of non-essential data
          const keysToKeep = ['mallex-auth-token', 'mallex-user-preferences']
          Object.keys(localStorage).forEach(key => {
            if (!keysToKeep.includes(key)) {
              localStorage.removeItem(key)
            }
          })
        },
        userMessage: '🧹 Speicher wird aufgeräumt...'
      }
    }

    // Critical errors - no recovery
    if (context.severity === 'critical') {
      return {
        canRecover: false,
        userMessage: '💥 Ein kritischer Fehler ist aufgetreten. Die App wird neu geladen...',
        recoveryAction: async () => {
          setTimeout(() => window.location.reload(), 3000)
        }
      }
    }

    // Generic recovery
    return {
      canRecover: true,
      userMessage: '⚠️ Ein Fehler ist aufgetreten. Vorgang wird wiederholt...'
    }
  }

  private static handleGlobalError(event: ErrorEvent) {
    this.handleError(new Error(event.message), {
      severity: 'high',
      component: 'global',
      action: 'window_error',
      metadata: {
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno
      }
    })
  }

  private static handleUnhandledRejection(event: PromiseRejectionEvent) {
    const error = event.reason instanceof Error ? event.reason : new Error(String(event.reason))

    this.handleError(error, {
      severity: 'high',
      component: 'global',
      action: 'unhandled_promise_rejection'
    })
  }

  // Get error statistics for admin dashboard
  static getErrorStats() {
    const now = Date.now()
    const last24h = this.errorQueue.filter(e => now - e.timestamp < 24 * 60 * 60 * 1000)

    return {
      total: this.errorQueue.length,
      last24h: last24h.length,
      bySeverity: {
        critical: last24h.filter(e => e.context.severity === 'critical').length,
        high: last24h.filter(e => e.context.severity === 'high').length,
        medium: last24h.filter(e => e.context.severity === 'medium').length,
        low: last24h.filter(e => e.context.severity === 'low').length
      },
      byComponent: this.groupBy(last24h, e => e.context.component || 'unknown')
    }
  }

  private static groupBy<T>(array: T[], keyFn: (item: T) => string) {
    return array.reduce((groups, item) => {
      const key = keyFn(item)
      groups[key] = (groups[key] || 0) + 1
      return groups
    }, {} as Record<string, number>)
  }
}

// React Error Boundary Hook
export function useErrorHandler() {
  return {
    handleError: (error: Error, context: Partial<ErrorContext> = {}) => {
      return CriticalErrorHandler.handleError(error, {
        severity: 'medium',
        ...context
      })
    },

    withErrorHandling: <T extends any[], R>(
      fn: (...args: T) => Promise<R>,
      context: Partial<ErrorContext> = {}
    ) => {
      return async (...args: T): Promise<R> => {
        try {
          return await fn(...args)
        } catch (error) {
          const recovery = await CriticalErrorHandler.handleError(
            error instanceof Error ? error : new Error(String(error)),
            { severity: 'medium', ...context }
          )

          if (recovery.canRecover && recovery.recoveryAction) {
            await recovery.recoveryAction()
            // Retry once
            return await fn(...args)
          }

          throw error
        }
      }
    }
  }
}