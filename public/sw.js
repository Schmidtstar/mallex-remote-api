
// MALLEX Service Worker v2.3.0 - Enhanced PWA Features
const CACHE_NAME = 'mallex-v2.3.0'
const STATIC_CACHE = 'mallex-static-v2.3.0'
const DYNAMIC_CACHE = 'mallex-dynamic-v2.3.0'
const API_CACHE = 'mallex-api-v2.3.0'

// Enhanced Caching Strategy Configuration
const CACHE_STRATEGIES = {
  networkFirst: [
    /firestore/,
    /auth/,
    /api/,
    /realtime/
  ],
  cacheFirst: [
    /\.(js|css|png|jpg|jpeg|gif|svg|ico|woff|woff2|ttf|eot)$/,
    /\/static\//,
    /\/assets\//,
    /\/sounds\//
  ],
  staleWhileRevalidate: [
    /challenges/,
    /i18n/,
    /tasks/,
    /leaderboard/
  ]
}

// Files to cache immediately
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/sounds/achievement.mp3',
  '/sounds/arena_start.mp3',
  '/sounds/click.mp3',
  '/sounds/correct.mp3',
  '/sounds/wrong.mp3'
]

// Install Event - Enhanced with intelligent preloading
self.addEventListener('install', (event) => {
  console.log('🔧 MALLEX Service Worker v2.3.0 installing...')
  
  event.waitUntil(
    Promise.all([
      // Static assets cache
      caches.open(STATIC_CACHE).then((cache) => {
        return cache.addAll(STATIC_ASSETS)
      }),
      
      // Pre-warm dynamic cache
      caches.open(DYNAMIC_CACHE),
      caches.open(API_CACHE),
      
      // Skip waiting for immediate activation
      self.skipWaiting()
    ])
  )
})

// Activate Event - Enhanced cleanup
self.addEventListener('activate', (event) => {
  console.log('✅ MALLEX Service Worker v2.3.0 activated')
  
  event.waitUntil(
    Promise.all([
      // Clean old caches
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter(name => 
              name.startsWith('mallex-') && 
              !['mallex-v2.3.0', 'mallex-static-v2.3.0', 'mallex-dynamic-v2.3.0', 'mallex-api-v2.3.0'].includes(name)
            )
            .map(name => caches.delete(name))
        )
      }),
      
      // Claim all clients
      self.clients.claim()
    ])
  )
})

// Enhanced Fetch Handler with intelligent caching strategies
self.addEventListener('fetch', (event) => {
  const request = event.request
  const url = new URL(request.url)
  
  // Skip non-GET requests
  if (request.method !== 'GET') {
    return
  }
  
  // Determine caching strategy
  const strategy = determineCachingStrategy(url)
  
  event.respondWith(
    handleRequest(request, strategy)
  )
})

// Determine optimal caching strategy
function determineCachingStrategy(url) {
  // Network First for real-time data
  for (const pattern of CACHE_STRATEGIES.networkFirst) {
    if (pattern.test(url.pathname) || pattern.test(url.href)) {
      return 'networkFirst'
    }
  }
  
  // Cache First for static assets
  for (const pattern of CACHE_STRATEGIES.cacheFirst) {
    if (pattern.test(url.pathname) || pattern.test(url.href)) {
      return 'cacheFirst'
    }
  }
  
  // Stale While Revalidate for frequently updated content
  for (const pattern of CACHE_STRATEGIES.staleWhileRevalidate) {
    if (pattern.test(url.pathname) || pattern.test(url.href)) {
      return 'staleWhileRevalidate'
    }
  }
  
  // Default to network first
  return 'networkFirst'
}

// Enhanced request handler with performance metrics
async function handleRequest(request, strategy) {
  const startTime = performance.now()
  
  try {
    let response
    
    switch (strategy) {
      case 'cacheFirst':
        response = await cacheFirst(request)
        break
      case 'staleWhileRevalidate':
        response = await staleWhileRevalidate(request)
        break
      case 'networkFirst':
      default:
        response = await networkFirst(request)
        break
    }
    
    // Track performance metrics
    const duration = performance.now() - startTime
    trackPerformanceMetric({
      type: 'SW_REQUEST',
      strategy,
      duration,
      url: request.url,
      cacheHit: response.headers.get('X-Cache-Status') === 'HIT'
    })
    
    return response
    
  } catch (error) {
    console.warn('Service Worker request failed:', error)
    return new Response('Offline - Content not available', {
      status: 503,
      statusText: 'Service Unavailable'
    })
  }
}

// Cache First Strategy
async function cacheFirst(request) {
  const cache = await caches.open(STATIC_CACHE)
  const cachedResponse = await cache.match(request)
  
  if (cachedResponse) {
    // Update cache in background
    fetch(request).then(response => {
      if (response.ok) {
        cache.put(request, response.clone())
      }
    }).catch(() => {}) // Silent fail for background updates
    
    return addCacheHeader(cachedResponse, 'HIT')
  }
  
  const networkResponse = await fetch(request)
  if (networkResponse.ok) {
    cache.put(request, networkResponse.clone())
  }
  
  return addCacheHeader(networkResponse, 'MISS')
}

// Network First Strategy
async function networkFirst(request) {
  try {
    const networkResponse = await fetch(request)
    
    if (networkResponse.ok) {
      const cache = await caches.open(DYNAMIC_CACHE)
      cache.put(request, networkResponse.clone())
    }
    
    return addCacheHeader(networkResponse, 'MISS')
    
  } catch (error) {
    // Fallback to cache
    const cache = await caches.open(DYNAMIC_CACHE)
    const cachedResponse = await cache.match(request)
    
    if (cachedResponse) {
      return addCacheHeader(cachedResponse, 'HIT')
    }
    
    throw error
  }
}

// Stale While Revalidate Strategy
async function staleWhileRevalidate(request) {
  const cache = await caches.open(DYNAMIC_CACHE)
  const cachedResponse = await cache.match(request)
  
  // Always try to update in background
  const fetchPromise = fetch(request).then(response => {
    if (response.ok) {
      cache.put(request, response.clone())
    }
    return response
  }).catch(() => {}) // Silent fail
  
  // Return cached version immediately if available
  if (cachedResponse) {
    fetchPromise // Don't await, run in background
    return addCacheHeader(cachedResponse, 'HIT')
  }
  
  // Wait for network if no cache
  const networkResponse = await fetchPromise
  return addCacheHeader(networkResponse, 'MISS')
}

// Add cache status header
function addCacheHeader(response, status) {
  const newResponse = new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: new Headers(response.headers)
  })
  
  newResponse.headers.set('X-Cache-Status', status)
  return newResponse
}

// Performance metrics tracking
function trackPerformanceMetric(metric) {
  // Send to main thread for processing
  self.clients.matchAll().then(clients => {
    clients.forEach(client => {
      client.postMessage({
        type: 'SW_PERFORMANCE_METRIC',
        metric
      })
    })
  })
}

// Background Sync for offline actions
self.addEventListener('sync', (event) => {
  if (event.tag === 'background-sync') {
    event.waitUntil(
      doBackgroundSync()
    )
  }
})

async function doBackgroundSync() {
  try {
    // Process offline queue if any
    const cache = await caches.open(API_CACHE)
    const requests = await cache.keys()
    
    for (const request of requests) {
      if (request.url.includes('/offline-queue/')) {
        try {
          await fetch(request)
          await cache.delete(request)
        } catch (error) {
          console.warn('Background sync failed for:', request.url)
        }
      }
    }
  } catch (error) {
    console.warn('Background sync failed:', error)
  }
}

// Push notification handler
self.addEventListener('push', (event) => {
  if (!event.data) return
  
  const options = {
    body: event.data.text(),
    icon: '/icon-192.png',
    badge: '/badge-72.png',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    },
    actions: [
      {
        action: 'open',
        title: 'App öffnen',
        icon: '/icon-192.png'
      }
    ]
  }
  
  event.waitUntil(
    self.registration.showNotification('MALLEX Update', options)
  )
})

console.log('🚀 MALLEX Service Worker v2.3.0 ready - Enhanced PWA features loaded')
