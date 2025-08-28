/**
 * ✨ SignumLBRI Enhanced - Components Module
 * 
 * Core UI components and interactions for the Enhanced interface
 */

(function(global) {
  'use strict';

  // Components namespace
  const Components = {
    
    // Modal management
    modal: {
      show: function(id) {
        const modal = document.getElementById(id);
        if (modal) {
          const bsModal = new bootstrap.Modal(modal);
          bsModal.show();
        }
      },
      
      hide: function(id) {
        const modal = document.getElementById(id);
        if (modal) {
          const bsModal = bootstrap.Modal.getInstance(modal);
          if (bsModal) bsModal.hide();
        }
      }
    },

    // Toast notifications
    toast: {
      show: function(message, type = 'info', duration = 5000) {
        const toastContainer = document.querySelector('.toast-container') || this.createContainer();
        const toast = this.createToast(message, type);
        toastContainer.appendChild(toast);
        
        const bsToast = new bootstrap.Toast(toast, { delay: duration });
        bsToast.show();
        
        toast.addEventListener('hidden.bs.toast', () => {
          toast.remove();
        });
      },
      
      createContainer: function() {
        const container = document.createElement('div');
        container.className = 'toast-container position-fixed top-0 end-0 p-3';
        container.style.zIndex = '9999';
        document.body.appendChild(container);
        return container;
      },
      
      createToast: function(message, type) {
        const toast = document.createElement('div');
        toast.className = `toast align-items-center text-white bg-${type} border-0`;
        toast.setAttribute('role', 'alert');
        toast.innerHTML = `
          <div class="d-flex">
            <div class="toast-body">${message}</div>
            <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
          </div>
        `;
        return toast;
      }
    },

    // Loading states
    loading: {
      show: function(element) {
        if (typeof element === 'string') {
          element = document.querySelector(element);
        }
        if (element) {
          element.classList.add('loading');
          const spinner = document.createElement('div');
          spinner.className = 'spinner-border spinner-border-sm';
          spinner.setAttribute('role', 'status');
          element.appendChild(spinner);
        }
      },
      
      hide: function(element) {
        if (typeof element === 'string') {
          element = document.querySelector(element);
        }
        if (element) {
          element.classList.remove('loading');
          const spinner = element.querySelector('.spinner-border');
          if (spinner) spinner.remove();
        }
      }
    },

    // Form validation
    form: {
      validate: function(form) {
        const inputs = form.querySelectorAll('input[required], select[required], textarea[required]');
        let isValid = true;
        
        inputs.forEach(input => {
          if (!input.value.trim()) {
            this.showError(input, 'To pole jest wymagane');
            isValid = false;
          } else {
            this.clearError(input);
          }
        });
        
        return isValid;
      },
      
      showError: function(input, message) {
        input.classList.add('is-invalid');
        let feedback = input.parentNode.querySelector('.invalid-feedback');
        if (!feedback) {
          feedback = document.createElement('div');
          feedback.className = 'invalid-feedback';
          input.parentNode.appendChild(feedback);
        }
        feedback.textContent = message;
      },
      
      clearError: function(input) {
        input.classList.remove('is-invalid');
        const feedback = input.parentNode.querySelector('.invalid-feedback');
        if (feedback) feedback.remove();
      }
    },

    // Theme management
    theme: {
      switch: function(theme) {
        document.body.setAttribute('data-theme', theme);
        localStorage.setItem('enhanced-theme', theme);
        this.updateThemeIcon(theme);
      },
      
      toggle: function() {
        const current = document.body.getAttribute('data-theme') || 'auto';
        const themes = ['light', 'dark', 'auto'];
        const nextIndex = (themes.indexOf(current) + 1) % themes.length;
        this.switch(themes[nextIndex]);
      },
      
      updateThemeIcon: function(theme) {
        const icon = document.querySelector('.theme-toggle i');
        if (icon) {
          icon.className = theme === 'dark' ? 'fas fa-sun' : 
                          theme === 'light' ? 'fas fa-moon' : 
                          'fas fa-adjust';
        }
      }
    },

    // Language management
    language: {
      switch: function(lang) {
        // Send request to server to change language
        fetch('/enhanced/api/language', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ language: lang })
        }).then(() => {
          location.reload();
        }).catch(console.error);
      }
    },

    // Search functionality
    search: {
      init: function() {
        const searchInputs = document.querySelectorAll('.search-input');
        searchInputs.forEach(input => {
          input.addEventListener('input', this.debounce(this.performSearch, 300));
        });
      },
      
      performSearch: function(event) {
        const query = event.target.value.trim();
        const container = event.target.closest('.search-container');
        const resultsContainer = container?.querySelector('.search-results');
        
        if (!resultsContainer) return;
        
        if (query.length < 2) {
          resultsContainer.innerHTML = '';
          return;
        }
        
        // Show loading
        resultsContainer.innerHTML = '<div class="text-center p-3"><div class="spinner-border spinner-border-sm"></div></div>';
        
        // Perform search
        fetch(`/enhanced/api/search?q=${encodeURIComponent(query)}`)
          .then(response => response.json())
          .then(data => {
            resultsContainer.innerHTML = data.results.map(result => `
              <div class="search-result-item p-2">
                <div class="fw-semibold">${result.title}</div>
                <div class="text-muted small">${result.description}</div>
              </div>
            `).join('');
          })
          .catch(() => {
            resultsContainer.innerHTML = '<div class="text-danger p-2">Błąd podczas wyszukiwania</div>';
          });
      },
      
      debounce: function(func, wait) {
        let timeout;
        return function executedFunction(...args) {
          const later = () => {
            clearTimeout(timeout);
            func(...args);
          };
          clearTimeout(timeout);
          timeout = setTimeout(later, wait);
        };
      }
    }
  };

  // Export to global
  global.EnhancedComponents = Components;

})(window);
