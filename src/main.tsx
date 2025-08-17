import React, { useState } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider } from 'react-router-dom'
import { router } from './router'
import './styles/index.css'
import './i18n'
import { AuthProvider } from './context/AuthContext'
import { AdminSettingsProvider } from './context/AdminSettingsContext' // Assuming AdminSettingsProvider is the intended replacement
import { PlayersProvider } from './context/PlayersContext'
import { TaskSuggestionsProvider } from './context/TaskSuggestionsContext'
import AppIntro from './components/AppIntro'
import { MonitoringService } from './lib/monitoring'
import { FirebaseOptimizer } from './lib/firebase-optimized'

const ContextProviders: React.FC<{ children: React.ReactNode }> = React.memo(({ children }) => (
  <AuthProvider>
    <AdminSettingsProvider>
      <TaskSuggestionsProvider>
        <PlayersProvider>
          {children}
        </PlayersProvider>
      </TaskSuggestionsProvider>
    </AdminSettingsProvider>
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

// Development debugging
if (import.meta.env.DEV) {
  ;(window as any).__MALLEX_DEV__ = true
}

// No problematic exports that break Fast Refresh