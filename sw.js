// ===== SERVICE WORKER - KDKMP PORTAL =====

const CACHE_NAME = 'kdkmp-portal-v1.2';
const OFFLINE_URL = '/tombolkd/offline.html';

// Assets to cache on install
const PRECACHE_ASSETS = [
  '/tombolkd/',
  '/tombolkd/index.html',
  '/tombolkd/style.css',
  '/tombolkd/script.js',
  '/tombolkd/manifest.json',
  'https://cdn.jsdelivr.net/npm/@mdi/svg@7.4.47/svg/earth.svg',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/webfonts/fa-solid-900.woff2'
];

// ===== INSTALL EVENT =====
self.addEventListener('install', event => {
  console.log('🛠️ Service Worker: Installing...');
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('📦 Service Worker: Caching core assets');
        return cache.addAll(PRECACHE_ASSETS);
      })
      .then(() => {
        console.log('✅ Service Worker: Installation complete');
        return self.skipWaiting();
      })
      .catch(error => {
        console.error('❌ Service Worker: Installation failed', error);
      })
  );
});

// ===== ACTIVATE EVENT =====
self.addEventListener('activate', event => {
  console.log('🚀 Service Worker: Activating...');
  
  // Clean up old caches
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('🧹 Service Worker: Deleting old cache', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
    .then(() => {
      console.log('✅ Service Worker: Activation complete');
      return self.clients.claim();
    })
  );
});

// ===== FETCH EVENT =====
self.addEventListener('fetch', event => {
  // Skip non-GET requests
  if (event.request.method !== 'GET') return;
  
  // Skip chrome-extension requests
  if (event.request.url.startsWith('chrome-extension://')) return;
  
  // Handle different strategies based on request type
  const requestUrl = new URL(event.request.url);
  
  // Strategy: Cache First, Fallback to Network
  if (PRECACHE_ASSETS.some(asset => event.request.url.includes(asset))) {
    event.respondWith(cacheFirst(event.request));
  } 
  // Strategy: Network First, Fallback to Cache (for API calls)
  else if (requestUrl.pathname.includes('/api/')) {
    event.respondWith(networkFirst(event.request));
  }
  // Default: Cache with Network Update
  else {
    event.respondWith(cacheWithUpdate(event.request));
  }
});

// ===== CACHING STRATEGIES =====

/**
 * Cache First Strategy
 */
async function cacheFirst(request) {
  const cachedResponse = await caches.match(request);
  
  if (cachedResponse) {
    // Update cache in background
    updateCache(request);
    return cachedResponse;
  }
  
  try {
    const networkResponse = await fetch(request);
    
    // Cache the new response
    const cache = await caches.open(CACHE_NAME);
    cache.put(request, networkResponse.clone());
    
    return networkResponse;
  } catch (error) {
    // If both cache and network fail, return offline page
    return caches.match('/tombolkd/');
  }
}

/**
 * Network First Strategy
 */
async function networkFirst(request) {
  try {
    const networkResponse = await fetch(request);
    
    // Update cache
    const cache = await caches.open(CACHE_NAME);
    cache.put(request, networkResponse.clone());
    
    return networkResponse;
  } catch (error) {
    // Fallback to cache
    const cachedResponse = await caches.match(request);
    return cachedResponse || Response.error();
  }
}

/**
 * Cache with Background Update
 */
async function cacheWithUpdate(request) {
  const cachedResponse = await caches.match(request);
  
  // Always try network
  const networkPromise = fetch(request)
    .then(networkResponse => {
      // Update cache
      caches.open(CACHE_NAME)
        .then(cache => cache.put(request, networkResponse.clone()));
      return networkResponse;
    })
    .catch(() => {
      // Network failed
      return null;
    });
  
  // Return cached response immediately, then update
  if (cachedResponse) {
    return cachedResponse;
  }
  
  // If no cache, wait for network
  const networkResponse = await networkPromise;
  if (networkResponse) {
    return networkResponse;
  }
  
  // If all fails, return offline page
  return caches.match('/tombolkd/');
}

/**
 * Background Cache Update
 */
async function updateCache(request) {
  try {
    const networkResponse = await fetch(request);
    const cache = await caches.open(CACHE_NAME);
    cache.put(request, networkResponse.clone());
  } catch (error) {
    // Silent fail for background updates
    console.log('Background update failed:', error);
  }
}

// ===== BACKGROUND SYNC =====
self.addEventListener('sync', event => {
  if (event.tag === 'sync-data') {
    console.log('🔄 Background sync: Syncing data...');
    event.waitUntil(syncData());
  }
});

async function syncData() {
  // Implement your background sync logic here
  console.log('Data synced in background');
  return Promise.resolve();
}

// ===== PUSH NOTIFICATIONS =====
self.addEventListener('push', event => {
  console.log('📢 Push notification received');
  
  const options = {
    body: event.data?.text() || 'Update dari KDKMP Portal',
    icon: 'https://cdn.jsdelivr.net/npm/@mdi/svg@7.4.47/svg/earth.svg',
    badge: 'https://cdn.jsdelivr.net/npm/@mdi/svg@7.4.47/svg/earth.svg',
    vibrate: [200, 100, 200],
    tag: 'kdkmp-update',
    data: {
      url: '/tombolkd/',
      timestamp: Date.now()
    },
    actions: [
      { action: 'open', title: 'Buka Portal' },
      { action: 'close', title: 'Tutup' }
    ]
  };
  
  event.waitUntil(
    self.registration.showNotification('KDKMP Portal', options)
  );
});

// ===== NOTIFICATION CLICK =====
self.addEventListener('notificationclick', event => {
  console.log('🖱️ Notification clicked');
  
  event.notification.close();
  
  const action = event.action;
  
  if (action === 'open') {
    event.waitUntil(
      clients.matchAll({ type: 'window', includeUncontrolled: true })
        .then(clientList => {
          // Focus existing window
          for (const client of clientList) {
            if (client.url === self.registration.scope && 'focus' in client) {
              return client.focus();
            }
          }
          
          // Open new window
          if (clients.openWindow) {
            return clients.openWindow('/tombolkd/');
          }
        })
    );
  }
});

// ===== PERIODIC SYNC (if supported) =====
if ('periodicSync' in self.registration) {
  self.addEventListener('periodicsync', event => {
    if (event.tag === 'update-content') {
      console.log('⏰ Periodic sync triggered');
      event.waitUntil(updateContent());
    }
  });
}

async function updateContent() {
  // Update cached content periodically
  console.log('Updating content in background');
  return Promise.resolve();
}

// ===== MESSAGE HANDLING =====
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'GET_CACHE_INFO') {
    caches.keys().then(cacheNames => {
      event.ports[0].postMessage({
        type: 'CACHE_INFO',
        cacheNames: cacheNames
      });
    });
  }
});

// ===== ERROR HANDLING =====
self.addEventListener('error', event => {
  console.error('Service Worker Error:', event.error);
});

self.addEventListener('unhandledrejection', event => {
  console.error('Service Worker Unhandled Rejection:', event.reason);
});

// Log Service Worker status
console.log('✅ Service Worker loaded successfully');
