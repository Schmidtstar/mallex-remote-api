const CACHE_VERSION = 'mallex-v2.2.0'
const STATIC_CACHE = `${CACHE_VERSION}-static`
const API_CACHE = `${CACHE_VERSION}-api`
const FIRESTORE_CACHE = `${CACHE_VERSION}-firestore`
const IMAGES_CACHE = `${CACHE_VERSION}-images`

// Erweiterte Caching-Strategien mit Performance-Optimierung
const CACHE_STRATEGIES = {
  'network-first': [
    'firestore.googleapis.com',
    'identitytoolkit.googleapis.com',
    'firebase.googleapis.com',
    'securetoken.googleapis.com'
  ],
  'cache-first': [
    'static/js/',
    'static/css/',
    'assets/',
    'sounds/',
    'manifest.json',
    'generated-icon.png',
    '.woff2',
    '.woff',
    '.ttf'
  ],
  'stale-while-revalidate': [
    'i18n/',
    'challenges.json',
    'categories.json',
    '/api/'
  ],
  'cache-only': [
    'offline.html',
    'fallback.json'
  ]
}

// Kritische App-Ressourcen für Offline-Support
const CRITICAL_RESOURCES = [
  '/',
  '/index.html',
  '/manifest.json',
  '/sounds/triumph.mp3',
  '/sounds/defeat.mp3',
  '/sounds/notification.mp3',
  '/generated-icon.png'
]

// Offline-Fallback Ressourcen
const OFFLINE_FALLBACKS = {
  '/': '/index.html',
  '/arena': '/index.html',
  '/leaderboard': '/index.html',
  '/menu': '/index.html'
}

// Performance Metrics Tracking - Enhanced
let requestCount = 0
let cacheHitCount = 0
let offlineRequestCount = 0
let errorCount = 0
let averageResponseTime = 0

// Enhanced Performance Tracking
function trackPerformanceMetric(metricData) {
  try {
    // Send to all clients
    self.clients.matchAll().then(clients => {
      clients.forEach(client => {
        client.postMessage({
          type: 'SW_PERFORMANCE_METRIC',
          metric: {
            ...metricData,
            timestamp: Date.now(),
            stats: {
              totalRequests: requestCount,
              cacheHitRate: requestCount > 0 ? Math.round((cacheHitCount / requestCount) * 100) : 0,
              offlineRequests: offlineRequestCount,
              errorCount: errorCount,
              averageResponseTime: averageResponseTime
            }
          }
        })
      })
    })
  } catch (error) {
    console.error('SW: Performance tracking error:', error)
    errorCount++
  }
}

// Installation - Aggressives Caching für kritische Ressourcen
self.addEventListener('install', (event) => {
  console.log('🏛️ MALLEX Service Worker v2.2.0 Installation gestartet')

  event.waitUntil(
    Promise.all([
      // Kritische Ressourcen vorab cachen
      caches.open(STATIC_CACHE).then(cache => {
        console.log('📦 Pre-Caching kritische Ressourcen...')
        return cache.addAll(CRITICAL_RESOURCES).catch(err => {
          console.warn('⚠️ Einige kritische Ressourcen konnten nicht gecacht werden:', err)
          // Nicht-kritischer Fehler - Installation fortsetzen
        })
      }),

      // Offline-Fallbacks vorbereiten
      caches.open(API_CACHE).then(cache => {
        const offlineData = {
          players: [],
          error: 'Offline-Modus',
          message: 'Daten nicht verfügbar - Bitte Internetverbindung prüfen'
        }

        return cache.put('/api/players/offline', new Response(
          JSON.stringify(offlineData),
          { headers: { 'Content-Type': 'application/json', 'X-Offline': 'true' }}
        ))
      }),

      self.skipWaiting()
    ])
  )
})

// Aktivierung - Intelligente Cache-Verwaltung
self.addEventListener('activate', (event) => {
  console.log('⚡ Service Worker v2.2.0 Aktivierung')

  event.waitUntil(
    Promise.all([
      // Cleanup alter Cache-Versionen
      caches.keys().then(cacheNames => {
        return Promise.all(
          cacheNames
            .filter(cacheName => 
              cacheName.startsWith('mallex-') && 
              !cacheName.includes(CACHE_VERSION)
            )
            .map(cacheName => {
              console.log('🗑️ Lösche veralteten Cache:', cacheName)
              return caches.delete(cacheName)
            })
        )
      }),

      // Performance-Reset
      resetPerformanceCounters(),

      self.clients.claim()
    ])
  )
})

// Hauptfetch-Handler mit intelligenter Strategie-Auswahl
self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)

  // Skip non-GET requests und Chrome Extensions
  if (request.method !== 'GET' || url.protocol === 'chrome-extension:') {
    return
  }

  requestCount++
  const startTime = performance.now()

  event.respondWith(
    handleRequest(request, url).then(response => {
      const endTime = performance.now()
      const duration = endTime - startTime

      // Performance-Metrics tracken
      broadcastPerformanceMetric({
        type: 'FETCH_PERFORMANCE',
        url: url.pathname,
        duration,
        strategy: getStrategy(url.href),
        cacheHit: response.headers.get('X-Cache') === 'HIT',
        online: navigator.onLine
      })

      return response
    }).catch(error => {
      console.warn('🚨 Fetch Error:', error.message, 'für URL:', url.href)
      errorCount++ // Fehler zählen
      // Performance-Metrik für Fehler senden
      broadcastPerformanceMetric({
        type: 'FETCH_ERROR',
        url: url.pathname,
        error: error.message,
        strategy: getStrategy(url.href),
        online: navigator.onLine
      })
      return handleOfflineRequest(request, url)
    })
  )
})

// Intelligente Request-Behandlung mit Performance-Optimierung
async function handleRequest(request, url) {
  const strategy = getStrategy(url.href)

  // Spezielle Behandlung für verschiedene Request-Typen
  if (url.pathname.endsWith('.css') || url.pathname.endsWith('.js')) {
    return cacheFirstWithUpdate(request, STATIC_CACHE)
  }

  if (url.pathname.includes('/sounds/') || url.pathname.endsWith('.mp3')) {
    return cacheFirst(request, STATIC_CACHE)
  }

  if (url.pathname.includes('/images/') || url.pathname.endsWith('.png') || url.pathname.endsWith('.jpg')) {
    return cacheFirst(request, IMAGES_CACHE)
  }

  switch (strategy) {
    case 'network-first':
      return networkFirst(request)
    case 'cache-first':
      return cacheFirst(request, STATIC_CACHE)
    case 'stale-while-revalidate':
      return staleWhileRevalidate(request)
    case 'cache-only':
      return cacheOnly(request)
    default:
      return networkFirst(request)
  }
}

// Network-First für Firebase/API mit intelligentem Fallback
async function networkFirst(request) {
  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 5000) // 5s Timeout

    const networkResponse = await fetch(request, { 
      signal: controller.signal 
    })
    clearTimeout(timeoutId)

    if (networkResponse.ok) {
      // Cache erfolgreiche API-Responses
      const cache = await caches.open(API_CACHE)
      await cache.put(request, networkResponse.clone())
    }

    return networkResponse
  } catch (error) {
    console.log('🌐 Network Error, versuche Cache-Fallback:', error.message)

    // Intelligenter Cache-Fallback
    const cachedResponse = await caches.match(request)
    if (cachedResponse) {
      console.log('📱 Cache-Fallback erfolgreich für:', request.url)
      cacheHitCount++
      return addCacheHeaders(cachedResponse, true)
    }

    throw error
  }
}

// Cache-First mit Background-Update
async function cacheFirstWithUpdate(request, cacheName) {
  const cache = await caches.open(cacheName)
  const cachedResponse = await cache.match(request)

  if (cachedResponse) {
    // Background-Update für Freshness
    fetch(request).then(response => {
      if (response.ok) {
        cache.put(request, response.clone())
      }
    }).catch(() => {
      // Background-Update Fehler ignorieren
    })

    cacheHitCount++
    return addCacheHeaders(cachedResponse)
  }

  // Nicht im Cache - Network Request
  const networkResponse = await fetch(request)
  if (networkResponse.ok) {
    await cache.put(request, networkResponse.clone())
  }

  return networkResponse
}

// Optimierter Cache-First
async function cacheFirst(request, cacheName) {
  const cache = await caches.open(cacheName)
  const cachedResponse = await cache.match(request)

  if (cachedResponse) {
    cacheHitCount++
    return addCacheHeaders(cachedResponse)
  }

  try {
    const networkResponse = await fetch(request)
    if (networkResponse.ok) {
      await cache.put(request, networkResponse.clone())
    }
    return networkResponse
  } catch (error) {
    console.warn('❌ Cache-First Network-Fehler:', error.message)
    throw error
  }
}

// Stale-While-Revalidate mit Performance-Optimierung
async function staleWhileRevalidate(request) {
  const cache = await caches.open(API_CACHE)
  const cachedResponse = await cache.match(request)

  // Background-Update starten (non-blocking)
  const networkUpdate = fetch(request).then(response => {
    if (response.ok) {
      cache.put(request, response.clone())
    }
    return response
  }).catch(err => {
    console.log('🔄 Background-Update fehlgeschlagen:', err.message)
  })

  // Cached Response sofort zurückgeben, falls vorhanden
  if (cachedResponse) {
    cacheHitCount++
    return addCacheHeaders(cachedResponse)
  }

  // Ansonsten auf Network warten
  return networkUpdate
}

// Cache-Only für spezielle Offline-Ressourcen
async function cacheOnly(request) {
  const cachedResponse = await caches.match(request)
  if (cachedResponse) {
    cacheHitCount++
    return addCacheHeaders(cachedResponse)
  }

  throw new Error('Ressource nicht im Cache verfügbar')
}

// Erweiterte Offline-Behandlung
async function handleOfflineRequest(request, url) {
  offlineRequestCount++

  // Navigation Requests - SPA-Fallback
  if (request.mode === 'navigate') {
    const cachedResponse = await caches.match('/index.html')
    if (cachedResponse) {
      return addCacheHeaders(cachedResponse, true)
    }
  }

  // API Requests - Strukturierte Offline-Responses
  if (url.pathname.includes('/api/') || url.hostname.includes('firestore') || url.hostname.includes('firebase')) {
    const offlineResponse = {
      error: 'OFFLINE',
      message: 'Keine Internetverbindung verfügbar',
      offline: true,
      timestamp: new Date().toISOString(),
      cachedData: await getCachedData(request)
    }

    return new Response(
      JSON.stringify(offlineResponse),
      {
        status: 503,
        headers: {
          'Content-Type': 'application/json',
          'X-Offline': 'true',
          'X-Cache': 'OFFLINE-FALLBACK'
        }
      }
    )
  }

  // Statische Ressourcen - Cache-Fallback versuchen
  const cachedFallback = await findCachedFallback(request)
  if (cachedFallback) {
    return addCacheHeaders(cachedFallback, true)
  }

  throw new Error('Ressource offline nicht verfügbar')
}

// Hilfsfunktionen
function getStrategy(url) {
  for (const [strategy, patterns] of Object.entries(CACHE_STRATEGIES)) {
    if (patterns.some(pattern => url.includes(pattern))) {
      return strategy
    }
  }
  return 'network-first'
}

function addCacheHeaders(response, isOffline = false) {
  const headers = new Headers(response.headers)
  headers.set('X-Cache', 'HIT')
  headers.set('X-Cache-Date', new Date().toISOString())

  if (isOffline) {
    headers.set('X-Offline-Served', 'true')
  }

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers
  })
}

async function getCachedData(request) {
  try {
    const cached = await caches.match(request)
    if (cached) {
      return await cached.json()
    }
  } catch (error) {
    console.log('Keine gecachten Daten verfügbar für:', request.url)
  }
  return null
}

async function findCachedFallback(request) {
  const cacheNames = await caches.keys()

  for (const cacheName of cacheNames) {
    const cache = await caches.open(cacheName)
    const response = await cache.match(request)
    if (response) {
      return response
    }
  }

  return null
}

function resetPerformanceCounters() {
  requestCount = 0
  cacheHitCount = 0
  offlineRequestCount = 0
  errorCount = 0
  averageResponseTime = 0 // Reset average response time
}

// Performance-Metrics Broadcasting
function broadcastPerformanceMetric(metric) {
  const enhancedMetric = {
    ...metric,
    timestamp: Date.now(),
    serviceWorker: 'v2.2.0',
    stats: {
      totalRequests: requestCount,
      cacheHits: cacheHitCount,
      cacheHitRate: requestCount > 0 ? (cacheHitCount / requestCount * 100).toFixed(1) : 0,
      offlineRequests: offlineRequestCount,
      errorCount: errorCount, // Include error count
      averageResponseTime: averageResponseTime // Include average response time
    }
  }

  self.clients.matchAll().then(clients => {
    clients.forEach(client => {
      client.postMessage({
        type: 'SW_PERFORMANCE_METRIC',
        metric: enhancedMetric
      })
    })
  })
}

// Background Sync für Offline-Updates
self.addEventListener('sync', event => {
  if (event.tag === 'background-sync-firestore') {
    event.waitUntil(
      syncFirestoreUpdates().catch(error => {
        console.error('[SW] Background sync failed:', error);
        // Retry später
        return self.registration.sync.register('background-sync-firestore');
      })
    );
  }
});

// Push-Notifications Support (für zukünftige Features)
self.addEventListener('push', (event) => {
  const options = {
    body: event.data ? event.data.text() : 'MALLEX Benachrichtigung',
    icon: '/generated-icon.png',
    badge: '/generated-icon.png',
    tag: 'mallex-notification',
    requireInteraction: false,
    actions: [
      {
        action: 'open-arena',
        title: 'Arena öffnen'
      },
      {
        action: 'dismiss',
        title: 'Schließen'
      }
    ]
  }

  event.waitUntil(
    self.registration.showNotification('MALLEX', options)
  )
})

// Notification Click Handler
self.addEventListener('notificationclick', (event) => {
  event.notification.close()

  if (event.action === 'open-arena') {
    event.waitUntil(
      clients.openWindow('/#/arena')
    )
  }
})

// Periodisches Performance-Reporting
async function syncPerformanceMetrics() {
  const metrics = {
    cacheHitRate: requestCount > 0 ? (cacheHitCount / requestCount * 100) : 0,
    totalRequests: requestCount,
    offlineRequests: offlineRequestCount,
    timestamp: Date.now()
  }

  console.log('📊 Service Worker Performance-Report:', metrics)
}

// Zukünftige Player-Updates Synchronisation
async function syncPlayerUpdates() {
  console.log('🔄 Background-Sync für Spieler-Updates')
  // Hier würden Offline-Änderungen synchronisiert werden
}

// Firestore Updates Synchronisation ( Platzhalter )
async function syncFirestoreUpdates() {
  console.log('🔄 Synchronisiere Firestore Updates...');
  // Implementiere hier die Logik zur Synchronisierung von Firestore-Änderungen
  // Beispiel: Abrufen von Änderungen seit dem letzten Sync und Anwenden auf das Netzwerk
  // oder Senden von lokalen Änderungen an den Server.
  // Wenn erfolgreich:
  // return Promise.resolve();
  // Bei Fehler:
  // return Promise.reject(new Error('Firestore sync failed'));
}


console.log('🏛️ MALLEX Service Worker v2.2.0 geladen - Enhanced PWA-Performance aktiv! ⚔️🚀')