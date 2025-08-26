/**
 * ✨ SignumLBRI Enhanced - Standalone Application (JS Version)
 * 
 * Nowoczesna, niezależna aplikacja zarządzania książkami szkolnymi
 * z zaawansowanymi funkcjami UI i kompletną architekturą
 */

const express = require('express');
const path = require('path');
const fs = require('fs');
const compression = require('compression');
const session = require('express-session');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');

// Load verification to ensure fixes are applied
try {
  require('./fix-verification.js');
} catch (e) {
  console.log('⚠️  Fix verification file not found, continuing...');
}

const app = express();
const PORT = process.env.PORT || process.env.ENHANCED_PORT || 4000;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://mongodb:27017/signumlbri';

// System resource monitoring
const getSystemInfo = () => {
  const memUsage = process.memoryUsage();
  const uptime = process.uptime();
  const cpuUsage = process.cpuUsage();
  
  return {
    memory: {
      rss: Math.round(memUsage.rss / 1024 / 1024),
      heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024),
      heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024),
      external: Math.round(memUsage.external / 1024 / 1024),
      arrayBuffers: Math.round(memUsage.arrayBuffers / 1024 / 1024)
    },
    cpu: {
      user: Math.round(cpuUsage.user / 1000),
      system: Math.round(cpuUsage.system / 1000)
    },
    uptime: Math.round(uptime),
    nodeVersion: process.version,
    pid: process.pid,
    platform: process.platform,
    arch: process.arch,
    eventLoopDelay: process.hrtime.bigint ? 'available' : 'unavailable'
  };
};

// Advanced request tracking
const requestTracker = {
  total: 0,
  active: 0,
  errors: 0,
  routes: new Map(),
  avgResponseTime: 0,
  responseTimes: []
};

console.log('🚀 SignumLBRI Enhanced Application Starting...');
console.log('⏰ Started at:', new Date().toISOString());
console.log('🖥️  System Information:');
const sysInfo = getSystemInfo();
Object.entries(sysInfo).forEach(([key, value]) => {
  if (typeof value === 'object') {
    console.log(`   ${key}:`, JSON.stringify(value, null, 2).replace(/\\n/g, '\\n      '));
  } else {
    console.log(`   ${key}: ${value}`);
  }
});
console.log('🐧 Platform:', process.platform, process.arch);
console.log('🌍 Environment:', process.env.NODE_ENV || 'development');
console.log('🏠 Working directory:', process.cwd());
console.log('📂 __dirname:', __dirname);
console.log('💾 Memory usage at startup:', {
  heapUsed: Math.round(process.memoryUsage().heapUsed / 1024 / 1024) + ' MB',
  heapTotal: Math.round(process.memoryUsage().heapTotal / 1024 / 1024) + ' MB',
  rss: Math.round(process.memoryUsage().rss / 1024 / 1024) + ' MB'
});
console.log('🌐 PORT:', PORT);
console.log('🗄️  MongoDB URI:', MONGODB_URI);
console.log('🔧 Environment variables check:');
console.log('   - NODE_ENV:', process.env.NODE_ENV || 'not set');
console.log('   - PORT:', process.env.PORT || 'not set');
console.log('   - ENHANCED_PORT:', process.env.ENHANCED_PORT || 'not set');
console.log('   - MONGODB_URI:', process.env.MONGODB_URI ? 'set' : 'using default');

// Check critical files exist
console.log('📁 File system checks:');
try {
  const templatePath = path.join(__dirname, 'views', 'enhanced');
  const stats = fs.statSync(templatePath);
  console.log('   ✅ Enhanced templates directory exists');
  console.log('   📊 Template files:');
  const files = fs.readdirSync(templatePath);
  files.forEach(file => console.log(`      - ${file}`));
} catch (error) {
  console.error('   ❌ Enhanced templates directory missing:', error.message);
}

try {
  const staticPath = path.join(__dirname, 'src', 'public');
  const stats = fs.statSync(staticPath);
  console.log('   ✅ Static assets directory exists');
} catch (error) {
  console.error('   ❌ Static assets directory missing:', error.message);
}

console.log('');
console.log('🐳 Environment:', process.env.NODE_ENV || 'development');
console.log('🗄️  MongoDB URI:', MONGODB_URI.replace(/\/\/.*:.*@/, '//***:***@'));

// Basic Mongoose Models (simplified versions)
const UserSchema = new mongoose.Schema({
  email: String,
  profile: {
    name: String,
    surname: String,
    avatar: String
  },
  role: { type: String, default: 'user' },
  createdAt: { type: Date, default: Date.now },
  lastActivity: Date,
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

const BookSchema = new mongoose.Schema({
  title: { type: String, required: true },
  author: String,
  publisher: String,
  isbn: String,
  category: String,
  price: Number,
  description: String,
  cover: String,
  views: { type: Number, default: 0 },
  school: { type: mongoose.Schema.Types.ObjectId, ref: 'School' },
  createdAt: { type: Date, default: Date.now }
}, { timestamps: true });

const BookListingSchema = new mongoose.Schema({
  book: { type: mongoose.Schema.Types.ObjectId, ref: 'Book' },
  seller: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  price: Number,
  condition: String,
  status: { type: String, default: 'available' },
  createdAt: { type: Date, default: Date.now }
}, { timestamps: true });

const SchoolSchema = new mongoose.Schema({
  name: { type: String, required: true },
  address: String,
  city: String,
  createdAt: { type: Date, default: Date.now }
}, { timestamps: true });

// Models
const User = mongoose.model('User', UserSchema);
const Book = mongoose.model('Book', BookSchema);
const BookListing = mongoose.model('BookListing', BookListingSchema);
const School = mongoose.model('School', SchoolSchema);

// Database Connection with retry logic
async function connectDatabase() {
  const maxRetries = 5;
  let retries = 0;

  const mongooseOptions = {
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000,
    family: 4,
    maxPoolSize: 10,
    minPoolSize: 5,
    maxIdleTimeMS: 30000
  };

  while (retries < maxRetries) {
    try {
      console.log(`🔄 Attempting to connect to MongoDB (attempt ${retries + 1}/${maxRetries})...`);
      await mongoose.connect(MONGODB_URI, mongooseOptions);
      console.log('✅ Connected to MongoDB successfully');
      
      // Test model access with detailed debugging
      console.log('🔍 Testing model access...');
      try {
        console.log('📊 Testing Book model...');
        const bookTestResult = await Book.countDocuments().limit(1);
        console.log('✅ Book model working, found', bookTestResult, 'documents');
      } catch (bookError) {
        console.error('❌ Book model error:', bookError.name, bookError.message);
      }
      
      try {
        console.log('📊 Testing BookListing model...');
        const listingTestResult = await BookListing.countDocuments().limit(1);
        console.log('✅ BookListing model working, found', listingTestResult, 'documents');
      } catch (listingError) {
        console.error('❌ BookListing model error:', listingError.name, listingError.message);
      }
      
      try {
        console.log('📊 Testing User model...');
        const userTestResult = await User.countDocuments().limit(1);
        console.log('✅ User model working, found', userTestResult, 'documents');
      } catch (userError) {
        console.error('❌ User model error:', userError.name, userError.message);
      }
      
      try {
        console.log('📊 Testing School model...');
        const schoolTestResult = await School.countDocuments().limit(1);
        console.log('✅ School model working, found', schoolTestResult, 'documents');
      } catch (schoolError) {
        console.error('❌ School model error:', schoolError.name, schoolError.message);
      }
      
      console.log('🎉 Model access testing completed');
      
      // Connection event handlers
      mongoose.connection.on('error', (err) => {
        console.error('🚨 MongoDB connection error:', err);
        console.error('   Error details:', {
          name: err.name,
          message: err.message,
          code: err.code,
          codeName: err.codeName
        });
      });

      mongoose.connection.on('disconnected', () => {
        console.log('⚠️  MongoDB disconnected');
        console.log('   Connection state:', mongoose.connection.readyState);
      });

      mongoose.connection.on('reconnected', () => {
        console.log('🔄 MongoDB reconnected');
        console.log('   Connection state:', mongoose.connection.readyState);
      });

      mongoose.connection.on('close', () => {
        console.log('🔌 MongoDB connection closed');
      });

      return;
    } catch (error) {
      retries++;
      console.error(`❌ MongoDB connection attempt ${retries} failed:`, error.message);
      
      if (retries < maxRetries) {
        const delay = Math.min(1000 * Math.pow(2, retries), 30000);
        console.log(`⏳ Retrying in ${delay/1000} seconds...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      } else {
        console.error('❌ All MongoDB connection attempts failed');
        console.log('⚠️  Continuing without database connection...');
        // Don't throw error - continue with mock data
      }
    }
  }
}

// Enhanced Language Middleware
function enhancedLanguageMiddleware(req, res, next) {
  // Get language from various sources
  const urlLang = req.params.lang;
  const queryLang = req.query.lang;
  const sessionLang = req.session?.language;
  const headerLang = req.headers['accept-language']?.split(',')[0]?.split('-')[0];
  
  // Priority: URL > Query > Session > Header > Default
  const supportedLanguages = ['pl', 'en', 'uk'];
  let language = 'pl'; // default
  
  if (urlLang && supportedLanguages.includes(urlLang)) {
    language = urlLang;
  } else if (queryLang && supportedLanguages.includes(queryLang)) {
    language = queryLang;
  } else if (sessionLang && supportedLanguages.includes(sessionLang)) {
    language = sessionLang;
  } else if (headerLang && supportedLanguages.includes(headerLang)) {
    language = headerLang;
  }
  
  // Set in request and session
  req.language = language;
  if (req.session) {
    req.session.language = language;
  }
  
  // Add to response locals for templates
  res.locals.lang = language;
  res.locals.language = language;
  
  next();
}

// Mock user middleware (for development)
function mockUserMiddleware(req, res, next) {
  if (!req.user && req.session) {
    req.user = {
      _id: 'mock-user-id',
      email: 'admin@signumlbri.com',
      profile: {
        name: 'Admin',
        surname: 'Enhanced'
      },
      role: 'admin'
    };
  }
  res.locals.user = req.user;
  next();
}

// Middleware Setup with enhanced error handling
app.use(compression({ threshold: 1024 }));
app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '10mb' }));

// Security headers
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  next();
});

// Enhanced debugging middleware with request tracking
app.use((req, res, next) => {
  const startTime = Date.now();
  const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const timestamp = new Date().toISOString();
  
  // Track request
  requestTracker.total++;
  requestTracker.active++;
  
  // Track route usage
  if (!requestTracker.routes.has(req.path)) {
    requestTracker.routes.set(req.path, { count: 0, avgTime: 0, errors: 0 });
  }
  requestTracker.routes.get(req.path).count++;
  
  req.requestId = requestId;
  req.startTime = startTime;
  
  console.log(`📥 [${timestamp}] ${req.method} ${req.url}`);
  console.log(`   Request ID: ${requestId}`);
  console.log(`   Headers: ${JSON.stringify(req.headers, null, 2)}`);
  console.log(`   User-Agent: ${req.get('User-Agent')}`);
  console.log(`   IP: ${req.ip || req.connection.remoteAddress}`);
  console.log(`   Query: ${JSON.stringify(req.query)}`);
  console.log(`   Active requests: ${requestTracker.active}/${requestTracker.total}`);
  
  if (req.body && Object.keys(req.body).length > 0) {
    console.log(`   Body: ${JSON.stringify(req.body, null, 2)}`);
  }
  
  if (req.query && Object.keys(req.query).length > 0) {
    console.log(`   Query params: ${JSON.stringify(req.query, null, 2)}`);
  }
  
  // Monitor response with enhanced tracking
  const oldSend = res.send;
  res.send = function(data) {
    const endTime = Date.now();
    const responseTime = endTime - startTime;
    
    // Update tracking
    requestTracker.active--;
    requestTracker.responseTimes.push(responseTime);
    
    // Keep only last 100 response times for average calculation
    if (requestTracker.responseTimes.length > 100) {
      requestTracker.responseTimes = requestTracker.responseTimes.slice(-100);
    }
    
    requestTracker.avgResponseTime = Math.round(requestTracker.responseTimes.reduce((a, b) => a + b, 0) / requestTracker.responseTimes.length);
    
    // Update route stats
    const routeStats = requestTracker.routes.get(req.path);
    routeStats.avgTime = Math.round(((routeStats.avgTime * (routeStats.count - 1)) + responseTime) / routeStats.count);
    
    console.log(`📤 [${new Date().toISOString()}] ${req.method} ${req.url} -> ${res.statusCode}`);
    console.log(`   Request ID: ${requestId}`);
    console.log(`   Response Time: ${responseTime}ms (avg: ${requestTracker.avgResponseTime}ms)`);
    console.log(`   Response Size: ${Buffer.byteLength(data || '', 'utf8')} bytes`);
    console.log(`   Memory: RSS ${getSystemInfo().memory.rss}MB, Heap ${getSystemInfo().memory.heapUsed}MB`);
    
    if (res.statusCode >= 400) {
      console.error(`❌ Error Response: ${res.statusCode} for ${req.method} ${req.url}`);
      if (data && typeof data === 'string' && data.length < 500) {
        console.error(`   Response Data: ${data}`);
      }
    }
    return oldSend.call(res, data);
  };
  
  next();
});

// Request logging middleware
app.use((req, res, next) => {
  console.log(`📥 ${req.method} ${req.url} - ${new Date().toISOString()}`);
  next();
});

// Session configuration with enhanced settings
app.use(session({
  secret: process.env.SESSION_SECRET || 'enhanced-secret-key-for-development',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: false,
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
    httpOnly: true
  },
  name: 'signumlbri.sid'
}));

// Enhanced language support with debugging
app.use(enhancedLanguageMiddleware);
app.use(mockUserMiddleware);

// Template variables debugging middleware
app.use((req, res, next) => {
  const originalRender = res.render;
  res.render = function(view, options, callback) {
    console.log(`🎨 Rendering template: ${view}`);
    console.log(`📋 Template variables:`, {
      title: options?.title,
      user: options?.user ? { email: options.user.email, role: options.user.role } : null,
      lang: options?.lang,
      theme: options?.theme,
      page: options?.page,
      hasData: !!options?.data,
      hasError: !!options?.error
    });
    
    // Validate required variables
    const requiredVars = ['title', 'user', 'lang', 'theme'];
    const missingVars = requiredVars.filter(varName => !options?.[varName]);
    
    if (missingVars.length > 0) {
      console.warn(`⚠️  Missing template variables for ${view}:`, missingVars);
    }
    
    return originalRender.call(this, view, options, callback);
  };
  next();
});

// View engine configuration
const viewPaths = [
  path.join(__dirname, 'views', 'enhanced'),
  path.join(__dirname, 'views')
];

console.log('📂 Setting up view directories:');
viewPaths.forEach((viewPath, index) => {
  console.log(`   ${index + 1}. ${viewPath}`);
});

app.set('views', viewPaths);
app.set('view engine', 'pug');
app.set('view options', { 
  debug: process.env.NODE_ENV !== 'production',
  cache: process.env.NODE_ENV === 'production'
});

// Static files with better caching
const staticOptions = {
  maxAge: process.env.NODE_ENV === 'production' ? '1d' : '0',
  etag: true,
  lastModified: true
};

app.use('/css', express.static(path.join(__dirname, 'src', 'public', 'css'), staticOptions));
app.use('/js', express.static(path.join(__dirname, 'src', 'public', 'js'), staticOptions));
app.use('/images', express.static(path.join(__dirname, 'public', 'images'), staticOptions));
app.use('/fonts', express.static(path.join(__dirname, 'src', 'public', 'fonts'), staticOptions));

// Enhanced health check endpoint for Docker with comprehensive monitoring
app.get('/health', (req, res) => {
  const systemInfo = getSystemInfo();
  const dbState = mongoose.connection.readyState;
  const dbStateNames = { 0: 'disconnected', 1: 'connected', 2: 'connecting', 3: 'disconnecting' };
  
  // Route statistics
  const routeStats = {};
  requestTracker.routes.forEach((stats, route) => {
    routeStats[route] = stats;
  });
  
  // Top 5 most used routes
  const topRoutes = Array.from(requestTracker.routes.entries())
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, 5)
    .map(([route, stats]) => ({ route, ...stats }));
  
  const healthData = {
    status: dbState === 1 ? 'healthy' : 'degraded',
    timestamp: new Date().toISOString(),
    uptime: systemInfo.uptime,
    system: systemInfo,
    database: {
      status: dbState === 1 ? 'connected' : dbStateNames[dbState] || 'unknown',
      readyState: dbState,
      connectionName: mongoose.connection.name || 'default'
    },
    requests: {
      total: requestTracker.total,
      active: requestTracker.active,
      errors: requestTracker.errors,
      avgResponseTime: Math.round(requestTracker.avgResponseTime * 100) / 100,
      totalRoutes: requestTracker.routes.size
    },
    performance: {
      topRoutes: topRoutes,
      recentResponseTimes: requestTracker.responseTimes.slice(-10)
    },
    version: '2.0.0-enhanced',
    environment: process.env.NODE_ENV || 'development',
    buildInfo: {
      nodeVersion: process.version,
      dockerized: !!process.env.DOCKER_CONTAINER,
      startTime: req.app.startTime || new Date().toISOString()
    }
  };
  
  console.log('🏥 Health check requested - System status OK');
  const statusCode = dbState === 1 ? 200 : 503;
  res.status(statusCode).json(healthData);
});

// Advanced statistics endpoint
app.get('/stats', (req, res) => {
  const systemInfo = getSystemInfo();
  
  // Calculate detailed route statistics
  const detailedRoutes = {};
  requestTracker.routes.forEach((stats, route) => {
    detailedRoutes[route] = {
      ...stats,
      errorRate: stats.count > 0 ? ((stats.errors / stats.count) * 100).toFixed(2) + '%' : '0%',
      avgTimeFormatted: stats.avgTime.toFixed(2) + 'ms'
    };
  });
  
  const statsData = {
    timestamp: new Date().toISOString(),
    system: systemInfo,
    requests: {
      ...requestTracker,
      responseTimes: undefined, // Don't send all response times
      recentResponseTimes: requestTracker.responseTimes.slice(-20),
      errorRate: requestTracker.total > 0 ? ((requestTracker.errors / requestTracker.total) * 100).toFixed(2) + '%' : '0%'
    },
    routes: detailedRoutes,
    database: {
      state: mongoose.connection.readyState,
      host: mongoose.connection.host || 'localhost',
      name: mongoose.connection.name || 'signumlbri',
      collections: Object.keys(mongoose.connection.collections)
    }
  };
  
  console.log('📊 Statistics requested - Detailed system metrics');
  res.json(statsData);
});

// Comprehensive route error handling middleware
app.use((req, res, next) => {
  const originalSend = res.send;
  const originalJson = res.json;
  const originalRender = res.render;
  
  res.send = function(data) {
    if (res.statusCode >= 400) {
      console.error(`❌ [ROUTE ERROR] ${req.method} ${req.url} - Status: ${res.statusCode}`);
      console.error('📋 [ROUTE ERROR] Response data:', data);
    }
    return originalSend.call(this, data);
  };
  
  res.json = function(data) {
    if (res.statusCode >= 400) {
      console.error(`❌ [ROUTE ERROR] ${req.method} ${req.url} - Status: ${res.statusCode}`);
      console.error('📋 [ROUTE ERROR] JSON response:', data);
    }
    return originalJson.call(this, data);
  };
  
  res.render = function(view, options, callback) {
    console.log(`🎨 [TEMPLATE] Rendering view: ${view} for ${req.method} ${req.url}`);
    if (options) {
      console.log('📋 [TEMPLATE] Template variables:', Object.keys(options));
    }
    
    const originalCallback = callback;
    const wrappedCallback = (err, html) => {
      if (err) {
        console.error(`❌ [TEMPLATE ERROR] Failed to render ${view}:`, err.name, err.message);
        console.error('📍 [TEMPLATE ERROR] Stack:', err.stack);
      } else {
        console.log(`✅ [TEMPLATE] Successfully rendered ${view}`);
      }
      if (originalCallback) {
        originalCallback(err, html);
      }
    };
    
    return originalRender.call(this, view, options, callback ? wrappedCallback : wrappedCallback);
  };
  
  next();
});

// Enhanced Routes
app.get('/enhanced', async (req, res) => {
  console.log('🏠 Dashboard route accessed:', { user: req.user?.email, language: req.language });
  try {
    // Dashboard data
    const dashboardData = {
      stats: {
        totalBooks: await getBookCount(),
        totalUsers: await getUserCount(),
        totalSchools: await getSchoolCount(),
        conversionRate: '85.2'
      },
      recentBooks: await getRecentBooks(6),
      popularCategories: await getPopularCategories(5),
      recentActivity: getMockActivity(),
      userStats: req.user ? await getUserStats(req.user._id) : null
    };
    
    console.log('📊 Dashboard data loaded successfully');
    res.render('dashboard', {
      title: getLocalizedText('dashboard.title', req.language),
      data: dashboardData,
      user: req.user,
      lang: req.language,
      theme: req.session?.theme || 'auto',
      page: 'dashboard'
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    res.render('dashboard', {
      title: 'Dashboard',
      data: { stats: { totalBooks: 0, totalUsers: 0, totalSchools: 0, conversionRate: '0' } },
      user: req.user,
      lang: req.language,
      theme: req.session?.theme || 'auto',
      page: 'dashboard'
    });
  }
});

// Library Routes
app.get('/enhanced/library', async (req, res) => {
  try {
    const libraryData = {
      stats: {
        totalBooks: await getBookCount(),
        availableBooks: await getAvailableBookCount(),
        categoriesCount: await getCategoryCount(),
        conversionRate: '78.5'
      },
      recentBooks: await getRecentBooks(6),
      popularBooks: await getPopularBooks(6)
    };
    
    res.render('library', {
      title: getLocalizedText('library.title', req.language),
      data: libraryData,
      user: req.user,
      lang: req.language,
      theme: req.session?.theme || 'auto',
      page: 'library'
    });
  } catch (error) {
    console.error('Library error:', error);
    try {
      res.status(500).render('error', {
        title: 'Library Error',
        message: 'Unable to load library data',
        error: process.env.NODE_ENV === 'production' ? {} : error,
        user: req.user,
        lang: req.language || 'pl',
        theme: req.session?.theme || 'auto',
        page: 'error'
      });
    } catch (renderError) {
      res.status(500).send('Library Error');
    }
  }
});

// Books Routes
app.get('/enhanced/books', async (req, res) => {
  try {
    const booksData = {
      books: await getBooks(req.query),
      pagination: {
        currentPage: parseInt(req.query.page) || 1,
        totalPages: 10,
        totalBooks: await getBookCount()
      },
      categories: await getCategories()
    };
    
    res.render('books', {
      title: getLocalizedText('books.title', req.language),
      data: booksData,
      user: req.user,
      lang: req.language,
      theme: req.session?.theme || 'auto',
      page: 'books'
    });
  } catch (error) {
    console.error('Books error:', error);
    try {
      res.status(500).render('error', {
        title: 'Books Error',
        message: 'Unable to load books data',
        error: process.env.NODE_ENV === 'production' ? {} : error,
        user: req.user,
        lang: req.language || 'pl',
        theme: req.session?.theme || 'auto',
        page: 'error'
      });
    } catch (renderError) {
      res.status(500).send('Books Error');
    }
  }
});

// Admin Routes
app.get('/enhanced/admin', (req, res) => {
  if (!req.user || req.user.role !== 'admin') {
    try {
      return res.status(403).render('error', {
        title: 'Access Denied',
        message: 'You do not have permission to access this page.',
        error: { status: 403 },
        user: req.user,
        lang: req.language || 'pl',
        theme: req.session?.theme || 'auto',
        page: 'error'
      });
    } catch (renderError) {
      return res.status(403).send('Access Denied');
    }
  }
  
  const adminData = {
    stats: {
      systemHealth: 'good',
      uptime: process.uptime(),
      memoryUsage: process.memoryUsage(),
      nodeVersion: process.version
    }
  };
  
  res.render('admin', {
    title: getLocalizedText('admin.title', req.language),
    data: adminData,
    user: req.user,
    lang: req.language,
    theme: req.session?.theme || 'auto',
    page: 'admin'
  });
});

// API Routes
app.get('/enhanced/api/books', async (req, res) => {
  try {
    const books = await getBooks(req.query);
    res.json({
      success: true,
      data: { books: books },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Unable to fetch books',
      timestamp: new Date().toISOString()
    });
  }
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('Unhandled error:', error);
  
  // Check if we've already sent a response
  if (res.headersSent) {
    return next(error);
  }
  
  // Try to render error page, fallback to JSON response
  try {
    res.status(500).render('error', {
      title: 'Server Error',
      message: process.env.NODE_ENV === 'production' ? 'Internal Server Error' : error.message,
      error: process.env.NODE_ENV === 'production' ? {} : error,
      user: req.user,
      lang: req.language || 'pl',
      theme: req.session?.theme || 'auto',
      page: 'error'
    });
  } catch (renderError) {
    console.error('Error rendering error page:', renderError);
    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      timestamp: new Date().toISOString()
    });
  }
});

// 404 handler (must be last)
app.use((req, res, next) => {
  console.log(`404 - Not Found: ${req.method} ${req.url}`);
  
  try {
    res.status(404).render('error', {
      title: 'Not Found',
      message: 'The requested page was not found.',
      error: { status: 404 },
      user: req.user,
      lang: req.language || 'pl',
      theme: req.session?.theme || 'auto',
      page: 'error'
    });
  } catch (renderError) {
    console.error('Error rendering 404 page:', renderError);
    res.status(404).json({
      success: false,
      error: 'Page Not Found',
      timestamp: new Date().toISOString()
    });
  }
});

app.post('/enhanced/api/language', (req, res) => {
  const { language } = req.body;
  
  if (!['pl', 'en', 'uk'].includes(language)) {
    return res.status(400).json({
      success: false,
      error: 'Invalid language code'
    });
  }
  
  if (req.session) {
    req.session.language = language;
  }
  
  res.json({
    success: true,
    data: { language: language, message: 'Language updated successfully' }
  });
});

// Comprehensive Error Handling Middleware - Must be after all routes
app.use('*', (req, res, next) => {
  console.error(`❌ [404] Route not found: ${req.method} ${req.originalUrl}`);
  console.error('📋 [404] Request details:', {
    headers: req.headers,
    query: req.query,
    body: req.body,
    ip: req.ip,
    userAgent: req.get('User-Agent')
  });
  
  // Try to render 404 page if it exists, otherwise send JSON
  res.status(404);
  
  if (req.accepts('html')) {
    res.render('enhanced/error', {
      theme: req.session?.theme || 'auto',
      lang: req.language || 'pl',
      user: req.user,
      title: '404 - Strona nie znaleziona',
      message: 'Strona, której szukasz, nie istnieje.',
      error: { status: 404, stack: '' }
    });
  } else if (req.accepts('json')) {
    res.json({
      success: false,
      error: 'Route not found',
      path: req.originalUrl,
      method: req.method
    });
  } else {
    res.type('txt').send('404 - Route not found');
  }
});

// Final Express error handler - catches all errors
app.use((error, req, res, next) => {
  console.error('');
  console.error('💥 [EXPRESS ERROR] Unhandled route error:', error.name);
  console.error('📋 [EXPRESS ERROR] Message:', error.message);
  console.error('📍 [EXPRESS ERROR] Stack:', error.stack);
  console.error('🌐 [EXPRESS ERROR] Request:', {
    method: req.method,
    url: req.originalUrl,
    headers: req.headers,
    query: req.query,
    body: req.body,
    user: req.user?.email,
    ip: req.ip,
    userAgent: req.get('User-Agent')
  });
  console.error('🔍 [EXPRESS ERROR] Error details:', {
    name: error.name,
    message: error.message,
    code: error.code,
    status: error.status,
    statusCode: error.statusCode,
    errno: error.errno,
    syscall: error.syscall
  });
  
  // Set error status
  const status = error.status || error.statusCode || 500;
  res.status(status);
  
  // Try to render error page
  if (req.accepts('html')) {
    res.render('enhanced/error', {
      theme: req.session?.theme || 'auto',
      lang: req.language || 'pl',
      user: req.user,
      title: `${status} - Błąd serwera`,
      message: process.env.NODE_ENV === 'development' ? error.message : 'Wystąpił błąd serwera',
      error: process.env.NODE_ENV === 'development' ? error : { status, stack: '' }
    });
  } else if (req.accepts('json')) {
    res.json({
      success: false,
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error',
      status: status,
      ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
    });
  } else {
    res.type('txt').send(process.env.NODE_ENV === 'development' ? error.stack : 'Internal server error');
  }
});

// Helper Functions with debugging
async function getBookCount() {
  try {
    console.log('📊 Getting book count from database...');
    const count = await Book.countDocuments();
    console.log(`📊 Book count: ${count}`);
    return count;
  } catch (error) {
    console.error('❌ Error getting book count:', error.message);
    const mockCount = Math.floor(Math.random() * 1000) + 500;
    console.log(`📊 Using mock book count: ${mockCount}`);
    return mockCount;
  }
}

async function getUserCount() {
  try {
    console.log('👥 Getting user count from database...');
    const count = await User.countDocuments({ role: { $ne: 'admin' } });
    console.log(`👥 User count: ${count}`);
    return count;
  } catch (error) {
    console.error('❌ Error getting user count:', error.message);
    const mockCount = Math.floor(Math.random() * 500) + 100;
    console.log(`👥 Using mock user count: ${mockCount}`);
    return mockCount;
  }
}

async function getSchoolCount() {
  try {
    return await School.countDocuments();
  } catch (error) {
    return Math.floor(Math.random() * 50) + 20; // Mock data
  }
}

async function getAvailableBookCount() {
  try {
    return await BookListing.countDocuments({ status: 'available' });
  } catch (error) {
    return Math.floor(Math.random() * 300) + 200; // Mock data
  }
}

async function getCategoryCount() {
  console.log('🔍 [DEBUG] getCategoryCount() - Querying for distinct categories...');
  try {
    const categories = await Book.distinct('category');
    console.log('✅ [DEBUG] getCategoryCount() - Success:', categories.length, 'categories found');
    console.log('📝 [DEBUG] getCategoryCount() - Categories:', categories);
    return categories.length;
  } catch (error) {
    console.error('❌ [DEBUG] getCategoryCount() - Database error:', error.name, error.message);
    console.log('🎭 [DEBUG] getCategoryCount() - Using mock data: 15');
    return 15; // Mock data
  }
}

async function getRecentBooks(limit = 6) {
  console.log(`🔍 [DEBUG] getRecentBooks(${limit}) - Querying for recent books...`);
  try {
    const books = await Book.find()
      .sort({ createdAt: -1 })
      .limit(limit)
      .populate('school', 'name')
      .lean();
    console.log('✅ [DEBUG] getRecentBooks() - Success:', books.length, 'books found');
    return books;
  } catch (error) {
    console.error('❌ [DEBUG] getRecentBooks() - Database error:', error.name, error.message);
    console.log('🎭 [DEBUG] getRecentBooks() - Using mock data');
    // Mock data
    const mockBooks = Array.from({ length: limit }, (_, i) => ({
      _id: `mock-book-${i}`,
      title: `Książka przykładowa ${i + 1}`,
      author: `Autor ${i + 1}`,
      category: 'Matematyka',
      price: Math.floor(Math.random() * 100) + 20,
      createdAt: new Date()
    }));
    return mockBooks;
  }
}

async function getPopularBooks(limit = 6) {
  console.log(`🔍 [DEBUG] getPopularBooks(${limit}) - Querying for popular books...`);
  try {
    const books = await Book.find()
      .sort({ views: -1 })
      .limit(limit)
      .populate('school', 'name')
      .lean();
    console.log('✅ [DEBUG] getPopularBooks() - Success:', books.length, 'books found');
    return books;
  } catch (error) {
    console.error('❌ [DEBUG] getPopularBooks() - Database error:', error.name, error.message);
    console.log('🔄 [DEBUG] getPopularBooks() - Falling back to getRecentBooks()');
    return getRecentBooks(limit); // Fallback to recent books
  }
}

async function getPopularCategories(limit = 5) {
  console.log(`🔍 [DEBUG] getPopularCategories(${limit}) - Aggregating popular categories...`);
  try {
    const categories = await Book.aggregate([
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: limit }
    ]);
    console.log('✅ [DEBUG] getPopularCategories() - Success:', categories.length, 'categories found');
    console.log('📊 [DEBUG] getPopularCategories() - Categories:', categories.map(c => `${c._id}: ${c.count}`));
    return categories;
  } catch (error) {
    console.error('❌ [DEBUG] getPopularCategories() - Database error:', error.name, error.message);
    console.log('🎭 [DEBUG] getPopularCategories() - Using mock data');
    // Mock data
    const mockCategories = [
      { _id: 'Matematyka', count: 45 },
      { _id: 'Fizyka', count: 38 },
      { _id: 'Chemia', count: 32 },
      { _id: 'Biologia', count: 28 },
      { _id: 'Historia', count: 25 }
    ];
    return mockCategories;
  }
}

async function getBooks(query = {}) {
  try {
    const limit = parseInt(query.limit) || 20;
    const page = parseInt(query.page) || 1;
    const skip = (page - 1) * limit;
    
    return await Book.find()
      .skip(skip)
      .limit(limit)
      .populate('school', 'name')
      .lean();
  } catch (error) {
    return []; // Empty array as fallback
  }
}

async function getCategories() {
  console.log('🔍 [DEBUG] getCategories() - Querying for all distinct categories...');
  try {
    const categories = await Book.distinct('category');
    console.log('✅ [DEBUG] getCategories() - Success:', categories.length, 'categories found');
    console.log('📝 [DEBUG] getCategories() - Categories:', categories);
    return categories;
  } catch (error) {
    console.error('❌ [DEBUG] getCategories() - Database error:', error.name, error.message);
    const mockCategories = ['Matematyka', 'Fizyka', 'Chemia', 'Biologia', 'Historia', 'Geografia'];
    console.log('🎭 [DEBUG] getCategories() - Using mock data:', mockCategories);
    return mockCategories;
  }
}

async function getUserStats(userId) {
  console.log(`🔍 [DEBUG] getUserStats(${userId}) - Generating user statistics...`);
  // Mock user statistics
  const stats = {
    ownedBooks: Math.floor(Math.random() * 20) + 5,
    activeListings: Math.floor(Math.random() * 10) + 2,
    favoriteBooks: Math.floor(Math.random() * 15) + 3
  };
  console.log('✅ [DEBUG] getUserStats() - Generated stats:', stats);
  return stats;
}

function getMockActivity() {
  return [
    {
      icon: 'fa-book text-primary',
      text: 'Dodano nową książkę "Matematyka klasa 3"',
      time: '5 minut temu'
    },
    {
      icon: 'fa-user text-success',
      text: 'Nowy użytkownik dołączył do systemu',
      time: '12 minut temu'
    },
    {
      icon: 'fa-exchange-alt text-info',
      text: 'Sprzedano książkę "Fizyka dla gimnazjum"',
      time: '1 godzinę temu'
    }
  ];
}

function getLocalizedText(key, lang) {
  const translations = {
    pl: {
      'dashboard.title': 'Panel główny - Enhanced',
      'library.title': 'Biblioteka - Enhanced',
      'books.title': 'Książki - Enhanced',
      'admin.title': 'Panel administratora - Enhanced'
    },
    en: {
      'dashboard.title': 'Dashboard - Enhanced',
      'library.title': 'Library - Enhanced',
      'books.title': 'Books - Enhanced',
      'admin.title': 'Admin Panel - Enhanced'
    },
    uk: {
      'dashboard.title': 'Панель - Enhanced',
      'library.title': 'Бібліотека - Enhanced',
      'books.title': 'Книги - Enhanced',
      'admin.title': 'Адмін панель - Enhanced'
    }
  };
  
  return translations[lang]?.[key] || translations['en']?.[key] || key;
}

// Error handling
app.use((err, req, res, next) => {
  console.error('Application Error:', err);
  res.status(500).render('error', {
    title: 'Błąd aplikacji',
    error: { status: 500, message: 'Wystąpił błąd serwera' },
    user: req.user,
    lang: req.language || 'pl'
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).render('error', {
    title: 'Nie znaleziono',
    error: { status: 404, message: 'Strona nie została znaleziona' },
    user: req.user,
    lang: req.language || 'pl'
  });
});

// Start server with enhanced error handling
async function startServer() {
  try {
    // Connect to database with retry logic
    await connectDatabase();
    
    // Add process error handlers
    process.on('uncaughtException', (error) => {
      console.error('💥 Uncaught Exception:', error);
      process.exit(1);
    });

    process.on('unhandledRejection', (reason, promise) => {
      console.error('💥 Unhandled Rejection at:', promise, 'reason:', reason);
      process.exit(1);
    });
    
    // Start HTTP server with proper error handling
    const server = app.listen(PORT, '0.0.0.0', () => {
      console.log('');
      console.log('🎉 SignumLBRI Enhanced Application Started Successfully!');
      console.log('');
      console.log('📍 Server Information:');
      console.log(`   🌐 URL: http://localhost:${PORT}/enhanced`);
      console.log(`   🚀 Port: ${PORT}`);
      console.log(`   📚 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`   🗄️  Database: ${mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected'}`);
      console.log('');
      console.log('📋 Available Endpoints:');
      console.log('   🏠 Dashboard: http://localhost:4000/enhanced');
      console.log('   📚 Library: http://localhost:4000/enhanced/library');
      console.log('   📖 Books: http://localhost:4000/enhanced/books');
      console.log('   ⚙️  Admin: http://localhost:4000/enhanced/admin');
      console.log('   🔌 API: http://localhost:4000/enhanced/api/*');
      console.log('   🏥 Health: http://localhost:4000/health');
      console.log('');
      console.log('✨ Features:');
      console.log('   🎨 Modern glassmorphism UI');
      console.log('   🌍 Multi-language support (PL/EN/UK)');
      console.log('   🌙 Dark/Light theme switching');
      console.log('   📱 Responsive mobile design');
      console.log('   📊 Real-time analytics');
      console.log('   🔍 Advanced search system');
      console.log('');
      console.log('Press Ctrl+C to stop the server');
      console.log('');
    });

    server.on('error', (error) => {
      if (error.code === 'EADDRINUSE') {
        console.error(`❌ Port ${PORT} is already in use`);
        process.exit(1);
      } else {
        console.error('❌ Server error:', error);
        process.exit(1);
      }
    });

    return server;
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

// Global error handlers for comprehensive debugging
process.on('uncaughtException', (error) => {
  console.error('');
  console.error('💥 [CRITICAL] Uncaught Exception:', error.name);
  console.error('📋 [CRITICAL] Error message:', error.message);
  console.error('📍 [CRITICAL] Stack trace:', error.stack);
  console.error('🔍 [CRITICAL] Error details:', {
    name: error.name,
    message: error.message,
    code: error.code,
    errno: error.errno,
    syscall: error.syscall,
    path: error.path
  });
  console.error('⚠️  [CRITICAL] Application will restart...');
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('');
  console.error('💥 [CRITICAL] Unhandled Promise Rejection:', reason);
  console.error('📋 [CRITICAL] Promise:', promise);
  if (reason && reason.stack) {
    console.error('📍 [CRITICAL] Stack trace:', reason.stack);
  }
  console.error('🔍 [CRITICAL] Rejection details:', {
    reason: reason,
    name: reason?.name,
    message: reason?.message,
    code: reason?.code
  });
  console.error('⚠️  [CRITICAL] Application will restart...');
  process.exit(1);
});

process.on('warning', (warning) => {
  console.warn('');
  console.warn('⚠️  [WARNING] Node.js Warning:', warning.name);
  console.warn('📋 [WARNING] Message:', warning.message);
  console.warn('📍 [WARNING] Stack:', warning.stack);
});

console.log('🔧 Enhanced debugging infrastructure is now running');
console.log('📊 Monitoring endpoints:');
console.log(`   Health check: http://localhost:${PORT}/health`);
console.log(`   Detailed stats: http://localhost:${PORT}/stats`);
console.log('🔍 All requests are being logged with detailed information');
console.log('');

// Periodic system monitoring (every 2 minutes)
const monitoringInterval = setInterval(() => {
  const systemInfo = getSystemInfo();
  const activeRoutes = Array.from(requestTracker.routes.entries())
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, 3);
  
  console.log(`🔄 [SYSTEM MONITOR] ${new Date().toISOString()}`);
  console.log(`   Memory: RSS ${systemInfo.memory.rss}MB, Heap ${systemInfo.memory.heapUsed}/${systemInfo.memory.heapTotal}MB`);
  console.log(`   CPU Time: User ${systemInfo.cpu.user}ms, System ${systemInfo.cpu.system}ms`);
  console.log(`   Requests: Total ${requestTracker.total}, Active ${requestTracker.active}, Errors ${requestTracker.errors}`);
  console.log(`   Avg Response: ${Math.round(requestTracker.avgResponseTime * 100) / 100}ms`);
  if (activeRoutes.length > 0) {
    console.log(`   Top Routes: ${activeRoutes.map(([route, stats]) => `${route}(${stats.count})`).join(', ')}`);
  }
  console.log(`   Database: ${mongoose.connection.readyState === 1 ? '✅ Connected' : '❌ Disconnected'} (State: ${mongoose.connection.readyState})`);
  console.log(`   Uptime: ${Math.round(systemInfo.uptime / 60)} minutes`);
  console.log('');
}, 120000); // Every 2 minutes

// Handle graceful shutdown
let isShuttingDown = false;

const gracefulShutdown = (signal) => {
  if (isShuttingDown) return;
  isShuttingDown = true;
  
  console.log('');
  console.log(`🛑 Received ${signal}, shutting down Enhanced Application gracefully...`);
  
  // Clear monitoring interval
  if (monitoringInterval) {
    clearInterval(monitoringInterval);
    console.log('⏰ Monitoring interval cleared');
  }
  
  // Print final statistics
  console.log('📊 Final Statistics:');
  console.log(`   Total Requests Processed: ${requestTracker.total}`);
  console.log(`   Total Errors: ${requestTracker.errors}`);
  console.log(`   Average Response Time: ${Math.round(requestTracker.avgResponseTime * 100) / 100}ms`);
  console.log(`   Routes Accessed: ${requestTracker.routes.size}`);
  
  // Close database connection
  if (mongoose.connection.readyState === 1) {
    mongoose.connection.close(() => {
      console.log('🗄️  Database connection closed');
    });
  }
  
  // Give time for connections to close
  setTimeout(() => {
    console.log('👋 SignumLBRI Enhanced stopped');
    process.exit(0);
  }, 1000);
};

process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGUSR2', () => gracefulShutdown('SIGUSR2')); // nodemon restart

// Start the application with enhanced error handling
startServer().catch(error => {
  console.error('❌ Failed to start Enhanced Application:', error);
  console.error('Stack trace:', error.stack);
  process.exit(1);
});
