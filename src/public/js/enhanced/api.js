/**
 * ✨ SignumLBRI Enhanced - API Module
 * 
 * API client for communicating with the Enhanced backend
 */

(function(global) {
  'use strict';

  // API Configuration
  const API_BASE = '/enhanced/api';
  
  // API Client
  const API = {
    
    // Generic request method
    request: async function(endpoint, options = {}) {
      const url = `${API_BASE}${endpoint}`;
      const defaultOptions = {
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'same-origin'
      };
      
      const config = { ...defaultOptions, ...options };
      
      try {
        const response = await fetch(url, config);
        const data = await response.json();
        
        if (!response.ok) {
          throw new Error(data.message || `HTTP ${response.status}`);
        }
        
        return data;
      } catch (error) {
        console.error('API Request Error:', error);
        throw error;
      }
    },

    // GET request
    get: function(endpoint) {
      return this.request(endpoint, { method: 'GET' });
    },

    // POST request
    post: function(endpoint, data) {
      return this.request(endpoint, {
        method: 'POST',
        body: JSON.stringify(data)
      });
    },

    // PUT request
    put: function(endpoint, data) {
      return this.request(endpoint, {
        method: 'PUT',
        body: JSON.stringify(data)
      });
    },

    // DELETE request
    delete: function(endpoint) {
      return this.request(endpoint, { method: 'DELETE' });
    },

    // Books API
    books: {
      getAll: () => API.get('/books'),
      getById: (id) => API.get(`/books/${id}`),
      create: (data) => API.post('/books', data),
      update: (id, data) => API.put(`/books/${id}`, data),
      delete: (id) => API.delete(`/books/${id}`),
      search: (query) => API.get(`/books/search?q=${encodeURIComponent(query)}`)
    },

    // Users API
    users: {
      getProfile: () => API.get('/users/profile'),
      updateProfile: (data) => API.put('/users/profile', data),
      getStats: () => API.get('/users/stats')
    },

    // Dashboard API
    dashboard: {
      getStats: () => API.get('/dashboard/stats'),
      getRecentActivity: () => API.get('/dashboard/activity'),
      getChartData: (type) => API.get(`/dashboard/charts/${type}`)
    },

    // Admin API
    admin: {
      getUsers: () => API.get('/admin/users'),
      getSystemStats: () => API.get('/admin/system'),
      getLogs: (limit = 100) => API.get(`/admin/logs?limit=${limit}`)
    },

    // File upload
    upload: {
      file: async function(file, endpoint = '/upload') {
        const formData = new FormData();
        formData.append('file', file);
        
        const response = await fetch(`${API_BASE}${endpoint}`, {
          method: 'POST',
          body: formData,
          credentials: 'same-origin'
        });
        
        const data = await response.json();
        
        if (!response.ok) {
          throw new Error(data.message || 'Upload failed');
        }
        
        return data;
      }
    },

    // Real-time updates
    realtime: {
      connect: function() {
        // WebSocket connection for real-time updates
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const wsUrl = `${protocol}//${window.location.host}/ws`;
        
        try {
          const ws = new WebSocket(wsUrl);
          
          ws.onopen = () => {
            console.log('✅ WebSocket connected');
          };
          
          ws.onmessage = (event) => {
            try {
              const data = JSON.parse(event.data);
              this.handleMessage(data);
            } catch (e) {
              console.error('WebSocket message parse error:', e);
            }
          };
          
          ws.onclose = () => {
            console.log('🔌 WebSocket disconnected, attempting reconnect...');
            setTimeout(() => this.connect(), 5000);
          };
          
          ws.onerror = (error) => {
            console.error('❌ WebSocket error:', error);
          };
          
          return ws;
        } catch (error) {
          console.warn('WebSocket not supported or connection failed:', error);
          return null;
        }
      },
      
      handleMessage: function(data) {
        // Handle different types of real-time messages
        switch (data.type) {
          case 'notification':
            if (global.EnhancedComponents) {
              global.EnhancedComponents.toast.show(data.message, data.level || 'info');
            }
            break;
          case 'stats_update':
            this.updateStats(data.stats);
            break;
          case 'user_activity':
            this.updateUserActivity(data.activity);
            break;
          default:
            console.log('Unknown message type:', data.type);
        }
      },
      
      updateStats: function(stats) {
        // Update dashboard stats in real-time
        Object.keys(stats).forEach(key => {
          const element = document.querySelector(`[data-stat="${key}"]`);
          if (element) {
            element.textContent = stats[key];
            element.classList.add('updated');
            setTimeout(() => element.classList.remove('updated'), 1000);
          }
        });
      },
      
      updateUserActivity: function(activity) {
        const activityContainer = document.querySelector('.activity-feed');
        if (activityContainer) {
          const item = document.createElement('div');
          item.className = 'activity-item new';
          item.innerHTML = `
            <div class="activity-icon">
              <i class="fas fa-${activity.icon || 'info-circle'}"></i>
            </div>
            <div class="activity-content">
              <div class="activity-text">${activity.text}</div>
              <div class="activity-time">${new Date().toLocaleString()}</div>
            </div>
          `;
          activityContainer.insertBefore(item, activityContainer.firstChild);
          
          // Remove 'new' class after animation
          setTimeout(() => item.classList.remove('new'), 1000);
        }
      }
    }
  };

  // Export to global
  global.EnhancedAPI = API;

})(window);
