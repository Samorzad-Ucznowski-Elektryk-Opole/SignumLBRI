/**
 * High-performance image lazy loading system for SignumLBRI 2025
 * Optimized for book covers and advertisement images
 */

class LazyImageLoader {
  constructor() {
    this.observer = null;
    this.imageCache = new Map();
    this.loadingQueue = new Set();

    // Initialize Intersection Observer with optimized settings
    this.observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          this.loadImage(entry.target);
          this.observer.unobserve(entry.target);
        }
      });
    }, {
      rootMargin: '50px 0px', // Start loading 50px before image comes into view
      threshold: 0.01
    });

    this.init();
  }

  init() {
    // Find all lazy images on page load
    const lazyImages = document.querySelectorAll('img[data-src]');
    lazyImages.forEach(img => this.observe(img));

    // Handle dynamic content (for AJAX loads)
    this.observeMutations();
  }

  observe(img) {
    // Add loading placeholder
    img.classList.add('lazy-loading');
    
    // Add error handling
    img.onerror = () => {
      img.classList.add('lazy-error');
      img.src = '/images/placeholder-error.png';
    };

    this.observer.observe(img);
  }

  async loadImage(img) {
    if (this.loadingQueue.has(img)) return;
    this.loadingQueue.add(img);

    const src = img.dataset.src;
    if (!src) return;

    try {
      // Check cache first
      let cachedImage = this.imageCache.get(src);
      
      if (!cachedImage) {
        // Create new image element for preloading
        cachedImage = new Image();
        
        // Use progressive loading for larger images
        if (img.dataset.progressive === 'true') {
          await this.loadProgressively(cachedImage, src, img);
        } else {
          await this.loadStandard(cachedImage, src);
        }
        
        this.imageCache.set(src, cachedImage);
      }

      // Apply loaded image
      img.src = cachedImage.src;
      img.classList.remove('lazy-loading');
      img.classList.add('lazy-loaded');

      // Add fade-in animation
      img.style.opacity = '0';
      img.style.transition = 'opacity 0.3s ease-in-out';
      
      requestAnimationFrame(() => {
        img.style.opacity = '1';
      });

    } catch (error) {
      console.error('Image loading failed:', src, error);
      img.classList.add('lazy-error');
      img.src = '/images/placeholder-error.png';
    } finally {
      this.loadingQueue.delete(img);
    }
  }

  loadStandard(img, src) {
    return new Promise((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = reject;
      img.src = src;
    });
  }

  async loadProgressively(img, src, targetImg) {
    // Load low-quality placeholder first
    const lowQualityUrl = src.replace(/(\.[^.]+)$/, '_thumb$1');
    
    try {
      await this.loadStandard(img, lowQualityUrl);
      targetImg.src = img.src;
      targetImg.style.filter = 'blur(2px)';
    } catch {
      // If thumbnail fails, skip to full quality
    }

    // Then load full quality
    await this.loadStandard(img, src);
    targetImg.style.filter = 'none';
  }

  observeMutations() {
    const mutationObserver = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === Node.ELEMENT_NODE) {
            const element = node;
            const newLazyImages = element.querySelectorAll('img[data-src]');
            newLazyImages.forEach(img => this.observe(img));
          }
        });
      });
    });

    mutationObserver.observe(document.body, {
      childList: true,
      subtree: true
    });
  }

  // Public method to manually add images to lazy loading
  addImage(img) {
    this.observe(img);
  }

  // Clean up cache periodically
  clearCache() {
    this.imageCache.clear();
  }
}

/**
 * Responsive image srcset generator
 */
class ResponsiveImageHelper {
  static generateBookCoverSrcset(bookId: string): string {
    const sizes = [
      { width: 120, suffix: '_thumb' },
      { width: 200, suffix: '_small' },
      { width: 400, suffix: '_medium' },
      { width: 800, suffix: '_large' }
    ];

    return sizes
      .map(size => `/book/${bookId}/image?width=${size.width} ${size.width}w`)
      .join(', ');
  }

  static generateBookAdImageSrcset(adId: string, filename: string): string {
    const sizes = [300, 600, 1200];
    
    return sizes
      .map(size => `/api/bookads/${adId}/images/${filename}?width=${size} ${size}w`)
      .join(', ');
  }
}

/**
 * Performance-optimized image component creator
 */
class ImageComponentFactory {
  static createBookCover(book: any, options: {
    size?: 'thumb' | 'small' | 'medium' | 'large';
    lazy?: boolean;
    progressive?: boolean;
    className?: string;
  } = {}) {
    const { size = 'medium', lazy = true, progressive = false, className = '' } = options;
    
    const img = document.createElement('img');
    img.alt = `Okładka książki: ${book.title}`;
    img.className = `book-cover book-cover--${size} ${className}`.trim();
    
    const widthMap = { thumb: 120, small: 200, medium: 400, large: 800 };
    const width = widthMap[size];
    
    if (lazy) {
      img.dataset.src = `/book/${book._id}/image?width=${width}`;
      img.dataset.progressive = progressive.toString();
      img.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0ibTIwIDMwIDEwLTEwLTEwLTEwLTEwIDEwIDEwIDEwWiIgZmlsbD0iIzk5OTk5OSIvPgo8L3N2Zz4K'; // Loading placeholder
    } else {
      img.src = `/book/${book._id}/image?width=${width}`;
    }
    
    // Add responsive srcset
    img.srcset = ResponsiveImageHelper.generateBookCoverSrcset(book._id);
    img.sizes = '(max-width: 768px) 120px, (max-width: 1024px) 200px, 400px';
    
    return img;
  }

  static createBookAdImage(ad: any, filename: string, options: {
    lazy?: boolean;
    className?: string;
  } = {}) {
    const { lazy = true, className = '' } = options;
    
    const img = document.createElement('img');
    img.alt = `Zdjęcie książki: ${ad.book?.title || 'Książka'}`;
    img.className = `book-ad-image ${className}`.trim();
    
    if (lazy) {
      img.dataset.src = `/api/bookads/${ad._id}/images/${filename}`;
      img.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0ibTIwIDMwIDEwLTEwLTEwLTEwLTEwIDEwIDEwIDEwWiIgZmlsbD0iIzk5OTk5OSIvPgo8L3N2Zz4K';
    } else {
      img.src = `/api/bookads/${ad._id}/images/${filename}`;
    }
    
    // Add responsive srcset for ad images
    img.srcset = ResponsiveImageHelper.generateBookAdImageSrcset(ad._id, filename);
    img.sizes = '(max-width: 768px) 300px, (max-width: 1024px) 600px, 1200px';
    
    return img;
  }
}

// Initialize lazy loading system
let lazyImageLoader: LazyImageLoader;

document.addEventListener('DOMContentLoaded', () => {
  lazyImageLoader = new LazyImageLoader();
});

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    LazyImageLoader,
    ResponsiveImageHelper,
    ImageComponentFactory
  };
}

// Add global styles for lazy loading
const lazyLoadingStyles = `
.lazy-loading {
  background: linear-gradient(90deg, #f0f0f0 25%, rgba(255,255,255,0.8) 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  animation: loading 1.5s infinite;
}

.lazy-loaded {
  animation: fadeIn 0.3s ease-in-out;
}

.lazy-error {
  background: #f8f9fa;
  border: 2px dashed #dee2e6;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #6c757d;
  font-size: 0.875rem;
}

@keyframes loading {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

/* Responsive image defaults */
.book-cover {
  width: 100%;
  height: auto;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.book-cover:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 16px rgba(0,0,0,0.15);
}

.book-ad-image {
  width: 100%;
  height: auto;
  border-radius: 6px;
  object-fit: cover;
}
`;

// Inject styles
if (typeof document !== 'undefined') {
  const styleSheet = document.createElement('style');
  styleSheet.textContent = lazyLoadingStyles;
  document.head.appendChild(styleSheet);
}
