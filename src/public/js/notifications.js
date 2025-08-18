/**
 * Modern Notification System for SignumLBRI 2025
 * Advanced toast notifications, alerts, and user feedback
 */

class NotificationSystem {
  constructor() {
    this.notifications = new Map();
    this.settings = this.loadSettings();
    this.container = null;
    this.soundEnabled = this.settings.soundEnabled || false;
    
    this.init();
  }

  init() {
    this.createContainer();
    this.loadSounds();
    this.setupKeyboardShortcuts();
    this.registerServiceWorkerListeners();
    
    console.log('Notification System: Initialized');
  }

  /**
   * Create notification container
   */
  createContainer() {
    this.container = document.createElement('div');
    this.container.id = 'notification-container';
    this.container.className = 'fixed top-4 right-4 z-50 space-y-3 max-w-sm w-full pointer-events-none';
    this.container.style.cssText = `
      max-height: calc(100vh - 2rem);
      overflow: hidden;
    `;
    
    document.body.appendChild(this.container);
  }

  /**
   * Show notification
   */
  show(options = {}) {
    const {
      type = 'info',
      title = '',
      message = '',
      duration = 5000,
      persistent = false,
      actions = [],
      icon = null,
      image = null,
      clickAction = null,
      data = {}
    } = options;

    const id = this.generateId();
    const notification = this.createNotificationElement({
      id, type, title, message, duration, persistent, actions, icon, image, clickAction, data
    });

    this.notifications.set(id, {
      element: notification,
      options,
      timestamp: Date.now()
    });

    this.container.appendChild(notification);
    
    // Animate in
    requestAnimationFrame(() => {
      notification.classList.add('notification--visible');
    });

    // Play sound
    this.playSound(type);

    // Auto-remove if not persistent
    if (!persistent && duration > 0) {
      setTimeout(() => {
        this.hide(id);
      }, duration);
    }

    // Clean up old notifications
    this.cleanupOld();

    return id;
  }

  /**
   * Create notification element
   */
  createNotificationElement(config) {
    const { id, type, title, message, persistent, actions, icon, image, clickAction } = config;
    
    const notification = document.createElement('div');
    notification.id = `notification-${id}`;
    notification.className = `notification notification--${type} pointer-events-auto`;
    notification.style.cssText = `
      background: var(--notification-bg, #ffffff);
      border: 1px solid var(--notification-border, #e5e7eb);
      border-radius: 12px;
      box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
      padding: 16px;
      margin-bottom: 12px;
      transform: translateX(100%);
      opacity: 0;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      backdrop-filter: blur(10px);
      max-width: 400px;
      word-wrap: break-word;
    `;

    // Type-specific styling
    const typeStyles = {
      success: 'border-l-4 border-l-green-500 bg-green-50 dark:bg-green-900/20',
      error: 'border-l-4 border-l-red-500 bg-red-50 dark:bg-red-900/20',
      warning: 'border-l-4 border-l-yellow-500 bg-yellow-50 dark:bg-yellow-900/20',
      info: 'border-l-4 border-l-blue-500 bg-blue-50 dark:bg-blue-900/20'
    };
    
    notification.className += ` ${typeStyles[type] || typeStyles.info}`;

    // Build content
    let content = `
      <div class="notification__content">
        <div class="flex items-start">
          ${this.getIcon(type, icon)}
          <div class="flex-1 ml-3">
            ${title ? `<h4 class="notification__title text-sm font-semibold text-gray-900 dark:text-white">${title}</h4>` : ''}
            ${message ? `<p class="notification__message text-sm text-gray-700 dark:text-gray-300 ${title ? 'mt-1' : ''}">${message}</p>` : ''}
            ${image ? `<img src="${image}" alt="Notification image" class="notification__image mt-2 rounded-lg max-w-full h-auto" />` : ''}
            ${actions.length > 0 ? this.renderActions(actions) : ''}
          </div>
          ${!persistent ? this.renderCloseButton() : ''}
        </div>
      </div>
    `;

    notification.innerHTML = content;

    // Add click handler
    if (clickAction) {
      notification.style.cursor = 'pointer';
      notification.addEventListener('click', (e) => {
        if (!e.target.closest('.notification__action, .notification__close')) {
          clickAction();
          this.hide(id);
        }
      });
    }

    // Setup action handlers
    this.setupActionHandlers(notification, actions, id);
    this.setupCloseHandler(notification, id);

    return notification;
  }

  /**
   * Get icon for notification type
   */
  getIcon(type, customIcon) {
    if (customIcon) {
      return `<div class="notification__icon">${customIcon}</div>`;
    }

    const icons = {
      success: `<div class="w-6 h-6 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center">
                  <svg class="w-4 h-4 text-green-600 dark:text-green-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
                  </svg>
                </div>`,
      error: `<div class="w-6 h-6 rounded-full bg-red-100 dark:bg-red-900 flex items-center justify-center">
                <svg class="w-4 h-4 text-red-600 dark:text-red-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"/>
                </svg>
              </div>`,
      warning: `<div class="w-6 h-6 rounded-full bg-yellow-100 dark:bg-yellow-900 flex items-center justify-center">
                  <svg class="w-4 h-4 text-yellow-600 dark:text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd"/>
                  </svg>
                </div>`,
      info: `<div class="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
               <svg class="w-4 h-4 text-blue-600 dark:text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                 <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd"/>
               </svg>
             </div>`
    };

    return icons[type] || icons.info;
  }

  /**
   * Render action buttons
   */
  renderActions(actions) {
    if (!actions.length) return '';

    return `
      <div class="notification__actions flex gap-2 mt-3">
        ${actions.map(action => `
          <button class="notification__action px-3 py-1 text-sm font-medium rounded-md transition-colors duration-200 ${
            action.primary 
              ? 'bg-blue-600 text-white hover:bg-blue-700' 
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
          }" data-action="${action.id}">
            ${action.text}
          </button>
        `).join('')}
      </div>
    `;
  }

  /**
   * Render close button
   */
  renderCloseButton() {
    return `
      <button class="notification__close ml-4 flex-shrink-0 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors duration-200">
        <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
          <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd"/>
        </svg>
      </button>
    `;
  }

  /**
   * Setup action handlers
   */
  setupActionHandlers(notification, actions, notificationId) {
    actions.forEach(action => {
      const button = notification.querySelector(`[data-action="${action.id}"]`);
      if (button) {
        button.addEventListener('click', (e) => {
          e.stopPropagation();
          if (action.handler) {
            action.handler();
          }
          if (!action.keepOpen) {
            this.hide(notificationId);
          }
        });
      }
    });
  }

  /**
   * Setup close handler
   */
  setupCloseHandler(notification, notificationId) {
    const closeButton = notification.querySelector('.notification__close');
    if (closeButton) {
      closeButton.addEventListener('click', (e) => {
        e.stopPropagation();
        this.hide(notificationId);
      });
    }
  }

  /**
   * Hide notification
   */
  hide(id) {
    const notificationData = this.notifications.get(id);
    if (!notificationData) return;

    const { element } = notificationData;
    
    // Animate out
    element.classList.remove('notification--visible');
    element.style.transform = 'translateX(100%)';
    element.style.opacity = '0';

    // Remove from DOM after animation
    setTimeout(() => {
      if (element.parentNode) {
        element.parentNode.removeChild(element);
      }
      this.notifications.delete(id);
    }, 300);
  }

  /**
   * Hide all notifications
   */
  hideAll() {
    this.notifications.forEach((_, id) => {
      this.hide(id);
    });
  }

  /**
   * Success notification shortcut
   */
  success(title, message, options = {}) {
    return this.show({
      type: 'success',
      title,
      message,
      ...options
    });
  }

  /**
   * Error notification shortcut
   */
  error(title, message, options = {}) {
    return this.show({
      type: 'error',
      title,
      message,
      duration: 8000, // Longer duration for errors
      ...options
    });
  }

  /**
   * Warning notification shortcut
   */
  warning(title, message, options = {}) {
    return this.show({
      type: 'warning',
      title,
      message,
      duration: 7000,
      ...options
    });
  }

  /**
   * Info notification shortcut
   */
  info(title, message, options = {}) {
    return this.show({
      type: 'info',
      title,
      message,
      ...options
    });
  }

  /**
   * Custom notification types
   */
  bookAdded(bookTitle) {
    return this.success(
      'Książka dodana!',
      `"${bookTitle}" została pomyślnie dodana do biblioteki.`,
      {
        actions: [
          {
            id: 'view',
            text: 'Zobacz ogłoszenie',
            primary: true,
            handler: () => {
              // Navigate to the book ad
            }
          }
        ]
      }
    );
  }

  bookReserved(bookTitle) {
    return this.info(
      'Książka zarezerwowana',
      `"${bookTitle}" została zarezerwowana. Skontaktuj się ze sprzedającym.`,
      {
        actions: [
          {
            id: 'contact',
            text: 'Skontaktuj się',
            primary: true,
            handler: () => {
              // Open contact modal
            }
          }
        ]
      }
    );
  }

  newMessage(from) {
    return this.show({
      type: 'info',
      title: 'Nowa wiadomość',
      message: `Otrzymałeś nową wiadomość od ${from}`,
      actions: [
        {
          id: 'view',
          text: 'Zobacz',
          primary: true,
          handler: () => {
            // Navigate to messages
          }
        },
        {
          id: 'dismiss',
          text: 'Później',
          handler: () => {}
        }
      ]
    });
  }

  /**
   * Generate unique ID
   */
  generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  /**
   * Play notification sound
   */
  playSound(type) {
    if (!this.soundEnabled || !this.sounds) return;

    const sound = this.sounds[type] || this.sounds.default;
    if (sound) {
      sound.play().catch(() => {
        // Ignore audio play errors
      });
    }
  }

  /**
   * Load notification sounds
   */
  loadSounds() {
    this.sounds = {
      success: new Audio('/sounds/success.mp3'),
      error: new Audio('/sounds/error.mp3'),
      warning: new Audio('/sounds/warning.mp3'),
      info: new Audio('/sounds/info.mp3'),
      default: new Audio('/sounds/notification.mp3')
    };

    // Set volume
    Object.values(this.sounds).forEach(sound => {
      sound.volume = 0.3;
    });
  }

  /**
   * Setup keyboard shortcuts
   */
  setupKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
      // Ctrl/Cmd + Shift + N to hide all notifications
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'N') {
        e.preventDefault();
        this.hideAll();
      }
    });
  }

  /**
   * Register service worker message listeners
   */
  registerServiceWorkerListeners() {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('message', (event) => {
        const { type, data } = event.data;
        
        switch (type) {
          case 'NOTIFICATION':
            this.show(data);
            break;
          case 'BOOK_UPDATE':
            this.info('Aktualizacja książki', data.message);
            break;
        }
      });
    }
  }

  /**
   * Clean up old notifications
   */
  cleanupOld() {
    const maxNotifications = 5;
    const notifications = Array.from(this.notifications.entries())
      .sort(([,a], [,b]) => a.timestamp - b.timestamp);

    if (notifications.length > maxNotifications) {
      const toRemove = notifications.slice(0, notifications.length - maxNotifications);
      toRemove.forEach(([id]) => this.hide(id));
    }
  }

  /**
   * Load user settings
   */
  loadSettings() {
    try {
      const settings = localStorage.getItem('signumlbri-notifications');
      return settings ? JSON.parse(settings) : {};
    } catch {
      return {};
    }
  }

  /**
   * Save user settings
   */
  saveSettings() {
    localStorage.setItem('signumlbri-notifications', JSON.stringify(this.settings));
  }

  /**
   * Toggle sound
   */
  toggleSound() {
    this.soundEnabled = !this.soundEnabled;
    this.settings.soundEnabled = this.soundEnabled;
    this.saveSettings();
    
    this.info(
      'Dźwięki powiadomień',
      this.soundEnabled ? 'Włączone' : 'Wyłączone'
    );
  }
}

// Initialize notification system
let notificationSystem;

document.addEventListener('DOMContentLoaded', () => {
  notificationSystem = new NotificationSystem();
  
  // Make available globally
  window.notify = notificationSystem;
  
  // Add CSS for visible state
  const style = document.createElement('style');
  style.textContent = `
    .notification--visible {
      transform: translateX(0) !important;
      opacity: 1 !important;
    }
    
    .notification__title {
      line-height: 1.4;
    }
    
    .notification__message {
      line-height: 1.5;
    }
    
    .notification:hover {
      transform: translateX(-4px);
    }
  `;
  document.head.appendChild(style);
});

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = NotificationSystem;
}
