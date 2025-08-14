
const CACHE_NAME = 'mallex-v1.2'
const STATIC_CACHE = 'mallex-static-v1.2'
const DYNAMIC_CACHE = 'mallex-dynamic-v1.2'

// Cache essential static assets
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json'
]

// Install event - cache static assets
self.addEventListener('install', event => {
  console.log('SW: Installing...')
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then(cache => {
        console.log('SW: Caching static assets')
        return cache.addAll(STATIC_ASSETS)
      })
      .then(() => self.skipWaiting())
  )
})

// Activate event - clean old caches
self.addEventListener('activate', event => {
  console.log('SW: Activating...')
  event.waitUntil(
    caches.keys()
      .then(cacheNames => {
        return Promise.all(
          cacheNames
            .filter(cacheName => 
              cacheName !== STATIC_CACHE && 
              cacheName !== DYNAMIC_CACHE
            )
            .map(cacheName => caches.delete(cacheName))
        )
      })
      .then(() => self.clients.claim())
  )
})

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', event => {
  const { request } = event
  const url = new URL(request.url)

  // Skip non-GET requests and Chrome extensions
  if (request.method !== 'GET' || url.protocol === 'chrome-extension:') {
    return
  }

  // Firebase/Firestore requests - always go to network
  if (url.hostname.includes('firebase') || url.hostname.includes('firestore')) {
    return
  }

  // Static assets - cache first
  if (STATIC_ASSETS.some(asset => url.pathname === asset)) {
    event.respondWith(
      caches.match(request)
        .then(response => response || fetch(request))
    )
    return
  }

  // Dynamic content - network first, cache fallback
  event.respondWith(
    fetch(request)
      .then(response => {
        // Only cache successful responses
        if (response.status === 200) {
          const responseClone = response.clone()
          caches.open(DYNAMIC_CACHE)
            .then(cache => cache.put(request, responseClone))
        }
        return response
      })
      .catch(() => {
        // Fallback to cache for offline support
        return caches.match(request)
          .then(response => {
            if (response) {
              return response
            }
            // Ultimate fallback for navigation requests
            if (request.destination === 'document') {
              return caches.match('/index.html')
            }
            throw new Error('No cached version available')
          })
      })
  )
})

// Handle messages from main thread
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting()
  }
})
