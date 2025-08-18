interface ErrorInfo {
  message: string
  stack?: string
  context?: any
  timestamp?: string
  errorCount?: number
}

class MonitoringServiceClass {
  private errorCount = 0
  private isInitialized = false

  init() {
    try {
      this.isInitialized = true
      console.log('🔍 Monitoring Service initialized')
    } catch (error) {
      console.warn('Monitoring Service initialization failed:', error)
    }
  }

  trackError(errorInfo: ErrorInfo) {
    if (!this.isInitialized) {
      console.warn('Monitoring not initialized, logging error anyway:', errorInfo)
    }

    this.errorCount++
    const enrichedError = {
      ...errorInfo,
      timestamp: new Date().toISOString(),
      errorCount: this.errorCount
    }

    console.error('🚨 Error tracked:', enrichedError)

    // Track in performance monitor if available
    try {
      const { performanceMonitor } = require('./performance-monitor')
      performanceMonitor?.trackError?.(enrichedError)
    } catch (e) {
      // Silently fail if performance monitor not available
    }
  }

  getErrorCount() {
    return this.errorCount
  }

  reset() {
    this.errorCount = 0
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