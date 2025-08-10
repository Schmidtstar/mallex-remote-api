import React from 'react'
import { createHashRouter, createBrowserRouter, Navigate } from 'react-router-dom'
import TabLayout from '@/layouts/TabLayout'
import ArenaScreen from '@/features/Arena/ArenaScreen'
import LegendsScreen from '@/features/Legends/LegendsScreen'
import MenuScreen from '@/features/Menu/MenuScreen'
import AuthScreen from '@/features/Auth/AuthScreen'
import { useAuth } from '@/context/AuthContext'

const useHash = import.meta.env.VITE_HASH_ROUTER === '1'

function withAuth(element: React.ReactNode) {
  const Guard = () => {
    const { user, loading } = useAuth()
    if (loading) return <div style={{padding:24}}>Laden…</div>
    if (!user) return <Navigate to="/auth" replace />
    return <>{element}</>
  }
  return <Guard />
}

const routes = [
  { path: '/auth', element: <AuthScreen /> },
  {
    path: '/',
    element: withAuth(<TabLayout />),
    children: [
      { index: true, element: <ArenaScreen /> },
      { path: 'arena', element: <ArenaScreen /> },
      { path: 'legends', element: <LegendsScreen /> },
      { path: 'menu', element: <MenuScreen /> }
    ]
  }
]

export default useHash ? createHashRouter(routes, {
  future: {
    v7_startTransition: true
  }
}) : createBrowserRouter(routes, {
  future: {
    v7_startTransition: true
  }
})
