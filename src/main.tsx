import React, { useState, useEffect } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider } from 'react-router-dom'
import { router } from './router'
// Intro-Styles ZUERST laden
import './styles/index.css'
import './i18n'
import { AuthProvider } from './context/AuthContext'
import { AdminSettingsProvider } from './context/AdminSettingsContext'
import { PlayersProvider } from './context/PlayersContext'
import { TaskSuggestionsProvider } from './context/TaskSuggestionsContext'

import LanguageSelector from './components/LanguageSelector'
import PrivacyBanner from './components/PrivacyBanner'
import { MonitoringService } from './lib/monitoring'
import { FirebaseOptimizer } from './lib/firebase-optimized'
import ErrorBoundaryEnhanced from './components/ErrorBoundaryEnhanced'
import { CriticalErrorHandler } from './lib/error-handler'
import { AccessibilityManager } from './lib/a11y'
import { SoundManager } from './lib/sound-manager'

// Initialize core systems once
const initializeCoreServices = async () => {
  try {
    // Error handling - Critical (first)
    CriticalErrorHandler.init()

    // Sound System - Non-blocking with better error handling
    try {
      SoundManager.init().catch(err => {
        console.warn('🔇 Sound system failed (non-critical):', err?.message || 'Audio not available')
        // Don't track audio errors as they're non-critical
      })
    } catch (err) {
      console.warn('🔇 Sound system initialization skipped')
    }

    // Accessibility - Essential
    AccessibilityManager.init()
    AccessibilityManager.addSkipLinks()

    // Performance monitoring - Immer initialisieren, aber unterschiedliche Modi
    MonitoringService.init()

    if (import.meta.env.DEV) {
      MonitoringService.trackUserAction('app_start')
      console.log('🔧 Development mode: Verbose logging enabled')
    } else {
      // Production: Silent monitoring
      MonitoringService.trackUserAction('app_start', { silent: true })
      console.log('✅ Production mode: Monitoring active')
    }

    // Firebase initialization - Production ready with error handling
    try {
      // Initialize Firebase Optimizer with proper async handling
      if (FirebaseOptimizer && typeof FirebaseOptimizer.init === 'function') {
        await FirebaseOptimizer.init()
        console.log('🔧 Firebase Optimizer initialized successfully')
      } else {
        console.warn('🟡 Firebase Optimizer init method not available - using fallback')

        // Fallback: Initialize monitoring directly via static method
        if (typeof FirebaseOptimizer?.monitorConnection === 'function') {
          FirebaseOptimizer.monitorConnection()
          console.log('🔧 Firebase monitoring active (fallback mode)')
        } else {
          // Last resort: Manual connection monitoring
          console.log('🔧 Firebase manual monitoring fallback')
          const { FirebaseOptimizer: FbOpt } = await import('./lib/firebase-optimized')
          if (FbOpt?.monitorConnection) {
            FbOpt.monitorConnection()
          }
        }
      }
    } catch (error: any) {
      console.warn('🟡 Firebase Optimizer failed (non-critical):', error?.message)
      // Don't track Firebase init errors as critical since app works without them
    }

    console.log('✅ MALLEX v2.1 - Core services initialized')
  } catch (error) {
    console.warn('⚠️ Non-critical service initialization failed:', error)
  }
}

// Context Providers - Memoized für Performance
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
  const [showLanguageSelector, setShowLanguageSelector] = useState(false)

  // Check if language is already set
  useEffect(() => {
    const savedLanguage = localStorage.getItem('mallex-language')
    if (!savedLanguage) {
      setShowLanguageSelector(true)
    }
  }, [])

  const handleLanguageSelected = (language: string) => {
    console.log(`🌍 Language selected: ${language}`)
    setShowLanguageSelector(false)
  }

  // Show language selector only if no language is set
  if (showLanguageSelector) {
    return (
      <LanguageSelector
        onLanguageSelected={handleLanguageSelected}
        showSkip={true}
      />
    )
  }

  return (
    <ContextProviders>
      <RouterProvider router={router} />
      <PrivacyBanner />
    </ContextProviders>
  )
}

// Single initialization point mit verbessertem Schutz
const rootElement = document.getElementById('root')
if (rootElement && !rootElement.hasAttribute('data-react-root') && !(rootElement as any)._reactRootContainer) {
  rootElement.setAttribute('data-react-root', 'true')

  // Initialize services BEFORE React - wrapped in async IIFE
  ;(async () => {
    try {
      await initializeCoreServices()
    } catch (error) {
      console.warn('⚠️ Service initialization failed:', error)
    }
  })()

  const root = createRoot(rootElement)

  // Development tools
  if (import.meta.env.DEV) {
    ;(window as any).MALLEX_DEV = {
      performance: () => MonitoringService.getPerformanceReport(),
      errors: () => CriticalErrorHandler.getErrorStats(),
      cache: () => FirebaseOptimizer.getCacheStats()
    }
    console.log('🛠️ Dev tools available: window.MALLEX_DEV')
  }

  // Cleanup on unload
  window.addEventListener('beforeunload', () => {
    try {
      FirebaseOptimizer.cleanup()
    } catch (error) {
      console.warn('Cleanup warning:', error)
    }
  })

  // Service Worker - Production only
  if (import.meta.env.PROD && 'serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js')
        .then(registration => {
          console.log('✅ Service Worker active:', registration)

          registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing
            if (newWorker) {
              newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  console.log('🔄 App update available')
                }
              })
            }
          })
        })
        .catch(error => {
          console.warn('Service Worker registration failed:', error)
        })
    })
  }

  root.render(
    <React.StrictMode>
      <ErrorBoundaryEnhanced showReportDialog={false}>
        <App />
      </ErrorBoundaryEnhanced>
    </React.StrictMode>
  )
}