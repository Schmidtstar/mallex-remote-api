
import React, { Suspense } from 'react'
import { createHashRouter, createBrowserRouter, Navigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import { ErrorBoundary } from './components/ErrorBoundary'

// Lazy load components mit verbesserter Fehlerbehandlung
const TabLayout = React.lazy(() => 
  import('./layouts/TabLayout')
    .then(m => ({ default: m.TabLayout }))
    .catch(error => {
      console.error('Failed to load TabLayout:', error)
      throw error
    })
)

const ArenaScreen = React.lazy(() => 
  import('./features/Arena/ArenaScreen')
    .then(m => ({ default: m.ArenaScreen }))
    .catch(error => {
      console.error('Failed to load ArenaScreen:', error)
      throw error
    })
)

const LegendsScreen = React.lazy(() => 
  import('./features/Legends/LegendsScreen')
    .then(m => ({ default: m.LegendsScreen }))
    .catch(error => {
      console.error('Failed to load LegendsScreen:', error)
      throw error
    })
)

const LeaderboardScreen = React.lazy(() => 
  import('./features/Leaderboard/LeaderboardScreen')
    .then(m => ({ default: m.LeaderboardScreen }))
    .catch(error => {
      console.error('Failed to load LeaderboardScreen:', error)
      throw error
    })
)

const MenuScreen = React.lazy(() => 
  import('./features/Menu/MenuScreen')
    .then(m => ({ default: m.MenuScreen }))
    .catch(error => {
      console.error('Failed to load MenuScreen:', error)
      throw error
    })
)

const TasksOverviewScreen = React.lazy(() => 
  import('./features/Tasks/TasksOverviewScreen')
    .then(m => ({ default: m.TasksOverviewScreen }))
    .catch(error => {
      console.error('Failed to load TasksOverviewScreen:', error)
      throw error
    })
)

const AdminTasksScreen = React.lazy(() => 
  import('./features/Tasks/AdminTasksScreen')
    .then(m => ({ default: m.AdminTasksScreen }))
    .catch(error => {
      console.error('Failed to load AdminTasksScreen:', error)
      throw error
    })
)

const AdminDashboard = React.lazy(() => 
  import('./features/Admin/AdminDashboard')
    .then(m => ({ default: m.default }))
    .catch(error => {
      console.error('Failed to load AdminDashboard:', error)
      throw error
    })
)

const RequireAdmin = React.lazy(() => 
  import('./routes/guards/RequireAdmin')
    .then(m => ({ default: m.default }))
    .catch(error => {
      console.error('Failed to load RequireAdmin:', error)
      throw error
    })
)

const AuthScreen = React.lazy(() => 
  import('./features/Auth/AuthScreen')
    .then(m => ({ default: m.AuthScreen }))
    .catch(error => {
      console.error('Failed to load AuthScreen:', error)
      throw error
    })
)

const PostfachScreen = React.lazy(() => 
  import('./components/NotificationCenter')
    .then(m => ({ default: m.PostfachScreen }))
    .catch(error => {
      console.error('Failed to load PostfachScreen:', error)
      throw error
    })
)

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
            path: 'users',
            element: <AdminDashboard />,
            errorElement: <ErrorBoundary><div>Fehler in Benutzerverwaltung</div></ErrorBoundary>
          },
          {
            path: 'settings',
            element: <AdminDashboard />,
            errorElement: <ErrorBoundary><div>Fehler in Admin-Einstellungen</div></ErrorBoundary>
          },
          {
            path: 'admins',
            element: <AdminDashboard />,
            errorElement: <ErrorBoundary><div>Fehler in Admin-Verwaltung</div></ErrorBoundary>
          },
          {
            path: 'notifications',
            element: <AdminDashboard />,
            errorElement: <ErrorBoundary><div>Fehler in Benachrichtigungen</div></ErrorBoundary>
          },
          {
            path: 'tasks',
            element: <AdminTasksScreen />,
            errorElement: <ErrorBoundary><div>Fehler im Adminbereich</div></ErrorBoundary>
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
