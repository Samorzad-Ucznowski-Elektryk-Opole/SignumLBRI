/**
 * Modern UI Components System for SignumLBRI 2025
 * High-performance, accessible, and beautiful design system
 */

class ModernUISystem {
  constructor() {
    this.theme = this.loadTheme();
    this.animations = new AnimationManager();
    this.accessibility = new AccessibilityManager();
    this.interactions = new InteractionManager();
    
    this.init();
  }

  init() {
    this.injectGlobalStyles();
    this.setupThemeToggle();
    this.initializeComponents();
    this.setupGlobalInteractions();
    
    console.log('Modern UI System: Initialized');
  }

  /**
   * Load user theme preference
   */
  loadTheme() {
    const savedTheme = localStorage.getItem('signumlbri-theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    return savedTheme || (prefersDark ? 'dark' : 'light');
  }

  /**
   * Apply theme to document
   */
  applyTheme(theme) {
    this.theme = theme;
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('signumlbri-theme', theme);
    
    // Update meta theme-color for mobile browsers
    const metaTheme = document.querySelector('meta[name="theme-color"]');
    if (metaTheme) {
      metaTheme.content = theme === 'dark' ? '#1f2937' : '#ffffff';
    }
    
    // Dispatch theme change event
    window.dispatchEvent(new CustomEvent('themechange', { detail: { theme } }));
  }

  /**
   * Setup theme toggle functionality
   */
  setupThemeToggle() {
    this.applyTheme(this.theme);
    
    // Create theme toggle button if not exists
    const existingToggle = document.querySelector('.theme-toggle');
    if (!existingToggle) {
      this.createThemeToggle();
    }
    
    // Listen for system theme changes
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
      if (!localStorage.getItem('signumlbri-theme')) {
        this.applyTheme(e.matches ? 'dark' : 'light');
      }
    });
  }

  /**
   * Create theme toggle button
   */
  createThemeToggle() {
    const toggle = document.createElement('button');
    toggle.className = 'theme-toggle';
    toggle.setAttribute('aria-label', 'Przełącz motyw');
    toggle.innerHTML = `
      <span class="theme-toggle__icon theme-toggle__icon--light">☀️</span>
      <span class="theme-toggle__icon theme-toggle__icon--dark">🌙</span>
    `;
    
    toggle.addEventListener('click', () => {
      this.applyTheme(this.theme === 'light' ? 'dark' : 'light');
    });
    
    // Add to header or appropriate location
    const header = document.querySelector('header') || document.body;
    header.appendChild(toggle);
  }

  /**
   * Initialize all modern components
   */
  initializeComponents() {
    this.initCards();
    this.initButtons();
    this.initForms();
    this.initModals();
    this.initToasts();
    this.initLoaders();
    this.initTabs();
    this.initAccordions();
    this.initTooltips();
    this.initDropdowns();
  }

  /**
   * Initialize modern card components
   */
  initCards() {
    const cards = document.querySelectorAll('.card, .book-card, .ad-card');
    
    cards.forEach(card => {
      // Add modern styling
      if (!card.classList.contains('modern-card')) {
        card.classList.add('modern-card');
      }
      
      // Add hover effects
      this.addHoverEffect(card);
      
      // Add loading states
      this.addLoadingState(card);
    });
  }

  /**
   * Initialize modern button components
   */
  initButtons() {
    const buttons = document.querySelectorAll('button, .btn, input[type="submit"]');
    
    buttons.forEach(button => {
      // Skip if already modern
      if (button.classList.contains('modern-btn')) return;
      
      button.classList.add('modern-btn');
      
      // Add ripple effect
      this.addRippleEffect(button);
      
      // Add loading state support
      this.addButtonLoadingState(button);
    });
  }

  /**
   * Initialize modern form components
   */
  initForms() {
    const forms = document.querySelectorAll('form');
    const inputs = document.querySelectorAll('input, textarea, select');
    
    forms.forEach(form => {
      if (!form.classList.contains('modern-form')) {
        form.classList.add('modern-form');
      }
      
      // Add form validation enhancements
      this.enhanceFormValidation(form);
    });
    
    inputs.forEach(input => {
      if (!input.classList.contains('modern-input')) {
        input.classList.add('modern-input');
      }
      
      // Add floating labels
      this.addFloatingLabel(input);
      
      // Add validation styling
      this.addInputValidation(input);
    });
  }

  /**
   * Add hover effect to elements
   */
  addHoverEffect(element) {
    element.addEventListener('mouseenter', () => {
      element.style.transform = 'translateY(-2px)';
      element.style.boxShadow = '0 8px 25px rgba(0, 0, 0, 0.15)';
    });
    
    element.addEventListener('mouseleave', () => {
      element.style.transform = 'translateY(0)';
      element.style.boxShadow = '';
    });
  }

  /**
   * Add ripple effect to buttons
   */
  addRippleEffect(button) {
    button.addEventListener('click', (e) => {
      const ripple = document.createElement('span');
      const rect = button.getBoundingClientRect();
      const size = Math.max(rect.width, rect.height);
      const x = e.clientX - rect.left - size / 2;
      const y = e.clientY - rect.top - size / 2;
      
      ripple.style.cssText = `
        position: absolute;
        width: ${size}px;
        height: ${size}px;
        left: ${x}px;
        top: ${y}px;
        background: rgba(255, 255, 255, 0.3);
        border-radius: 50%;
        transform: scale(0);
        animation: ripple 0.6s ease-out;
        pointer-events: none;
      `;
      
      ripple.className = 'ripple';
      
      // Ensure button has relative positioning
      if (getComputedStyle(button).position === 'static') {
        button.style.position = 'relative';
      }
      
      button.appendChild(ripple);
      
      setTimeout(() => ripple.remove(), 600);
    });
  }

  /**
   * Add loading state to elements
   */
  addLoadingState(element) {
    const loadingObserver = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'attributes' && mutation.attributeName === 'data-loading') {
          const isLoading = element.getAttribute('data-loading') === 'true';
          
          if (isLoading) {
            element.classList.add('loading');
            element.setAttribute('aria-busy', 'true');
          } else {
            element.classList.remove('loading');
            element.removeAttribute('aria-busy');
          }
        }
      });
    });
    
    loadingObserver.observe(element, { attributes: true });
  }

  /**
   * Add button loading state
   */
  addButtonLoadingState(button) {
    const originalText = button.innerHTML;
    
    button.addEventListener('click', () => {
      if (button.hasAttribute('data-loading')) return;
      
      // Check if button should show loading (has async action)
      const hasAsyncAction = button.hasAttribute('data-async') || 
                            button.closest('form')?.hasAttribute('data-async');
      
      if (hasAsyncAction) {
        button.setAttribute('data-loading', 'true');
        button.disabled = true;
        button.innerHTML = `
          <span class="loading-spinner"></span>
          <span>Ładowanie...</span>
        `;
        
        // Auto-remove loading after 30 seconds (safety)
        setTimeout(() => {
          if (button.hasAttribute('data-loading')) {
            button.removeAttribute('data-loading');
            button.disabled = false;
            button.innerHTML = originalText;
          }
        }, 30000);
      }
    });
  }

  /**
   * Add floating label to input
   */
  addFloatingLabel(input) {
    if (input.type === 'hidden' || input.hasAttribute('data-no-float')) return;
    
    const wrapper = document.createElement('div');
    wrapper.className = 'floating-label';
    
    const label = input.previousElementSibling?.tagName === 'LABEL' ? 
                 input.previousElementSibling : null;
    
    if (label) {
      input.parentNode.insertBefore(wrapper, label);
      wrapper.appendChild(label);
      wrapper.appendChild(input);
      
      // Add floating behavior
      const updateLabel = () => {
        if (input.value || input === document.activeElement) {
          wrapper.classList.add('floating-label--active');
        } else {
          wrapper.classList.remove('floating-label--active');
        }
      };
      
      input.addEventListener('focus', updateLabel);
      input.addEventListener('blur', updateLabel);
      input.addEventListener('input', updateLabel);
      
      // Initial state
      updateLabel();
    }
  }

  /**
   * Enhance form validation
   */
  enhanceFormValidation(form) {
    const inputs = form.querySelectorAll('input, textarea, select');
    
    inputs.forEach(input => {
      input.addEventListener('invalid', (e) => {
        e.preventDefault();
        this.showValidationError(input, input.validationMessage);
      });
      
      input.addEventListener('input', () => {
        if (input.checkValidity()) {
          this.hideValidationError(input);
        }
      });
    });
    
    form.addEventListener('submit', (e) => {
      let hasErrors = false;
      
      inputs.forEach(input => {
        if (!input.checkValidity()) {
          this.showValidationError(input, input.validationMessage);
          hasErrors = true;
        }
      });
      
      if (hasErrors) {
        e.preventDefault();
        // Focus first invalid input
        const firstInvalid = form.querySelector('.input-error');
        if (firstInvalid) {
          firstInvalid.focus();
        }
      }
    });
  }

  /**
   * Show validation error
   */
  showValidationError(input, message) {
    input.classList.add('input-error');
    
    let errorElement = input.parentNode.querySelector('.error-message');
    if (!errorElement) {
      errorElement = document.createElement('div');
      errorElement.className = 'error-message';
      input.parentNode.appendChild(errorElement);
    }
    
    errorElement.textContent = message;
    errorElement.style.display = 'block';
  }

  /**
   * Hide validation error
   */
  hideValidationError(input) {
    input.classList.remove('input-error');
    
    const errorElement = input.parentNode.querySelector('.error-message');
    if (errorElement) {
      errorElement.style.display = 'none';
    }
  }

  /**
   * Setup global interactions
   */
  setupGlobalInteractions() {
    // Smooth scrolling for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
      anchor.addEventListener('click', (e) => {
        e.preventDefault();
        const target = document.querySelector(anchor.getAttribute('href'));
        if (target) {
          target.scrollIntoView({ behavior: 'smooth' });
        }
      });
    });
    
    // Auto-resize textareas
    document.querySelectorAll('textarea').forEach(textarea => {
      const resize = () => {
        textarea.style.height = 'auto';
        textarea.style.height = textarea.scrollHeight + 'px';
      };
      
      textarea.addEventListener('input', resize);
      resize(); // Initial resize
    });
    
    // Enhanced focus management
    this.setupFocusManagement();
  }

  /**
   * Setup focus management for accessibility
   */
  setupFocusManagement() {
    let isKeyboardUser = false;
    
    // Detect keyboard usage
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Tab') {
        isKeyboardUser = true;
        document.body.classList.add('keyboard-user');
      }
    });
    
    document.addEventListener('mousedown', () => {
      isKeyboardUser = false;
      document.body.classList.remove('keyboard-user');
    });
  }

  /**
   * Inject global styles for modern UI
   */
  injectGlobalStyles() {
    const styles = `
      /* Modern UI Global Styles */
      :root {
        --color-primary: #2563eb;
        --color-primary-dark: #1d4ed8;
        --color-secondary: #64748b;
        --color-success: #10b981;
        --color-warning: #f59e0b;
        --color-error: #ef4444;
        --color-background: #ffffff;
        --color-surface: #f8fafc;
        --color-text: #1f2937;
        --color-text-secondary: #6b7280;
        --radius-sm: 0.375rem;
        --radius-md: 0.5rem;
        --radius-lg: 0.75rem;
        --shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
        --shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
        --shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
        --transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      }

      [data-theme="dark"] {
        --color-background: #111827;
        --color-surface: #1f2937;
        --color-text: #f9fafb;
        --color-text-secondary: #d1d5db;
      }

      /* Modern Cards */
      .modern-card {
        background: var(--color-background);
        border-radius: var(--radius-lg);
        box-shadow: var(--shadow-md);
        transition: var(--transition);
        overflow: hidden;
        border: 1px solid rgba(0, 0, 0, 0.05);
      }

      [data-theme="dark"] .modern-card {
        border-color: rgba(255, 255, 255, 0.1);
      }

      /* Modern Buttons */
      .modern-btn {
        position: relative;
        padding: 0.75rem 1.5rem;
        border-radius: var(--radius-md);
        font-weight: 600;
        transition: var(--transition);
        overflow: hidden;
        border: none;
        cursor: pointer;
      }

      .modern-btn:disabled {
        opacity: 0.6;
        cursor: not-allowed;
      }

      /* Button variants */
      .modern-btn--primary {
        background: var(--color-primary);
        color: white;
      }

      .modern-btn--secondary {
        background: var(--color-secondary);
        color: white;
      }

      /* Loading states */
      .loading {
        position: relative;
        pointer-events: none;
      }

      .loading::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(255, 255, 255, 0.8);
        z-index: 1;
      }

      .loading-spinner {
        width: 16px;
        height: 16px;
        border: 2px solid rgba(255, 255, 255, 0.3);
        border-top: 2px solid white;
        border-radius: 50%;
        animation: spin 1s linear infinite;
        display: inline-block;
        margin-right: 8px;
      }

      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }

      /* Ripple animation */
      @keyframes ripple {
        0% {
          transform: scale(0);
          opacity: 1;
        }
        100% {
          transform: scale(2);
          opacity: 0;
        }
      }

      /* Theme toggle */
      .theme-toggle {
        position: fixed;
        top: 20px;
        left: 20px;
        width: 48px;
        height: 48px;
        border-radius: 50%;
        background: var(--color-surface);
        border: 2px solid var(--color-primary);
        cursor: pointer;
        z-index: 1000;
        transition: var(--transition);
      }

      .theme-toggle__icon {
        font-size: 20px;
        transition: var(--transition);
      }

      .theme-toggle__icon--light {
        display: block;
      }

      .theme-toggle__icon--dark {
        display: none;
      }

      [data-theme="dark"] .theme-toggle__icon--light {
        display: none;
      }

      [data-theme="dark"] .theme-toggle__icon--dark {
        display: block;
      }

      /* Floating labels */
      .floating-label {
        position: relative;
        margin-bottom: 1rem;
      }

      .floating-label label {
        position: absolute;
        left: 12px;
        top: 50%;
        transform: translateY(-50%);
        background: var(--color-background);
        padding: 0 4px;
        color: var(--color-text-secondary);
        transition: var(--transition);
        pointer-events: none;
        z-index: 1;
      }

      .floating-label--active label {
        top: 0;
        transform: translateY(-50%);
        font-size: 0.875rem;
        color: var(--color-primary);
      }

      /* Modern inputs */
      .modern-input {
        width: 100%;
        padding: 12px;
        border: 2px solid #e5e7eb;
        border-radius: var(--radius-md);
        background: var(--color-background);
        color: var(--color-text);
        transition: var(--transition);
      }

      .modern-input:focus {
        outline: none;
        border-color: var(--color-primary);
        box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
      }

      .input-error {
        border-color: var(--color-error) !important;
      }

      .error-message {
        color: var(--color-error);
        font-size: 0.875rem;
        margin-top: 4px;
        display: none;
      }

      /* Keyboard focus styles */
      .keyboard-user *:focus {
        outline: 2px solid var(--color-primary);
        outline-offset: 2px;
      }
    `;
    
    const styleSheet = document.createElement('style');
    styleSheet.textContent = styles;
    document.head.appendChild(styleSheet);
  }
}

/**
 * Animation Manager for smooth animations
 */
class AnimationManager {
  constructor() {
    this.observers = new Map();
    this.setupIntersectionObserver();
  }

  setupIntersectionObserver() {
    this.fadeInObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('animate-fade-in');
          this.fadeInObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1 });
  }

  observeFadeIn(elements) {
    elements.forEach(element => {
      this.fadeInObserver.observe(element);
    });
  }
}

/**
 * Accessibility Manager
 */
class AccessibilityManager {
  constructor() {
    this.setupAria();
    this.setupKeyboardNavigation();
  }

  setupAria() {
    // Auto-add ARIA labels where missing
    document.querySelectorAll('button:not([aria-label]):not([aria-labelledby])').forEach(button => {
      if (!button.textContent.trim()) {
        console.warn('Button missing accessible name:', button);
      }
    });
  }

  setupKeyboardNavigation() {
    // Enhanced keyboard navigation
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        // Close any open modals/dropdowns
        this.closeAllOverlays();
      }
    });
  }

  closeAllOverlays() {
    document.querySelectorAll('.modal.active, .dropdown.active').forEach(overlay => {
      overlay.classList.remove('active');
    });
  }
}

/**
 * Interaction Manager
 */
class InteractionManager {
  constructor() {
    this.setupTouchGestures();
    this.setupKeyboardShortcuts();
  }

  setupTouchGestures() {
    // Add touch-friendly interactions
    let touchStartY = 0;
    
    document.addEventListener('touchstart', (e) => {
      touchStartY = e.touches[0].clientY;
    }, { passive: true });
    
    document.addEventListener('touchend', (e) => {
      const touchEndY = e.changedTouches[0].clientY;
      const diff = touchStartY - touchEndY;
      
      // Pull to refresh (for mobile)
      if (diff < -100 && window.scrollY === 0) {
        if (typeof window.refreshPage === 'function') {
          window.refreshPage();
        }
      }
    }, { passive: true });
  }

  setupKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
      // Global shortcuts
      if (e.ctrlKey || e.metaKey) {
        switch (e.key) {
          case 'k':
            e.preventDefault();
            // Focus search if available
            const search = document.querySelector('input[type="search"], .search-input');
            if (search) search.focus();
            break;
        }
      }
    });
  }
}

// Initialize Modern UI System when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  window.modernUI = new ModernUISystem();
});

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { ModernUISystem, AnimationManager, AccessibilityManager, InteractionManager };
}
