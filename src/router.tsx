import React from 'react'
import { createHashRouter, createBrowserRouter, Navigate, Outlet } from 'react-router-dom'
import { TabLayout } from './layouts/TabLayout'
import { ArenaScreen } from './features/Arena/ArenaScreen'
import { LegendsScreen } from './features/Legends/LegendsScreen'
import { LeaderboardScreen } from './features/Leaderboard/LeaderboardScreen'
import { MenuScreen } from './features/Menu/MenuScreen'
import { TasksOverviewScreen } from './features/Tasks/TasksOverviewScreen'
import { SuggestTaskScreen } from './features/Tasks/SuggestTaskScreen'
import { AdminTasksScreen } from './features/Tasks/AdminTasksScreen'
import { AdminSuggestionsScreen } from './features/Admin/AdminSuggestionsScreen'
import RequireAdmin from './routes/guards/RequireAdmin'

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

const ProtectedRoutes = () => {
  const { user, loading } = useAuth()

  if (loading) {
    return <div style={{ padding: '20px', textAlign: 'center' }}>Loading...</div>
  }

  return (
    <TabLayout />
  )
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
        path: 'leaderboard',
        element: <LeaderboardScreen />,
        errorElement: <ErrorBoundary><div>Fehler in Rangliste</div></ErrorBoundary>
      },
      {
        path: 'menu',
        element: <MenuScreen />,
        errorElement: <ErrorBoundary><div>Fehler im Menü</div></ErrorBoundary>
      },
      {
        path: 'tasks',
        element: <TasksOverviewScreen />,
        errorElement: <ErrorBoundary><div>Fehler in Aufgaben-Übersicht</div></ErrorBoundary>
      },
      {
        path: 'tasks/suggest',
        element: <SuggestTaskScreen />,
        errorElement: <ErrorBoundary><div>Fehler beim Vorschlagen</div></ErrorBoundary>
      },
      {
        path: 'admin',
        element: <RequireAdmin />,
        errorElement: <ErrorBoundary><div>Fehler beim Admin-Zugriff</div></ErrorBoundary>,
        children: [
          {
            path: 'tasks',
            element: <AdminTasksScreen />,
            errorElement: <ErrorBoundary><div>Fehler im Adminbereich</div></ErrorBoundary>
          },
          {
            path: 'suggestions',
            element: <AdminSuggestionsScreen />,
            errorElement: <ErrorBoundary><div>Fehler bei Vorschlag-Moderation</div></ErrorBoundary>
          }
        ]
      },
      {
        path: 'profile',
        element: <Navigate to="/menu?tab=profile" replace />,
        errorElement: <ErrorBoundary><div>Fehler beim Weiterleiten</div></ErrorBoundary>
      },
      {
        path: 'settings',
        element: <Navigate to="/menu?tab=settings" replace />,
        errorElement: <ErrorBoundary><div>Fehler beim Weiterleiten</div></ErrorBoundary>
      }
    ]
  }
]

const router = useHash
  ? createHashRouter(routes)
  : createBrowserRouter(routes)

export { router }