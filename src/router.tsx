import React, { Suspense } from 'react'
import { createHashRouter, createBrowserRouter, Navigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import { ErrorBoundary } from './components/ErrorBoundary'

// Lazy load components mit Preload-Optimierung
const TabLayout = React.lazy(() => import(/* webpackPreload: true */ './layouts/TabLayout').then(m => ({ default: m.TabLayout })))
const ArenaScreen = React.lazy(() => import(/* webpackPrefetch: true */ './features/Arena/ArenaScreen').then(m => ({ default: m.ArenaScreen })))
const LegendsScreen = React.lazy(() => import('./features/Legends/LegendsScreen').then(m => ({ default: m.LegendsScreen })))
const LeaderboardScreen = React.lazy(() => import('./features/Leaderboard/LeaderboardScreen').then(m => ({ default: m.LeaderboardScreen })))
const MenuScreen = React.lazy(() => import('./features/Menu/MenuScreen').then(m => ({ default: m.MenuScreen })))
const TasksOverviewScreen = React.lazy(() => import('./features/Tasks/TasksOverviewScreen').then(m => ({ default: m.TasksOverviewScreen })))
const SuggestTaskScreen = React.lazy(() => import('./features/Tasks/SuggestTaskScreen').then(m => ({ default: m.SuggestTaskScreen })))
const AdminTasksScreen = React.lazy(() => import('./features/Tasks/AdminTasksScreen').then(m => ({ default: m.AdminTasksScreen })))
const AdminSuggestionsScreen = React.lazy(() => import('./features/Admin/AdminSuggestionsScreen').then(m => ({ default: m.AdminSuggestionsScreen })))
const AdminDashboard = React.lazy(() => import('./features/Admin/AdminDashboard').then(m => ({ default: m.AdminDashboard })))
const RequireAdmin = React.lazy(() => import('./routes/guards/RequireAdmin').then(m => ({ default: m.default })))
const AuthScreen = React.lazy(() => import('./features/Auth/AuthScreen').then(m => ({ default: m.AuthScreen })))
const PostfachScreen = React.lazy(() => import('./components/NotificationCenter').then(m => ({ default: m.PostfachScreen })))

const LoadingSpinner = () => (
  <div style={{ 
    display: 'flex', 
    flexDirection: 'column',
    justifyContent: 'center', 
    alignItems: 'center', 
    height: '50vh',
    fontSize: '1rem',
    color: '#666',
    gap: '10px'
  }}>
    <div style={{ fontSize: '2rem' }}>⚡</div>
    <div>Laden...</div>
  </div>
)

const useHash = import.meta.env.VITE_HASH_ROUTER === '1'

function withAuth(element: React.ReactNode) {
  const Guard = () => {
    const { user, loading } = useAuth()
    if (loading) return <LoadingSpinner />
    if (!user) return <Navigate to="/auth" replace />
    return <Suspense fallback={<LoadingSpinner />}>{element}</Suspense>
  }
  return <Guard />
}

// ProtectedRoutes removed - using withAuth wrapper instead

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
        element: <SuggestTaskScreen />,
        errorElement: <ErrorBoundary><div>Fehler beim Vorschlagen</div></ErrorBoundary>
      },
      {
        path: 'admin',
        element: <RequireAdmin />,
        errorElement: <ErrorBoundary><div>Fehler beim Admin-Zugriff</div></ErrorBoundary>,
        children: [
          {
            index: true,
            element: <AdminDashboard />,
            errorElement: <ErrorBoundary><div>Fehler im Admin Dashboard</div></ErrorBoundary>
          },
          {
            path: 'dashboard',
            element: <AdminDashboard />,
            errorElement: <ErrorBoundary><div>Fehler im Admin Dashboard</div></ErrorBoundary>
          },
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

export const router = useHash
  ? createHashRouter(routes)
  : createBrowserRouter(routes)