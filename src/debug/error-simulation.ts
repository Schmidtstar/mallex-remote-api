// MALLEX Debug Module - Simplified
// Nur noch System Health Check ohne Simulationen

export class SystemHealthChecker {
  static getSystemHealth() {
    return {
      firebase: !!window.firebase,
      auth: !!window.firebase?.auth?.currentUser,
      network: navigator.onLine,
      memory: (performance as any).memory || 'N/A',
      timestamp: new Date().toISOString()
    }
  }

  static logSystemStatus() {
    const health = this.getSystemHealth()
    console.log('🔍 System Health:', health)
    return health
  }
}

// Development Console Access - Nur Health Check
if (import.meta.env.DEV) {
  (window as any).MALLEX_HEALTH = SystemHealthChecker
  console.log('🔍 System Health Checker available: window.MALLEX_HEALTH')
}