import React, { useState } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider } from 'react-router-dom'
import { router } from './router'
import './styles/index.css'
import './i18n'
import { AuthProvider } from './context/AuthContext'
// AdminContext removed - centralized admin check in AuthContext
import AdminSettingsProvider from './context/AdminSettingsContext'
import { PlayersProvider } from './context/PlayersContext'
import { TaskSuggestionsProvider } from './context/TaskSuggestionsContext'


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
  // Intro komplett entfernt - direkt die App laden
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
  root.render(<App />)
}

// Development debugging
if (import.meta.env.DEV) {
  ;(window as any).__MALLEX_DEV__ = true
}

// No problematic exports that break Fast Refresh