/**
 * ✨ SignumLBRI Enhanced - Core JavaScript
 * 
 * Main application initialization and core functionality
 * Theme switching, language support, and global utilities
 */

(function() {
  'use strict';

  // Global Enhanced App object
  window.EnhancedApp = {
    config: {
      theme: 'auto',
      language: 'pl',
      user: null,
      csrfToken: null,
      apiBase: '/enhanced/api'
    },
    
    // Storage keys
    STORAGE_KEYS: {
      THEME: 'enhanced_theme',
      LANGUAGE: 'enhanced_language',
      RECENT_SEARCHES: 'enhanced_recent_searches',
      USER_PREFERENCES: 'enhanced_user_preferences'
    },

    // Initialize the application
    init: function(options = {}) {
      this.config = { ...this.config, ...options };
      
      console.log('🚀 Initializing SignumLBRI Enhanced...');
      
      // Load saved preferences
      this.loadPreferences();
      
      // Initialize components
      this.initThemeSystem();
      this.initLanguageSystem();
      this.initNavigation();
      this.initSearch();
      this.initNotifications();
      this.initTooltips();
      this.initModals();
      this.initAnimations();
      
      // Set up event listeners
      this.bindEvents();
      
      console.log('✅ SignumLBRI Enhanced initialized successfully');
    },

    // Load user preferences from localStorage
    loadPreferences: function() {
      const savedTheme = localStorage.getItem(this.STORAGE_KEYS.THEME);
      const savedLanguage = localStorage.getItem(this.STORAGE_KEYS.LANGUAGE);
      
      if (savedTheme && ['light', 'dark', 'auto'].includes(savedTheme)) {
        this.config.theme = savedTheme;
      }
      
      if (savedLanguage && ['pl', 'en', 'uk'].includes(savedLanguage)) {
        this.config.language = savedLanguage;
      }
    },

    // Theme system initialization
    initThemeSystem: function() {
      const html = document.documentElement;
      const body = document.body;
      
      // Apply current theme
      this.applyTheme(this.config.theme);
      
      // Theme toggle buttons
      const themeToggleButtons = document.querySelectorAll('.theme-btn, .theme-toggle-btn');
      themeToggleButtons.forEach(button => {
        button.addEventListener('click', (e) => {
          e.preventDefault();
          this.toggleTheme();
        });
      });
      
      // Listen for system theme changes
      if (window.matchMedia) {
        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        mediaQuery.addEventListener('change', () => {
          if (this.config.theme === 'auto') {
            this.applyTheme('auto');
          }
        });
      }
    },

    // Apply theme to document
    applyTheme: function(theme) {
      const body = document.body;
      
      // Determine actual theme for auto mode
      let actualTheme = theme;
      if (theme === 'auto') {
        actualTheme = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      }
      
      // Apply theme attributes
      body.setAttribute('data-theme', theme);
      body.classList.remove('theme-light', 'theme-dark', 'theme-auto');
      body.classList.add(`theme-${theme}`);
      
      // Update theme toggle icons
      this.updateThemeIcons(theme);
      
      // Save preference
      localStorage.setItem(this.STORAGE_KEYS.THEME, theme);
      
      console.log(`🎨 Theme applied: ${theme} (${actualTheme})`);
    },

    // Toggle between themes
    toggleTheme: function() {
      const themes = ['light', 'dark', 'auto'];
      const currentIndex = themes.indexOf(this.config.theme);
      const nextIndex = (currentIndex + 1) % themes.length;
      const nextTheme = themes[nextIndex];
      
      this.config.theme = nextTheme;
      this.applyTheme(nextTheme);
      
      // Show notification
      const themeNames = {
        light: { pl: 'Jasny', en: 'Light', uk: 'Світлий' },
        dark: { pl: 'Ciemny', en: 'Dark', uk: 'Темний' },
        auto: { pl: 'Automatyczny', en: 'Auto', uk: 'Автоматичний' }
      };
      
      const message = this.getText('theme.switched', { 
        theme: themeNames[nextTheme][this.config.language] || themeNames[nextTheme]['en']
      });
      
      this.showNotification('success', message);
    },

    // Update theme toggle icons
    updateThemeIcons: function(theme) {
      const themeIcons = document.querySelectorAll('.theme-btn i, .theme-toggle-btn i');
      
      themeIcons.forEach(icon => {
        icon.className = 'fas';
        
        switch(theme) {
          case 'light':
            icon.classList.add('fa-moon');
            break;
          case 'dark':
            icon.classList.add('fa-sun');
            break;
          case 'auto':
            icon.classList.add('fa-adjust');
            break;
        }
      });
    },

    // Language system initialization
    initLanguageSystem: function() {
      // Language toggle buttons
      const langButtons = document.querySelectorAll('.lang-option');
      langButtons.forEach(button => {
        button.addEventListener('click', (e) => {
          e.preventDefault();
          const lang = button.getAttribute('data-lang');
          if (lang) {
            this.changeLanguage(lang);
          }
        });
      });
      
      // Update current language display
      this.updateLanguageDisplay();
    },

    // Change application language
    changeLanguage: function(newLang) {
      if (!['pl', 'en', 'uk'].includes(newLang)) {
        console.warn('Invalid language:', newLang);
        return;
      }
      
      this.config.language = newLang;
      localStorage.setItem(this.STORAGE_KEYS.LANGUAGE, newLang);
      
      // Update language display
      this.updateLanguageDisplay();
      
      // Send to server
      this.updateServerLanguage(newLang);
      
      // Show notification and reload
      const message = this.getText('language.changed');
      this.showNotification('info', message);
      
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    },

    // Update language display in UI
    updateLanguageDisplay: function() {
      const langDisplays = document.querySelectorAll('.current-lang');
      langDisplays.forEach(display => {
        display.textContent = this.config.language.toUpperCase();
      });
    },

    // Update server-side language preference
    updateServerLanguage: function(language) {
      if (!this.config.csrfToken) return;
      
      fetch('/enhanced/api/language', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': this.config.csrfToken
        },
        body: JSON.stringify({ language: language })
      })
      .catch(error => {
        console.error('Failed to update server language:', error);
      });
    },

    // Navigation initialization
    initNavigation: function() {
      // Mobile menu toggle
      const mobileToggle = document.querySelector('.mobile-menu-btn');
      const mobileOverlay = document.querySelector('.mobile-nav-overlay');
      const mobileClose = document.querySelector('.mobile-close-btn');
      
      if (mobileToggle && mobileOverlay) {
        mobileToggle.addEventListener('click', () => {
          mobileOverlay.classList.add('show');
          document.body.style.overflow = 'hidden';
        });
        
        const closeMobileMenu = () => {
          mobileOverlay.classList.remove('show');
          document.body.style.overflow = '';
        };
        
        if (mobileClose) {
          mobileClose.addEventListener('click', closeMobileMenu);
        }
        
        mobileOverlay.addEventListener('click', (e) => {
          if (e.target === mobileOverlay) {
            closeMobileMenu();
          }
        });
      }
      
      // Active page highlighting
      this.highlightActivePage();
    },

    // Highlight active navigation item
    highlightActivePage: function() {
      const currentPath = window.location.pathname;
      const navLinks = document.querySelectorAll('.nav-link, .mobile-nav-link');
      
      navLinks.forEach(link => {
        const href = link.getAttribute('href');
        if (href && (currentPath === href || (href !== '/enhanced' && currentPath.startsWith(href)))) {
          link.classList.add('active');
        }
      });
    },

    // Search system initialization
    initSearch: function() {
      const searchInput = document.querySelector('.search-input');
      const searchForm = document.querySelector('.search-form');
      
      if (searchInput) {
        let searchTimeout;
        
        searchInput.addEventListener('input', (e) => {
          clearTimeout(searchTimeout);
          const query = e.target.value.trim();
          
          if (query.length >= 2) {
            searchTimeout = setTimeout(() => {
              this.performLiveSearch(query);
            }, 300);
          } else {
            this.hideSuggestions();
          }
        });
        
        searchInput.addEventListener('focus', () => {
          if (searchInput.value.trim().length >= 2) {
            this.performLiveSearch(searchInput.value.trim());
          }
        });
        
        searchInput.addEventListener('blur', () => {
          setTimeout(() => this.hideSuggestions(), 200);
        });
      }
      
      if (searchForm) {
        searchForm.addEventListener('submit', (e) => {
          const query = searchInput.value.trim();
          if (query) {
            this.saveRecentSearch(query);
          }
        });
      }
    },

    // Perform live search with suggestions
    performLiveSearch: function(query) {
      if (!query || query.length < 2) return;
      
      fetch(`${this.config.apiBase}/search?q=${encodeURIComponent(query)}&limit=5`)
        .then(response => response.json())
        .then(data => {
          if (data.success && data.data.results.length > 0) {
            this.showSuggestions(data.data.results);
          } else {
            this.hideSuggestions();
          }
        })
        .catch(error => {
          console.error('Search error:', error);
          this.hideSuggestions();
        });
    },

    // Show search suggestions
    showSuggestions: function(results) {
      let suggestionsContainer = document.getElementById('search-suggestions');
      
      if (!suggestionsContainer) {
        suggestionsContainer = document.createElement('div');
        suggestionsContainer.id = 'search-suggestions';
        suggestionsContainer.className = 'search-suggestions glassmorphism';
        
        const searchContainer = document.querySelector('.navbar-search-section');
        if (searchContainer) {
          searchContainer.appendChild(suggestionsContainer);
        }
      }
      
      const html = results.map(result => `
        <a href="${result.url}" class="suggestion-item">
          <div class="suggestion-icon">
            <i class="fas fa-${result.type === 'book' ? 'book' : 'user'}"></i>
          </div>
          <div class="suggestion-content">
            <div class="suggestion-title">${this.escapeHtml(result.title || result.profile?.name || result.email)}</div>
            <div class="suggestion-meta">${this.escapeHtml(result.author || result.email || '')}</div>
          </div>
        </a>
      `).join('');
      
      suggestionsContainer.innerHTML = html;
      suggestionsContainer.classList.remove('d-none');
    },

    // Hide search suggestions
    hideSuggestions: function() {
      const suggestionsContainer = document.getElementById('search-suggestions');
      if (suggestionsContainer) {
        suggestionsContainer.classList.add('d-none');
      }
    },

    // Save recent search to localStorage
    saveRecentSearch: function(query) {
      let recentSearches = JSON.parse(localStorage.getItem(this.STORAGE_KEYS.RECENT_SEARCHES) || '[]');
      
      // Remove if already exists
      recentSearches = recentSearches.filter(search => search !== query);
      
      // Add to beginning
      recentSearches.unshift(query);
      
      // Keep only last 10
      recentSearches = recentSearches.slice(0, 10);
      
      localStorage.setItem(this.STORAGE_KEYS.RECENT_SEARCHES, JSON.stringify(recentSearches));
    },

    // Notifications system
    initNotifications: function() {
      // Create toast container if it doesn't exist
      if (!document.getElementById('toastContainer')) {
        const container = document.createElement('div');
        container.id = 'toastContainer';
        container.className = 'toast-container position-fixed top-0 end-0 p-3';
        container.style.zIndex = '1080';
        document.body.appendChild(container);
      }
    },

    // Show notification toast
    showNotification: function(type, message, title = null, duration = 4000) {
      const container = document.getElementById('toastContainer');
      if (!container) return;
      
      const toastId = `toast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const typeIcons = {
        success: 'check-circle',
        error: 'exclamation-circle',
        warning: 'exclamation-triangle',
        info: 'info-circle'
      };
      
      const toast = document.createElement('div');
      toast.id = toastId;
      toast.className = `toast align-items-center text-bg-${type} border-0`;
      toast.setAttribute('role', 'alert');
      toast.innerHTML = `
        <div class="d-flex">
          <div class="toast-body d-flex align-items-center">
            <i class="fas fa-${typeIcons[type] || 'info-circle'} me-2"></i>
            <div>
              ${title ? `<strong>${this.escapeHtml(title)}</strong><br>` : ''}
              ${this.escapeHtml(message)}
            </div>
          </div>
          <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
        </div>
      `;
      
      container.appendChild(toast);
      
      // Initialize Bootstrap toast
      const bsToast = new bootstrap.Toast(toast, {
        autohide: duration > 0,
        delay: duration
      });
      
      bsToast.show();
      
      // Remove from DOM after hide
      toast.addEventListener('hidden.bs.toast', () => {
        toast.remove();
      });
    },

    // Initialize tooltips
    initTooltips: function() {
      const tooltipElements = document.querySelectorAll('[data-bs-toggle="tooltip"]');
      tooltipElements.forEach(element => {
        new bootstrap.Tooltip(element, {
          trigger: 'hover focus'
        });
      });
    },

    // Initialize modals
    initModals: function() {
      // Auto-open modals with hash
      const hash = window.location.hash;
      if (hash && hash.startsWith('#') && document.querySelector(hash + '.modal')) {
        const modal = new bootstrap.Modal(document.querySelector(hash));
        modal.show();
      }
    },

    // Initialize animations
    initAnimations: function() {
      // Scroll animations using Intersection Observer
      const observeElements = document.querySelectorAll('.dashboard-card, .book-item, .stat-card');
      
      if (observeElements.length > 0 && 'IntersectionObserver' in window) {
        const observer = new IntersectionObserver((entries) => {
          entries.forEach(entry => {
            if (entry.isIntersecting) {
              entry.target.style.animationPlayState = 'running';
              entry.target.classList.add('animate-in');
              observer.unobserve(entry.target);
            }
          });
        }, {
          threshold: 0.1,
          rootMargin: '50px'
        });
        
        observeElements.forEach(element => {
          element.style.animationPlayState = 'paused';
          observer.observe(element);
        });
      }
    },

    // Bind global event listeners
    bindEvents: function() {
      // Global keyboard shortcuts
      document.addEventListener('keydown', (e) => {
        // Alt + T for theme toggle
        if (e.altKey && e.key === 't') {
          e.preventDefault();
          this.toggleTheme();
        }
        
        // Alt + S for search focus
        if (e.altKey && e.key === 's') {
          e.preventDefault();
          const searchInput = document.querySelector('.search-input');
          if (searchInput) {
            searchInput.focus();
          }
        }
        
        // Escape to close modals and overlays
        if (e.key === 'Escape') {
          const mobileOverlay = document.querySelector('.mobile-nav-overlay.show');
          if (mobileOverlay) {
            mobileOverlay.classList.remove('show');
            document.body.style.overflow = '';
          }
        }
      });
      
      // Handle browser back/forward
      window.addEventListener('popstate', () => {
        this.highlightActivePage();
      });
      
      // Handle online/offline status
      window.addEventListener('online', () => {
        this.showNotification('success', this.getText('connection.restored'));
      });
      
      window.addEventListener('offline', () => {
        this.showNotification('warning', this.getText('connection.lost'));
      });
    },

    // Get localized text
    getText: function(key, params = {}) {
      const translations = {
        pl: {
          'theme.switched': 'Motyw zmieniony na: ${theme}',
          'language.changed': 'Język zostanie zmieniony po odświeżeniu strony',
          'connection.restored': 'Połączenie przywrócone',
          'connection.lost': 'Brak połączenia z internetem'
        },
        en: {
          'theme.switched': 'Theme switched to: ${theme}',
          'language.changed': 'Language will be changed after page refresh',
          'connection.restored': 'Connection restored',
          'connection.lost': 'No internet connection'
        },
        uk: {
          'theme.switched': 'Тему змінено на: ${theme}',
          'language.changed': 'Мова зміниться після оновлення сторінки',
          'connection.restored': 'З\'єднання відновлено',
          'connection.lost': 'Немає підключення до інтернету'
        }
      };
      
      let text = translations[this.config.language]?.[key] || translations['en']?.[key] || key;
      
      // Replace parameters
      Object.keys(params).forEach(param => {
        text = text.replace(new RegExp(`\\$\\{${param}\\}`, 'g'), params[param]);
      });
      
      return text;
    },

    // Utility: Escape HTML
    escapeHtml: function(text) {
      const div = document.createElement('div');
      div.textContent = text;
      return div.innerHTML;
    },

    // Utility: Format date
    formatDate: function(date, options = {}) {
      const defaultOptions = {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      };
      
      return new Intl.DateTimeFormat(this.config.language, { ...defaultOptions, ...options }).format(new Date(date));
    },

    // Utility: Format currency
    formatCurrency: function(amount, currency = 'PLN') {
      return new Intl.NumberFormat(this.config.language, {
        style: 'currency',
        currency: currency
      }).format(amount);
    }
  };

  // Auto-initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
      // Will be initialized by the layout template
    });
  }

})();
