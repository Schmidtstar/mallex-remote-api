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

// Lazy Import Utilities mit intelligentem Preloading
export const preloadComponents = {
  arena: () => import('../features/Arena/ArenaScreen'),
  legends: () => import('../features/Legends/LegendsScreen'),
  leaderboard: () => import('../features/Leaderboard/LeaderboardScreen'),
  tasks: () => import('../features/Tasks/TasksOverviewScreen'),
  suggestTasks: () => import('../features/Tasks/SuggestTaskScreen'),
  adminTasks: () => import('../features/Tasks/AdminTasksScreen'),
  adminDashboard: () => import('../features/Admin/AdminDashboard'),
  menu: () => import('../features/Menu/MenuScreen'),
  privacy: () => import('../features/Privacy/PrivacyDashboard')
}

// Intelligentes Preloading basierend auf User-Verhalten
export const intelligentPreload = () => {
  // Preload kritische Komponenten nach 2 Sekunden
  setTimeout(() => {
    preloadComponents.arena().catch(() => {})
    preloadComponents.menu().catch(() => {})
  }, 2000)

  // Preload weitere Komponenten nach 5 Sekunden
  setTimeout(() => {
    preloadComponents.legends().catch(() => {})
    preloadComponents.leaderboard().catch(() => {})
    preloadComponents.tasks().catch(() => {})
  }, 5000)

  // Admin-Komponenten nur bei Bedarf preloaden
  const user = localStorage.getItem('mallex_user')
  if (user) {
    try {
      const userData = JSON.parse(user)
      if (userData.role === 'admin') {
        setTimeout(() => {
          preloadComponents.adminTasks().catch(() => {})
          preloadComponents.adminDashboard().catch(() => {})
        }, 3000)
      }
    } catch (error) {
      console.warn('User data parsing failed:', error)
    }
  }
}