import React, { Suspense, lazy } from 'react'
import { createHashRouter, createBrowserRouter, Navigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import ErrorBoundary from './components/ErrorBoundary'
import { LoadingSpinner } from './components/LoadingSpinner'

// Placeholder for LazyLoader component, assuming it's defined elsewhere and handles lazy component loading with fallbacks.
// For this example, we'll assume LazyLoader is a component that takes children and a fallback prop.
// If LazyLoader is not a real component, this will need to be adjusted.
const LazyLoader = ({ children, fallback }) => (
  <Suspense fallback={fallback}>{children}</Suspense>
);

// Safe lazy loading with explicit default handling
const TabLayout = React.lazy(() => 
  import('./layouts/TabLayout').then(m => ({ default: m.default || m.TabLayout || m }))
)
const ArenaScreen = lazy(() => import('./features/Arena/ArenaScreen').then(module => ({ default: module.ArenaScreen || module.default })))
const LegendsScreen = lazy(() => import('./features/Legends/LegendsScreen').then(module => ({ default: module.LegendsScreen || module.default })))
const LeaderboardScreen = lazy(() => import('./features/Leaderboard/LeaderboardScreen').then(module => ({ default: module.LeaderboardScreen || module.default })))
const MenuScreen = lazy(() => import('./features/Menu/MenuScreen').then(module => ({ default: module.MenuScreen || module.default })))
const TasksOverviewScreen = lazy(() => import('./features/Tasks/TasksOverviewScreen').then(module => ({ default: module.TasksOverviewScreen || module.default })))
const SuggestTaskScreen = lazy(() => import('./features/Tasks/SuggestTaskScreen').then(module => ({ default: module.SuggestTaskScreen || module.default })))
const AdminTasksScreen = lazy(() => import('./features/Tasks/AdminTasksScreen').then(module => ({ default: module.AdminTasksScreen || module.default })))
const AdminDashboard = lazy(() => import('./features/Admin/AdminDashboard').then(module => ({ default: module.AdminDashboard || module.default })))
const RequireAdmin = React.lazy(() => 
  import('./routes/guards/RequireAdmin').then(m => ({ default: m.default || m.RequireAdmin || m }))
)
const AuthScreen = lazy(() => import('./features/Auth/AuthScreen').then(module => ({ default: module.AuthScreen || module.default })))
const PostfachScreen = React.lazy(() => 
  import('./components/NotificationCenter').then(m => ({ default: m.default || m.NotificationCenter || m }))
)
const PrivacyDashboard = lazy(() => import('./features/Privacy/PrivacyDashboard').then(module => ({ default: module.PrivacyDashboard || module.default })))

// Mock MonitoringService for demonstration purposes if it's not globally available.
// In a real application, this would be imported from its actual location.
const MonitoringService = {
  trackError: (name, data) => {
    console.log(`MonitoringService: Tracked error "${name}" with data:`, data);
  }
};


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
        element: (
          <ErrorBoundary 
            fallback={
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                height: '60vh',
                gap: '1rem',
                color: 'var(--ancient-bronze)'
              }}>
                <div style={{ fontSize: '3rem' }}>⚡</div>
                <h3>Arena konnte nicht geladen werden</h3>
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
            }
            onError={(error, errorInfo) => {
              console.error('🚨 Arena Loading Error:', error, errorInfo)
              MonitoringService.trackError('lazy_loading_error', {
                component: 'ArenaScreen',
                error: error.message
              })
            }}
          >
            <LazyLoader fallback={<LoadingSpinner message="Arena wird geladen..." />}>
              <ArenaScreen />
            </LazyLoader>
          </ErrorBoundary>
        ),
        errorElement: <ErrorBoundary><div>Fehler in Arena</div></ErrorBoundary>
      },
      {
        path: 'arena',
        element: (
          <ErrorBoundary 
            fallback={
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                height: '60vh',
                gap: '1rem',
                color: 'var(--ancient-bronze)'
              }}>
                <div style={{ fontSize: '3rem' }}>⚡</div>
                <h3>Arena konnte nicht geladen werden</h3>
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
            }
            onError={(error, errorInfo) => {
              console.error('🚨 Arena Loading Error:', error, errorInfo)
              MonitoringService.trackError('lazy_loading_error', {
                component: 'ArenaScreen',
                error: error.message
              })
            }}
          >
            <LazyLoader fallback={<LoadingSpinner message="Arena wird geladen..." />}>
              <ArenaScreen />
            </LazyLoader>
          </ErrorBoundary>
        ),
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
        errorElement: <ErrorBoundary><div>Fehler beim Vorschlagen von Aufgaben</div></ErrorBoundary>
      },
      {
        path: 'tasks/admin',
        element: (
          <RequireAdmin>
            <AdminTasksScreen />
          </RequireAdmin>
        ),
        errorElement: <ErrorBoundary><div>Fehler im Admin-Tasks-Bereich</div></ErrorBoundary>
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