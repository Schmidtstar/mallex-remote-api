
import React, { useState, useEffect } from 'react'
import s from './CachePerformanceDashboard.module.css'

interface CacheMetrics {
  totalRequests: number
  cacheHits: number
  networkRequests: number
  averageResponseTime: number
  offlineEvents: number
  cacheHitRate: number
}

interface CachePerformanceDashboardProps {
  isVisible: boolean
  onClose: () => void
}

const CachePerformanceDashboard: React.FC<CachePerformanceDashboardProps> = ({ 
  isVisible, 
  onClose 
}) => {
  const [metrics, setMetrics] = useState<CacheMetrics | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (!isVisible) return

    const updateMetrics = () => {
      // Performance Monitor aus dem globalen Scope abrufen
      if (window.PerformanceMonitor) {
        const swMetrics = window.PerformanceMonitor.getServiceWorkerMetrics()
        setMetrics({
          ...swMetrics,
          cacheHitRate: swMetrics.totalRequests > 0 
            ? (swMetrics.cacheHits / swMetrics.totalRequests * 100)
            : 0
        })
      }
      setIsLoading(false)
    }

    updateMetrics()
    const interval = setInterval(updateMetrics, 2000) // Update alle 2 Sekunden

    return () => clearInterval(interval)
  }, [isVisible])

  if (!isVisible) return null

  const getPerformanceRating = (hitRate: number) => {
    if (hitRate >= 80) return { emoji: '🚀', label: 'Excellent', color: '#4CAF50' }
    if (hitRate >= 60) return { emoji: '⚡', label: 'Good', color: '#FF9800' }
    if (hitRate >= 40) return { emoji: '⚠️', label: 'Fair', color: '#FF5722' }
    return { emoji: '🐌', label: 'Poor', color: '#F44336' }
  }

  return (
    <div className={s.overlay}>
      <div className={s.dashboard}>
        <div className={s.header}>
          <h3>🏛️ MALLEX Cache Performance</h3>
          <button className={s.closeBtn} onClick={onClose}>×</button>
        </div>

        {isLoading ? (
          <div className={s.loading}>
            <div className={s.spinner}></div>
            <p>Analyzing cache performance...</p>
          </div>
        ) : metrics ? (
          <div className={s.content}>
            {/* Hauptmetriken */}
            <div className={s.mainMetrics}>
              <div className={s.metric}>
                <div className={s.metricValue}>
                  {metrics.cacheHitRate.toFixed(1)}%
                </div>
                <div className={s.metricLabel}>
                  {getPerformanceRating(metrics.cacheHitRate).emoji} Cache Hit Rate
                </div>
                <div 
                  className={s.performanceRating}
                  style={{ color: getPerformanceRating(metrics.cacheHitRate).color }}
                >
                  {getPerformanceRating(metrics.cacheHitRate).label}
                </div>
              </div>

              <div className={s.metric}>
                <div className={s.metricValue}>
                  {Math.round(metrics.averageResponseTime)}ms
                </div>
                <div className={s.metricLabel}>
                  ⏱️ Avg Response Time
                </div>
              </div>

              <div className={s.metric}>
                <div className={s.metricValue}>
                  {metrics.totalRequests}
                </div>
                <div className={s.metricLabel}>
                  📊 Total Requests
                </div>
              </div>
            </div>

            {/* Detailmetriken */}
            <div className={s.detailMetrics}>
              <div className={s.detailRow}>
                <span>⚡ Cache Hits:</span>
                <span className={s.value}>{metrics.cacheHits}</span>
              </div>
              <div className={s.detailRow}>
                <span>🌐 Network Requests:</span>
                <span className={s.value}>{metrics.networkRequests}</span>
              </div>
              <div className={s.detailRow}>
                <span>📱 Offline Events:</span>
                <span className={s.value}>{metrics.offlineEvents}</span>
              </div>
            </div>

            {/* Performance-Empfehlungen */}
            <div className={s.recommendations}>
              <h4>💡 Performance-Empfehlungen:</h4>
              <ul>
                {metrics.cacheHitRate < 60 && (
                  <li>🔧 Cache-Strategien optimieren für bessere Hit-Rate</li>
                )}
                {metrics.averageResponseTime > 1000 && (
                  <li>⚡ Response-Zeiten durch Caching verbessern</li>
                )}
                {metrics.offlineEvents > 0 && (
                  <li>📱 Offline-Support ist aktiv und funktioniert</li>
                )}
                {metrics.cacheHitRate >= 80 && (
                  <li>✅ Excellent Cache-Performance!</li>
                )}
              </ul>
            </div>
          </div>
        ) : (
          <div className={s.error}>
            <p>⚠️ Cache-Metriken nicht verfügbar</p>
            <p>Service Worker möglicherweise noch nicht aktiv.</p>
          </div>
        )}
      </div>
    </div>
  )
}

export { CachePerformanceDashboard }
export default CachePerformanceDashboard
