
import React, { Suspense, lazy } from 'react'
import { createHashRouter, createBrowserRouter, Navigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import ErrorBoundary from './components/ErrorBoundary'
import { LoadingSpinner } from './components/LoadingSpinner'
import { EnhancedLoadingSpinner } from './components/EnhancedLoadingSpinner'

// MonitoringService Import fix
let MonitoringService: any
try {
  const monitoring = await import('./lib/monitoring')
  MonitoringService = monitoring.MonitoringService
} catch {
  MonitoringService = { trackError: () => {} }
}

// Safe lazy loading with better error handling
const createSafeLazy = (importFn: () => Promise<any>, componentName: string) => {
  return lazy(async () => {
    try {
      const module = await importFn()
      // Ensure we have a valid default export
      const Component = module.default || module[componentName] || module
      if (typeof Component !== 'function') {
        throw new Error(`No valid component found for ${componentName}`)
      }
      return { default: Component }
    } catch (error) {
      console.error(`Failed to load ${componentName}:`, error)
      MonitoringService?.trackError?.('lazy_loading_error', {
        component: componentName,
        error: error.message
      })
      // Return fallback component
      return {
        default: () => (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            height: '60vh',
            gap: '1rem',
            color: 'var(--ancient-bronze)'
          }}>
            <div style={{ fontSize: '3rem' }}>⚠️</div>
            <h3>{componentName} konnte nicht geladen werden</h3>
            <button
              onClick={() => window.location.reload()}
              style={{
                padding: '8px 16px',
                background: 'var(--ancient-gold)',
                color: 'var(--ancient-night)',
                border: 'none',
                borderRadius: 'var(--radius)',
                cursor: 'pointer'
              }}
            >
              Seite neu laden
            </button>
          </div>
        )
      }
    }
  })
}

// All lazy components with safe loading
const TabLayout = createSafeLazy(() => import('./layouts/TabLayout'), 'TabLayout')
const ArenaScreen = createSafeLazy(() => import('./features/Arena/ArenaScreen'), 'ArenaScreen')
const LegendsScreen = createSafeLazy(() => import('./features/Legends/LegendsScreen'), 'LegendsScreen')
const LeaderboardScreen = createSafeLazy(() => import('./features/Leaderboard/LeaderboardScreen'), 'LeaderboardScreen')
const MenuScreen = createSafeLazy(() => import('./features/Menu/MenuScreen'), 'MenuScreen')
const TasksOverviewScreen = createSafeLazy(() => import('./features/Tasks/TasksOverviewScreen'), 'TasksOverviewScreen')
const SuggestTaskScreen = createSafeLazy(() => import('./features/Tasks/SuggestTaskScreen'), 'SuggestTaskScreen')
const AdminTasksScreen = createSafeLazy(() => import('./features/Tasks/AdminTasksScreen'), 'AdminTasksScreen')
const AdminDashboard = createSafeLazy(() => import('./features/Admin/AdminDashboard'), 'AdminDashboard')
const RequireAdmin = createSafeLazy(() => import('./routes/guards/RequireAdmin'), 'RequireAdmin')
const AuthScreen = createSafeLazy(() => import('./features/Auth/AuthScreen'), 'AuthScreen')
const PostfachScreen = createSafeLazy(() => import('./components/NotificationCenter'), 'NotificationCenter')
const PrivacyDashboard = createSafeLazy(() => import('./features/Privacy/PrivacyDashboard'), 'PrivacyDashboard')

function withAuth(element: React.ReactNode) {
  const Guard = () => {
    const { user, loading } = useAuth()
    if (loading) return <EnhancedLoadingSpinner variant="auth" size="large" />
    if (!user) return <Navigate to="/auth" replace />
    return <Suspense fallback={<EnhancedLoadingSpinner variant="general" size="medium" />}>{element}</Suspense>
  }
  return <Guard />
}

const routes = [
  {
    path: '/auth',
    element: (
      <Suspense fallback={<EnhancedLoadingSpinner variant="auth" size="large" />}>
        <AuthScreen />
      </Suspense>
    ),
    errorElement: <ErrorBoundary><div>Fehler beim Laden der Anmeldung</div></ErrorBoundary>
  },
  {
    path: '/',
    element: withAuth(<TabLayout />),
    errorElement: <ErrorBoundary><div>Fehler beim Laden der App</div></ErrorBoundary>,
    children: [
      {
        index: true,
        element: (
          <Suspense fallback={<EnhancedLoadingSpinner variant="arena" size="large" />}>
            <ArenaScreen />
          </Suspense>
        ),
        errorElement: <ErrorBoundary><div>Fehler in Arena</div></ErrorBoundary>
      },
      {
        path: 'arena',
        element: (
          <Suspense fallback={<EnhancedLoadingSpinner variant="arena" size="large" />}>
            <ArenaScreen />
          </Suspense>
        ),
        errorElement: <ErrorBoundary><div>Fehler in Arena</div></ErrorBoundary>
      },
      {
        path: 'legends',
        element: (
          <Suspense fallback={<EnhancedLoadingSpinner variant="general" size="medium" />}>
            <LegendsScreen />
          </Suspense>
        ),
        errorElement: <ErrorBoundary><div>Fehler in Legenden</div></ErrorBoundary>
      },
      {
        path: 'leaderboard',
        element: (
          <Suspense fallback={<EnhancedLoadingSpinner variant="general" size="medium" />}>
            <LeaderboardScreen />
          </Suspense>
        ),
        errorElement: <ErrorBoundary><div>Fehler in Rangliste</div></ErrorBoundary>
      },
      {
        path: 'menu',
        element: (
          <Suspense fallback={<EnhancedLoadingSpinner variant="general" size="medium" />}>
            <MenuScreen />
          </Suspense>
        ),
        errorElement: <ErrorBoundary><div>Fehler im Menü</div></ErrorBoundary>
      },
      {
        path: 'postfach',
        element: (
          <Suspense fallback={<EnhancedLoadingSpinner variant="general" size="medium" />}>
            <PostfachScreen />
          </Suspense>
        ),
        errorElement: <ErrorBoundary><div>Fehler im Postfach</div></ErrorBoundary>
      },
      {
        path: 'tasks',
        element: (
          <Suspense fallback={<EnhancedLoadingSpinner variant="general" size="medium" />}>
            <TasksOverviewScreen />
          </Suspense>
        ),
        errorElement: <ErrorBoundary><div>Fehler in Aufgaben-Übersicht</div></ErrorBoundary>
      },
      {
        path: 'tasks/suggest',
        element: (
          <Suspense fallback={<EnhancedLoadingSpinner variant="general" size="medium" />}>
            <SuggestTaskScreen />
          </Suspense>
        ),
        errorElement: <ErrorBoundary><div>Fehler beim Vorschlagen von Aufgaben</div></ErrorBoundary>
      },
      {
        path: 'tasks/admin',
        element: (
          <Suspense fallback={<EnhancedLoadingSpinner variant="admin" size="medium" />}>
            <RequireAdmin>
              <AdminTasksScreen />
            </RequireAdmin>
          </Suspense>
        ),
        errorElement: <ErrorBoundary><div>Fehler im Admin-Tasks-Bereich</div></ErrorBoundary>
      },
      {
        path: 'admin',
        element: (
          <Suspense fallback={<EnhancedLoadingSpinner variant="admin" size="medium" />}>
            <RequireAdmin>
              <AdminDashboard />
            </RequireAdmin>
          </Suspense>
        ),
        errorElement: <ErrorBoundary><div>Fehler im Admin-Bereich</div></ErrorBoundary>
      },
      {
        path: 'privacy',
        element: (
          <Suspense fallback={<EnhancedLoadingSpinner variant="general" size="medium" />}>
            <PrivacyDashboard />
          </Suspense>
        ),
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
