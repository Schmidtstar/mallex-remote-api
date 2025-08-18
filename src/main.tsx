import React, { useState } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider } from 'react-router-dom'
import { router } from './router'
import './styles/index.css'
import './i18n'
import { AuthProvider } from './context/AuthContext'
import { AdminSettingsProvider } from './context/AdminSettingsContext'
import { PlayersProvider } from './context/PlayersContext'
import { TaskSuggestionsProvider } from './context/TaskSuggestionsContext'
import AppIntro from './components/AppIntro'
import PrivacyBanner from './components/PrivacyBanner'
import { MonitoringService } from './lib/monitoring'
import { FirebaseOptimizer } from './lib/firebase-optimized'
import ErrorBoundary from './components/ErrorBoundary'
import PerformanceDashboard from './components/PerformanceDashboard'
import { SoundManager } from './lib/sound-manager'
import './lib/capacitor-integration'
import ErrorBoundaryEnhanced from './components/ErrorBoundaryEnhanced'
import { CriticalErrorHandler } from './lib/error-handler'
import { AccessibilityManager } from './lib/a11y'
import PerformanceMonitor from './lib/performance-monitor'

// Initialize Sound System
SoundManager.init().catch(err => 
  console.warn('Sound system initialization failed:', err)
)

// Initialize Accessibility Manager
AccessibilityManager.init()
AccessibilityManager.addSkipLinks() 

const ContextProviders: React.FC<{ children: React.ReactNode }> = React.memo(({ children }) => (
  <AuthProvider>
    <PlayersProvider>
      <TaskSuggestionsProvider>
        <AdminSettingsProvider>
          {children}
        </AdminSettingsProvider>
      </TaskSuggestionsProvider>
    </PlayersProvider>
  </AuthProvider>
))
ContextProviders.displayName = 'ContextProviders'

const App: React.FC = () => {
  const [showIntro, setShowIntro] = useState(true)
  const [isLoading, setIsLoading] = useState(false)

  const handleIntroComplete = () => {
    setIsLoading(true)
    // Smooth transition mit Loading-Feedback
    setTimeout(() => {
      setShowIntro(false)
      setIsLoading(false)
    }, 300)
  }

  if (showIntro) {
    return <AppIntro onComplete={handleIntroComplete} />
  }

  if (isLoading) {
    return (
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        height: '100vh',
        background: 'linear-gradient(#0b1327, #0b0f1b)',
        color: '#fff'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>⚔️</div>
          <div>Die Arena wird vorbereitet...</div>
        </div>
      </div>
    )
  }

  return (
    <ContextProviders>
      <RouterProvider key="main-router" router={router} />
      <PrivacyBanner />
      <PerformanceDashboard />
    </ContextProviders>
  )
}

const rootElement = document.getElementById('root')
if (rootElement && !rootElement.hasAttribute('data-react-root')) {
  rootElement.setAttribute('data-react-root', 'true')
  const root = createRoot(rootElement)

  // Initialize critical error handling
  CriticalErrorHandler.init()

  // Enhanced Performance Monitoring Initialization
  try {
    PerformanceMonitor.init()
    MonitoringService.trackUserAction('app_start')
    FirebaseOptimizer.monitorConnection()
    console.log('📊 Performance monitoring initialized successfully')
  } catch (error) {
    console.warn('Performance monitoring initialization failed:', error)
  }

  // Track app initialization performance with detailed metrics
  const initStartTime = performance.now()
  console.log('🚀 MALLEX App v2.0 initialization started')

  window.addEventListener('load', () => {
    const initTime = performance.now() - initStartTime
    console.log(`📊 App initialized in ${Math.round(initTime)}ms`)

    // Track critical performance metrics
    PerformanceMonitor.trackMetric({ 
      name: 'app-initialization', 
      value: initTime, 
      timestamp: Date.now() 
    })

    // Initialize performance dashboard in dev mode
    if (import.meta.env.DEV) {
      setTimeout(() => {
        console.log('📊 Performance Dashboard available in browser console')
        console.log('Type window.MALLEX_PERFORMANCE for metrics')
      }, 2000)
    }
  })

  // Global Performance API for Development
  if (import.meta.env.DEV) {
    ;(window as any).MALLEX_PERFORMANCE = {
      getMetrics: () => PerformanceMonitor.getPerformanceReport(),
      generateReport: () => PerformanceMonitor.generatePerformanceReport(),
      trackMetric: (name: string, value: number) => PerformanceMonitor.trackMetric({ name, value, timestamp: Date.now() })
    }
  }

  // Service Worker Performance Metrics Listener
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.addEventListener('message', (event) => {
      if (event.data?.type === 'SW_PERFORMANCE_METRIC') {
        try {
          PerformanceMonitor.trackServiceWorkerMetric(event.data.metric)
        } catch (error) {
          console.warn('Performance Monitor tracking failed:', error)
        }
      }
    })
  }

  // Cleanup on page unload
  window.addEventListener('beforeunload', () => {
    FirebaseOptimizer.cleanup()

    if (import.meta.env.DEV) {
      const report = MonitoringService.getPerformanceReport()
      console.log('📊 Session Performance Report:', report)
    }
  })

  root.render(
    <React.StrictMode>
      <ErrorBoundaryEnhanced context={{ component: 'App', severity: 'critical' }}>
        <App />
      </ErrorBoundaryEnhanced>
    </React.StrictMode>
  )
}

// Enhanced Service Worker Registration mit Performance-Integration
if ('serviceWorker' in navigator) {
  // PerformanceMonitor global verfügbar machen
  ;(window as any).PerformanceMonitor = PerformanceMonitor

  window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js')
        .then((registration) => {
          console.log('✅ MALLEX Service Worker v2.2.0 registriert:', registration)

          // Service Worker Updates überwachen
          registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing
            if (newWorker) {
              newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  console.log('🔄 Service Worker Update verfügbar - Reload empfohlen')

                  // Optional: User-freundliche Update-Benachrichtigung
                  MonitoringService.trackUserAction('sw_update_available')

                  // Auto-Update nach 5 Sekunden (nur im Dev-Mode)
                  if (import.meta.env.DEV) {
                    setTimeout(() => {
                      window.location.reload()
                    }, 5000)
                  }
                }
              })
            }
          })

          })
        .catch((error) => {
          console.error('❌ Service Worker Registration fehlgeschlagen:', error)
          MonitoringService.trackError('sw_registration_failed', { error: error.message })
        })

      // Offline/Online Status-Updates
      window.addEventListener('online', () => {
        console.log('🌐 Verbindung wiederhergestellt')
        MonitoringService.trackUserAction('connection_restored')
      })

      window.addEventListener('offline', () => {
        console.log('📱 Offline-Modus aktiviert')
        MonitoringService.trackUserAction('connection_lost')
      })
    })
}

// Development debugging
if (import.meta.env.DEV) {
  ;(window as any).__MALLEX_DEV__ = true
  
  // Handle WebSocket connection issues for Vite HMR
  if (typeof window !== 'undefined') {
    window.addEventListener('error', (event) => {
      if (event.message?.includes('WebSocket') || event.message?.includes('0.0.0.0 blocked')) {
        console.warn('WebSocket HMR connection blocked - this is normal in some environments')
        event.preventDefault()
      }
    })
  }
}

// Initialize Performance Monitoring (Development)
  if (import.meta.env.DEV) {
    MonitoringService.init()
  }

  // Initialize Mobile Performance Optimizations
  import('./lib/mobile-performance').then((module) => {
    const MobilePerformanceOptimizer = module.MobilePerformanceOptimizer || module.default
    if (MobilePerformanceOptimizer?.init) {
      MobilePerformanceOptimizer.init()
    }
  }).catch(() => {
    console.warn('Mobile performance optimizer not available')
  })

// No problematic exports that break Fast Refresh