/**
 * SignumLBRI Service Worker - Advanced PWA Implementation 2025
 * High-performance caching and offline support for book marketplace
 */

const CACHE_VERSION = 'v2.0.0';
const CACHE_NAMES = {
  static: `signumlbri-static-${CACHE_VERSION}`,
  dynamic: `signumlbri-dynamic-${CACHE_VERSION}`,
  images: `signumlbri-images-${CACHE_VERSION}`,
  api: `signumlbri-api-${CACHE_VERSION}`
};

// Static assets to cache immediately
const STATIC_ASSETS = [
  '/',
  '/css/main.css',
  '/css/tailwind.css',
  '/js/main.js',
  '/js/lazy-images.js',
  '/js/alpine.min.js',
  '/manifest.json',
  '/images/logo.svg',
  '/images/placeholder-book.png',
  '/images/placeholder-error.png',
  '/fonts/inter-var.woff2'
];

// API routes to cache with strategy
const API_CACHE_ROUTES = [
  '/api/books/browse',
  '/api/schools',
  '/api/categories'
];

// Image optimization cache settings
const IMAGE_CACHE_CONFIG = {
  maxEntries: 500,
  maxAgeSeconds: 30 * 24 * 60 * 60, // 30 days
  purgeOnQuotaError: true
};

/**
 * Installation event - Cache static assets
 */
self.addEventListener('install', (event) => {
  console.log('Service Worker: Installing...');
  
  event.waitUntil(
    (async () => {
      try {
        const cache = await caches.open(CACHE_NAMES.static);
        await cache.addAll(STATIC_ASSETS);
        console.log('Service Worker: Static assets cached');
        
        // Skip waiting to activate immediately
        self.skipWaiting();
      } catch (error) {
        console.error('Service Worker: Installation failed', error);
      }
    })()
  );
});

/**
 * Activation event - Clean up old caches
 */
self.addEventListener('activate', (event) => {
  console.log('Service Worker: Activating...');
  
  event.waitUntil(
    (async () => {
      try {
        const cacheNames = await caches.keys();
        const validCacheNames = Object.values(CACHE_NAMES);
        
        // Delete old caches
        await Promise.all(
          cacheNames.map(cacheName => {
            if (!validCacheNames.includes(cacheName)) {
              console.log('Service Worker: Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
        
        // Take control of all pages
        self.clients.claim();
        console.log('Service Worker: Activated successfully');
      } catch (error) {
        console.error('Service Worker: Activation failed', error);
      }
    })()
  );
});

/**
 * Fetch event - Advanced caching strategies
 */
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }
  
  // Skip chrome-extension requests
  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    return;
  }

  event.respondWith(handleFetchRequest(request, url));
});

/**
 * Handle fetch requests with appropriate caching strategy
 */
async function handleFetchRequest(request, url) {
  try {
    // Strategy 1: Static assets - Cache First
    if (isStaticAsset(url)) {
      return await cacheFirstStrategy(request, CACHE_NAMES.static);
    }
    
    // Strategy 2: Images - Cache First with optimization
    if (isImageRequest(url)) {
      return await imageCacheStrategy(request);
    }
    
    // Strategy 3: API requests - Network First
    if (isApiRequest(url)) {
      return await networkFirstStrategy(request, CACHE_NAMES.api);
    }
    
    // Strategy 4: HTML pages - Stale While Revalidate
    if (isHtmlRequest(request)) {
      return await staleWhileRevalidateStrategy(request, CACHE_NAMES.dynamic);
    }
    
    // Default: Network First
    return await networkFirstStrategy(request, CACHE_NAMES.dynamic);
    
  } catch (error) {
    console.error('Service Worker: Fetch failed', error);
    return await getOfflineFallback(request, url);
  }
}

/**
 * Cache First Strategy - For static assets
 */
async function cacheFirstStrategy(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  
  if (cached) {
    return cached;
  }
  
  try {
    const response = await fetch(request);
    if (response.ok) {
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    console.warn('Service Worker: Network failed, no cache available', error);
    throw error;
  }
}

/**
 * Network First Strategy - For API and dynamic content
 */
async function networkFirstStrategy(request, cacheName, timeout = 3000) {
  const cache = await caches.open(cacheName);
  
  try {
    // Try network with timeout
    const networkResponse = await Promise.race([
      fetch(request),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Network timeout')), timeout)
      )
    ]);
    
    if (networkResponse.ok) {
      // Cache successful responses
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
    
  } catch (error) {
    console.warn('Service Worker: Network failed, trying cache', error);
    
    // Fallback to cache
    const cached = await cache.match(request);
    if (cached) {
      return cached;
    }
    
    throw error;
  }
}

/**
 * Stale While Revalidate Strategy - For HTML pages
 */
async function staleWhileRevalidateStrategy(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  
  // Always try to fetch and update cache in background
  const fetchPromise = fetch(request).then(response => {
    if (response.ok) {
      cache.put(request, response.clone());
    }
    return response;
  }).catch(error => {
    console.warn('Service Worker: Background fetch failed', error);
  });
  
  // Return cached version immediately if available
  if (cached) {
    return cached;
  }
  
  // If no cache, wait for network
  return await fetchPromise;
}

/**
 * Advanced image caching with size optimization
 */
async function imageCacheStrategy(request) {
  const cache = await caches.open(CACHE_NAMES.images);
  const url = new URL(request.url);
  
  // Check cache first
  const cached = await cache.match(request);
  if (cached) {
    return cached;
  }
  
  try {
    const response = await fetch(request);
    
    if (response.ok && response.headers.get('content-type')?.startsWith('image/')) {
      // Clone for caching
      const responseClone = response.clone();
      
      // Cache management - remove old entries if needed
      await manageImageCache(cache, request, responseClone);
    }
    
    return response;
  } catch (error) {
    // Return placeholder image for failed image requests
    return await getImagePlaceholder();
  }
}

/**
 * Manage image cache size and cleanup
 */
async function manageImageCache(cache, request, response) {
  const keys = await cache.keys();
  
  // If approaching limit, remove oldest entries
  if (keys.length >= IMAGE_CACHE_CONFIG.maxEntries) {
    const oldestKeys = keys.slice(0, Math.floor(keys.length * 0.2)); // Remove 20%
    await Promise.all(oldestKeys.map(key => cache.delete(key)));
  }
  
  // Cache the new image
  await cache.put(request, response);
}

/**
 * Get offline fallback responses
 */
async function getOfflineFallback(request, url) {
  if (isHtmlRequest(request)) {
    return await getOfflineHtmlFallback();
  }
  
  if (isImageRequest(url)) {
    return await getImagePlaceholder();
  }
  
  if (isApiRequest(url)) {
    return new Response(
      JSON.stringify({ 
        error: 'Brak połączenia z internetem',
        message: 'Ta funkcja wymaga połączenia z internetem',
        offline: true 
      }),
      { 
        status: 503,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
  
  return new Response('Offline', { status: 503 });
}

/**
 * Get offline HTML page
 */
async function getOfflineHtmlFallback() {
  const offlineHtml = `
    <!DOCTYPE html>
    <html lang="pl">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>SignumLBRI - Offline</title>
      <style>
        body { font-family: system-ui; text-align: center; padding: 2rem; }
        .offline-icon { font-size: 4rem; margin-bottom: 1rem; }
        .offline-title { color: #1f2937; margin-bottom: 0.5rem; }
        .offline-message { color: #6b7280; margin-bottom: 2rem; }
        .retry-button { 
          background: #2563eb; color: white; padding: 0.75rem 1.5rem; 
          border: none; border-radius: 0.5rem; cursor: pointer; 
        }
      </style>
    </head>
    <body>
      <div class="offline-container">
        <div class="offline-icon">📖</div>
        <h1 class="offline-title">SignumLBRI - Tryb offline</h1>
        <p class="offline-message">
          Brak połączenia z internetem. Sprawdź połączenie i spróbuj ponownie.
        </p>
        <button class="retry-button" onclick="window.location.reload()">
          Spróbuj ponownie
        </button>
      </div>
    </body>
    </html>
  `;
  
  return new Response(offlineHtml, {
    headers: { 'Content-Type': 'text/html; charset=utf-8' }
  });
}

/**
 * Get image placeholder for failed image loads
 */
async function getImagePlaceholder() {
  const cache = await caches.open(CACHE_NAMES.static);
  const placeholder = await cache.match('/images/placeholder-error.png');
  
  if (placeholder) {
    return placeholder;
  }
  
  // Generate SVG placeholder if no cached placeholder available
  const svgPlaceholder = `
    <svg width="200" height="200" xmlns="http://www.w3.org/2000/svg">
      <rect width="200" height="200" fill="#f3f4f6"/>
      <text x="50%" y="50%" text-anchor="middle" dy="0.3em" font-family="system-ui" font-size="14" fill="#9ca3af">
        Brak obrazu
      </text>
    </svg>
  `;
  
  return new Response(svgPlaceholder, {
    headers: { 'Content-Type': 'image/svg+xml' }
  });
}

/**
 * Helper functions to identify request types
 */
function isStaticAsset(url) {
  return STATIC_ASSETS.some(asset => url.pathname === asset) ||
         url.pathname.startsWith('/css/') ||
         url.pathname.startsWith('/js/') ||
         url.pathname.startsWith('/fonts/');
}

function isImageRequest(url) {
  return url.pathname.match(/\.(png|jpg|jpeg|gif|svg|webp|ico)$/i) ||
         url.pathname.includes('/image') ||
         url.pathname.includes('/images/');
}

function isApiRequest(url) {
  return url.pathname.startsWith('/api/');
}

function isHtmlRequest(request) {
  return request.headers.get('accept')?.includes('text/html');
}

/**
 * Background sync for form submissions
 */
self.addEventListener('sync', (event) => {
  console.log('Service Worker: Background sync triggered', event.tag);
  
  if (event.tag === 'book-ad-submit') {
    event.waitUntil(handleBookAdBackgroundSync());
  }
  
  if (event.tag === 'cart-update') {
    event.waitUntil(handleCartBackgroundSync());
  }
});

/**
 * Handle background sync for book ad submissions
 */
async function handleBookAdBackgroundSync() {
  try {
    // Get pending submissions from IndexedDB
    const pendingSubmissions = await getPendingBookAdSubmissions();
    
    for (const submission of pendingSubmissions) {
      try {
        await submitBookAd(submission);
        await removePendingSubmission(submission.id);
      } catch (error) {
        console.error('Background sync failed for submission:', submission.id, error);
      }
    }
  } catch (error) {
    console.error('Background sync failed:', error);
  }
}

/**
 * Handle background sync for cart updates
 */
async function handleCartBackgroundSync() {
  try {
    const pendingCartUpdates = await getPendingCartUpdates();
    
    for (const update of pendingCartUpdates) {
      try {
        await updateCart(update);
        await removePendingCartUpdate(update.id);
      } catch (error) {
        console.error('Background sync failed for cart update:', update.id, error);
      }
    }
  } catch (error) {
    console.error('Cart background sync failed:', error);
  }
}

/**
 * Push notifications
 */
self.addEventListener('push', (event) => {
  if (!event.data) {
    return;
  }
  
  const data = event.data.json();
  
  const options = {
    body: data.body,
    icon: '/images/pwa/icon-192x192.png',
    badge: '/images/pwa/icon-72x72.png',
    data: data.data || {},
    actions: [
      {
        action: 'view',
        title: 'Zobacz',
        icon: '/images/pwa/action-view.png'
      },
      {
        action: 'dismiss',
        title: 'Zamknij',
        icon: '/images/pwa/action-dismiss.png'
      }
    ],
    requireInteraction: true,
    renotify: true,
    tag: data.tag || 'signumlbri-notification'
  };
  
  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

/**
 * Handle notification clicks
 */
self.addEventListener('notificationclick', (event) => {
  const { action, notification } = event;
  const data = notification.data || {};
  
  event.notification.close();
  
  if (action === 'view' || !action) {
    const url = data.url || '/';
    
    event.waitUntil(
      clients.matchAll({ type: 'window' }).then((clientList) => {
        // Try to focus existing window
        for (const client of clientList) {
          if (client.url === url && 'focus' in client) {
            return client.focus();
          }
        }
        
        // Open new window if no existing window found
        if (clients.openWindow) {
          return clients.openWindow(url);
        }
      })
    );
  }
});

// IndexedDB helper functions (simplified - would need full implementation)
async function getPendingBookAdSubmissions() {
  // Implementation would use IndexedDB
  return [];
}

async function removePendingSubmission(id) {
  // Implementation would use IndexedDB
}

async function getPendingCartUpdates() {
  // Implementation would use IndexedDB
  return [];
}

async function removePendingCartUpdate(id) {
  // Implementation would use IndexedDB
}

async function submitBookAd(submission) {
  // Implementation would submit to API
}

async function updateCart(update) {
  // Implementation would update cart via API
}

console.log('Service Worker: Registered successfully');
