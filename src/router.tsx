import React, { Suspense, lazy } from 'react'
import { createHashRouter, createBrowserRouter, Navigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import ErrorBoundary from './components/ErrorBoundary'
import { LoadingSpinner } from './components/LoadingSpinner'

// Lazy load components mit Prioritäts-System und Error Fallbacks
const LazyHomeScreen = lazy(() => 
  import('./features/Menu/MenuScreen').catch(() => ({ default: () => <div>Menu Error</div> }))
)
const LazyArenaScreen = lazy(() => 
  import('./features/Arena/ArenaScreen').catch(() => ({ default: () => <div>Arena Error</div> }))
)
const LazyLegendsScreen = lazy(() => 
  import('./features/Legends/LegendsScreen').catch(() => ({ default: () => <div>Legends Error</div> }))
)
const LazyLeaderboardScreen = lazy(() => 
  import('./features/Leaderboard/LeaderboardScreen').catch(() => ({ default: () => <div>Leaderboard Error</div> }))
)
const LazyAuthScreen = lazy(() => 
  import('./features/Auth/AuthScreen').catch(() => ({ default: () => <div>Auth Error</div> }))
)
const LazyAdminDashboard = lazy(() => 
  import('./features/Admin/AdminDashboard').catch(() => ({ default: () => <div>Admin Error</div> }))
)
const LazyAchievementScreen = lazy(() => 
  import('./features/Achievements/AchievementScreen').catch(() => ({ default: () => <div>Achievement Error</div> }))
)
const LazyPrivacyDashboard = lazy(() => 
  import('./features/Privacy/PrivacyDashboard').catch(() => ({ default: () => <div>Privacy Error</div> }))
)
const LazyTasksOverviewScreen = lazy(() => 
  import('./features/Tasks/TasksOverviewScreen').catch(() => ({ default: () => <div>Tasks Error</div> }))
)
const LazySuggestTaskScreen = lazy(() => 
  import('./features/Tasks/SuggestTaskScreen').catch(() => ({ default: () => <div>Suggest Error</div> }))
)
const LazyAdminTasksScreen = lazy(() => 
  import('./features/Tasks/AdminTasksScreen').catch(() => ({ default: () => <div>Admin Tasks Error</div> }))
)

const TabLayout = React.lazy(() => import(/* webpackPreload: true */ './layouts/TabLayout'))
const ArenaScreen = React.lazy(() => import(/* webpackPreload: true */ './features/Arena/ArenaScreen'))
const LegendsScreen = React.lazy(() => import('./features/Legends/LegendsScreen'))
const LeaderboardScreen = React.lazy(() => import('./features/Leaderboard/LeaderboardScreen'))
const MenuScreen = React.lazy(() => import('./features/Menu/MenuScreen'))
const TasksOverviewScreen = React.lazy(() => import('./features/Tasks/TasksOverviewScreen'))
const SuggestTaskScreen = React.lazy(() => import('./features/Tasks/SuggestTaskScreen'))
const AdminTasksScreen = React.lazy(() => import('./features/Tasks/AdminTasksScreen'))

const AdminDashboard = React.lazy(() => import('./features/Admin/AdminDashboard'))
const RequireAdmin = React.lazy(() => import('./routes/guards/RequireAdmin'))
const AuthScreen = React.lazy(() => import('./features/Auth/AuthScreen'))
const PostfachScreen = React.lazy(() => import('./components/NotificationCenter'))
import PrivacyDashboard from './features/Privacy/PrivacyDashboard'

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
        path: '/admin',
        element: (
          <RequireAdmin>
            <AdminDashboard />
          </RequireAdmin>
        )
      },
      {
        path: '/privacy',
        element: <PrivacyDashboard />
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