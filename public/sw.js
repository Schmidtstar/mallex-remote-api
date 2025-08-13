
// Service Worker für bessere Performance und Offline-Support
const CACHE_NAME = 'mallex-v1.2'
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
        return fetch(event.request)
      })
  )
})
