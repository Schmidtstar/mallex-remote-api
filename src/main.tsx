import React from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider } from 'react-router-dom'
import { router } from './router'
import './styles/index.css'
import './i18n' // Side-effect Import für i18n Initialisierung
import { AuthProvider } from './context/AuthContext'
import { AdminProvider } from './context/AdminContext'
import { PlayersProvider } from './context/PlayersContext'
import { TaskSuggestionsProvider } from './context/TaskSuggestionsContext'
import { ErrorBoundary } from './components/ErrorBoundary'

createRoot(document.getElementById('root')!).render(
  <AuthProvider>
    <AdminProvider>
      <PlayersProvider>
        <TaskSuggestionsProvider>
          <RouterProvider router={router} future={{
            v7_startTransition: true
          }}
          />
        </TaskSuggestionsProvider>
      </PlayersProvider>
    </AdminProvider>
  </AuthProvider>
)