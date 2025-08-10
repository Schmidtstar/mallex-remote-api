
import React from 'react'
import { createHashRouter, createBrowserRouter, Navigate } from 'react-router-dom'
import { TabLayout } from './layouts/TabLayout'
import { ArenaScreen } from './features/Arena/ArenaScreen'
import { LegendsScreen } from './features/Legends/LegendsScreen'
import { MenuScreen } from './features/Menu/MenuScreen'
import { AuthScreen } from './features/Auth/AuthScreen'
import { ErrorBoundary } from './components/ErrorBoundary'
import { useAuth } from './context/AuthContext'

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
  {
    path: '/auth',
    element: <AuthScreen />,
    errorElement: <ErrorBoundary><div>Fehler beim Laden der Anmeldung</div></ErrorBoundary>
  },
  {
    path: '/',
    element: withAuth(<TabLayout />),
    errorElement: <ErrorBoundary><div>Fehler beim Laden der App</div></ErrorBoundary>,
    children: [
      {
        index: true,
        element: <ArenaScreen />,
        errorElement: <ErrorBoundary><div>Fehler in Arena</div></ErrorBoundary>
      },
      {
        path: 'arena',
        element: <ArenaScreen />,
        errorElement: <ErrorBoundary><div>Fehler in Arena</div></ErrorBoundary>
      },
      {
        path: 'legends',
        element: <LegendsScreen />,
        errorElement: <ErrorBoundary><div>Fehler in Legenden</div></ErrorBoundary>
      },
      {
        path: 'menu',
        element: <MenuScreen />,
        errorElement: <ErrorBoundary><div>Fehler im Menü</div></ErrorBoundary>
      }
    ]
  }
]

const router = useHash
  ? createHashRouter(routes, {
      future: {
        v7_startTransition: true,
        v7_relativeSplatPath: true
      }
    })
  : createBrowserRouter(routes, {
      future: {
        v7_startTransition: true,
        v7_relativeSplatPath: true
      }
    })

export { router }
export default router
