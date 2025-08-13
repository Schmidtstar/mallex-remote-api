import React, { useState } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider } from 'react-router-dom'
import { router } from './router'
import './styles/index.css'
import './i18n' // Side-effect Import für i18n Initialisierung
import { AuthProvider } from './context/AuthContext'
import { AdminProvider } from './context/AdminContext'
import { PlayersProvider } from './context/PlayersContext'
import { TaskSuggestionsProvider } from './context/TaskSuggestionsContext'
import { IntroScreen } from './components/IntroScreen'

const App = () => {
  const [showIntro, setShowIntro] = useState(true)
  
  if (showIntro) {
    return <IntroScreen onComplete={() => setShowIntro(false)} />
  }
  
  return (
    <AuthProvider>
      <AdminProvider>
        <PlayersProvider>
          <TaskSuggestionsProvider>
            <RouterProvider router={router} />
          </TaskSuggestionsProvider>
        </PlayersProvider>
      </AdminProvider>
    </AuthProvider>
  )
}

createRoot(document.getElementById('root')!).render(<App />)