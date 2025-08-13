import React, { useState } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider } from 'react-router-dom'
import { router } from './router'
import './styles/index.css'
import './i18n'
import { AuthProvider } from './context/AuthContext'
import { AdminProvider } from './context/AdminContext'
import { AdminSettingsProvider } from './context/AdminSettingsContext'
import { PlayersProvider } from './context/PlayersContext'
import { TaskSuggestionsProvider } from './context/TaskSuggestionsContext'
import { IntroScreen } from './components/IntroScreen'

const ContextProviders: React.FC<{ children: React.ReactNode }> = React.memo(({ children }) => (
  <AuthProvider>
    <AdminProvider>
      <AdminSettingsProvider>
        <PlayersProvider>
          <TaskSuggestionsProvider>
            {children}
          </TaskSuggestionsProvider>
        </PlayersProvider>
      </AdminSettingsProvider>
    </AdminProvider>
  </AuthProvider>
))
ContextProviders.displayName = 'ContextProviders'

const App: React.FC = () => {
  const [showIntro, setShowIntro] = useState(true)
  
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
}

const rootElement = document.getElementById('root')
if (rootElement && !rootElement.hasAttribute('data-react-root')) {
  rootElement.setAttribute('data-react-root', 'true')
  const root = createRoot(rootElement)
  root.render(<App />)
}

// Expose a global boolean for debugging
if (import.meta.env.DEV) {
  ;(window as any).__MALLEX_DEV__ = true
}

// Export for Fast Refresh compatibility - remove problematic default
export { App }