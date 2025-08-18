
# 📱 MALLEX - Capacitor Mobile App Guide

## 🚀 Mobile App Entwicklung mit Capacitor

### 📋 Übersicht

Dieser Guide führt durch die komplette Transformation von MALLEX von einer PWA zu nativen iOS- und Android-Apps mit Capacitor.

---

## 1. Capacitor Setup & Installation

### 1.1 Dependencies Installation

```bash
# Core Capacitor Packages
npm install @capacitor/core @capacitor/cli

# Platform Packages  
npm install @capacitor/ios @capacitor/android

# Plugin Packages für MALLEX
npm install @capacitor/push-notifications
npm install @capacitor/haptics
npm install @capacitor/status-bar
npm install @capacitor/splash-screen
npm install @capacitor/filesystem
npm install @capacitor/network
npm install @capacitor/share
npm install @capacitor/toast
npm install @capacitor/app
npm install @capacitor/device
```

### 1.2 Capacitor Initialization

```bash
# Capacitor initialisieren
npx cap init

# Platforms hinzufügen
npx cap add ios
npx cap add android

# Initial sync
npx cap sync
```

### 1.3 Enhanced Capacitor Config

```typescript
// capacitor.config.ts - Erweiterte Konfiguration
import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.mallex.app',
  appName: 'MALLEX - Olympische Saufspiele',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
    iosScheme: 'https'
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: "#1a1a1a",
      androidSplashResourceName: "splash",
      androidScaleType: "CENTER_CROP",
      showSpinner: false,
      splashFullScreen: true,
      splashImmersive: true
    },
    StatusBar: {
      style: 'DARK',
      backgroundColor: '#1a1a1a'
    },
    PushNotifications: {
      presentationOptions: ["badge", "sound", "alert"]
    },
    Haptics: {
      enable: true
    }
  },
  ios: {
    contentInset: 'automatic',
    backgroundColor: '#1a1a1a'
  },
  android: {
    backgroundColor: '#1a1a1a',
    allowMixedContent: true,
    captureInput: true
  }
};

export default config;
```

---

## 2. Mobile-spezifische Code-Anpassungen

### 2.1 Platform Detection Service

```typescript
// src/lib/platform-service.ts
import { Capacitor } from '@capacitor/core';
import { Device } from '@capacitor/device';

export class PlatformService {
  static async initializePlatform() {
    const info = await Device.getInfo();
    
    return {
      isNative: Capacitor.isNativePlatform(),
      platform: info.platform,
      osVersion: info.osVersion,
      model: info.model,
      isIOS: info.platform === 'ios',
      isAndroid: info.platform === 'android',
      isWeb: !Capacitor.isNativePlatform()
    };
  }

  static async getDeviceInfo() {
    const info = await Device.getInfo();
    const batteryInfo = await Device.getBatteryInfo();
    
    return {
      ...info,
      batteryLevel: batteryInfo?.batteryLevel,
      isCharging: batteryInfo?.isCharging
    };
  }
}
```

### 2.2 Native Features Integration

```typescript
// src/lib/native-features.ts
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { Toast } from '@capacitor/toast';
import { Share } from '@capacitor/share';
import { StatusBar, Style } from '@capacitor/status-bar';

export class NativeFeatures {
  // Haptic Feedback für Touch-Interaktionen
  static async triggerHaptic(style: 'light' | 'medium' | 'heavy' = 'light') {
    if (!Capacitor.isNativePlatform()) return;
    
    const impactStyle = {
      light: ImpactStyle.Light,
      medium: ImpactStyle.Medium,
      heavy: ImpactStyle.Heavy
    }[style];
    
    await Haptics.impact({ style: impactStyle });
  }

  // Native Toast Notifications
  static async showToast(message: string, duration: 'short' | 'long' = 'short') {
    if (!Capacitor.isNativePlatform()) {
      // Fallback für Web
      console.log(`Toast: ${message}`);
      return;
    }
    
    await Toast.show({
      text: message,
      duration: duration,
      position: 'bottom'
    });
  }

  // Social Sharing
  static async shareScore(playerName: string, score: number, category: string) {
    const shareData = {
      title: 'MALLEX - Olympische Saufspiele',
      text: `🏆 ${playerName} hat ${score} Punkte in ${category} erreicht!`,
      url: 'https://mallex.app',
      dialogTitle: 'Teile deinen Erfolg!'
    };

    if (Capacitor.isNativePlatform()) {
      await Share.share(shareData);
    } else {
      // Web Share API Fallback
      if (navigator.share) {
        await navigator.share(shareData);
      }
    }
  }

  // Status Bar Management
  static async setStatusBarStyle(isDarkMode: boolean) {
    if (!Capacitor.isNativePlatform()) return;
    
    await StatusBar.setStyle({ 
      style: isDarkMode ? Style.Dark : Style.Light 
    });
  }
}
```

### 2.3 Push Notifications Setup

```typescript
// src/lib/push-notifications.ts
import { PushNotifications } from '@capacitor/push-notifications';
import { Capacitor } from '@capacitor/core';

export class PushNotificationService {
  static async initializePushNotifications() {
    if (!Capacitor.isNativePlatform()) return;

    // Request permission
    const permissionStatus = await PushNotifications.requestPermissions();
    
    if (permissionStatus.receive === 'granted') {
      await PushNotifications.register();
    }

    // Listener für Token-Registration
    PushNotifications.addListener('registration', (token) => {
      console.log('Push registration success, token: ' + token.value);
      // Token an Firebase senden für Targeting
      this.saveTokenToFirebase(token.value);
    });

    // Listener für eingehende Notifications
    PushNotifications.addListener('pushNotificationReceived', (notification) => {
      console.log('Push notification received: ', notification);
      // Notification in App anzeigen
      this.handleInAppNotification(notification);
    });

    // Listener für Notification-Taps
    PushNotifications.addListener('pushNotificationActionPerformed', (action) => {
      console.log('Push notification action performed', action);
      // Navigation zu entsprechendem Screen
      this.handleNotificationAction(action);
    });
  }

  private static async saveTokenToFirebase(token: string) {
    // Implementation: Token in Firestore speichern
  }

  private static handleInAppNotification(notification: any) {
    // Implementation: In-App Notification anzeigen
  }

  private static handleNotificationAction(action: any) {
    // Implementation: Navigation basierend auf Notification
  }

  // Achievement Notification senden
  static async sendAchievementNotification(achievement: string) {
    if (!Capacitor.isNativePlatform()) return;

    await PushNotifications.createChannel({
      id: 'achievements',
      name: 'Achievements',
      description: 'Achievement-Benachrichtigungen',
      importance: 3,
      visibility: 1
    });

    // Local Notification für Achievement
    await PushNotifications.schedule({
      notifications: [{
        title: '🏆 Neues Achievement!',
        body: `Du hast "${achievement}" freigeschaltet!`,
        id: Date.now(),
        channelId: 'achievements',
        extra: {
          type: 'achievement',
          achievementId: achievement
        }
      }]
    });
  }
}
```

---

## 3. Platform-spezifische Optimierungen

### 3.1 iOS-spezifische Anpassungen

```typescript
// src/lib/ios-optimizations.ts
import { StatusBar } from '@capacitor/status-bar';
import { Keyboard } from '@capacitor/keyboard';

export class IOSOptimizations {
  static async setupIOSSpecificFeatures() {
    // Safe Area Handling
    this.setupSafeAreaInsets();
    
    // Status Bar Configuration
    await StatusBar.setStyle({ style: 'DARK' });
    await StatusBar.setBackgroundColor({ color: '#1a1a1a' });
    
    // Keyboard Handling
    this.setupKeyboardHandling();
    
    // Swipe-Back Gesture
    this.setupSwipeBackGesture();
  }

  private static setupSafeAreaInsets() {
    // CSS Custom Properties für Safe Area
    const style = document.createElement('style');
    style.innerHTML = `
      :root {
        --safe-area-inset-top: env(safe-area-inset-top);
        --safe-area-inset-right: env(safe-area-inset-right);
        --safe-area-inset-bottom: env(safe-area-inset-bottom);
        --safe-area-inset-left: env(safe-area-inset-left);
      }
      
      .ios-safe-area {
        padding-top: var(--safe-area-inset-top);
        padding-right: var(--safe-area-inset-right);
        padding-bottom: var(--safe-area-inset-bottom);
        padding-left: var(--safe-area-inset-left);
      }
    `;
    document.head.appendChild(style);
  }

  private static setupKeyboardHandling() {
    if (!Capacitor.isNativePlatform()) return;

    Keyboard.addListener('keyboardWillShow', (info) => {
      document.body.style.transform = `translateY(-${info.keyboardHeight / 2}px)`;
    });

    Keyboard.addListener('keyboardWillHide', () => {
      document.body.style.transform = 'translateY(0)';
    });
  }

  private static setupSwipeBackGesture() {
    // iOS-native Swipe-Back aktivieren
    if (Capacitor.getPlatform() === 'ios') {
      // Swipe-Back in WebView aktivieren
      (window as any).webkit?.messageHandlers?.bridge?.postMessage({
        action: 'enableSwipeBack'
      });
    }
  }
}
```

### 3.2 Android-spezifische Anpassungen  

```typescript
// src/lib/android-optimizations.ts
import { StatusBar } from '@capacitor/status-bar';
import { App } from '@capacitor/app';

export class AndroidOptimizations {
  static async setupAndroidSpecificFeatures() {
    // Status Bar Setup
    await this.setupStatusBar();
    
    // Hardware Back Button
    this.setupBackButtonHandling();
    
    // App State Handling
    this.setupAppStateHandling();
    
    // Material Design Components
    this.setupMaterialDesign();
  }

  private static async setupStatusBar() {
    await StatusBar.setStyle({ style: 'DARK' });
    await StatusBar.setBackgroundColor({ color: '#1a1a1a' });
    await StatusBar.setOverlaysWebView({ overlay: false });
  }

  private static setupBackButtonHandling() {
    App.addListener('backButton', (data) => {
      // Custom Back-Button Logic
      const currentRoute = window.location.hash;
      
      if (currentRoute === '#/' || currentRoute === '') {
        // Auf Hauptscreen: App minimieren
        App.minimizeApp();
      } else {
        // Navigation zurück
        window.history.back();
      }
    });
  }

  private static setupAppStateHandling() {
    App.addListener('appStateChange', (state) => {
      if (state.isActive) {
        // App wieder aktiv: Daten refreshen
        this.handleAppResume();
      } else {
        // App in Background: Zustand speichern
        this.handleAppPause();
      }
    });
  }

  private static setupMaterialDesign() {
    // Material Design CSS-Klassen hinzufügen
    document.body.classList.add('material-design');
    
    // Dynamic Colors für Android 12+
    if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
      document.body.classList.add('material-dark');
    }
  }

  private static handleAppResume() {
    // Leaderboard refreshen, neue Achievements checken
    window.dispatchEvent(new CustomEvent('app-resumed'));
  }

  private static handleAppPause() {
    // Aktuellen Spielstand speichern
    window.dispatchEvent(new CustomEvent('app-paused'));
  }
}
```

---

## 4. Build & Deployment Pipeline

### 4.1 Mobile Build Scripts

```json
// package.json - Mobile Build Scripts hinzufügen
{
  "scripts": {
    "build:mobile": "vite build --mode mobile",
    "cap:sync": "cap sync",
    "cap:sync:ios": "cap sync ios",
    "cap:sync:android": "cap sync android",
    "ios:dev": "npm run build:mobile && cap sync ios && cap open ios",
    "android:dev": "npm run build:mobile && cap sync android && cap open android",
    "ios:build": "npm run build:mobile && cap sync ios && cap build ios",
    "android:build": "npm run build:mobile && cap sync android && cap build android"
  }
}
```

### 4.2 Mobile-spezifische Vite-Konfiguration

```typescript
// vite.config.mobile.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  define: {
    __MOBILE_BUILD__: true
  },
  build: {
    outDir: 'dist',
    sourcemap: false, // Für Production
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom'],
          'firebase': ['firebase/app', 'firebase/auth', 'firebase/firestore'],
          'capacitor': ['@capacitor/core', '@capacitor/haptics', '@capacitor/toast']
        }
      }
    },
    target: ['es2020', 'edge88', 'firefox78', 'chrome87', 'safari14']
  },
  server: {
    host: '0.0.0.0',
    port: 5173
  }
});
```

### 4.3 App Store Assets

#### iOS App Store Assets

```
ios/App/App/Assets.xcassets/
├── AppIcon.appiconset/
│   ├── Icon-20@2x.png      (40x40)
│   ├── Icon-20@3x.png      (60x60)
│   ├── Icon-29@2x.png      (58x58)
│   ├── Icon-29@3x.png      (87x87)
│   ├── Icon-40@2x.png      (80x80)
│   ├── Icon-40@3x.png      (120x120)
│   ├── Icon-60@2x.png      (120x120)
│   ├── Icon-60@3x.png      (180x180)
│   └── Icon-1024.png       (1024x1024)
└── LaunchImage.launchimage/
    ├── Default@2x.png      (640x960)
    ├── Default@3x.png      (1125x2436)
    └── Default-Landscape@2x.png (2048x1536)
```

#### Android App Store Assets

```
android/app/src/main/res/
├── mipmap-hdpi/
│   └── ic_launcher.png     (72x72)
├── mipmap-mdpi/
│   └── ic_launcher.png     (48x48)
├── mipmap-xhdpi/
│   └── ic_launcher.png     (96x96)
├── mipmap-xxhdpi/
│   └── ic_launcher.png     (144x144)
├── mipmap-xxxhdpi/
│   └── ic_launcher.png     (192x192)
└── drawable/
    └── splash.png          (1080x1920)
```

---

## 5. Testing & Quality Assurance

### 5.1 Mobile Testing Checklist

```typescript
interface MobileTestingChecklist {
  functionality: {
    allScreensAccessible: boolean
    navigationWorking: boolean
    formsSubmittable: boolean
    offlineModeWorking: boolean
    pushNotificationsWorking: boolean
  }
  
  performance: {
    loadTime: 'unter 3s'
    smoothScrolling: '60fps'
    memoryUsage: 'unter 100MB'
    batteryOptimized: boolean
  }
  
  ux: {
    touchTargetsAdequate: 'min 44px'
    keyboardHandling: 'proper'
    orientationSupport: 'portrait + landscape'
    accessibilityCompliant: boolean
  }
  
  devices: {
    iPhoneModels: ['12', '13', '14', '15']
    androidVersions: ['API 23+']
    tabletSupport: boolean
    foldableSupport: boolean
  }
}
```

### 5.2 Device Testing Matrix

```bash
# iOS Testing (Simulator)
xcrun simctl list devices available

# Zu testende iOS-Geräte:
iPhone 12 Pro (iOS 15.0)
iPhone 13 (iOS 16.0)  
iPhone 14 Pro Max (iOS 17.0)
iPhone 15 (iOS 17.2)
iPad Pro 12.9" (iPadOS 17.0)

# Android Testing (Emulator)
android list avd

# Zu testende Android-Geräte:
Pixel 6 (API 31)
Samsung Galaxy S21 (API 32)
OnePlus 9 Pro (API 33)
Tablet: Samsung Galaxy Tab S8 (API 33)
```

---

## 6. App Store Deployment

### 6.1 iOS App Store Deployment

#### Vorbereitung:
```bash
# iOS Build für App Store
npm run ios:build

# Xcode öffnen
cap open ios

# In Xcode:
# 1. Bundle Identifier konfigurieren: com.mallex.app
# 2. Team auswählen
# 3. Provisioning Profile konfigurieren
# 4. Archive erstellen: Product > Archive
# 5. Upload to App Store Connect
```

#### App Store Connect Setup:
```yaml
App Information:
  Name: "MALLEX - Olympische Saufspiele"
  Bundle ID: "com.mallex.app"
  Category: "Games"
  Subcategory: "Party"
  Content Rating: "17+ (Mature/Adult)"

Pricing:
  Freemium: "Free with In-App Purchases"
  Premium Tier: "€4.99/month"

Metadata:
  Short Description: "Die olympischen Saufspiele als digitale Erfahrung"
  Keywords: "trinkspiel,party,olympisch,saufspiel,freunde"
  Screenshots: "5.5", 6.5", 12.9" iPad Pro"
```

### 6.2 Android Play Store Deployment

#### Vorbereitung:
```bash
# Android Build für Play Store
npm run android:build

# Android Studio öffnen
cap open android

# In Android Studio:
# 1. Build > Generate Signed Bundle / APK
# 2. Keystore erstellen/auswählen
# 3. Release-Build konfigurieren
# 4. AAB (Android App Bundle) generieren
# 5. Upload to Play Console
```

#### Play Console Setup:
```yaml
App Information:
  App Name: "MALLEX - Olympische Saufspiele"
  Package Name: "com.mallex.app"
  Category: "Game"
  Content Rating: "High Maturity"

Store Listing:
  Short Description: "Olympische Trinkspiele digital erleben"
  Full Description: "Detaillierte App-Beschreibung..."
  Screenshots: "Phone + 7" Tablet + 10" Tablet"
  Feature Graphic: "1024 x 500"

Release Management:
  Track: "Internal Testing → Alpha → Beta → Production"
  Rollout: "Staged rollout 5% → 20% → 50% → 100%"
```

---

## 7. Performance Optimierung für Mobile

### 7.1 Mobile-spezifische Performance-Optimierungen

```typescript
// src/lib/mobile-performance.ts
export class MobilePerformanceOptimizer {
  static async optimizeForMobile() {
    // Viewport-optimierte Konfiguration
    this.setupViewport();
    
    // Touch-optimierte Interaktionen
    this.optimizeTouchEvents();
    
    // Memory-Management
    this.setupMemoryManagement();
    
    // Battery-Optimization
    this.optimizeBatteryUsage();
  }

  private static setupViewport() {
    const viewport = document.querySelector('meta[name="viewport"]');
    if (viewport) {
      viewport.setAttribute('content', 
        'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover'
      );
    }
  }

  private static optimizeTouchEvents() {
    // Passive Touch-Events für bessere Performance
    document.addEventListener('touchstart', () => {}, { passive: true });
    document.addEventListener('touchmove', () => {}, { passive: true });
    
    // Fast-Tap für bessere Responsiveness
    document.body.style.touchAction = 'manipulation';
  }

  private static setupMemoryManagement() {
    // Garbage Collection triggern bei App-Pause
    App.addListener('appStateChange', (state) => {
      if (!state.isActive && window.gc) {
        window.gc();
      }
    });
  }

  private static optimizeBatteryUsage() {
    // Animationen reduzieren bei niedrigem Batteriestand
    if ('getBattery' in navigator) {
      (navigator as any).getBattery().then((battery: any) => {
        if (battery.level < 0.2) {
          document.body.classList.add('low-battery-mode');
        }
      });
    }
  }
}
```

### 7.2 Mobile Bundle-Optimierung

```typescript
// Mobile-spezifische Build-Optimierungen
interface MobileBuildOptimizations {
  bundleSize: {
    target: 'unter 100kb gzipped'
    treeshaking: 'Aggressive für Mobile'
    compression: 'Brotli + Gzip'
  }
  
  assetOptimization: {
    images: 'WebP + AVIF für moderne Browser'
    icons: 'SVG wo möglich'
    fonts: 'Subsetting für verwendete Zeichen'
  }
  
  caching: {
    serviceWorker: 'Aggressive Caching-Strategie'
    appShell: 'Complete Offline-Funktionalität'
    updates: 'Background-Updates'
  }
}
```

---

## 8. Monitoring & Analytics für Mobile

### 8.1 Mobile-spezifische Analytics

```typescript
// src/lib/mobile-analytics.ts
export class MobileAnalytics {
  static trackMobileMetrics() {
    this.trackDeviceInfo();
    this.trackPerformanceMetrics();
    this.trackUserBehavior();
    this.trackCrashes();
  }

  private static async trackDeviceInfo() {
    const deviceInfo = await Device.getInfo();
    const batteryInfo = await Device.getBatteryInfo();
    
    // Analytics Event senden
    analytics.track('device_info', {
      platform: deviceInfo.platform,
      osVersion: deviceInfo.osVersion,
      model: deviceInfo.model,
      batteryLevel: batteryInfo?.batteryLevel,
      memoryUsed: deviceInfo.memUsed,
      realDiskFree: deviceInfo.realDiskFree
    });
  }

  private static trackPerformanceMetrics() {
    // Mobile-spezifische Performance-Metriken
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.entryType === 'largest-contentful-paint') {
          analytics.track('mobile_lcp', {
            value: entry.startTime,
            platform: Capacitor.getPlatform()
          });
        }
      }
    });
    
    observer.observe({ entryTypes: ['largest-contentful-paint'] });
  }

  private static trackUserBehavior() {
    // Touch-Events tracking
    document.addEventListener('touchstart', (e) => {
      analytics.track('touch_interaction', {
        target: e.target?.tagName,
        timestamp: Date.now(),
        touches: e.touches.length
      });
    });
  }

  private static trackCrashes() {
    window.addEventListener('error', (error) => {
      analytics.track('mobile_error', {
        message: error.message,
        filename: error.filename,
        lineno: error.lineno,
        colno: error.colno,
        platform: Capacitor.getPlatform(),
        stack: error.error?.stack
      });
    });
  }
}
```

---

## 9. Troubleshooting & Common Issues

### 9.1 Häufige Probleme und Lösungen

```typescript
// Troubleshooting Guide
interface CommonIssues {
  ios: {
    webviewBlank: {
      problem: 'Weiße Seite nach App-Start'
      solution: 'capacitor.config.ts: server.iosScheme = "https"'
    }
    
    keyboardIssues: {
      problem: 'Keyboard überdeckt Input-Felder'
      solution: '@capacitor/keyboard plugin + proper handling'
    }
    
    safeAreaIssues: {
      problem: 'Content hinter Notch/Home-Indicator'
      solution: 'CSS env(safe-area-inset-*) verwenden'
    }
  }
  
  android: {
    backButtonNotWorking: {
      problem: 'Hardware Back-Button funktioniert nicht'
      solution: 'App.addListener("backButton") implementieren'
    }
    
    statusBarIssues: {
      problem: 'Status Bar überdeckt Content'
      solution: 'StatusBar.setOverlaysWebView(false)'
    }
    
    permissionDenied: {
      problem: 'Push-Notification Permission verweigert'
      solution: 'Graceful Fallback + Re-Request-Mechanismus'
    }
  }
}
```

### 9.2 Debug-Tools und Testing

```bash
# iOS Debugging
# Safari Developer Tools für iOS Simulator
# Remote Debugging für echte Geräte

# Android Debugging  
# Chrome DevTools für Android Emulator
chrome://inspect/#devices

# Capacitor Debug Commands
npx cap doctor              # Konfiguration prüfen
npx cap ls                  # Installierte Plugins anzeigen
npx cap sync --deployment   # Production-Sync
```

---

## 10. Roadmap & Next Steps

### 10.1 Mobile App Release Timeline

```yaml
Week 1-2: Capacitor Setup & Basic Integration
  - Capacitor Installation & Configuration
  - Platform-spezifische Optimierungen
  - Native Features Integration

Week 3-4: Testing & Optimization
  - Device Testing auf Real-Hardware
  - Performance-Optimierung
  - Bug-Fixes & Polish

Week 5-6: App Store Preparation
  - Assets-Erstellung (Icons, Screenshots)
  - Store-Listings vorbereiten
  - Review-Guidelines Compliance

Week 7-8: Store Submission & Launch
  - iOS App Store Submission
  - Google Play Store Submission
  - Marketing & Launch-Campaign
```

### 10.2 Post-Launch Entwicklung

```typescript
interface PostLaunchRoadmap {
  v1_1: {
    features: ['Biometric Authentication', 'Advanced Push Notifications']
    timeline: 'Month 2'
  }
  
  v1_2: {
    features: ['Offline Mode Enhanced', 'Social Sharing', 'Apple Watch Support']
    timeline: 'Month 4'
  }
  
  v2_0: {
    features: ['AI-powered Challenges', 'Augmented Reality', 'Wear OS Support']
    timeline: 'Month 8'
  }
}
```

---

🏛️ **MALLEX IS READY FOR MOBILE DOMINATION!** 📱⚔️🚀

Mit diesem umfassenden Capacitor-Guide wird MALLEX erfolgreich zu nativen iOS- und Android-Apps transformiert und kann den mobilen Markt erobern!
