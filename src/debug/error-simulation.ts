
// MALLEX Error Simulation Tool - Nur für Debugging!

export class ErrorSimulator {
  static async simulateFirebaseHang() {
    console.warn('🔥 SIMULATING: Firebase Connection Hang')
    
    // Simuliere Firebase Timeout
    const originalGetDoc = window.firebase?.firestore?.getDoc
    if (originalGetDoc) {
      window.firebase.firestore.getDoc = () => 
        new Promise(() => {}) // Hängt für immer
    }
    
    return 'Firebase getDoc() wird jetzt endlos hängen'
  }
  
  static simulateAuthLoop() {
    console.warn('🔄 SIMULATING: Auth State Change Loop')
    
    // Simuliere Auth-Loop durch rapid state changes
    let count = 0
    const interval = setInterval(() => {
      if (count++ > 10) {
        clearInterval(interval)
        return
      }
      
      // Triggere künstliche Auth-Changes
      window.dispatchEvent(new CustomEvent('auth-state-change', {
        detail: { user: count % 2 ? { uid: 'test' } : null }
      }))
    }, 100)
    
    return 'Auth state wird jetzt rapid changes haben'
  }
  
  static simulateComponentLoadCascadeFailure() {
    console.warn('💥 SIMULATING: Lazy Component Cascade Failure')
    
    // Überschreibe dynamic imports
    const originalImport = window.__webpack_require__ || ((id: string) => Promise.reject(`Failed: ${id}`))
    
    // Alle Komponenten-Imports fehlschlagen lassen
    ;['Arena', 'Legends', 'Leaderboard', 'Tasks'].forEach(component => {
      (window as any)[`__FAIL_${component}`] = true
    })
    
    return 'Alle lazy components werden jetzt fehlschlagen'
  }
  
  static simulatePerformanceMonitorLoop() {
    console.warn('📊 SIMULATING: Performance Monitor Self-Triggering Loop')
    
    let loopCount = 0
    const triggerLoop = () => {
      if (loopCount++ > 50) return // Safety brake
      
      // Performance Monitor triggert sich selbst
      if (window.PerformanceMonitor) {
        window.PerformanceMonitor.trackMetric({
          name: 'self-trigger-test',
          value: loopCount,
          timestamp: Date.now()
        })
        
        // Triggert weitere Metrics
        setTimeout(triggerLoop, 10)
      }
    }
    
    triggerLoop()
    return 'Performance Monitor wird jetzt sich selbst triggern'
  }
  
  static simulateNetworkFlapping() {
    console.warn('📶 SIMULATING: Network Flapping (Online/Offline Loop)')
    
    let isOnline = navigator.onLine
    const interval = setInterval(() => {
      isOnline = !isOnline
      
      // Simuliere rapid network changes
      window.dispatchEvent(new Event(isOnline ? 'online' : 'offline'))
      
      console.log(`Network: ${isOnline ? '🟢 Online' : '🔴 Offline'}`)
    }, 500)
    
    // Stop nach 10 Sekunden
    setTimeout(() => clearInterval(interval), 10000)
    
    return 'Network wird jetzt für 10s rapid flapping'
  }
  
  // Alle Simulationen auf einmal (VORSICHT!)
  static simulateAllErrors() {
    console.warn('💥💥💥 SIMULATING ALL CRITICAL ERRORS - THIS WILL BREAK THE APP!')
    
    setTimeout(() => this.simulateFirebaseHang(), 1000)
    setTimeout(() => this.simulateAuthLoop(), 2000)
    setTimeout(() => this.simulateComponentLoadCascadeFailure(), 3000)
    setTimeout(() => this.simulatePerformanceMonitorLoop(), 4000)
    setTimeout(() => this.simulateNetworkFlapping(), 5000)
    
    return '⚠️ ALLE CRITICAL ERRORS WERDEN IN 5 SEKUNDEN AKTIV!'
  }
  
  // Debug Info
  static getSystemHealth() {
    return {
      firebase: !!window.firebase,
      auth: !!window.firebase?.auth?.currentUser,
      performanceMonitor: !!window.PerformanceMonitor,
      router: !!window.location.hash || !!window.history,
      network: navigator.onLine,
      memory: (performance as any).memory || 'N/A',
      errors: window.__MALLEX_ERRORS__ || []
    }
  }
}

// Development Console Access - Nur in lokaler Entwicklung
if (import.meta.env.DEV && import.meta.env.MODE === 'development') {
  (window as any).MALLEX_ERROR_SIM = ErrorSimulator
  console.log('🛠️ Error Simulator available: window.MALLEX_ERROR_SIM')
} else {
  console.log('🔒 Error Simulator disabled in production/staging')
}
