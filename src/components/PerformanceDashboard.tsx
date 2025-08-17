
import React, { useState, useEffect } from 'react'
import styles from './PerformanceDashboard.module.css'

interface PerformanceMetrics {
  totalRequests: number
  cacheHitRate: number
  averageResponseTime: number
  errorCount: number
  lastUpdated: string
}

export default function PerformanceDashboard() {
  const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null)
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    // Listen for Service Worker metrics
    const handleSWMessage = (event: MessageEvent) => {
      if (event.data?.type === 'SW_PERFORMANCE_METRIC') {
        const { stats } = event.data.metric
        setMetrics({
          totalRequests: stats.totalRequests || 0,
          cacheHitRate: stats.cacheHitRate || 0,
          averageResponseTime: stats.averageResponseTime || 0,
          errorCount: stats.errorCount || 0,
          lastUpdated: new Date().toLocaleTimeString()
        })
      }
    }

    navigator.serviceWorker?.addEventListener('message', handleSWMessage)

    // Get initial metrics from PerformanceMonitor
    const updateMetrics = () => {
      try {
        const report = (window as any).PerformanceMonitor?.getPerformanceReport()
        if (report?.serviceWorker) {
          setMetrics({
            totalRequests: report.serviceWorker.totalRequests || 0,
            cacheHitRate: report.serviceWorker.totalRequests > 0 
              ? Math.round((report.serviceWorker.cacheHits / report.serviceWorker.totalRequests) * 100) 
              : 0,
            averageResponseTime: Math.round(report.serviceWorker.averageResponseTime || 0),
            errorCount: 0,
            lastUpdated: new Date().toLocaleTimeString()
          })
        }
      } catch (error) {
        console.log('Performance metrics not available yet')
      }
    }

    updateMetrics()
    const interval = setInterval(updateMetrics, 5000)

    return () => {
      navigator.serviceWorker?.removeEventListener('message', handleSWMessage)
      clearInterval(interval)
    }
  }, [])

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
          
          {metrics ? (
            <div className={styles.metrics}>
              <div className={styles.metric}>
                <span className={styles.label}>Requests:</span>
                <span className={styles.value}>{metrics.totalRequests}</span>
              </div>
              
              <div className={styles.metric}>
                <span className={styles.label}>Cache Hit:</span>
                <span className={`${styles.value} ${
                  metrics.cacheHitRate >= 80 ? styles.good : 
                  metrics.cacheHitRate >= 60 ? styles.warning : styles.poor
                }`}>
                  {metrics.cacheHitRate}%
                </span>
              </div>
              
              <div className={styles.metric}>
                <span className={styles.label}>Avg Response:</span>
                <span className={`${styles.value} ${
                  metrics.averageResponseTime < 500 ? styles.good : 
                  metrics.averageResponseTime < 1000 ? styles.warning : styles.poor
                }`}>
                  {metrics.averageResponseTime}ms
                </span>
              </div>
              
              <div className={styles.metric}>
                <span className={styles.label}>Errors:</span>
                <span className={`${styles.value} ${metrics.errorCount === 0 ? styles.good : styles.poor}`}>
                  {metrics.errorCount}
                </span>
              </div>
              
              <div className={styles.timestamp}>
                Updated: {metrics.lastUpdated}
              </div>
            </div>
          ) : (
            <div className={styles.loading}>Loading metrics...</div>
          )}
        </div>
      )}
    </div>
  )
}
