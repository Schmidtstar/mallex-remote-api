
interface PerformanceEntry {
  name: string
  startTime: number
  duration: number
  entryType: string
}

interface ErrorInfo {
  message: string
  stack?: string
  componentStack?: string
  errorId?: string
}

class PerformanceMonitor {
  private metrics: Map<string, number[]> = new Map()
  private isInitialized = false

  constructor() {
    this.init()
  }

  init() {
    try {
      this.setupResourceTiming()
      this.isInitialized = true
      console.log('📊 Performance Monitor v2.0 initialized')
    } catch (error) {
      console.warn('Performance Monitor initialization failed:', error)
    }
  }

  setupResourceTiming() {
    if ('PerformanceObserver' in window) {
      try {
        const observer = new PerformanceObserver((list) => {
          list.getEntries().forEach((entry) => {
            // Only track slow resources (>200ms) to reduce noise
            if (entry.duration > 200) {
              this.trackMetric(`slow-resource-${entry.name.split('/').pop()}`, entry.duration)
            }
          })
        })
        observer.observe({ entryTypes: ['resource'] })
      } catch (error) {
        console.warn('Could not setup resource timing:', error)
      }
    }
  }

  trackError(errorInfo: ErrorInfo) {
    if (!this.isInitialized) return
    
    try {
      console.error('📊 Performance Monitor tracked error:', errorInfo)
      // Store error metrics
      this.trackMetric('errors', 1)
    } catch (error) {
      console.warn('Could not track error in performance monitor:', error)
    }
  }

  trackMetric(name: string, value: number) {
    if (!this.isInitialized) return
    
    try {
      if (!this.metrics.has(name)) {
        this.metrics.set(name, [])
      }
      this.metrics.get(name)?.push(value)
      
      // Reduce console spam - only log significant metrics or errors
      if (import.meta.env.DEV && (value > 100 || name.includes('error'))) {
        console.log(`📊 Performance Alert ${name}: ${value}ms`)
      }
    } catch (error) {
      console.warn('Could not track metric:', error)
    }
  }

  getMetrics() {
    return Object.fromEntries(this.metrics)
  }

  clearMetrics() {
    this.metrics.clear()
  }
}

// Export singleton instance
export const performanceMonitor = new PerformanceMonitor()
export default performanceMonitor

// Global access for debugging
if (typeof window !== 'undefined') {
  (window as any).MALLEX_PERFORMANCE = performanceMonitor
}
