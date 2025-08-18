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
  const { request } = event
  const url = new URL(request.url)

  // Performance timing start
  const fetchStart = performance.now()
  performanceMetrics.totalRequests++

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return
  }

  // Advanced request categorization and routing
  event.respondWith(handleRequestWithIntelligentCaching(request, fetchStart))
})

// Intelligent Request Handler
async function handleRequestWithIntelligentCaching(request, fetchStart) {
  const url = new URL(request.url)
  const requestType = categorizeRequest(url, request)

  try {
    let response

    switch (requestType) {
      case 'critical-static':
        response = await cacheFirstStrategy(request, STATIC_CACHE)
        break

      case 'api-data':
        response = await networkFirstWithTimeout(request, API_CACHE, 2000)
        break

      case 'static-assets':
        response = await staleWhileRevalidateStrategy(request, DYNAMIC_CACHE)
        break

      case 'images':
        response = await cacheFirstWithFallback(request, DYNAMIC_CACHE, '/assets/placeholder.jpg')
        break

      case 'fonts':
        response = await cacheFirstStrategy(request, STATIC_CACHE)
        break

      case 'external':
        response = await networkOnlyWithAnalytics(request)
        break

      default:
        response = await networkFirstStrategy(request, DYNAMIC_CACHE)
    }

    // Performance tracking
    trackRequestPerformance(request, response, fetchStart, requestType)

    return response

  } catch (error) {
    performanceMetrics.failedRequests++
    console.error('SW: Request failed:', error)
    return createErrorResponse()
  }
}

// Request Categorization
function categorizeRequest(url, request) {
  const pathname = url.pathname
  const hostname = url.hostname

  // Critical app resources
  if (pathname === '/' || pathname.includes('index') || pathname.includes('main')) {
    return 'critical-static'
  }

  // API calls
  if (hostname.includes('firestore') || pathname.includes('/api/')) {
    return 'api-data'
  }

  // Static assets
  if (pathname.includes('/assets/') || pathname.match(/\.(js|css|ico)$/)) {
    return 'static-assets'
  }

  // Images
  if (pathname.match(/\.(jpg|jpeg|png|gif|svg|webp)$/)) {
    return 'images'
  }

  // Fonts
  if (pathname.match(/\.(woff|woff2|ttf|eot)$/)) {
    return 'fonts'
  }

  // External domains
  if (hostname !== self.location.hostname) {
    return 'external'
  }

  return 'default'
}

// Enhanced Caching Strategies

// Cache First with Performance Monitoring
async function cacheFirstStrategy(request, cacheName) {
  const cache = await caches.open(cacheName)
  const cachedResponse = await cache.match(request)

  if (cachedResponse) {
    performanceMetrics.cacheHits++

    // Background update for expired content
    if (await isCacheExpired(cachedResponse, cacheName)) {
      event.waitUntil(updateCacheInBackground(request, cache))
    }

    return cachedResponse
  }

  const networkResponse = await fetch(request)
  performanceMetrics.networkRequests++

  if (networkResponse.ok) {
    await cache.put(request, networkResponse.clone())
  }

  return networkResponse
}

// Network First with Timeout and Fallback
async function networkFirstWithTimeout(request, cacheName, timeout = 3000) {
  const cache = await caches.open(cacheName)

  try {
    const networkPromise = fetch(request)
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Network timeout')), timeout)
    )

    const networkResponse = await Promise.race([networkPromise, timeoutPromise])
    performanceMetrics.networkRequests++

    if (networkResponse.ok) {
      await cache.put(request, networkResponse.clone())
    }

    return networkResponse

  } catch (error) {
    console.warn('SW: Network failed, trying cache:', error)
    const cachedResponse = await cache.match(request)

    if (cachedResponse) {
      performanceMetrics.cacheHits++
      return cachedResponse
    }

    throw error
  }
}

// Stale While Revalidate with Smart Updates
async function staleWhileRevalidateStrategy(request, cacheName) {
  const cache = await caches.open(cacheName)
  const cachedResponse = await cache.match(request)

  const networkPromise = fetch(request).then(response => {
    if (response.ok) {
      cache.put(request, response.clone())
    }
    performanceMetrics.networkRequests++
    return response
  }).catch(error => {
    console.warn('SW: Network update failed:', error)
    return null
  })

  if (cachedResponse) {
    performanceMetrics.cacheHits++
    performanceMetrics.staleWhileRevalidateCount++

    // Return cached immediately, update in background
    event.waitUntil(networkPromise)
    return cachedResponse
  }

  // No cache, wait for network
  return await networkPromise || createErrorResponse()
}

// Cache First with Fallback
async function cacheFirstWithFallback(request, cacheName, fallbackUrl) {
  try {
    return await cacheFirstStrategy(request, cacheName)
  } catch (error) {
    const fallbackResponse = await caches.match(fallbackUrl)
    return fallbackResponse || createErrorResponse()
  }
}

// Network Only with Analytics
async function networkOnlyWithAnalytics(request) {
  performanceMetrics.networkOnlyRequests++
  const response = await fetch(request)
  performanceMetrics.networkRequests++
  return response
}

// Utility Functions

async function isCacheExpired(response, cacheName) {
  const cacheConfig = SMART_CACHE_CONFIG.maxAge
  const responseDate = new Date(response.headers.get('date') || Date.now())
  const now = new Date()
  const maxAge = cacheConfig[cacheName] || cacheConfig.static

  return (now - responseDate) > maxAge
}

async function updateCacheInBackground(request, cache) {
  try {
    const networkResponse = await fetch(request)
    if (networkResponse.ok) {
      await cache.put(request, networkResponse)
    }
  } catch (error) {
    console.warn('SW: Background cache update failed:', error)
  }
}

function trackRequestPerformance(request, response, fetchStart, requestType) {
  const responseTime = performance.now() - fetchStart

  // Update metrics
  const previousAvg = performanceMetrics.averageResponseTime
  const totalRequests = performanceMetrics.totalRequests
  performanceMetrics.averageResponseTime = 
    ((previousAvg * (totalRequests - 1)) + responseTime) / totalRequests

  if (responseTime > performanceMetrics.largestResponseTime) {
    performanceMetrics.largestResponseTime = responseTime
  }

  // Performance alerts
  if (responseTime > PERFORMANCE_THRESHOLDS.SLOW_RESPONSE) {
    console.warn(`SW: Slow response detected: ${Math.round(responseTime)}ms for ${request.url}`)
  }

  // Send metrics to main thread
  if (responseTime > 1000) { // Only report slow requests
    self.clients.matchAll().then(clients => {
      clients.forEach(client => {
        client.postMessage({
          type: 'SW_PERFORMANCE_METRIC',
          metric: {
            url: request.url,
            responseTime,
            requestType,
            timestamp: Date.now()
          }
        })
      })
    })
  }
}

function createErrorResponse() {
  return new Response(
    JSON.stringify({ error: 'Service temporarily unavailable' }),
    {
      status: 503,
      statusText: 'Service Unavailable',
      headers: { 'Content-Type': 'application/json' }
    }
  )
}

// MALLEX Service Worker v3.0 - Enterprise PWA
const CACHE_NAME_V3 = 'mallex-v3' // Renamed to avoid conflict
const DYNAMIC_CACHE_V3 = 'mallex-dynamic-v3' // Renamed to avoid conflict

// Intelligent caching strategies
const CACHE_STRATEGIES_V3 = { // Renamed to avoid conflict
  'network-first': [
    'firestore.googleapis.com',
    'identitytoolkit.googleapis.com'
  ],
  'cache-first': [
    '/static/',
    '/assets/',
    '/sounds/',
    '.js',
    '.css',
    '.woff2'
  ],
  'stale-while-revalidate': [
    '/i18n/',
    'challenges'
  ]
}

// Critical resources to cache immediately
const CRITICAL_RESOURCES_V3 = [ // Renamed to avoid conflict
  '/',
  '/index.html',
  '/assets/index.js',
  '/assets/index.css',
  '/manifest.json'
]

// Performance metrics tracking
let performanceMetrics_V3 = { // Renamed to avoid conflict
  cacheHits: 0,
  networkRequests: 0,
  totalRequests: 0,
  averageResponseTime: 0,
  failedRequests: 0, // Added for error tracking
  staleWhileRevalidateCount: 0, // Added for specific strategy tracking
  networkOnlyRequests: 0, // Added for network-only strategy tracking
  largestResponseTime: 0 // Added for largest response time tracking
}
// Placeholder for SMART_CACHE_CONFIG and PERFORMANCE_THRESHOLDS
const SMART_CACHE_CONFIG = {
  maxAge: {
    static: 86400000, // 24 hours
    dynamic: 3600000 // 1 hour
  }
}

const PERFORMANCE_THRESHOLDS = {
  SLOW_RESPONSE: 1000 // 1 second
}

// Install event - cache critical resources
self.addEventListener('install', (event) => {
  console.log('🔄 Installing MALLEX Service Worker v3.0')

  event.waitUntil(
    caches.open(CACHE_NAME_V3)
      .then(cache => {
        console.log('📦 Caching critical resources')
        return cache.addAll(CRITICAL_RESOURCES_V3)
      })
      .then(() => {
        console.log('✅ Service Worker installed successfully')
        return self.skipWaiting()
      })
  )
})

// Activate event - clean old caches
self.addEventListener('activate', (event) => {
  console.log('⚡ Activating MALLEX Service Worker v3.0')

  event.waitUntil(
    caches.keys()
      .then(cacheNames => {
        return Promise.all(
          cacheNames
            .filter(cacheName => cacheName !== CACHE_NAME_V3 && cacheName !== DYNAMIC_CACHE_V3)
            .map(cacheName => {
              console.log('🗑️ Deleting old cache:', cacheName)
              return caches.delete(cacheName)
            })
        )
      })
      .then(() => {
        console.log('🎯 Service Worker activated')
        return self.clients.claim()
      })
  )
})

// Fetch event - intelligent caching
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url)

  // Skip non-GET requests
  if (event.request.method !== 'GET') return

  // Determine cache strategy
  let strategy = 'network-first' // default

  for (const [strategyName, patterns] of Object.entries(CACHE_STRATEGIES_V3)) {
    if (patterns.some(pattern => url.href.includes(pattern))) {
      strategy = strategyName
      break
    }
  }

  event.respondWith(handleRequest(event.request, strategy))
})

// Strategy implementations
async function handleRequest(request, strategy) {
  const startTime = performance.now()

  try {
    switch (strategy) {
      case 'cache-first':
        return await cacheFirst(request)
      case 'network-first':
        return await networkFirst(request)
      case 'stale-while-revalidate':
        return await staleWhileRevalidate(request)
      default:
        return await networkFirst(request)
    }
  } finally {
    const duration = performance.now() - startTime
    console.log(`🔍 ${strategy}: ${request.url.split('/').pop()} (${duration.toFixed(0)}ms)`)
  }
}

async function cacheFirst(request) {
  const cache = await caches.open(CACHE_NAME_V3)
  const cached = await cache.match(request)

  if (cached) {
    return cached
  }

  try {
    const response = await fetch(request)
    if (response.ok) {
      cache.put(request, response.clone())
    }
    return response
  } catch (error) {
    console.warn('🚨 Network failed, no cache available:', request.url)
    throw error
  }
}

async function networkFirst(request) {
  try {
    const response = await fetch(request)
    if (response.ok) {
      const cache = await caches.open(DYNAMIC_CACHE_V3)
      cache.put(request, response.clone())
    }
    return response
  } catch (error) {
    const cache = await caches.open(CACHE_NAME_V3)
    const cached = await cache.match(request)
    if (cached) {
      console.log('📱 Serving from cache (offline):', request.url)
      return cached
    }
    throw error
  }
}

async function staleWhileRevalidate(request) {
  const cache = await caches.open(CACHE_NAME_V3)
  const cached = await cache.match(request)

  // Update cache in background
  const fetchPromise = fetch(request).then(response => {
    if (response.ok) {
      cache.put(request, response.clone())
    }
    return response
  }).catch(() => {})

  // Return cached version immediately if available
  if (cached) {
    // Don't await fetchPromise, run in background
    return cached
  }

  // Wait for network if no cache
  return await fetchPromise || createErrorResponse()
}

// Background sync for offline actions
self.addEventListener('sync', (event) => {
  if (event.tag === 'background-sync') {
    console.log('🔄 Background sync triggered')
    event.waitUntil(syncOfflineActions())
  }
})

async function syncOfflineActions() {
  // Sync pending arena updates, player actions, etc.
  const pendingActions = await getStoredActions()

  for (const action of pendingActions) {
    try {
      await processAction(action)
      await removeStoredAction(action.id)
    } catch (error) {
      console.warn('⚠️ Failed to sync action:', action, error)
    }
  }
}

// Message handling from main app
self.addEventListener('message', (event) => {
  const { type, payload } = event.data

  switch (type) {
    case 'SKIP_WAITING':
      self.skipWaiting()
      break
    case 'CACHE_RESOURCE':
      cacheResource(payload.url)
      break
    case 'CLEAR_CACHE':
      clearAllCaches()
      break
  }
})

async function cacheResource(url) {
  const cache = await caches.open(DYNAMIC_CACHE_V3)
  await cache.add(url)
}

async function clearAllCaches() {
  const cacheNames = await caches.keys()
  await Promise.all(cacheNames.map(name => caches.delete(name)))
}

console.log('🚀 MALLEX Service Worker v3.0 ready - Enterprise PWA features')