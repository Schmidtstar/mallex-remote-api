interface PerformanceMetric {
  name: string
  value: number
  timestamp: number
  context?: Record<string, any>
}

interface SessionData {
  startTime: number
  errors: any[]
  sessionId: string
}

// Global type declaration for gtag
declare global {
  interface Window {
    gtag?: (...args: any[]) => void
  }
}

class MonitoringService {
  private static metrics: PerformanceMetric[] = []
  private static errorCount = 0
  private static startTime = Date.now()
  private static session: SessionData | null = null

  // Web Vitals Tracking
  static trackWebVital(metric: { name: string; value: number; id: string }) {
    this.addMetric({
      name: metric.name,
      value: metric.value,
      timestamp: Date.now(),
      context: { id: metric.id }
    })

    // Alert if metric is poor
    const thresholds = {
      CLS: 0.1,
      FID: 100,
      LCP: 2500,
      FCP: 1800,
      TTFB: 600
    }

    const threshold = thresholds[metric.name as keyof typeof thresholds]
    if (threshold && metric.value > threshold) {
      console.warn(`⚠️ Poor ${metric.name}: ${metric.value} (threshold: ${threshold})`)
    }
  }

  // Custom Performance Tracking
  static startTimer(operation: string): () => void {
    const start = performance.now()
    return () => {
      const duration = performance.now() - start
      this.addMetric({
        name: `operation_${operation}`,
        value: duration,
        timestamp: Date.now()
      })

      if (duration > 1000) {
        console.warn(`🐌 Slow operation: ${operation} took ${duration.toFixed(2)}ms`)
      }
    }
  }

  // Initialize session
  static initSession(): void {
    this.session = {
      startTime: Date.now(),
      errors: [],
      sessionId: `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    }
  }

  // Error Tracking
  static trackError(error: any, context?: any): void {
    try {
      if (!this.session) {
        this.initSession()
      }

      // Better error message handling
      let message = 'Unknown error'
      if (typeof error === 'string') {
        message = error
      } else if (error?.message) {
        message = error.message
      } else if (error?.toString) {
        message = error.toString()
      }

      // Avoid "No default value" generic errors and provide better context
      if (message === 'No default value') {
        if (error?.stack) {
          const stackLines = error.stack.split('\n')
          const lazyLine = stackLines.find(line => line.includes('lazy') || line.includes('Lazy'))
          const componentLine = stackLines.find(line => line.includes('src/'))
          
          if (lazyLine) {
            message = 'Lazy component loading error - missing default export'
          } else if (componentLine) {
            message = `Component loading error: ${componentLine.trim()}`
          } else {
            message = 'React component initialization error'
          }
        } else {
          message = 'Component default export missing'
        }
      }

      const errorData = {
        message,
        stack: error?.stack || undefined,
        timestamp: new Date().toISOString(),
        context,
        errorCount: this.session.errors.length + 1,
        sessionDuration: Date.now() - this.session.startTime
      }

      this.session.errors.push(errorData)
      console.error('🚨 Error tracked:', errorData)

      // Optional: Send to external monitoring service
      if (typeof window !== 'undefined' && window.gtag) {
        window.gtag('event', 'exception', {
          description: errorData.message,
          fatal: false
        })
      }
    } catch (monitoringError) {
      console.error('Monitoring self-error:', monitoringError)
    }
  }

  // User Interaction Tracking
  static trackUserAction(action: string, details?: Record<string, any>) {
    if (import.meta.env.DEV) {
      console.log(`👤 User Action: ${action}`, details)
    }

    this.addMetric({
      name: `user_action_${action}`,
      value: 1,
      timestamp: Date.now(),
      context: details
    })
  }

  private static addMetric(metric: PerformanceMetric) {
    this.metrics.push(metric)
    // Keep only last 100 metrics
    if (this.metrics.length > 100) {
      this.metrics = this.metrics.slice(-100)
    }
  }

  // Get Performance Report
  static getPerformanceReport() {
    return {
      sessionDuration: Date.now() - this.startTime,
      totalErrors: this.errorCount,
      metrics: this.metrics.slice(-20), // Last 20 metrics
      memoryUsage: (performance as any).memory ? {
        used: (performance as any).memory.usedJSHeapSize,
        total: (performance as any).memory.totalJSHeapSize,
        limit: (performance as any).memory.jsHeapSizeLimit
      } : null
    }
  }
}

export { MonitoringService }

// Auto-initialize session
MonitoringService.initSession()

// Auto-initialize Web Vitals tracking
if (typeof window !== 'undefined') {
  // Track Page Load Performance
  window.addEventListener('load', () => {
    setTimeout(() => {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming
      if (navigation) {
        MonitoringService.trackWebVital({
          name: 'page_load',
          value: navigation.loadEventEnd - navigation.fetchStart,
          id: 'page_load'
        })
      }
    }, 0)
  })

  // Track Unhandled Errors
  window.addEventListener('error', (event) => {
    MonitoringService.trackError(event.error || new Error(event.message))
  })

  window.addEventListener('unhandledrejection', (event) => {
    MonitoringService.trackError(new Error(event.reason))
  })
}