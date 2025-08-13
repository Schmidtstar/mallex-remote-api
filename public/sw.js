
// Service Worker für bessere Performance und Offline-Support
const CACHE_NAME = 'mallex-v1.3'
const MAX_CACHE_SIZE = 50 * 1024 * 1024 // 50MB Cache Limit
const urlsToCache = [
  '/',
  '/manifest.json',
  '/index.html'
]

// Installierung des Service Workers
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        return cache.addAll(urlsToCache)
      })
  )
  self.skipWaiting()
})

// Aktivierung und Cache-Management
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName)
          }
        })
      )
    })
  )
  event.waitUntil(self.clients.claim())
})

// Cache-Größe verwalten
async function manageCacheSize(cacheName, maxSize) {
  const cache = await caches.open(cacheName)
  const keys = await cache.keys()
  
  let totalSize = 0
  for (const key of keys) {
    const response = await cache.match(key)
    if (response) {
      const blob = await response.blob()
      totalSize += blob.size
    }
  }
  
  if (totalSize > maxSize) {
    // Älteste Einträge löschen
    await cache.delete(keys[0])
    await manageCacheSize(cacheName, maxSize)
  }
}

// Fetch-Events abfangen
self.addEventListener('fetch', event => {
  // Nur GET-Requests cachen
  if (event.request.method !== 'GET') return
  
  // Firebase-Requests nicht cachen
  if (event.request.url.includes('firebaseapp.com') || 
      event.request.url.includes('googleapis.com')) {
    return
  }
  
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Cache hit - return response
        if (response) {
          return response
        }
        
        // Netzwerk-Request mit Cache-Verwaltung
        return fetch(event.request).then(fetchResponse => {
          // Nur erfolgreiche Responses cachen
          if (fetchResponse.status === 200) {
            const responseClone = fetchResponse.clone()
            caches.open(CACHE_NAME).then(cache => {
              cache.put(event.request, responseClone)
              manageCacheSize(CACHE_NAME, MAX_CACHE_SIZE)
            })
          }
          return fetchResponse
        })
      })
      .catch(() => {
        // Fallback für Offline-Modus
        return caches.match('/')
      })
  )
})
