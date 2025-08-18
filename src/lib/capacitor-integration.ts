
import { Capacitor } from '@capacitor/core'
import { StatusBar } from '@capacitor/status-bar'
import { SplashScreen } from '@capacitor/splash-screen'
import { Haptics, ImpactStyle } from '@capacitor/haptics'

export class CapacitorIntegration {
  static async init() {
    if (!Capacitor.isNativePlatform()) {
      console.log('📱 Running in web mode')
      return
    }

    console.log('📱 Capacitor native platform detected')
    
    // StatusBar konfigurieren
    await this.setupStatusBar()
    
    // SplashScreen verwalten
    await this.setupSplashScreen()
    
    // Haptic Feedback aktivieren
    this.setupHaptics()
  }

  private static async setupStatusBar() {
    try {
      await StatusBar.setStyle({ style: 'DARK' })
      await StatusBar.setBackgroundColor({ color: '#1a1a1a' })
      console.log('📱 StatusBar configured')
    } catch (error) {
      console.warn('StatusBar configuration failed:', error)
    }
  }

  private static async setupSplashScreen() {
    try {
      // SplashScreen nach App-Load verstecken
      setTimeout(async () => {
        await SplashScreen.hide()
        console.log('📱 SplashScreen hidden')
      }, 2000)
    } catch (error) {
      console.warn('SplashScreen handling failed:', error)
    }
  }

  private static setupHaptics() {
    // Globale Haptic-Helper
    window.MALLEX_HAPTICS = {
      light: () => this.hapticFeedback(ImpactStyle.Light),
      medium: () => this.hapticFeedback(ImpactStyle.Medium),
      heavy: () => this.hapticFeedback(ImpactStyle.Heavy)
    }
  }

  private static async hapticFeedback(style: ImpactStyle) {
    if (!Capacitor.isNativePlatform()) return
    
    try {
      await Haptics.impact({ style })
    } catch (error) {
      console.warn('Haptic feedback failed:', error)
    }
  }
}

// Globale Haptic-Funktionen für TypeScript
declare global {
  interface Window {
    MALLEX_HAPTICS: {
      light: () => void
      medium: () => void
      heavy: () => void
    }
  }
}
