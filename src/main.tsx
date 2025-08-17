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
import ErrorBoundary from './components/ErrorBoundary';

// Assuming PerformanceMonitor is defined elsewhere and imported if necessary
// import { PerformanceMonitor } from './lib/performance-monitor'; 

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

  const handleIntroComplete = () => {
    setShowIntro(false)
  }

  if (showIntro) {
    return <AppIntro onComplete={handleIntroComplete} />
  }

  return (
    <ContextProviders>
      <RouterProvider key="main-router" router={router} />
      <PrivacyBanner />
    </ContextProviders>
  )
}

const rootElement = document.getElementById('root')
if (rootElement && !rootElement.hasAttribute('data-react-root')) {
  rootElement.setAttribute('data-react-root', 'true')
  const root = createRoot(rootElement)

  // Initialize monitoring
  MonitoringService.trackUserAction('app_start')
  FirebaseOptimizer.monitorConnection()

  // Cleanup on page unload
  window.addEventListener('beforeunload', () => {
    FirebaseOptimizer.cleanup()

    if (import.meta.env.DEV) {
      const report = MonitoringService.getPerformanceReport()
      console.log('📊 Session Performance Report:', report)
    }
  })

  root.render(<App />)
}

// Enhanced Service Worker Registration mit Performance-Integration
if ('serviceWorker' in navigator) {
  // Import PerformanceMonitor für Service Worker Integration
  import('./lib/performance-monitor').then(({ PerformanceMonitor }) => {
    // Global verfügbar machen für Dashboard
    ;(window as any).PerformanceMonitor = PerformanceMonitor
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js')
        .then((registration) => {
          console.log('✅ MALLEX Service Worker v2.2.0 registriert:', registration.scope)

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

          // Performance-Monitoring aktivieren
          PerformanceMonitor.init()
        })
        .catch((error) => {
          console.error('❌ Service Worker Registration fehlgeschlagen:', error)
          MonitoringService.trackError('sw_registration_failed', { error: error.message })
        })

      // Service Worker Message-Handler für Performance-Metrics
      navigator.serviceWorker.addEventListener('message', (event) => {
        if (event.data?.type === 'SW_PERFORMANCE_METRIC') {
          PerformanceMonitor.trackServiceWorkerMetric(event.data.metric)
        }
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
  }).catch(err => {
    console.warn('Performance Monitor konnte nicht geladen werden:', err)
  })
}

// Development debugging
if (import.meta.env.DEV) {
  ;(window as any).__MALLEX_DEV__ = true
}

// No problematic exports that break Fast Refresh