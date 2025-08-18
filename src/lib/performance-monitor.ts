export class PerformanceMonitor {
  private static instance: PerformanceMonitor | null = null
  private metrics: Map<string, number[]> = new Map()

  constructor() {
    if (PerformanceMonitor.instance) {
      return PerformanceMonitor.instance
    }
    PerformanceMonitor.instance = this
  }

  static getInstance(): PerformanceMonitor {
    if (!this.instance) {
      this.instance = new PerformanceMonitor()
    }
    return this.instance
  }

  trackMetric(name: string, value: number): void {
    if (!this.metrics.has(name)) {
      this.metrics.set(name, [])
    }

    const values = this.metrics.get(name)!
    values.push(value)

    // Keep only last 100 measurements
    if (values.length > 100) {
      values.shift()
    }

    // Log significant performance issues
    if (name === 'LCP' && value > 2500) {
      console.warn(`⚠️ Poor LCP: ${value}ms`)
    } else if (name === 'FID' && value > 100) {
      console.warn(`⚠️ Poor FID: ${value}ms`)
    } else if (name === 'CLS' && value > 0.25) {
      console.warn(`⚠️ Poor CLS: ${value}`)
    }
  }

  getMetrics(): Record<string, number[]> {
    const result: Record<string, number[]> = {}
    this.metrics.forEach((values, key) => {
      result[key] = [...values]
    })
    return result
  }

  getAverageMetric(name: string): number {
    const values = this.metrics.get(name)
    if (!values || values.length === 0) return 0

    return values.reduce((sum, val) => sum + val, 0) / values.length
  }

  clearMetrics(): void {
    this.metrics.clear()
  }
}

// Export singleton instance
export const performanceMonitor = PerformanceMonitor.getInstance()

// Global access for debugging
if (typeof window !== 'undefined') {
  (window as any).MALLEX_PERFORMANCE = performanceMonitor
}