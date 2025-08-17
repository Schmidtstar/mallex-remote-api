import React, { useState, useEffect } from 'react'
import styles from './PerformanceDashboard.module.css'

// Define the interface for PerformanceMetrics
interface PerformanceMetrics {
  totalRequests?: number
  cacheHitRate?: number
  averageResponseTime?: number
  errorCount?: number
  lastUpdated?: string
  networkStatus?: boolean
  serviceWorkerStatus?: string
  memoryUsage?: number
  timestamp?: string
  webVitals?: {
    [key: string]: {
      latest: number
      name: string
    }
  }
  serviceWorker?: {
    cacheHits: number
    totalRequests: number
    averageResponseTime: number
  }
}

// Mock MonitoringService for demonstration purposes if it's not globally available
const MonitoringService = {
  getPerformanceReport: () => {
    // Simulate fetching data
    if (Math.random() > 0.3) { // Simulate occasional data availability
      return {
        webVitals: {
          CLS: { latest: Math.random() * 0.2, name: 'Cumulative Layout Shift' },
          FID: { latest: Math.random() * 150, name: 'First Input Delay' },
          LCP: { latest: Math.random() * 2000 + 500, name: 'Largest Contentful Paint' },
        },
        serviceWorker: {
          cacheHits: Math.floor(Math.random() * 100),
          totalRequests: Math.floor(Math.random() * 200) + 50,
          averageResponseTime: Math.random() * 800 + 100,
        }
      }
    } else {
      throw new Error('Performance report not available')
    }
  }
}


export default function PerformanceDashboard() {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({})
  const [isVisible, setIsVisible] = useState(false)
  const [networkStatus, setNetworkStatus] = useState(navigator.onLine)
  const [serviceWorkerStatus, setServiceWorkerStatus] = useState('loading')

  useEffect(() => {
    // Network Status Updates
    const handleOnline = () => setNetworkStatus(true)
    const handleOffline = () => setNetworkStatus(false)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    // Service Worker Status
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.ready.then(() => {
        setServiceWorkerStatus('active')
      }).catch(() => {
        setServiceWorkerStatus('error')
      })
    } else {
      setServiceWorkerStatus('unavailable')
    }

    const interval = setInterval(() => {
      try {
        // Use the mock or actual MonitoringService
        const report = (window as any).PerformanceMonitor?.getPerformanceReport ? (window as any).PerformanceMonitor.getPerformanceReport() : MonitoringService.getPerformanceReport();

        // Enhanced metrics with real-time data
        const enhancedReport: PerformanceMetrics = {
          ...report,
          networkStatus,
          serviceWorkerStatus,
          memoryUsage: (performance as any).memory?.usedJSHeapSize || 0,
          timestamp: new Date().toLocaleTimeString()
        }

        setMetrics(enhancedReport)
      } catch (error) {
        console.warn('Performance metrics nicht verfügbar:', error)
        // Ensure metrics state is updated even on error to reflect potential changes
        setMetrics(prevMetrics => ({
          ...prevMetrics,
          networkStatus,
          serviceWorkerStatus,
          timestamp: new Date().toLocaleTimeString()
        }));
      }
    }, 3000) // Häufigere Updates

    return () => {
      clearInterval(interval)
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [networkStatus, serviceWorkerStatus]) // Dependencies ensure updates when status changes

  // Development-only dashboard
  if (import.meta.env.PROD && !window.location.search.includes('debug=true')) {
    return null
  }

  return (
    <div className={styles.dashboard}>
      <button
        className={styles.toggle}
        onClick={() => setIsVisible(!isVisible)}
        title="Performance Dashboard"
      >
        📊
      </button>

      {isVisible && (
        <div className={styles.panel}>
          <div className={styles.header}>
            <h4>⚡ Live Performance</h4>
            <button onClick={() => setIsVisible(false)}>×</button>
          </div>

          <div className={styles.metricsGrid}>
            {/* Network & SW Status */}
            <div className={styles.statusRow}>
              <div className={`${styles.statusBadge} ${networkStatus ? styles.online : styles.offline}`}>
                {networkStatus ? '🌐 Online' : '📱 Offline'}
              </div>
              <div className={`${styles.statusBadge} ${serviceWorkerStatus === 'active' ? styles.active : (serviceWorkerStatus === 'unavailable' ? styles.inactive : styles.error)}`}>
                {serviceWorkerStatus === 'active' ? '⚡ SW Active' : serviceWorkerStatus === 'unavailable' ? '🚫 SW Unavailable' : '❌ SW Error'}
              </div>
            </div>

            {/* Performance Metrics */}
            {metrics.webVitals && Object.entries(metrics.webVitals).map(([vital, data]: [string, any]) => (
              <div key={vital} className={styles.vitalMetric}>
                <span className={styles.vitalName}>{vital}:</span>
                <span className={`${styles.vitalValue} ${
                  data.latest < (vital === 'CLS' ? 0.1 : vital === 'FID' ? 100 : 2500) ? styles.good : data.latest < (vital === 'CLS' ? 0.25 : vital === 'FID' ? 200 : 4000) ? styles.warning : styles.poor
                }`}>
                  {Math.round(data.latest)}ms
                </span>
              </div>
            ))}

            {/* Memory Usage */}
            {metrics.memoryUsage !== undefined && (
              <div className={styles.memoryMetric}>
                <span>Memory:</span>
                <span className={styles.memoryValue}>
                  {Math.round(metrics.memoryUsage / (1024 * 1024))}MB
                </span>
              </div>
            )}

            {/* Service Worker Performance */}
            {metrics.serviceWorker && (
              <div className={styles.swMetrics}>
                <div>Cache Hits: {metrics.serviceWorker.cacheHits}/{metrics.serviceWorker.totalRequests}</div>
                <div>Avg Response: {Math.round(metrics.serviceWorker.averageResponseTime)}ms</div>
              </div>
            )}

            {metrics.timestamp && (
              <div className={styles.timestamp}>
                Updated: {metrics.timestamp}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}