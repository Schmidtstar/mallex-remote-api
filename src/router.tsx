
import React, { Suspense } from 'react'
import { createHashRouter, createBrowserRouter, Navigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import ErrorBoundary from './components/ErrorBoundary'
import { LoadingSpinner } from './components/LoadingSpinner'

// Clean lazy loading - nur EINE Definition pro Component
const TabLayout = React.lazy(() => import('./layouts/TabLayout'))
const ArenaScreen = React.lazy(() => import('./features/Arena/ArenaScreen'))
const LegendsScreen = React.lazy(() => import('./features/Legends/LegendsScreen'))
const LeaderboardScreen = React.lazy(() => import('./features/Leaderboard/LeaderboardScreen'))
const MenuScreen = React.lazy(() => import('./features/Menu/MenuScreen'))
const TasksOverviewScreen = React.lazy(() => import('./features/Tasks/TasksOverviewScreen'))
const AdminDashboard = React.lazy(() => import('./features/Admin/AdminDashboard'))
const RequireAdmin = React.lazy(() => import('./routes/guards/RequireAdmin'))
const AuthScreen = React.lazy(() => import('./features/Auth/AuthScreen'))
const PostfachScreen = React.lazy(() => import('./components/NotificationCenter'))
const PrivacyDashboard = React.lazy(() => import('./features/Privacy/PrivacyDashboard'))

function withAuth(element: React.ReactNode) {
  const Guard = () => {
    const { user, loading } = useAuth()
    if (loading) return <LoadingSpinner />
    if (!user) return <Navigate to="/auth" replace />
    return <Suspense fallback={<LoadingSpinner />}>{element}</Suspense>
  }
  return <Guard />
}

const routes = [
  {
    path: '/auth',
    element: <Suspense fallback={<LoadingSpinner />}><AuthScreen /></Suspense>,
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
        path: 'postfach',
        element: <PostfachScreen />,
        errorElement: <ErrorBoundary><div>Fehler im Postfach</div></ErrorBoundary>
      },
      {
        path: 'tasks',
        element: <TasksOverviewScreen />,
        errorElement: <ErrorBoundary><div>Fehler in Aufgaben-Übersicht</div></ErrorBoundary>
      },
      {
        path: 'tasks/suggest',
        element: <Navigate to="/tasks?tab=suggest" replace />,
        errorElement: <ErrorBoundary><div>Fehler beim Weiterleiten</div></ErrorBoundary>
      },
      {
        path: 'admin',
        element: (
          <RequireAdmin>
            <AdminDashboard />
          </RequireAdmin>
        ),
        errorElement: <ErrorBoundary><div>Fehler im Admin-Bereich</div></ErrorBoundary>
      },
      {
        path: 'privacy',
        element: <PrivacyDashboard />,
        errorElement: <ErrorBoundary><div>Fehler in Privacy</div></ErrorBoundary>
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
      },
      {
        path: 'admin/dashboard',
        element: <Navigate to="/admin" replace />,
        errorElement: <ErrorBoundary><div>Fehler beim Weiterleiten</div></ErrorBoundary>
      }
    ]
  }
]

const useHash = import.meta.env.VITE_HASH_ROUTER === '1'

export const router = useHash
  ? createHashRouter(routes)
  : createBrowserRouter(routes)
