
const CACHE_VERSION = 'mallex-v2.1.0'
const STATIC_CACHE = `${CACHE_VERSION}-static`
const API_CACHE = `${CACHE_VERSION}-api`
const FIRESTORE_CACHE = `${CACHE_VERSION}-firestore`

// Erweiterte Caching-Strategien
const CACHE_STRATEGIES = {
  'network-first': [
    'firestore.googleapis.com',
    'identitytoolkit.googleapis.com',
    'firebase.googleapis.com'
  ],
  'cache-first': [
    'static/js/',
    'static/css/',
    'assets/',
    'sounds/',
    'manifest.json'
  ],
  'stale-while-revalidate': [
    'i18n/',
    'challenges.json',
    'categories.json'
  ]
}

// Kritische App-Ressourcen für Offline
const CRITICAL_RESOURCES = [
  '/',
  '/index.html',
  '/manifest.json',
  '/sounds/triumph.mp3',
  '/sounds/defeat.mp3'
]

// Installation - Aggressive Caching für kritische Ressourcen
self.addEventListener('install', (event) => {
  console.log('🏛️ MALLEX Service Worker Installation gestartet')
  
  event.waitUntil(
    Promise.all([
      caches.open(STATIC_CACHE).then(cache => {
        console.log('📦 Caching kritische Ressourcen...')
        return cache.addAll(CRITICAL_RESOURCES)
      }),
      self.skipWaiting()
    ])
  )
})

// Aktivierung - Cleanup alter Caches
self.addEventListener('activate', (event) => {
  console.log('⚡ Service Worker Aktivierung')
  
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
              console.log('🗑️ Lösche alten Cache:', cacheName)
              return caches.delete(cacheName)
            })
        )
      }),
      self.clients.claim()
    ])
  )
})

// Fetch Handler - Intelligente Caching-Strategien
self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)
  
  // Performance Tracking
  const startTime = performance.now()
  
  event.respondWith(
    handleRequest(request).then(response => {
      // Performance Metrics an Clients senden
      const endTime = performance.now()
      const duration = endTime - startTime
      
      broadcastPerformanceMetric({
        type: 'FETCH_PERFORMANCE',
        url: url.pathname,
        duration,
        strategy: getStrategy(url.href),
        cacheHit: response.headers.get('X-Cache') === 'HIT'
      })
      
      return response
    }).catch(error => {
      console.error('🚨 Fetch Error:', error, 'für URL:', url.href)
      return handleOfflineRequest(request)
    })
  )
})

// Intelligente Request-Behandlung
async function handleRequest(request) {
  const url = request.url
  const strategy = getStrategy(url)
  
  switch (strategy) {
    case 'network-first':
      return networkFirst(request)
    case 'cache-first':
      return cacheFirst(request)
    case 'stale-while-revalidate':
      return staleWhileRevalidate(request)
    default:
      return networkFirst(request)
  }
}

// Network-First für Firebase/API
async function networkFirst(request) {
  try {
    const networkResponse = await fetch(request)
    
    if (networkResponse.ok) {
      // Cache erfolgreiche Responses
      const cache = await caches.open(API_CACHE)
      await cache.put(request, networkResponse.clone())
    }
    
    return networkResponse
  } catch (error) {
    // Fallback auf Cache bei Netzwerk-Fehler
    const cachedResponse = await caches.match(request)
    if (cachedResponse) {
      console.log('📱 Offline-Fallback für:', request.url)
      return addCacheHeaders(cachedResponse)
    }
    throw error
  }
}

// Cache-First für statische Ressourcen
async function cacheFirst(request) {
  const cachedResponse = await caches.match(request)
  
  if (cachedResponse) {
    return addCacheHeaders(cachedResponse)
  }
  
  // Nicht im Cache - aus Netzwerk laden und cachen
  try {
    const networkResponse = await fetch(request)
    
    if (networkResponse.ok) {
      const cache = await caches.open(STATIC_CACHE)
      await cache.put(request, networkResponse.clone())
    }
    
    return networkResponse
  } catch (error) {
    console.error('❌ Cache-First Fehler:', error, request.url)
    throw error
  }
}

// Stale-While-Revalidate für häufig aktualisierte Inhalte
async function staleWhileRevalidate(request) {
  const cache = await caches.open(API_CACHE)
  const cachedResponse = await cache.match(request)
  
  // Background-Update starten
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
    return addCacheHeaders(cachedResponse)
  }
  
  // Ansonsten auf Netzwerk warten
  return networkUpdate
}

// Strategy-Detection basierend auf URL
function getStrategy(url) {
  for (const [strategy, patterns] of Object.entries(CACHE_STRATEGIES)) {
    if (patterns.some(pattern => url.includes(pattern))) {
      return strategy
    }
  }
  return 'network-first'
}

// Offline-Fallback für kritische Requests
async function handleOfflineRequest(request) {
  const url = new URL(request.url)
  
  // Navigation Requests - Fallback auf cached index.html
  if (request.mode === 'navigate') {
    const cachedResponse = await caches.match('/index.html')
    if (cachedResponse) {
      return addCacheHeaders(cachedResponse)
    }
  }
  
  // API Requests - Offline-Antwort
  if (url.pathname.includes('/api/') || url.hostname.includes('firestore')) {
    return new Response(
      JSON.stringify({
        error: 'Offline',
        message: 'Keine Internetverbindung verfügbar'
      }),
      {
        status: 503,
        headers: {
          'Content-Type': 'application/json',
          'X-Offline': 'true'
        }
      }
    )
  }
  
  throw new Error('Ressource offline nicht verfügbar')
}

// Cache-Headers für Performance-Tracking
function addCacheHeaders(response) {
  const headers = new Headers(response.headers)
  headers.set('X-Cache', 'HIT')
  headers.set('X-Cache-Date', new Date().toISOString())
  
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers
  })
}

// Performance-Metrics an Clients senden
function broadcastPerformanceMetric(metric) {
  self.clients.matchAll().then(clients => {
    clients.forEach(client => {
      client.postMessage({
        type: 'SW_PERFORMANCE_METRIC',
        metric: {
          ...metric,
          timestamp: Date.now(),
          serviceWorker: true
        }
      })
    })
  })
}

// Background-Sync für Offline-Updates (zukünftig)
self.addEventListener('sync', (event) => {
  if (event.tag === 'background-sync-player-updates') {
    event.waitUntil(syncPlayerUpdates())
  }
})

// Zukünftige Background-Sync Implementierung
async function syncPlayerUpdates() {
  console.log('🔄 Background-Sync für Spieler-Updates')
  // Implementation für Offline-Änderungen synchronisieren
}

console.log('🏛️ MALLEX Service Worker v2.1.0 geladen - Enhanced PWA-Funktionalität aktiv! ⚔️')
