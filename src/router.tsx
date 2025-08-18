
import React, { Suspense, lazy } from 'react'
import { createHashRouter, createBrowserRouter, Navigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import ErrorBoundary from './components/ErrorBoundary'
import { EnhancedLoadingSpinner } from './components/EnhancedLoadingSpinner'

// Safe lazy loading utility
const createSafeLazy = (importFn: () => Promise<any>, componentName: string) => {
  return lazy(async () => {
    try {
      const module = await importFn()
      const Component = module.default || Object.values(module)[0]

      if (!Component) {
        throw new Error(`Component ${componentName} could not be loaded`)
      }

      return { default: Component }
    } catch (error: any) {
      console.error(`❌ Failed to load ${componentName}:`, error)

      // User-friendly fallback
      return {
        default: () => (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            height: '60vh',
            gap: '1rem',
            color: '#c9aa71',
            background: 'linear-gradient(135deg, #0b1327 0%, #0b0f1b 100%)',
            padding: '2rem',
            borderRadius: '12px',
            margin: '1rem',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '3rem' }}>⚠️</div>
            <h3 style={{ margin: '0.5rem 0', color: '#c9aa71' }}>
              {componentName} nicht verfügbar
            </h3>
            <p style={{ opacity: 0.8, marginBottom: '1rem' }}>
              Ein temporärer Fehler ist aufgetreten.
            </p>
            <button
              onClick={() => window.location.reload()}
              style={{
                padding: '12px 24px',
                background: 'linear-gradient(135deg, #c9aa71 0%, #8b7355 100%)',
                color: '#0b0f1b',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontWeight: 'bold',
                fontSize: '14px'
              }}
            >
              🔄 Neu laden
            </button>
          </div>
        )
      }
    }
  })
}

// Core components
const TabLayout = createSafeLazy(() => import('./layouts/TabLayout'), 'TabLayout')
const AuthScreen = createSafeLazy(() => import('./features/Auth/AuthScreen'), 'AuthScreen')

// Feature components
const ArenaScreen = createSafeLazy(() => import('./features/Arena/ArenaScreen'), 'ArenaScreen')
const LegendsScreen = createSafeLazy(() => import('./features/Legends/LegendsScreen'), 'LegendsScreen')
const LeaderboardScreen = createSafeLazy(() => import('./features/Leaderboard/LeaderboardScreen'), 'LeaderboardScreen')
const MenuScreen = createSafeLazy(() => import('./features/Menu/MenuScreen'), 'MenuScreen')
const TasksOverviewScreen = createSafeLazy(() => import('./features/Tasks/TasksOverviewScreen'), 'TasksOverviewScreen')
const SuggestTaskScreen = createSafeLazy(() => import('./features/Tasks/SuggestTaskScreen'), 'SuggestTaskScreen')
const NotificationCenter = createSafeLazy(() => import('./components/NotificationCenter'), 'NotificationCenter')
const PrivacyDashboard = createSafeLazy(() => import('./features/Privacy/PrivacyDashboard'), 'PrivacyDashboard')

// Admin components
const AdminTasksScreen = createSafeLazy(() => import('./features/Tasks/AdminTasksScreen'), 'AdminTasksScreen')
const AdminDashboard = createSafeLazy(() => import('./features/Admin/AdminDashboard'), 'AdminDashboard')
const RequireAdmin = createSafeLazy(() => import('./routes/guards/RequireAdmin'), 'RequireAdmin')

// Auth guard for protected routes
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()

  if (loading) {
    return <EnhancedLoadingSpinner variant="auth" size="large" />
  }

  if (!user) {
    return <Navigate to="/auth" replace />
  }

  return <>{children}</>
}

// Route definitions with clear structure
const routes = [
  // Public routes
  {
    path: '/auth',
    element: (
      <Suspense fallback={<EnhancedLoadingSpinner variant="auth" size="large" />}>
        <AuthScreen />
      </Suspense>
    ),
    errorElement: <ErrorBoundary><div>Anmeldung nicht verfügbar</div></ErrorBoundary>
  },

  // Protected routes
  {
    path: '/',
    element: (
      <ProtectedRoute>
        <Suspense fallback={<EnhancedLoadingSpinner variant="general" size="medium" />}>
          <TabLayout />
        </Suspense>
      </ProtectedRoute>
    ),
    errorElement: <ErrorBoundary><div>App nicht verfügbar</div></ErrorBoundary>,
    children: [
      // Main navigation
      {
        index: true,
        element: (
          <Suspense fallback={<EnhancedLoadingSpinner variant="arena" size="large" />}>
            <ArenaScreen />
          </Suspense>
        )
      },
      {
        path: 'arena',
        element: (
          <Suspense fallback={<EnhancedLoadingSpinner variant="arena" size="large" />}>
            <ArenaScreen />
          </Suspense>
        )
      },
      {
        path: 'legends',
        element: (
          <Suspense fallback={<EnhancedLoadingSpinner variant="legends" size="large" />}>
            <LegendsScreen />
          </Suspense>
        )
      },
      {
        path: 'leaderboard',
        element: (
          <Suspense fallback={<EnhancedLoadingSpinner variant="leaderboard" size="large" />}>
            <LeaderboardScreen />
          </Suspense>
        )
      },
      {
        path: 'menu',
        element: (
          <Suspense fallback={<EnhancedLoadingSpinner variant="general" size="medium" />}>
            <MenuScreen />
          </Suspense>
        )
      },

      // Secondary features
      {
        path: 'tasks',
        element: (
          <Suspense fallback={<EnhancedLoadingSpinner variant="tasks" size="large" />}>
            <TasksOverviewScreen />
          </Suspense>
        )
      },
      {
        path: 'tasks/suggest',
        element: (
          <Suspense fallback={<EnhancedLoadingSpinner variant="suggest" size="large" />}>
            <SuggestTaskScreen />
          </Suspense>
        )
      },
      {
        path: 'postfach',
        element: (
          <Suspense fallback={<EnhancedLoadingSpinner variant="general" size="medium" />}>
            <NotificationCenter />
          </Suspense>
        )
      },
      {
        path: 'privacy',
        element: (
          <Suspense fallback={<EnhancedLoadingSpinner variant="general" size="medium" />}>
            <PrivacyDashboard />
          </Suspense>
        )
      },

      // Admin routes
      {
        path: 'admin',
        element: (
          <Suspense fallback={<EnhancedLoadingSpinner variant="admin" size="large" />}>
            <RequireAdmin>
              <AdminDashboard />
            </RequireAdmin>
          </Suspense>
        )
      },
      {
        path: 'admin/tasks',
        element: (
          <Suspense fallback={<EnhancedLoadingSpinner variant="admin" size="large" />}>
            <RequireAdmin>
              <AdminTasksScreen />
            </RequireAdmin>
          </Suspense>
        )
      },

      // Redirects for better UX
      {
        path: 'profile',
        element: <Navigate to="/menu?tab=profile" replace />
      },
      {
        path: 'settings', 
        element: <Navigate to="/menu?tab=settings" replace />
      },
      {
        path: 'admin/dashboard',
        element: <Navigate to="/admin" replace />
      }
    ]
  },

  // Catch-all redirect
  {
    path: '*',
    element: <Navigate to="/" replace />
  }
]

// Router configuration
const useHash = import.meta.env.VITE_HASH_ROUTER === '1'

export const router = useHash 
  ? createHashRouter(routes)
  : createBrowserRouter(routes)
