/**
 * PWA Manager - Progressive Web App functionality for SignumLBRI
 * Handles service worker registration, app updates, and PWA features
 */

class PWAManager {
  constructor() {
    this.registration = null;
    this.isOnline = navigator.onLine;
    this.updateAvailable = false;
    this.deferredPrompt = null;
    this.notificationPermission = 'default';
    
    this.init();
  }

  async init() {
    // Register service worker
    await this.registerServiceWorker();
    
    // Setup event listeners
    this.setupEventListeners();
    
    // Check for updates periodically
    this.startUpdateChecker();
    
    // Initialize PWA install prompt
    this.setupInstallPrompt();
    
    // Request notification permission
    await this.requestNotificationPermission();
    
    console.log('PWA Manager: Initialized successfully');
  }

  /**
   * Register service worker
   */
  async registerServiceWorker() {
    if (!('serviceWorker' in navigator)) {
      console.warn('PWA Manager: Service Worker not supported');
      return;
    }

    try {
      this.registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/',
        updateViaCache: 'none' // Always check for updates
      });

      console.log('PWA Manager: Service Worker registered', this.registration);

      // Handle service worker updates
      this.registration.addEventListener('updatefound', () => {
        const newWorker = this.registration.installing;
        
        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            console.log('PWA Manager: New version available');
            this.updateAvailable = true;
            this.showUpdateNotification();
          }
        });
      });

      // Listen for messages from service worker
      navigator.serviceWorker.addEventListener('message', (event) => {
        this.handleServiceWorkerMessage(event.data);
      });

    } catch (error) {
      console.error('PWA Manager: Service Worker registration failed', error);
    }
  }

  /**
   * Setup event listeners for PWA functionality
   */
  setupEventListeners() {
    // Online/offline status
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.handleOnlineStatusChange(true);
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
      this.handleOnlineStatusChange(false);
    });

    // Before install prompt
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      this.deferredPrompt = e;
      this.showInstallButton();
    });

    // App installed
    window.addEventListener('appinstalled', () => {
      console.log('PWA Manager: App installed');
      this.hideInstallButton();
      this.trackEvent('pwa_installed');
    });

    // Visibility change (for background sync)
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden && this.updateAvailable) {
        this.showUpdateNotification();
      }
    });
  }

  /**
   * Handle online/offline status changes
   */
  handleOnlineStatusChange(isOnline) {
    const statusIndicator = this.getOrCreateStatusIndicator();
    
    if (isOnline) {
      statusIndicator.textContent = 'Online';
      statusIndicator.className = 'status-indicator online';
      
      // Sync pending data when coming back online
      this.syncPendingData();
      
      // Hide offline notification
      this.hideOfflineNotification();
    } else {
      statusIndicator.textContent = 'Offline';
      statusIndicator.className = 'status-indicator offline';
      
      // Show offline notification
      this.showOfflineNotification();
    }

    // Auto-hide after 3 seconds
    setTimeout(() => {
      statusIndicator.style.opacity = '0';
    }, 3000);
  }

  /**
   * Get or create status indicator element
   */
  getOrCreateStatusIndicator() {
    let indicator = document.getElementById('pwa-status-indicator');
    
    if (!indicator) {
      indicator = document.createElement('div');
      indicator.id = 'pwa-status-indicator';
      indicator.className = 'status-indicator';
      document.body.appendChild(indicator);
    }
    
    indicator.style.opacity = '1';
    return indicator;
  }

  /**
   * Show offline notification
   */
  showOfflineNotification() {
    const notification = this.getOrCreateNotificationElement('offline-notification', {
      type: 'warning',
      title: 'Tryb offline',
      message: 'Niektóre funkcje mogą być niedostępne. Dane będą zsynchronizowane po powrocie połączenia.',
      persistent: true
    });
    
    notification.style.display = 'block';
  }

  /**
   * Hide offline notification
   */
  hideOfflineNotification() {
    const notification = document.getElementById('offline-notification');
    if (notification) {
      notification.style.display = 'none';
    }
  }

  /**
   * Start periodic update checker
   */
  startUpdateChecker() {
    // Check for updates every 30 minutes
    setInterval(() => {
      if (this.registration) {
        this.registration.update();
      }
    }, 30 * 60 * 1000);
  }

  /**
   * Show update notification
   */
  showUpdateNotification() {
    const notification = this.getOrCreateNotificationElement('update-notification', {
      type: 'info',
      title: 'Dostępna aktualizacja',
      message: 'Nowa wersja aplikacji jest dostępna.',
      actions: [
        {
          text: 'Aktualizuj teraz',
          action: () => this.applyUpdate(),
          primary: true
        },
        {
          text: 'Później',
          action: () => this.hideUpdateNotification()
        }
      ]
    });
    
    notification.style.display = 'block';
  }

  /**
   * Hide update notification
   */
  hideUpdateNotification() {
    const notification = document.getElementById('update-notification');
    if (notification) {
      notification.style.display = 'none';
    }
  }

  /**
   * Apply service worker update
   */
  async applyUpdate() {
    if (!this.registration || !this.registration.waiting) {
      return;
    }

    // Tell the waiting service worker to activate
    this.registration.waiting.postMessage({ type: 'SKIP_WAITING' });
    
    // Reload the page after activation
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      window.location.reload();
    });
    
    this.hideUpdateNotification();
  }

  /**
   * Setup PWA install prompt
   */
  setupInstallPrompt() {
    // Only show install button if not already installed
    if (window.matchMedia('(display-mode: standalone)').matches || 
        window.navigator.standalone === true) {
      console.log('PWA Manager: App already installed');
      return;
    }
  }

  /**
   * Show install button
   */
  showInstallButton() {
    let installBtn = document.getElementById('pwa-install-btn');
    
    if (!installBtn) {
      installBtn = document.createElement('button');
      installBtn.id = 'pwa-install-btn';
      installBtn.className = 'pwa-install-button';
      installBtn.innerHTML = `
        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
          <path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"/>
        </svg>
        Zainstaluj aplikację
      `;
      
      // Find appropriate place to insert button (e.g., in header)
      const header = document.querySelector('header') || document.body;
      header.appendChild(installBtn);
    }
    
    installBtn.style.display = 'block';
    installBtn.onclick = () => this.promptInstall();
  }

  /**
   * Hide install button
   */
  hideInstallButton() {
    const installBtn = document.getElementById('pwa-install-btn');
    if (installBtn) {
      installBtn.style.display = 'none';
    }
  }

  /**
   * Prompt user to install PWA
   */
  async promptInstall() {
    if (!this.deferredPrompt) {
      return;
    }

    this.deferredPrompt.prompt();
    
    const { outcome } = await this.deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      console.log('PWA Manager: User accepted install prompt');
      this.trackEvent('pwa_install_accepted');
    } else {
      console.log('PWA Manager: User dismissed install prompt');
      this.trackEvent('pwa_install_dismissed');
    }
    
    this.deferredPrompt = null;
    this.hideInstallButton();
  }

  /**
   * Request notification permission
   */
  async requestNotificationPermission() {
    if (!('Notification' in window)) {
      console.warn('PWA Manager: Notifications not supported');
      return;
    }

    this.notificationPermission = await Notification.requestPermission();
    console.log('PWA Manager: Notification permission:', this.notificationPermission);
  }

  /**
   * Show local notification
   */
  showLocalNotification(title, options = {}) {
    if (this.notificationPermission !== 'granted') {
      console.warn('PWA Manager: Notification permission not granted');
      return;
    }

    const notification = new Notification(title, {
      icon: '/images/pwa/icon-192x192.png',
      badge: '/images/pwa/icon-72x72.png',
      ...options
    });

    // Auto-close after 5 seconds unless specified otherwise
    if (options.autoClose !== false) {
      setTimeout(() => notification.close(), 5000);
    }

    return notification;
  }

  /**
   * Handle messages from service worker
   */
  handleServiceWorkerMessage(data) {
    switch (data.type) {
      case 'CACHE_UPDATED':
        console.log('PWA Manager: Cache updated', data.cacheName);
        break;
        
      case 'BACKGROUND_SYNC_SUCCESS':
        console.log('PWA Manager: Background sync successful', data.tag);
        this.showLocalNotification('Dane zsynchronizowane', {
          body: 'Twoje dane zostały pomyślnie zsynchronizowane.',
          tag: 'sync-success'
        });
        break;
        
      case 'BACKGROUND_SYNC_FAILED':
        console.error('PWA Manager: Background sync failed', data.tag, data.error);
        this.showLocalNotification('Błąd synchronizacji', {
          body: 'Nie udało się zsynchronizować danych. Spróbuj ponownie.',
          tag: 'sync-error'
        });
        break;
    }
  }

  /**
   * Sync pending data when coming back online
   */
  async syncPendingData() {
    if (!this.registration || !this.registration.sync) {
      return;
    }

    try {
      // Register background sync for different types of data
      await this.registration.sync.register('book-ad-submit');
      await this.registration.sync.register('cart-update');
      
      console.log('PWA Manager: Background sync registered');
    } catch (error) {
      console.error('PWA Manager: Background sync registration failed', error);
    }
  }

  /**
   * Create or update notification element
   */
  getOrCreateNotificationElement(id, config) {
    let notification = document.getElementById(id);
    
    if (!notification) {
      notification = document.createElement('div');
      notification.id = id;
      notification.className = `pwa-notification pwa-notification--${config.type}`;
      
      const content = `
        <div class="pwa-notification__content">
          <h4 class="pwa-notification__title">${config.title}</h4>
          <p class="pwa-notification__message">${config.message}</p>
          ${config.actions ? this.renderNotificationActions(config.actions) : ''}
        </div>
        ${!config.persistent ? '<button class="pwa-notification__close" onclick="this.parentElement.style.display=\'none\'">&times;</button>' : ''}
      `;
      
      notification.innerHTML = content;
      document.body.appendChild(notification);
    }
    
    return notification;
  }

  /**
   * Render notification actions
   */
  renderNotificationActions(actions) {
    return `
      <div class="pwa-notification__actions">
        ${actions.map(action => `
          <button class="pwa-notification__action ${action.primary ? 'pwa-notification__action--primary' : ''}" 
                  onclick="${action.action.name}()">
            ${action.text}
          </button>
        `).join('')}
      </div>
    `;
  }

  /**
   * Track PWA events for analytics
   */
  trackEvent(eventName, properties = {}) {
    if (typeof gtag !== 'undefined') {
      gtag('event', eventName, properties);
    }
    
    console.log('PWA Manager: Event tracked:', eventName, properties);
  }

  /**
   * Get PWA installation status
   */
  isInstalled() {
    return window.matchMedia('(display-mode: standalone)').matches || 
           window.navigator.standalone === true;
  }

  /**
   * Get current connection info
   */
  getConnectionInfo() {
    const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    
    return {
      online: this.isOnline,
      type: connection?.type || 'unknown',
      effectiveType: connection?.effectiveType || 'unknown',
      downlink: connection?.downlink || 0,
      rtt: connection?.rtt || 0
    };
  }
}

// Initialize PWA Manager when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  window.pwaManager = new PWAManager();
});

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = PWAManager;
}
