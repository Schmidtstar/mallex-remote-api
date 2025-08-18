import React, { Suspense, lazy } from 'react'
import { createHashRouter, createBrowserRouter, Navigate, Route } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import ErrorBoundary from './components/ErrorBoundary'
import { EnhancedLoadingSpinner } from './components/EnhancedLoadingSpinner'
import { intelligentPreload } from './utils/lazyImports'

// MonitoringService Import fix - Synchronous fallback
let MonitoringService: any = { trackError: () => {} }

// Async import with fallback
import('./lib/monitoring').then((monitoring) => {
  MonitoringService = monitoring.MonitoringService
}).catch(() => {
  console.warn('MonitoringService fallback used')
})

// Safe lazy loading with better error handling
const createSafeLazy = (importFn: () => Promise<any>, componentName: string) => {
  return lazy(async () => {
    try {
      const module = await importFn()

      // Multiple fallback strategies
      const Component = module.default || Object.values(module)[0]

      if (typeof Component !== 'function' && typeof Component !== 'object') {
        throw new Error(`No valid component found for ${componentName}`)
      }

      return { default: Component }
    } catch (error: any) {
      console.error(`Failed to load ${componentName}:`, error)

      // Safe error tracking
      try {
        if (MonitoringService && typeof MonitoringService.trackError === 'function') {
          MonitoringService.trackError('lazy_loading_error', {
            component: componentName,
            error: error?.message || 'Unknown error'
          })
        }
      } catch (trackingError) {
        console.warn('Error tracking failed:', trackingError)
      }

      // Return enhanced fallback component
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
            margin: '1rem'
          }}>
            <div style={{ fontSize: '3rem' }}>⚠️</div>
            <h3 style={{ margin: '0.5rem 0', color: '#c9aa71' }}>
              {componentName} konnte nicht geladen werden
            </h3>
            <p style={{ textAlign: 'center', opacity: 0.8, marginBottom: '1rem' }}>
              Möglicherweise ist ein temporärer Fehler aufgetreten.
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
                fontSize: '14px',
                transition: 'transform 0.2s ease'
              }}
              onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
              onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
            >
              🔄 Seite neu laden
            </button>
          </div>
        )
      }
    }
  })
}

// All lazy components with safe loading
const TabLayout = createSafeLazy(() => import('./layouts/TabLayout'), 'TabLayout')
const AuthScreen = createSafeLazy(() => import('./features/Auth/AuthScreen'), 'AuthScreen')
const PostfachScreen = createSafeLazy(() => import('./components/NotificationCenter'), 'NotificationCenter')
const PrivacyDashboard = createSafeLazy(() => import('./features/Privacy/PrivacyDashboard'), 'PrivacyDashboard')

// Lazy imports for specific features
const LazyArenaScreen = createSafeLazy(() => import('./features/Arena/ArenaScreen'), 'ArenaScreen')
const LazyLegendsScreen = createSafeLazy(() => import('./features/Legends/LegendsScreen'), 'LegendsScreen')
const LazyLeaderboardScreen = createSafeLazy(() => import('./features/Leaderboard/LeaderboardScreen'), 'LeaderboardScreen')
const LazyTasksOverviewScreen = createSafeLazy(() => import('./features/Tasks/TasksOverviewScreen'), 'TasksOverviewScreen')
const LazySuggestTaskScreen = createSafeLazy(() => import('./features/Tasks/SuggestTaskScreen'), 'SuggestTaskScreen')
const LazyAdminTasksScreen = createSafeLazy(() => import('./features/Tasks/AdminTasksScreen'), 'AdminTasksScreen')
const LazyAdminDashboard = createSafeLazy(() => import('./features/Admin/AdminDashboard'), 'AdminDashboard')
const RequireAdmin = createSafeLazy(() => import('./routes/guards/RequireAdmin'), 'RequireAdmin')
const MenuScreen = createSafeLazy(() => import('./features/Menu/MenuScreen'), 'MenuScreen')


// Starte intelligent preloading mit Error-Handling
try {
  intelligentPreload()
} catch (error) {
  console.warn('Intelligent preloading failed:', error)
}

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
            <LazyArenaScreen />
          </Suspense>
        ),
        errorElement: <ErrorBoundary><div>Fehler in Arena</div></ErrorBoundary>
      },
      {
        path: 'arena',
        element: (
          <Suspense fallback={<EnhancedLoadingSpinner variant="arena" size="large" />}>
            <LazyArenaScreen />
          </Suspense>
        ),
        errorElement: <ErrorBoundary><div>Fehler in Arena</div></ErrorBoundary>
      },
      {
        path: 'legends',
        element: (
          <Suspense fallback={<EnhancedLoadingSpinner variant="legends" size="large" />}>
            <LazyLegendsScreen />
          </Suspense>
        ),
        errorElement: <ErrorBoundary><div>Fehler in Legenden</div></ErrorBoundary>
      },
      {
        path: 'leaderboard',
        element: (
          <Suspense fallback={<EnhancedLoadingSpinner variant="leaderboard" size="large" />}>
            <LazyLeaderboardScreen />
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
          <Suspense fallback={<EnhancedLoadingSpinner variant="tasks" size="large" />}>
            <LazyTasksOverviewScreen />
          </Suspense>
        ),
        errorElement: <ErrorBoundary><div>Fehler in Aufgaben-Übersicht</div></ErrorBoundary>
      },
      {
        path: 'tasks/suggest',
        element: (
          <Suspense fallback={<EnhancedLoadingSpinner variant="suggest" size="large" />}>
            <LazySuggestTaskScreen />
          </Suspense>
        ),
        errorElement: <ErrorBoundary><div>Fehler beim Vorschlagen von Aufgaben</div></ErrorBoundary>
      },
      {
        path: 'admin/tasks',
        element: (
          <Suspense fallback={<EnhancedLoadingSpinner variant="admin" size="large" />}>
            <RequireAdmin>
              <LazyAdminTasksScreen />
            </RequireAdmin>
          </Suspense>
        ),
        errorElement: <ErrorBoundary><div>Fehler im Admin-Tasks-Bereich</div></ErrorBoundary>
      },
      {
        path: 'admin',
        element: (
          <Suspense fallback={<EnhancedLoadingSpinner variant="admin" size="large" />}>
            <RequireAdmin>
              <LazyAdminDashboard />
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