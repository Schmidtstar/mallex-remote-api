interface ErrorInfo {
  message: string
  stack?: string
  context?: any
  timestamp?: string
  errorCount?: number
}

interface UserAction {
  action: string
  metadata?: Record<string, any>
  timestamp?: number
}

class MonitoringServiceClass {
  private errorCount = 0
  private actionCount = 0
  private isInitialized = false

  init() {
    try {
      this.isInitialized = true
      console.log('🔍 Monitoring Service initialized')
    } catch (error) {
      console.warn('Monitoring Service initialization failed:', error)
    }
  }

  trackError(errorInfo: ErrorInfo | string, context?: any) {
    if (!this.isInitialized) {
      console.warn('Monitoring not initialized, logging error anyway:', errorInfo)
    }

    this.errorCount++
    
    const enrichedError = typeof errorInfo === 'string' 
      ? { message: errorInfo, context, timestamp: new Date().toISOString(), errorCount: this.errorCount }
      : { ...errorInfo, timestamp: new Date().toISOString(), errorCount: this.errorCount }

    console.error('🚨 Error tracked:', enrichedError)

    // Track in performance monitor if available
    try {
      const { performanceMonitor } = require('./performance-monitor')
      performanceMonitor?.trackError?.(enrichedError)
    } catch (e) {
      // Silently fail if performance monitor not available
    }
  }

  trackUserAction(action: string | UserAction, metadata?: Record<string, any>) {
    if (!this.isInitialized) {
      console.warn('Monitoring not initialized, logging action anyway:', action)
    }

    this.actionCount++
    
    const actionData = typeof action === 'string' 
      ? { action, metadata, timestamp: Date.now() }
      : { ...action, timestamp: action.timestamp || Date.now() }

    // Only log important actions in development to reduce noise
    if (import.meta.env.DEV && (action.toString().includes('error') || action.toString().includes('critical'))) {
      console.log('📊 Critical action tracked:', actionData)
    }

    // Track in performance monitor if available
    try {
      const { performanceMonitor } = require('./performance-monitor')
      performanceMonitor?.trackUserAction?.(actionData)
    } catch (e) {
      // Silently fail if performance monitor not available
    }
  }

  getErrorCount() {
    return this.errorCount
  }

  getActionCount() {
    return this.actionCount
  }

  getPerformanceReport() {
    return {
      errors: this.errorCount,
      actions: this.actionCount,
      initialized: this.isInitialized,
      timestamp: new Date().toISOString()
    }
  }

  reset() {
    this.errorCount = 0
    this.actionCount = 0
  }
}

// Export singleton instance
export const MonitoringService = new MonitoringServiceClass()
export default MonitoringService

// Initialize immediately
MonitoringService.init()

// Global error tracking
if (typeof window !== 'undefined') {
  window.addEventListener('error', (event) => {
    MonitoringService.trackError({
      message: event.error?.message || event.message,
      stack: event.error?.stack,
      context: { filename: event.filename, lineno: event.lineno, colno: event.colno }
    })
  })

  window.addEventListener('unhandledrejection', (event) => {
    MonitoringService.trackError({
      message: event.reason?.message || String(event.reason),
      stack: event.reason?.stack,
      context: { type: 'unhandledrejection' }
    })
  })
}