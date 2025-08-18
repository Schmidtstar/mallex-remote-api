interface PerformanceMetric {
  name: string;
  value: number;
  timestamp: number;
  type: string; // e.g., 'web-vital', 'memory', 'animation', 'interaction', 'resource', 'navigation'
  metadata?: any;
}

interface WebVitalMetric {
  name: string;
  value: number;
  delta: number;
  id: string;
}

export default class PerformanceMonitor {
  private static metrics: PerformanceMetric[] = []
  private static isEnabled = true
  private static alertThresholds = {
    LCP: 2500,    // Largest Contentful Paint
    FID: 100,     // First Input Delay
    CLS: 0.1,     // Cumulative Layout Shift
    FCP: 1800,    // First Contentful Paint
    TTFB: 800     // Time to First Byte
  }

  static init() {
    if (typeof window === 'undefined') return

    console.log('📊 Performance Monitor v2.0 initialized')
    this.setupWebVitals()
    this.setupResourceTiming()
    this.setupNavigationTiming()
    this.setupMemoryMonitoring()
    this.setupFrameRateMonitoring()
    this.setupUserInteractionMetrics()
    this.startPeriodicReporting()
  }

  // Enhanced Web Vitals mit Real-Time Alerts
  private static setupWebVitals() {
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        const metric: PerformanceMetric = {
          name: entry.name,
          value: entry.value || entry.duration,
          timestamp: Date.now(),
          type: 'web-vital'
        }

        this.addMetric(metric)
        this.checkPerformanceAlert(metric)
      }
    })

    try {
      observer.observe({ entryTypes: ['largest-contentful-paint', 'first-input', 'layout-shift'] })
    } catch (error) {
      console.warn('Web Vitals observer not supported:', error)
    }
  }

  // Memory-Überwachung für Mobile-Optimierung
  private static setupMemoryMonitoring() {
    if ('memory' in performance) {
      setInterval(() => {
        const memory = (performance as any).memory
        const memoryMetric: PerformanceMetric = {
          name: 'memory-usage',
          value: memory.usedJSHeapSize,
          timestamp: Date.now(),
          type: 'memory',
          metadata: {
            total: memory.totalJSHeapSize,
            limit: memory.jsHeapSizeLimit,
            percentage: (memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100
          }
        }

        this.addMetric(memoryMetric)

        // Memory-Warning bei > 80%
        if (memoryMetric.metadata.percentage > 80) {
          console.warn('🚨 High memory usage:', `${Math.round(memoryMetric.metadata.percentage)}%`)
          this.triggerPerformanceOptimization('memory')
        }
      }, 15000) // Check every 15 seconds
    }
  }

  // Frame Rate Monitoring für flüssige Animationen
  private static setupFrameRateMonitoring() {
    let lastTime = performance.now()
    let frameCount = 0
    const targetFPS = 60

    const measureFrameRate = () => {
      frameCount++
      const currentTime = performance.now()
      const elapsed = currentTime - lastTime

      if (elapsed >= 1000) { // Measure every second
        const fps = Math.round((frameCount * 1000) / elapsed)

        const fpsMetric: PerformanceMetric = {
          name: 'frame-rate',
          value: fps,
          timestamp: Date.now(),
          type: 'animation'
        }

        this.addMetric(fpsMetric)

        if (fps < targetFPS * 0.8) { // Below 48 FPS
          console.warn('🎭 Low frame rate detected:', `${fps} FPS`)
        }

        frameCount = 0
        lastTime = currentTime
      }

      requestAnimationFrame(measureFrameRate)
    }

    requestAnimationFrame(measureFrameRate)
  }

  // User Interaction Metriken
  private static setupUserInteractionMetrics() {
    let clickStartTime: number

    document.addEventListener('mousedown', () => {
      clickStartTime = performance.now()
    })

    document.addEventListener('mouseup', () => {
      if (clickStartTime) {
        const responseTime = performance.now() - clickStartTime

        const interactionMetric: PerformanceMetric = {
          name: 'click-response',
          value: responseTime,
          timestamp: Date.now(),
          type: 'interaction'
        }

        this.addMetric(interactionMetric)

        if (responseTime > 100) {
          console.warn('🖱️ Slow click response:', `${Math.round(responseTime)}ms`)
        }
      }
    })
  }

  // Performance-Alert System
  private static checkPerformanceAlert(metric: PerformanceMetric) {
    const threshold = this.alertThresholds[metric.name as keyof typeof this.alertThresholds]

    if (threshold && metric.value > threshold) {
      console.warn(`🚨 Performance Alert: ${metric.name} exceeded threshold`)
      console.warn(`Value: ${Math.round(metric.value)}ms, Threshold: ${threshold}ms`)

      // Trigger automatic optimization
      this.triggerPerformanceOptimization(metric.name)
    }
  }

  // Automatische Performance-Optimierung
  private static triggerPerformanceOptimization(metricName: string) {
    switch (metricName) {
      case 'memory':
        // Trigger garbage collection hint
        if (window.gc) window.gc()
        break

      case 'largest-contentful-paint':
        // Lazy load non-critical resources
        this.optimizeLazyLoading()
        break

      case 'frame-rate':
        // Reduce animation complexity
        document.body.classList.add('reduced-motion')
        break
    }
  }

  private static optimizeLazyLoading() {
    // Implementierung der Lazy Loading Optimierung
    const images = document.querySelectorAll('img[loading="lazy"]')
    images.forEach(img => {
      if (!img.hasAttribute('data-optimized')) {
        img.setAttribute('data-optimized', 'true')
      }
    })
  }

  // Periodische Berichte
  private static startPeriodicReporting() {
    setInterval(() => {
      this.generatePerformanceReport()
    }, 60000) // Every minute
  }

  private static generatePerformanceReport() {
    if (this.metrics.length === 0) return

    const recentMetrics = this.metrics.filter(m => 
      Date.now() - m.timestamp < 60000 // Last minute
    )

    const report = {
      timestamp: Date.now(),
      metrics: recentMetrics.length,
      avgResponseTime: this.calculateAverageByType(recentMetrics, 'interaction'),
      memoryUsage: this.getLatestMetricByName(recentMetrics, 'memory-usage'),
      frameRate: this.getLatestMetricByName(recentMetrics, 'frame-rate'),
      webVitals: {
        LCP: this.getLatestMetricByName(recentMetrics, 'largest-contentful-paint'),
        FID: this.getLatestMetricByName(recentMetrics, 'first-input'),
        CLS: this.getLatestMetricByName(recentMetrics, 'layout-shift')
      }
    }

    console.log('📊 Performance Report:', report)

    // Optional: Send to analytics
    this.sendToAnalytics(report)
  }

  private static calculateAverageByType(metrics: PerformanceMetric[], type: string): number {
    const typeMetrics = metrics.filter(m => m.type === type)
    if (typeMetrics.length === 0) return 0

    const sum = typeMetrics.reduce((acc, m) => acc + m.value, 0)
    return Math.round(sum / typeMetrics.length)
  }

  private static getLatestMetricByName(metrics: PerformanceMetric[], name: string): number | null {
    const metric = metrics
      .filter(m => m.name === name)
      .sort((a, b) => b.timestamp - a.timestamp)[0]

    return metric ? metric.value : null
  }

  private static sendToAnalytics(report: any) {
    // Integration with Firebase Analytics oder anderer Service
    if (import.meta.env.DEV) return

    // Hier würde die Übertragung an Analytics-Service stattfinden
  }

  // Existing methods from original code (kept for completeness, assuming they are still relevant)
  private static observers = new Map<string, PerformanceObserver>()
  private static serviceWorkerMetrics = new Map<string, any[]>()

  static initBasicMonitoring() {
    // Basic performance monitoring without web-vitals
    window.addEventListener('load', () => {
      const loadTime = performance.now();
      this.trackMetric({
        name: 'page_load_time',
        value: loadTime,
        timestamp: Date.now()
      });
    });

    // Monitor navigation timing
    if (performance.navigation) {
      const navTiming = performance.timing;
      const loadTime = navTiming.loadEventEnd - navTiming.navigationStart;
      this.trackMetric({
        name: 'navigation_timing',
        value: loadTime,
        timestamp: Date.now()
      });
    }
  }

  static initServiceWorkerMetrics() {
    // Service Worker Status überwachen
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.ready.then(registration => {
        console.log('📊 Service Worker Performance-Tracking aktiv')
        this.trackServiceWorkerStatus('ready')
      })

      // Offline/Online Events
      window.addEventListener('online', () => {
        this.trackServiceWorkerStatus('online')
        console.log('🌐 Verbindung wiederhergestellt')
      })

      window.addEventListener('offline', () => {
        this.trackServiceWorkerStatus('offline')
        console.log('📱 Offline-Modus aktiviert')
      })
    }
  }

  static trackServiceWorkerMetric(metric: any) {
    const key = `sw_${metric.type.toLowerCase()}`

    if (!this.serviceWorkerMetrics.has(key)) {
      this.serviceWorkerMetrics.set(key, [])
    }

    this.serviceWorkerMetrics.get(key)!.push({
      ...metric,
      timestamp: Date.now()
    })

    // Erweiterte Cache-Performance Analyse
    if (metric.type === 'FETCH_PERFORMANCE') {
      const emoji = metric.cacheHit ? '⚡' : metric.online ? '🌐' : '📱'
      const status = metric.cacheHit ? 'Cache Hit' : metric.online ? 'Network' : 'Offline'

      console.log(`${emoji} ${status}: ${metric.url} (${Math.round(metric.duration)}ms)`, {
        strategy: metric.strategy,
        cacheHitRate: metric.stats?.cacheHitRate ? `${metric.stats.cacheHitRate}%` : 'N/A',
        totalRequests: metric.stats?.totalRequests || 0
      })

      // Performance-Thresholds mit Context
      if (metric.duration > 2000) {
        console.warn(`🐌 Langsamer Request: ${metric.url} (${Math.round(metric.duration)}ms)`, {
          strategy: metric.strategy,
          suggestion: metric.cacheHit ? 'Cache-Strategie überprüfen' : 'Network-Optimierung nötig'
        })
      }

      // Offline-Tracking
      if (!metric.online && metric.stats?.offlineRequests) {
        console.log(`📱 Offline-Modus: ${metric.stats.offlineRequests} Requests verarbeitet`)
      }
    }
  }

  static trackServiceWorkerStatus(status: string) {
    console.log(`📱 Service Worker Status: ${status}`)

    const metrics = this.serviceWorkerMetrics.get('status') || []
    metrics.push({
      status,
      timestamp: Date.now(),
      online: navigator.onLine
    })
    this.serviceWorkerMetrics.set('status', metrics)
  }

  static getServiceWorkerMetrics() {
    const summary = {
      totalRequests: 0,
      cacheHits: 0,
      networkRequests: 0,
      averageResponseTime: 0,
      offlineEvents: 0
    }

    const fetchMetrics = this.serviceWorkerMetrics.get('sw_fetch_performance') || []

    summary.totalRequests = fetchMetrics.length
    summary.cacheHits = fetchMetrics.filter(m => m.cacheHit).length
    summary.networkRequests = fetchMetrics.filter(m => !m.cacheHit).length

    if (fetchMetrics.length > 0) {
      summary.averageResponseTime = fetchMetrics.reduce((sum, m) => sum + m.duration, 0) / fetchMetrics.length
    }

    const statusMetrics = this.serviceWorkerMetrics.get('status') || []
    summary.offlineEvents = statusMetrics.filter(m => m.status === 'offline').length

    return summary
  }

  static trackWebVital(metric: WebVitalMetric) {
    const key = `web_vital_${metric.name.toLowerCase()}`

    if (!this.metrics.has(key)) {
      this.metrics.set(key, [])
    }

    this.metrics.get(key)!.push(metric.value)

    // Performance-Bewertung mit Emojis für bessere UX
    const getPerformanceEmoji = (name: string, value: number) => {
      switch (name) {
        case 'CLS':
          return value < 0.1 ? '🟢' : value < 0.25 ? '🟡' : '🔴'
        case 'FID':
          return value < 100 ? '🟢' : value < 300 ? '🟡' : '🔴'
        case 'LCP':
          return value < 2500 ? '🟢' : value < 4000 ? '🟡' : '🔴'
        case 'FCP':
          return value < 1800 ? '🟢' : value < 3000 ? '🟡' : '🔴'
        case 'TTFB':
          return value < 800 ? '🟢' : value < 1800 ? '🟡' : '🔴'
        default:
          return '📊'
      }
    }

    const emoji = getPerformanceEmoji(metric.name, metric.value)
    console.log(`${emoji} Web Vital ${metric.name}: ${Math.round(metric.value)}ms`, {
      rating: emoji === '🟢' ? 'Excellent' : emoji === '🟡' ? 'Good' : 'Needs Improvement',
      id: metric.id
    })
  }

  static trackNavigationTiming() {
    if (typeof window === 'undefined' || !window.performance?.timing) return

    const timing = window.performance.timing
    const navigation = {
      domContentLoaded: timing.domContentLoadedEventEnd - timing.navigationStart,
      loadComplete: timing.loadEventEnd - timing.navigationStart,
      domInteractive: timing.domInteractive - timing.navigationStart,
      firstPaint: 0,
      firstContentfulPaint: 0
    }

    // Paint Timings falls verfügbar
    const paintEntries = performance.getEntriesByType('paint')
    paintEntries.forEach(entry => {
      if (entry.name === 'first-paint') {
        navigation.firstPaint = entry.startTime
      } else if (entry.name === 'first-contentful-paint') {
        navigation.firstContentfulPaint = entry.startTime
      }
    })

    console.log('📊 Navigation Performance:', {
      domContentLoaded: `${navigation.domContentLoaded}ms`,
      loadComplete: `${navigation.loadComplete}ms`,
      domInteractive: `${navigation.domInteractive}ms`,
      firstPaint: navigation.firstPaint ? `${Math.round(navigation.firstPaint)}ms` : 'N/A',
      firstContentfulPaint: navigation.firstContentfulPaint ? `${Math.round(navigation.firstContentfulPaint)}ms` : 'N/A'
    })

    this.metrics.set('navigation_timing', [
      navigation.domContentLoaded,
      navigation.loadComplete,
      navigation.domInteractive
    ])
  }

  static observeResourceTiming() {
    if (typeof window === 'undefined' || !window.PerformanceObserver) return

    try {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries()

        entries.forEach(entry => {
          if (entry.entryType === 'resource') {
            const resourceEntry = entry as PerformanceResourceTiming
            const loadTime = resourceEntry.responseEnd - resourceEntry.requestStart

            // Nur wichtige Ressourcen tracken
            if (resourceEntry.name.includes('firebase') ||
                resourceEntry.name.includes('.js') ||
                resourceEntry.name.includes('.css') ||
                resourceEntry.name.includes('/api/')) {

              const resourceType = this.getResourceType(resourceEntry.name)
              const key = `resource_${resourceType}`

              if (!this.metrics.has(key)) {
                this.metrics.set(key, [])
              }

              this.metrics.get(key)!.push(loadTime)

              // Performance-Warnung bei langsamen Ressourcen
              if (loadTime > 2000) {
                console.warn(`🐌 Langsame Ressource: ${resourceEntry.name} (${Math.round(loadTime)}ms)`)
              }
            }
          }
        })
      })

      observer.observe({ entryTypes: ['resource'] })
      this.observers.set('resource', observer)
    } catch (error) {
      console.warn('Resource Timing Observer nicht verfügbar:', error)
    }
  }

  static getResourceType(url: string): string {
    if (url.includes('firebase') || url.includes('firestore')) return 'firebase'
    if (url.endsWith('.js')) return 'javascript'
    if (url.endsWith('.css')) return 'stylesheet'
    if (url.includes('/api/')) return 'api'
    if (url.match(/\.(png|jpg|jpeg|gif|svg|webp)$/)) return 'image'
    return 'other'
  }

  static getPerformanceReport() {
    const report: any = {
      timestamp: new Date().toISOString(),
      webVitals: {},
      resources: {},
      serviceWorker: this.getServiceWorkerMetrics(),
      navigation: this.metrics.get('navigation_timing') || []
    }

    // Web Vitals zusammenfassen
    for (const [key, values] of this.metrics.entries()) {
      if (key.startsWith('web_vital_')) {
        const vitalName = key.replace('web_vital_', '').toUpperCase()
        report.webVitals[vitalName] = {
          latest: values[values.length - 1],
          average: values.reduce((a, b) => a + b, 0) / values.length,
          count: values.length
        }
      } else if (key.startsWith('resource_')) {
        const resourceType = key.replace('resource_', '')
        report.resources[resourceType] = {
          average: values.reduce((a, b) => a + b, 0) / values.length,
          min: Math.min(...values),
          max: Math.max(...values),
          count: values.length
        }
      }
    }

    return report
  }

  // Internal helper to add metrics
  private static addMetric(metric: PerformanceMetric) {
    this.metrics.push(metric);
    // Optional: Limit the number of stored metrics to prevent memory issues
    if (this.metrics.length > 500) {
      this.metrics = this.metrics.slice(-250);
    }
  }

  // Existing methods from original code (kept for completeness, assuming they are still relevant)
  private metrics: PerformanceMetrics[] = [];
  private isMonitoring = import.meta.env.DEV;

  startRenderMeasure(label: string): void {
    if (!this.isMonitoring) return;
    performance.mark(`${label}-start`);
  }

  endRenderMeasure(label: string, itemCount: number): void {
    if (!this.isMonitoring) return;

    performance.mark(`${label}-end`);
    performance.measure(label, `${label}-start`, `${label}-end`);

    const measure = performance.getEntriesByName(label)[0];
    const renderTime = measure.duration;

    // Memory usage estimation
    const memoryUsage = (performance as any).memory?.usedJSHeapSize || 0;

    this.metrics.push({
      renderTime,
      scrollPerformance: renderTime < 16 ? 100 : Math.max(0, 100 - (renderTime - 16) * 2),
      memoryUsage: memoryUsage / (1024 * 1024), // MB
      itemsRendered: itemCount
    });

    if (this.metrics.length > 100) {
      this.metrics = this.metrics.slice(-50); // Keep last 50 measurements
    }

    console.log(`🚀 Virtual Scrolling Performance:`, {
      renderTime: `${renderTime.toFixed(2)}ms`,
      itemCount,
      memoryMB: `${(memoryUsage / (1024 * 1024)).toFixed(1)}MB`,
      performance: renderTime < 16 ? '✅ Excellent' : renderTime < 33 ? '⚠️ Good' : '❌ Needs optimization'
    });
  }

  getAverageMetrics(): PerformanceMetrics | null {
    if (this.metrics.length === 0) return null;

    const sum = this.metrics.reduce((acc, metric) => ({
      renderTime: acc.renderTime + metric.renderTime,
      scrollPerformance: acc.scrollPerformance + metric.scrollPerformance,
      memoryUsage: acc.memoryUsage + metric.memoryUsage,
      itemsRendered: acc.itemsRendered + metric.itemsRendered
    }), { renderTime: 0, scrollPerformance: 0, memoryUsage: 0, itemsRendered: 0 });

    const count = this.metrics.length;
    return {
      renderTime: sum.renderTime / count,
      scrollPerformance: sum.scrollPerformance / count,
      memoryUsage: sum.memoryUsage / count,
      itemsRendered: sum.itemsRendered / count
    };
  }

  static trackMetric(metric: { name: string; value: number; timestamp: number }) {
    const key = `basic_${metric.name}`;
    if (!this.metrics.has(key)) {
      this.metrics.set(key, []);
    }
    this.metrics.get(key)!.push(metric.value);
    console.log(`📊 Basic Metric ${metric.name}: ${Math.round(metric.value)}ms`);
  }
}

export const performanceMonitor = new PerformanceMonitor();