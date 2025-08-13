import { useState } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider } from 'react-router-dom'
import { router } from './router'
import './styles/index.css'
import './i18n' // Side-effect Import für i18n Initialisierung
import { AuthProvider } from './context/AuthContext'
import { AdminProvider } from './context/AdminContext'
import { AdminSettingsProvider } from './context/AdminSettingsContext'
import { PlayersProvider } from './context/PlayersContext'
import { TaskSuggestionsProvider } from './context/TaskSuggestionsContext'
import { IntroScreen } from './components/IntroScreen'
import React from 'react' // React importieren, da es für React.StrictMode benötigt wird

const App = () => {
  const [showIntro, setShowIntro] = useState(true)

  if (showIntro) {
    return <IntroScreen onComplete={() => setShowIntro(false)} />
  }

  return (
    <AuthProvider>
      <AdminProvider>
        <AdminSettingsProvider>
          <PlayersProvider>
            <TaskSuggestionsProvider>
              <RouterProvider router={router} />
            </TaskSuggestionsProvider>
          </PlayersProvider>
        </AdminSettingsProvider>
      </AdminProvider>
    </AuthProvider>
  )
}

const rootElement = document.getElementById('root')!

// Verhindere doppelte Root-Erstellung
if (!rootElement._reactRootContainer) {
  const root = createRoot(rootElement)
  root.render(<App />)
}