/**
 * Enhanced Routing System with Advanced Features
 * Centralized route management with validation, caching, and performance monitoring
 */

interface RouteConfig {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  path: string;
  handler: string; // Controller method reference
  middleware?: string[];
  auth?: {
    required: boolean;
    roles?: string[];
    permissions?: string[];
  };
  validation?: {
    params?: any;
    query?: any;
    body?: any;
  };
  cache?: {
    enabled: boolean;
    ttl?: number;
    key?: string;
  };
  rateLimit?: {
    windowMs: number;
    max: number;
  };
  description?: string;
  tags?: string[];
}

// Route registry for centralized management
export class RouteRegistry {
  private routes: Map<string, RouteConfig> = new Map();
  private routeGroups: Map<string, RouteConfig[]> = new Map();
  
  // Register a single route
  register(name: string, config: RouteConfig): void {
    this.routes.set(name, config);
    
    // Add to group if tags exist
    config.tags?.forEach(tag => {
      if (!this.routeGroups.has(tag)) {
        this.routeGroups.set(tag, []);
      }
      this.routeGroups.get(tag)!.push(config);
    });
  }
  
  // Register multiple routes
  registerBulk(routes: Record<string, RouteConfig>): void {
    Object.entries(routes).forEach(([name, config]) => {
      this.register(name, config);
    });
  }
  
  // Get route by name
  get(name: string): RouteConfig | undefined {
    return this.routes.get(name);
  }
  
  // Get all routes in a group
  getGroup(tag: string): RouteConfig[] {
    return this.routeGroups.get(tag) || [];
  }
  
  // Get all routes
  getAll(): Map<string, RouteConfig> {
    return new Map(this.routes);
  }
  
  // Generate route documentation
  generateDocs(): any {
    const docs: any = {
      routes: {},
      groups: {}
    };
    
    // Document all routes
    this.routes.forEach((config, name) => {
      docs.routes[name] = {
        method: config.method,
        path: config.path,
        description: config.description,
        auth: config.auth,
        rateLimit: config.rateLimit,
        cache: config.cache
      };
    });
    
    // Document route groups
    this.routeGroups.forEach((routes, tag) => {
      docs.groups[tag] = routes.map(route => ({
        method: route.method,
        path: route.path,
        description: route.description
      }));
    });
    
    return docs;
  }
}

// Global route registry instance
export const routeRegistry = new RouteRegistry();

// Enhanced route definitions
export const enhancedRoutes: Record<string, RouteConfig> = {
  // Home routes
  'home.index': {
    method: 'GET',
    path: '/',
    handler: 'home.index',
    cache: { enabled: true, ttl: 300 },
    description: 'Homepage with featured books and statistics',
    tags: ['public', 'home']
  },
  
  'home.staff': {
    method: 'GET',
    path: '/staff',
    handler: 'home.staff',
    auth: { required: true, roles: ['staff', 'admin'] },
    cache: { enabled: true, ttl: 180 },
    description: 'Staff dashboard',
    tags: ['auth', 'staff']
  },
  
  // Authentication routes
  'auth.login': {
    method: 'GET',
    path: '/login',
    handler: 'user.getLogin',
    middleware: ['guest'],
    description: 'Login page',
    tags: ['auth', 'public']
  },
  
  'auth.login.post': {
    method: 'POST',
    path: '/login',
    handler: 'user.postLogin',
    middleware: ['guest'],
    validation: {
      body: {
        email: { type: 'email', required: true },
        password: { type: 'string', required: true, minLength: 6 }
      }
    },
    rateLimit: { windowMs: 900000, max: 5 }, // 5 attempts per 15 minutes
    description: 'Process login',
    tags: ['auth', 'public']
  },
  
  'auth.register': {
    method: 'GET',
    path: '/signup',
    handler: 'user.getSignup',
    middleware: ['guest'],
    description: 'Registration page',
    tags: ['auth', 'public']
  },
  
  'auth.register.post': {
    method: 'POST',
    path: '/signup',
    handler: 'user.postSignup',
    middleware: ['guest'],
    validation: {
      body: {
        email: { type: 'email', required: true },
        password: { type: 'string', required: true, minLength: 6 },
        confirmPassword: { type: 'string', required: true },
        'profile.name': { type: 'string', required: true, minLength: 2 },
        'profile.surname': { type: 'string', required: true, minLength: 2 },
        school: { type: 'objectId', required: true }
      }
    },
    rateLimit: { windowMs: 3600000, max: 3 }, // 3 attempts per hour
    description: 'Process registration',
    tags: ['auth', 'public']
  },
  
  'auth.logout': {
    method: 'POST',
    path: '/logout',
    handler: 'user.logout',
    auth: { required: true },
    description: 'User logout',
    tags: ['auth']
  },
  
  // User profile routes
  'user.profile': {
    method: 'GET',
    path: '/account/profile',
    handler: 'user.getProfile',
    auth: { required: true },
    cache: { enabled: true, ttl: 300 },
    description: 'User profile page',
    tags: ['auth', 'user']
  },
  
  'user.profile.update': {
    method: 'POST',
    path: '/account/profile',
    handler: 'user.postUpdateProfile',
    auth: { required: true },
    validation: {
      body: {
        'profile.name': { type: 'string', required: true },
        'profile.surname': { type: 'string', required: true },
        'profile.bio': { type: 'string', maxLength: 500 },
        'profile.phoneNumber': { type: 'phone' }
      }
    },
    description: 'Update user profile',
    tags: ['auth', 'user']
  },
  
  // Book routes
  'book.search': {
    method: 'GET',
    path: '/books',
    handler: 'book.search',
    validation: {
      query: {
        q: { type: 'string' },
        page: { type: 'number', min: 1, default: 1 },
        limit: { type: 'number', min: 1, max: 50, default: 20 },
        subject: { type: 'string' },
        gradeLevel: { type: 'number', min: 1, max: 13 },
        condition: { type: 'string', enum: ['new', 'excellent', 'very_good', 'good', 'fair', 'poor'] }
      }
    },
    cache: { enabled: true, ttl: 180 },
    description: 'Search and browse books',
    tags: ['public', 'books']
  },
  
  'book.details': {
    method: 'GET',
    path: '/books/:id',
    handler: 'book.details',
    validation: {
      params: {
        id: { type: 'objectId', required: true }
      }
    },
    cache: { enabled: true, ttl: 300 },
    description: 'Book details page',
    tags: ['public', 'books']
  },
  
  'book.create': {
    method: 'GET',
    path: '/books/add',
    handler: 'book.getCreate',
    auth: { required: true, permissions: ['books.create'] },
    description: 'Add new book form',
    tags: ['auth', 'books']
  },
  
  'book.create.post': {
    method: 'POST',
    path: '/books/add',
    handler: 'book.postCreate',
    auth: { required: true, permissions: ['books.create'] },
    validation: {
      body: {
        title: { type: 'string', required: true, maxLength: 500 },
        authors: { type: 'array', required: true, minItems: 1 },
        publisher: { type: 'string', required: true, maxLength: 200 },
        isbn: { type: 'isbn', required: true },
        year: { type: 'number', required: true, min: 1000, max: new Date().getFullYear() + 2 },
        subject: { type: 'string', enum: ['mathematics', 'physics', 'chemistry', 'biology', 'geography', 'history', 'polish', 'english', 'other'] }
      }
    },
    description: 'Create new book',
    tags: ['auth', 'books']
  },
  
  // Book listing routes
  'listing.create': {
    method: 'GET',
    path: '/sell/:bookId?',
    handler: 'book.getSell',
    auth: { required: true },
    validation: {
      params: {
        bookId: { type: 'objectId' }
      }
    },
    description: 'Create book listing form',
    tags: ['auth', 'listings']
  },
  
  'listing.create.post': {
    method: 'POST',
    path: '/sell',
    handler: 'book.postSell',
    auth: { required: true },
    validation: {
      body: {
        book: { type: 'objectId', required: true },
        condition: { type: 'string', required: true, enum: ['new', 'excellent', 'very_good', 'good', 'fair', 'poor'] },
        price: { type: 'number', min: 0, max: 10000 },
        saleType: { type: 'string', required: true, enum: ['sell', 'exchange', 'donate'] },
        description: { type: 'string', maxLength: 1000 },
        contactMethod: { type: 'array', required: true, minItems: 1 }
      }
    },
    description: 'Create book listing',
    tags: ['auth', 'listings']
  },
  
  'listing.edit': {
    method: 'GET',
    path: '/listing/:id/edit',
    handler: 'book.getEditListing',
    auth: { required: true },
    validation: {
      params: {
        id: { type: 'objectId', required: true }
      }
    },
    description: 'Edit book listing form',
    tags: ['auth', 'listings']
  },
  
  'listing.update': {
    method: 'POST',
    path: '/listing/:id/edit',
    handler: 'book.postEditListing',
    auth: { required: true },
    validation: {
      params: {
        id: { type: 'objectId', required: true }
      },
      body: {
        condition: { type: 'string', enum: ['new', 'excellent', 'very_good', 'good', 'fair', 'poor'] },
        price: { type: 'number', min: 0, max: 10000 },
        description: { type: 'string', maxLength: 1000 },
        isActive: { type: 'boolean' }
      }
    },
    description: 'Update book listing',
    tags: ['auth', 'listings']
  },
  
  // API routes
  'api.books.search': {
    method: 'GET',
    path: '/api/books/search',
    handler: 'api.searchBooks',
    validation: {
      query: {
        q: { type: 'string', required: true },
        limit: { type: 'number', min: 1, max: 100, default: 20 }
      }
    },
    cache: { enabled: true, ttl: 300 },
    rateLimit: { windowMs: 60000, max: 100 },
    description: 'Book search API endpoint',
    tags: ['api', 'books']
  },
  
  'api.books.isbn': {
    method: 'GET',
    path: '/api/books/isbn/:isbn',
    handler: 'api.getBookByISBN',
    validation: {
      params: {
        isbn: { type: 'isbn', required: true }
      }
    },
    cache: { enabled: true, ttl: 600 },
    rateLimit: { windowMs: 60000, max: 60 },
    description: 'Get book by ISBN',
    tags: ['api', 'books']
  },
  
  'api.listings.featured': {
    method: 'GET',
    path: '/api/listings/featured',
    handler: 'api.getFeaturedListings',
    cache: { enabled: true, ttl: 300 },
    rateLimit: { windowMs: 60000, max: 120 },
    description: 'Get featured listings',
    tags: ['api', 'listings']
  },
  
  // Admin routes
  'admin.dashboard': {
    method: 'GET',
    path: '/admin',
    handler: 'admin.dashboard',
    auth: { required: true, roles: ['admin', 'super_admin'] },
    cache: { enabled: true, ttl: 180 },
    description: 'Admin dashboard',
    tags: ['admin', 'auth']
  },
  
  'admin.users': {
    method: 'GET',
    path: '/admin/users',
    handler: 'admin.getUsers',
    auth: { required: true, roles: ['admin', 'super_admin'], permissions: ['users.view'] },
    validation: {
      query: {
        page: { type: 'number', min: 1, default: 1 },
        limit: { type: 'number', min: 1, max: 100, default: 25 },
        status: { type: 'string', enum: ['active', 'inactive', 'suspended', 'pending_verification', 'blocked'] },
        role: { type: 'string', enum: ['student', 'teacher', 'staff', 'admin'] }
      }
    },
    description: 'User management page',
    tags: ['admin', 'users']
  },
  
  'admin.listings.moderate': {
    method: 'GET',
    path: '/admin/listings/moderate',
    handler: 'admin.getModerateListings',
    auth: { required: true, roles: ['admin', 'staff'], permissions: ['listings.moderate'] },
    validation: {
      query: {
        status: { type: 'string', enum: ['pending', 'reported'], default: 'pending' },
        page: { type: 'number', min: 1, default: 1 }
      }
    },
    description: 'Listing moderation interface',
    tags: ['admin', 'moderation']
  },
  
  'admin.listing.approve': {
    method: 'POST',
    path: '/admin/listing/:id/approve',
    handler: 'admin.approveListing',
    auth: { required: true, roles: ['admin', 'staff'], permissions: ['listings.moderate'] },
    validation: {
      params: {
        id: { type: 'objectId', required: true }
      },
      body: {
        reason: { type: 'string', maxLength: 200 }
      }
    },
    description: 'Approve a listing',
    tags: ['admin', 'moderation']
  },
  
  'admin.listing.reject': {
    method: 'POST',
    path: '/admin/listing/:id/reject',
    handler: 'admin.rejectListing',
    auth: { required: true, roles: ['admin', 'staff'], permissions: ['listings.moderate'] },
    validation: {
      params: {
        id: { type: 'objectId', required: true }
      },
      body: {
        reason: { type: 'string', required: true, maxLength: 200 }
      }
    },
    description: 'Reject a listing',
    tags: ['admin', 'moderation']
  },
  
  // Image handling
  'image.upload': {
    method: 'POST',
    path: '/api/upload/image',
    handler: 'image.upload',
    auth: { required: true },
    rateLimit: { windowMs: 3600000, max: 20 }, // 20 uploads per hour
    description: 'Upload image',
    tags: ['api', 'upload']
  },
  
  'image.serve': {
    method: 'GET',
    path: '/images/:filename',
    handler: 'image.serve',
    validation: {
      params: {
        filename: { type: 'string', required: true }
      }
    },
    cache: { enabled: true, ttl: 86400 }, // Cache images for 1 day
    description: 'Serve uploaded images',
    tags: ['public', 'static']
  },
  
  // Health and monitoring
  'system.health': {
    method: 'GET',
    path: '/health',
    handler: 'system.health',
    description: 'System health check',
    tags: ['system', 'monitoring']
  },
  
  'system.metrics': {
    method: 'GET',
    path: '/metrics',
    handler: 'system.metrics',
    auth: { required: true, roles: ['admin', 'super_admin'] },
    description: 'System metrics and statistics',
    tags: ['system', 'monitoring', 'admin']
  }
};

// Register all routes
routeRegistry.registerBulk(enhancedRoutes);

// Route middleware factory
export const createRouteMiddleware = (routeName: string) => {
  return (req: any, res: any, next: any) => {
    const route = routeRegistry.get(routeName);
    if (!route) {
      return res.status(404).json({ error: 'Route not found' });
    }
    
    // Add route info to request
    req.routeInfo = route;
    req.routeName = routeName;
    
    next();
  };
};

// Route validation middleware
export const validateRoute = (routeName: string) => {
  return (req: any, res: any, next: any) => {
    const route = routeRegistry.get(routeName);
    if (!route || !route.validation) {
      return next();
    }
    
    const errors: string[] = [];
    
    // Validate params
    if (route.validation.params) {
      errors.push(...validateObject(req.params, route.validation.params, 'params'));
    }
    
    // Validate query
    if (route.validation.query) {
      errors.push(...validateObject(req.query, route.validation.query, 'query'));
    }
    
    // Validate body
    if (route.validation.body) {
      errors.push(...validateObject(req.body, route.validation.body, 'body'));
    }
    
    if (errors.length > 0) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors
      });
    }
    
    next();
  };
};

// Simple validation helper
const validateObject = (obj: any, schema: any, location: string): string[] => {
  const errors: string[] = [];
  
  for (const [key, rules] of Object.entries(schema) as [string, any][]) {
    const value = obj[key];
    
    if (rules.required && (value === undefined || value === null || value === '')) {
      errors.push(`${location}.${key} is required`);
      continue;
    }
    
    if (value === undefined || value === null) continue;
    
    // Type validation
    if (rules.type) {
      if (!validateType(value, rules.type)) {
        errors.push(`${location}.${key} must be of type ${rules.type}`);
      }
    }
    
    // Length validation
    if (rules.minLength && value.length < rules.minLength) {
      errors.push(`${location}.${key} must be at least ${rules.minLength} characters`);
    }
    
    if (rules.maxLength && value.length > rules.maxLength) {
      errors.push(`${location}.${key} must not exceed ${rules.maxLength} characters`);
    }
    
    // Number validation
    if (rules.min !== undefined && value < rules.min) {
      errors.push(`${location}.${key} must be at least ${rules.min}`);
    }
    
    if (rules.max !== undefined && value > rules.max) {
      errors.push(`${location}.${key} must not exceed ${rules.max}`);
    }
    
    // Enum validation
    if (rules.enum && !rules.enum.includes(value)) {
      errors.push(`${location}.${key} must be one of: ${rules.enum.join(', ')}`);
    }
  }
  
  return errors;
};

const validateType = (value: any, type: string): boolean => {
  switch (type) {
    case 'string':
      return typeof value === 'string';
    case 'number':
      return typeof value === 'number' && !isNaN(value);
    case 'boolean':
      return typeof value === 'boolean';
    case 'array':
      return Array.isArray(value);
    case 'email':
      return typeof value === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
    case 'phone':
      return typeof value === 'string' && /^\+?[\d\s\-\(\)]+$/.test(value);
    case 'isbn':
      return typeof value === 'string' && validateISBN(value);
    case 'objectId':
      return typeof value === 'string' && /^[a-fA-F0-9]{24}$/.test(value);
    default:
      return true;
  }
};

const validateISBN = (isbn: string): boolean => {
  const cleanISBN = isbn.replace(/[^0-9X]/gi, '');
  return cleanISBN.length === 10 || cleanISBN.length === 13;
};

// Export route registry and utilities
export default routeRegistry;
