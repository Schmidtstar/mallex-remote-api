import React from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider } from 'react-router-dom'
import router from './router'
import './styles/index.css'
import './i18n'
import { AuthProvider } from './context/AuthContext'

createRoot(document.getElementById('root')!).render(
  <AuthProvider>
    <RouterProvider 
      router={router} 
      future={{ 
        v7_startTransition: true 
      }} 
    />
  </AuthProvider>
)
