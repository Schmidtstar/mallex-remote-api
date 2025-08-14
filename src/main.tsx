import React, { useState } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider } from 'react-router-dom'
import { router } from './router'
import './styles/index.css'
import './i18n'
import { AuthProvider } from './context/AuthContext'
import { AdminProvider } from './context/AdminProvider'
import AdminSettingsProvider from './context/AdminSettingsContext'
import { PlayersProvider } from './context/PlayersContext'
import { TaskSuggestionsProvider } from './context/TaskSuggestionsContext'
import { IntroScreen } from './components/IntroScreen'
import { ErrorBoundary } from './components/ErrorBoundary'

// Fix for Safari viewport height issues
function setVH() {
  const vh = window.innerHeight * 0.01
  document.documentElement.style.setProperty('--vh', `${vh}px`)
}

// Set initial values
setVH()

// Re-calculate on resize and orientation change
window.addEventListener('resize', setVH)
window.addEventListener('orientationchange', () => {
  setTimeout(setVH, 100) // Delay to ensure orientation change is complete
})

const ContextProviders: React.FC<{ children: React.ReactNode }> = React.memo(({ children }) => (
  <ErrorBoundary>
    <AuthProvider>
      <TaskSuggestionsProvider>
        <AdminProvider>
          <AdminSettingsProvider>
            <PlayersProvider>
              {children}
            </PlayersProvider>
          </AdminSettingsProvider>
        </AdminProvider>
      </TaskSuggestionsProvider>
    </AuthProvider>
  </ErrorBoundary>
))
ContextProviders.displayName = 'ContextProviders'

const App: React.FC = React.memo(() => {
  const [showIntro, setShowIntro] = useState(false) // Temporarily disabled for debugging

  const handleIntroComplete = React.useCallback(() => {
    setShowIntro(false)
  }, [])

  if (showIntro) {
    return <IntroScreen onComplete={handleIntroComplete} />
  }

  return (
    <ContextProviders>
      <RouterProvider router={router} />
    </ContextProviders>
  )
})
App.displayName = 'App'

const rootElement = document.getElementById('root')
if (rootElement && !rootElement.hasAttribute('data-react-root')) {
  rootElement.setAttribute('data-react-root', 'true')
  const root = createRoot(rootElement)
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  )
}

// Development debugging
if (import.meta.env.DEV) {
  ;(window as any).__MALLEX_DEV__ = true
}

// No problematic exports that break Fast Refresh