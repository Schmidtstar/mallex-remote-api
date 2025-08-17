
interface PerformanceMetric {
  name: string
  value: number
  timestamp: number
  context?: Record<string, any>
}

class MonitoringService {
  private static metrics: PerformanceMetric[] = []
  private static errorCount = 0
  private static startTime = Date.now()
  
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
  
  // Error Tracking
  static trackError(error: Error, context?: Record<string, any>) {
    this.errorCount++
    
    const errorData = {
      message: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString(),
      context,
      errorCount: this.errorCount,
      sessionDuration: Date.now() - this.startTime
    }
    
    if (import.meta.env.DEV) {
      console.error('🚨 Error tracked:', errorData)
    }
    
    // Store in localStorage for offline analysis
    try {
      const stored = JSON.parse(localStorage.getItem('mallex_errors') || '[]')
      stored.push(errorData)
      // Keep only last 50 errors
      const limited = stored.slice(-50)
      localStorage.setItem('mallex_errors', JSON.stringify(limited))
    } catch (e) {
      console.warn('Failed to store error data')
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
