
// MALLEX Intelligent Preloading System - v2.1
// Optimiert für bessere Performance und verhindert Endlosschleifen

interface PreloadComponent {
  (): Promise<any>
}

interface PreloadComponents {
  [key: string]: PreloadComponent
}

// Saubere Preload-Komponenten ohne Endlosschleifen
const preloadComponents: PreloadComponents = {
  arena: () => import('../features/Arena/ArenaScreen'),
  legends: () => import('../features/Legends/LegendsScreen'),
  leaderboard: () => import('../features/Leaderboard/LeaderboardScreen'),
  menu: () => import('../features/Menu/MenuScreen'),
  tasks: () => import('../features/Tasks/TasksOverviewScreen'),
  adminTasks: () => import('../features/Tasks/AdminTasksScreen'),
  adminDashboard: () => import('../features/Admin/AdminDashboard')
}

let preloadStarted = false

export function intelligentPreload() {
  // Verhindere doppelte Ausführung
  if (preloadStarted) {
    console.log('📦 Preloading already started')
    return
  }
  
  preloadStarted = true
  console.log('📦 Starting intelligent component preloading...')

  try {
    // Immediate priority - Arena (Hauptbildschirm)
    preloadComponents.arena()
      .then(() => console.log('✅ Arena preloaded'))
      .catch(err => console.warn('Arena preload failed:', err))

    // High priority nach 1 Sekunde
    setTimeout(() => {
      Promise.all([
        preloadComponents.legends(),
        preloadComponents.leaderboard(),
        preloadComponents.menu()
      ]).then(() => {
        console.log('✅ Core components preloaded')
      }).catch(err => {
        console.warn('Core preload failed:', err)
      })
    }, 1000)

    // Medium priority nach 3 Sekunden
    setTimeout(() => {
      preloadComponents.tasks()
        .then(() => console.log('✅ Tasks preloaded'))
        .catch(err => console.warn('Tasks preload failed:', err))
    }, 3000)

    // Low priority nach 5 Sekunden (nur wenn user authenticated)
    setTimeout(() => {
      if (window.location.pathname.includes('admin') || 
          localStorage.getItem('mallex-admin-user')) {
        Promise.all([
          preloadComponents.adminTasks(),
          preloadComponents.adminDashboard()
        ]).then(() => {
          console.log('✅ Admin components preloaded')
        }).catch(err => {
          console.warn('Admin preload failed:', err)
        })
      }
    }, 5000)

  } catch (error) {
    console.warn('Preloading error (non-critical):', error)
  }
}

// Development utilities
if (import.meta.env.DEV) {
  ;(window as any).MALLEX_PRELOAD = {
    restart: () => {
      preloadStarted = false
      intelligentPreload()
    },
    status: () => ({
      started: preloadStarted,
      components: Object.keys(preloadComponents)
    })
  }
}
