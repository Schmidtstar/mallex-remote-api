
import { lazy } from 'react'

// Lazy-loaded Screens für bessere Performance
export const LazyArenaScreen = lazy(() => 
  import('../features/Arena/ArenaScreen').then(module => ({ default: module.ArenaScreen }))
)

export const LazyLeaderboardScreen = lazy(() => 
  import('../features/Leaderboard/LeaderboardScreen').then(module => ({ default: module.LeaderboardScreen }))
)

export const LazyLegendsScreen = lazy(() => 
  import('../features/Legends/LegendsScreen').then(module => ({ default: module.LegendsScreen }))
)

export const LazyAdminDashboard = lazy(() => 
  import('../features/Admin/AdminDashboard').then(module => ({ default: module.AdminDashboard }))
)

export const LazyTasksOverviewScreen = lazy(() => 
  import('../features/Tasks/TasksOverviewScreen').then(module => ({ default: module.TasksOverviewScreen }))
)

export const LazySuggestTaskScreen = lazy(() => 
  import('../features/Tasks/SuggestTaskScreen').then(module => ({ default: module.SuggestTaskScreen }))
)

export const LazyAdminTasksScreen = lazy(() => 
  import('../features/Tasks/AdminTasksScreen').then(module => ({ default: module.AdminTasksScreen }))
)

// Preload-Funktionen für bessere UX
export const preloadComponents = {
  arena: () => import('../features/Arena/ArenaScreen'),
  leaderboard: () => import('../features/Leaderboard/LeaderboardScreen'),
  legends: () => import('../features/Legends/LegendsScreen'),
  admin: () => import('../features/Admin/AdminDashboard'),
  tasks: () => import('../features/Tasks/TasksOverviewScreen'),
  suggest: () => import('../features/Tasks/SuggestTaskScreen'),
  adminTasks: () => import('../features/Tasks/AdminTasksScreen')
}

// Intelligent Preloading basierend auf User-Verhalten
export const intelligentPreload = () => {
  // Preload nach 2 Sekunden im Idle
  setTimeout(() => {
    preloadComponents.arena()
    preloadComponents.leaderboard()
  }, 2000)

  // Preload Admin-Components nur für Admins
  setTimeout(() => {
    const isAdmin = localStorage.getItem('mallex-is-admin') === 'true'
    if (isAdmin) {
      preloadComponents.admin()
      preloadComponents.adminTasks()
    }
  }, 5000)
}
