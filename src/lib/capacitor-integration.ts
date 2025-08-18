
// Capacitor imports with proper fallback for web environment
let Capacitor: any = { isNativePlatform: () => false, getPlatform: () => 'web' };
let StatusBar: any = null;
let SplashScreen: any = null;
let Haptics: any = null;
let ImpactStyle: any = null;
let Share: any = null;
let PushNotifications: any = null;
let Device: any = null;

// Try to import Capacitor modules only if running in a Capacitor environment
const initCapacitor = async () => {
  try {
    // Check if we're in a Capacitor environment
    if (typeof window !== 'undefined' && (window as any).Capacitor) {
      const capacitorCore = await import("@capacitor/core");
      Capacitor = capacitorCore.Capacitor;

      if (Capacitor.isNativePlatform()) {
        // Only import native modules if we're actually on a native platform
        try {
          const statusBarModule = await import("@capacitor/status-bar");
          StatusBar = statusBarModule.StatusBar;
        } catch (e) { console.log('StatusBar not available') }

        try {
          const splashModule = await import("@capacitor/splash-screen");
          SplashScreen = splashModule.SplashScreen;
        } catch (e) { console.log('SplashScreen not available') }

        try {
          const hapticsModule = await import("@capacitor/haptics");
          Haptics = hapticsModule.Haptics;
          ImpactStyle = hapticsModule.ImpactStyle;
        } catch (e) { console.log('Haptics not available') }

        try {
          const shareModule = await import("@capacitor/share");
          Share = shareModule.Share;
        } catch (e) { console.log('Share not available') }

        try {
          const pushModule = await import("@capacitor/push-notifications");
          PushNotifications = pushModule.PushNotifications;
        } catch (e) { console.log('PushNotifications not available') }

        try {
          const deviceModule = await import("@capacitor/device");
          Device = deviceModule.Device;
        } catch (e) { console.log('Device not available') }
      }
    }
  } catch (error) {
    console.log('Capacitor not available, running in web mode');
  }
};

export class CapacitorIntegration {
  static async init() {
    await initCapacitor();

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
    if (!StatusBar) return;
    
    try {
      await StatusBar.setStyle({ style: 'DARK' })
      await StatusBar.setBackgroundColor({ color: '#1a1a1a' })
      console.log('📱 StatusBar configured')
    } catch (error) {
      console.warn('StatusBar configuration failed:', error)
    }
  }

  private static async setupSplashScreen() {
    if (!SplashScreen) return;

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
    if (!Haptics || !ImpactStyle) {
      // Web fallback for haptics
      window.MALLEX_HAPTICS = {
        light: () => console.log('🔗 Haptic feedback (web): light'),
        medium: () => console.log('🔗 Haptic feedback (web): medium'),
        heavy: () => console.log('🔗 Haptic feedback (web): heavy')
      }
      return;
    }

    // Globale Haptic-Helper
    window.MALLEX_HAPTICS = {
      light: () => this.hapticFeedback(ImpactStyle.Light),
      medium: () => this.hapticFeedback(ImpactStyle.Medium),
      heavy: () => this.hapticFeedback(ImpactStyle.Heavy)
    }
  }

  private static async hapticFeedback(style: any) {
    if (!Capacitor.isNativePlatform() || !Haptics) return

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
