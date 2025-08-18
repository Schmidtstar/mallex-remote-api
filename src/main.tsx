import React, { useState, useEffect } from 'react'
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
import LanguageSelector from './components/LanguageSelector'
import PrivacyBanner from './components/PrivacyBanner'
import { MonitoringService } from './lib/monitoring'
import { FirebaseOptimizer } from './lib/firebase-optimized'
import ErrorBoundaryEnhanced from './components/ErrorBoundaryEnhanced'
import { CriticalErrorHandler } from './lib/error-handler'
import { AccessibilityManager } from './lib/a11y'
import { SoundManager } from './lib/sound-manager'

// Initialize core systems once
const initializeCoreServices = () => {
  try {
    // Error handling - Critical (first)
    CriticalErrorHandler.init()

    // Sound System - Non-blocking with better error handling
    SoundManager.init().catch(err => {
      console.warn('Sound system failed (non-critical):', err)
      CriticalErrorHandler.handleError(err, {
        severity: 'low',
        component: 'sound_system',
        action: 'initialization'
      })
    })

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
      FirebaseOptimizer.init()
    } catch (err) {
      console.warn('Firebase initialization failed:', err)
      CriticalErrorHandler.handleError(err, {
        severity: 'medium',
        component: 'firebase',
        action: 'initialization'
      })
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

type AppPhase = 'intro' | 'language' | 'app'
type UserType = 'first-time' | 'returning' | 'admin'

const App: React.FC = () => {
  const [currentPhase, setCurrentPhase] = useState<AppPhase>('intro')
  const [userType, setUserType] = useState<UserType>('first-time')

  // User-Type Detection beim App-Start
  useEffect(() => {
    const detectUserType = (): UserType => {
      // Check für gespeicherte Daten
      const hasVisitedBefore = localStorage.getItem('mallex-language') || 
                              localStorage.getItem('mallex-visited')
      
      // Check für Admin-Role (falls Auth-Context verfügbar)
      const isAdmin = localStorage.getItem('mallex-user-role') === 'admin'
      
      if (isAdmin) return 'admin'
      if (hasVisitedBefore) return 'returning'
      return 'first-time'
    }

    const detectedType = detectUserType()
    setUserType(detectedType)

    // Intro für alle User-Typen anzeigen (kann individuell angepasst werden)
    // Das Intro wird basierend auf userType optimiert, aber nicht übersprungen

    // Mark als visited
    localStorage.setItem('mallex-visited', 'true')
  }, [])

  const handleIntroComplete = () => {
    console.log('🎬 Intro completed, showing language selection')
    setCurrentPhase('language')
  }

  const handleLanguageSelected = (language: string) => {
    console.log(`🌍 Language selected: ${language}, showing main app`)
    setCurrentPhase('app')
  }

  if (currentPhase === 'intro') {
    return (
      <AppIntro 
        onComplete={handleIntroComplete} 
        userType={userType}
        showSkip={true}
      />
    )
  }

  if (currentPhase === 'language') {
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

  // Initialize services BEFORE React
  initializeCoreServices()

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