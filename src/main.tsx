import React from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider } from 'react-router-dom'
import router from './router'
import './styles/index.css'
import './i18n'
import { AuthProvider } from './context/AuthContext'
import { PlayersProvider } from './context/PlayersContext'

createRoot(document.getElementById('root')!).render(
  <AuthProvider>
    <PlayersProvider>
      <RouterProvider router={router} future={{ 
        v7_startTransition: true 
      }} 
    />
    </PlayersProvider>
  </AuthProvider>
)