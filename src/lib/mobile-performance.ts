
export class MobilePerformanceOptimizer {
  private static isInitialized = false
  private static performanceMetrics = new Map<string, number[]>()

  static async init() {
    if (this.isInitialized) return
    
    console.log('🚀 Initializing Mobile Performance Optimizer...')
    
    // Viewport-optimierte Konfiguration
    this.setupViewport()
    
    // Touch-optimierte Interaktionen
    this.optimizeTouchEvents()
    
    // Memory-Management für Mobile
    this.setupMemoryManagement()
    
    // Battery-Optimization
    this.optimizeBatteryUsage()
    
    // Performance-Tracking initialisieren
    this.initPerformanceTracking()
    
    this.isInitialized = true
    console.log('✅ Mobile Performance Optimizer initialized')
  }

  private static initPerformanceTracking() {
    // Track App Start Performance
    const startTime = performance.now()
    
    window.addEventListener('load', () => {
      const loadTime = performance.now() - startTime
      this.trackMetric('app_load_time', loadTime)
      
      if (loadTime > 3000) {
        console.warn('🐌 Slow app load detected:', `${Math.round(loadTime)}ms`)
      } else {
        console.log('⚡ Fast app load:', `${Math.round(loadTime)}ms`)
      }
    })

    // Track Navigation Performance
    if ('navigation' in performance) {
      const navTiming = (performance as any).navigation
      if (navTiming.type === 1) { // Reload
        console.log('🔄 App was reloaded')
      } else if (navTiming.type === 2) { // Back/Forward
        console.log('⬅️ Navigation via back/forward')
      }
    }
  }

  static trackMetric(name: string, value: number) {
    if (!this.performanceMetrics.has(name)) {
      this.performanceMetrics.set(name, [])
    }
    
    this.performanceMetrics.get(name)!.push(value)
    
    // Keep only last 10 measurements
    const metrics = this.performanceMetrics.get(name)!
    if (metrics.length > 10) {
      this.performanceMetrics.set(name, metrics.slice(-10))
    }
  }

  static getMetrics() {
    const summary: any = {}
    
    for (const [name, values] of this.performanceMetrics.entries()) {
      summary[name] = {
        latest: values[values.length - 1],
        average: values.reduce((a, b) => a + b, 0) / values.length,
        min: Math.min(...values),
        max: Math.max(...values),
        count: values.length
      }
    }
    
    return summary
  }

  private static setupViewport() {
    const viewport = document.querySelector('meta[name="viewport"]')
    if (viewport) {
      viewport.setAttribute('content', 
        'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover'
      )
    }
  }

  private static optimizeTouchEvents() {
    // Passive Touch-Events für bessere Performance
    document.addEventListener('touchstart', () => {}, { passive: true })
    document.addEventListener('touchmove', () => {}, { passive: true })
    
    // Fast-Tap für bessere Responsiveness
    document.body.style.touchAction = 'manipulation'
  }

  private static setupMemoryManagement() {
    // Memory-Pressure Events überwachen
    if ('memory' in performance) {
      const memory = (performance as any).memory
      
      const checkMemory = () => {
        const memoryUsage = memory.usedJSHeapSize / memory.jsHeapSizeLimit
        
        if (memoryUsage > 0.8) {
          console.warn('🚨 High memory usage detected:', `${Math.round(memoryUsage * 100)}%`)
          this.triggerGarbageCollection()
        }
      }
      
      setInterval(checkMemory, 30000) // Check every 30 seconds
    }
  }

  private static triggerGarbageCollection() {
    // Cleanup-Operationen
    if (window.gc) {
      window.gc()
    }
  }

  private static optimizeBatteryUsage() {
    // Reduce animations on low battery
    if ('getBattery' in navigator) {
      (navigator as any).getBattery().then((battery: any) => {
        const handleBatteryChange = () => {
          if (battery.level < 0.2) {
            document.body.classList.add('low-battery-mode')
            console.log('🔋 Low battery mode activated')
          } else {
            document.body.classList.remove('low-battery-mode')
          }
        }
        
        battery.addEventListener('levelchange', handleBatteryChange)
        handleBatteryChange()
      })
    }
  }
}
