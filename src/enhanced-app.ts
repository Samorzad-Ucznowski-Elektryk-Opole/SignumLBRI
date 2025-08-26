/**
 * 🎨 Enhanced Standalon// Enhanced Controllers
import * as enhancedHomeController from './controllers/enhanced/home';
import * as enhancedBookController from './controllers/enhanced/book';
import * as enhancedUserController from './controllers/enhanced/user';
import * as enhancedAnalyticsController from './controllers/enhanced/analytics';
import * as enhancedAdminController from './controllers/enhanced/admin';
import * as enhancedLanguageController from './controllers/enhanced/language';
import * as enhancedApiController from './controllers/enhanced/api';
import * as enhancedLibraryController from './controllers/enhanced/library';umLBRI - Next Generation Educational Platform
 * 
 * Features:
 * - Modern glass morphism UI with advanced animations
 * - Comprehensive book management system
 * - Interactive analytics dashboard
 * - Multi-language support with real-time switching
 * - Advanced filtering and search capabilities
 * - Progressive Web App (PWA) features
 * - Dark/Light theme support
 * - Real-time notifications
 * - Enhanced user experience with micro-interactions
 */

import express, { Request, Response, NextFunction } from "express";
import path from "path";
import compression from "compression";
import session from "express-session";
import bodyParser from "body-parser";
import MongoStore from "connect-mongo";
import flash from "express-flash";
import mongoose from "mongoose";
import passport from "passport";
import { MONGODB_URI, SESSION_SECRET } from "./util/secrets";
import MobileDetect from "mobile-detect";
import { createServer } from "http";

// Enhanced Controllers for Standalone App
import * as enhancedHomeController from "./controllers/enhanced/home";
import * as enhancedBookController from "./controllers/enhanced/book";
import * as enhancedUserController from "./controllers/enhanced/user";
import * as enhancedAnalyticsController from "./controllers/enhanced/analytics";
import * as enhancedApiController from "./controllers/enhanced/api";
import * as enhancedLibraryController from "./controllers/enhanced/library";
import * as enhancedAdminController from "./controllers/enhanced/admin";

// Configuration and middleware
import * as passportConfig from "./config/passport";
import { enhancedLanguageMiddleware, enhancedChangeLanguage } from "./controllers/enhanced/language";

// Create Enhanced Express Application
const app = express();
const server = createServer(app);

console.log("🚀 Starting Enhanced SignumLBRI Standalone Application");

// MongoDB Connection with Enhanced Configuration
mongoose.set('strictQuery', false);
mongoose
  .connect(MONGODB_URI, {
    maxPoolSize: 25,
    minPoolSize: 5,
    maxIdleTimeMS: 30000,
    serverSelectionTimeoutMS: 5000,
    retryWrites: true
  })
  .then(() => {
    console.log("✅ Enhanced MongoDB connected successfully!");
    console.log("📚 Database ready for enhanced features");
  })
  .catch((err: any) => {
    console.error("❌ MongoDB connection error:", err.message);
    if (process.env.NODE_ENV === 'production') {
      process.exit(1);
    }
  });

// Enhanced Express Configuration
app.set("port", process.env.ENHANCED_PORT || 4000);
app.set("views", path.join(__dirname, "../views/enhanced"));
app.set("view engine", "pug");
app.set('trust proxy', true);

// Enhanced Performance Middleware
app.use(compression({ 
  level: 9, // Maximum compression for standalone app
  threshold: 512, // Compress smaller files too
  filter: (req, res) => {
    if (req.headers['x-no-compression']) return false;
    return compression.filter(req, res);
  }
}));

// Enhanced Body Parsing
app.use(bodyParser.json({ 
  limit: '100mb', // Increased for better file handling
  verify: (req: any, res, buf) => {
    req.rawBody = buf;
  }
}));

app.use(bodyParser.urlencoded({ 
  extended: true, 
  limit: '100mb',
  parameterLimit: 50000 // Increased for complex forms
}));

// Enhanced Session Management
app.use(
  session({
    resave: false,
    saveUninitialized: false,
    secret: SESSION_SECRET + "_enhanced",
    store: new MongoStore({
      mongoUrl: MONGODB_URI,
      touchAfter: 24 * 3600 // Lazy session update
    }),
    cookie: {
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days for standalone app
      secure: false, // Set to true in production with HTTPS
      httpOnly: true,
      sameSite: 'lax' // Better for standalone app
    }
  })
);

// Enhanced Security & Authentication
app.use(passport.initialize());
app.use(passport.session());
app.use(flash());

// Enhanced Request Context Middleware
app.use((req: Request, res: Response, next: NextFunction) => {
  res.locals.user = req.user;
  res.locals.device = new MobileDetect(req.headers["user-agent"]);
  res.locals.isEnhanced = true;
  res.locals.version = "2.0.0-enhanced";
  res.locals.buildDate = new Date().toISOString();
  res.locals.theme = req.session?.theme || 'auto';
  res.locals.language = req.session?.language || 'pl';
  next();
});

// Enhanced Flash Messages
app.use((req: any, res: Response, next: NextFunction) => {
  req.flashError = (err: any, msg: string | string[], redirect = true) => {
    if (err) console.error("⚠️ Enhanced Error:", err);
    
    if (Array.isArray(msg)) {
      req.flash("errors", msg);
    } else {
      req.flash("errors", { msg });
    }
    
    if (redirect) res.redirect("/enhanced");
  };
  
  req.flashSuccess = (msg: string) => {
    req.flash("success", { msg });
  };
  
  req.flashInfo = (msg: string) => {
    req.flash("info", { msg });
  };
  
  next();
});

// Enhanced Language Middleware
app.use(enhancedLanguageMiddleware);

// Enhanced Static Files with Advanced Caching
app.use('/enhanced', express.static(path.join(__dirname, "public/enhanced"), { 
  maxAge: '1d',
  etag: true,
  lastModified: true
}));

app.use('/assets', express.static(path.join(__dirname, "public"), { 
  maxAge: '7d',
  immutable: true
}));

// Enhanced Application Routes
console.log("🔗 Setting up enhanced routes...");

// === ENHANCED HOME ROUTES ===
app.get('/enhanced', enhancedHomeController.getDashboard);
app.get('/enhanced/welcome', enhancedHomeController.getWelcome);
app.get('/enhanced/features', enhancedHomeController.getFeatures);

// === ENHANCED BOOK MANAGEMENT ROUTES ===
app.get('/enhanced/books', enhancedBookController.getAllBooks);
app.get('/enhanced/books/add', enhancedBookController.getAddBook);
app.post('/enhanced/books/add', enhancedBookController.postAddBook);
app.get('/enhanced/books/:id', enhancedBookController.getBookDetails);
app.get('/enhanced/books/:id/edit', enhancedBookController.getEditBook);
app.post('/enhanced/books/:id/edit', enhancedBookController.postEditBook);
app.delete('/enhanced/books/:id', enhancedBookController.deleteBook);

// === ENHANCED LIBRARY ROUTES ===
app.get('/enhanced/library', enhancedLibraryController.getLibrary);
app.get('/enhanced/library/search', enhancedLibraryController.searchBooks);
app.get('/enhanced/library/categories', enhancedLibraryController.getCategories);
app.get('/enhanced/library/featured', enhancedLibraryController.getFeaturedBooks);

// === ENHANCED USER MANAGEMENT ROUTES ===
app.get('/enhanced/users', enhancedUserController.getAllUsers);
app.get('/enhanced/users/:id', enhancedUserController.getUserProfile);
app.get('/enhanced/profile', enhancedUserController.getMyProfile);
app.post('/enhanced/profile', enhancedUserController.updateProfile);

// === ENHANCED ANALYTICS ROUTES ===
app.get('/enhanced/analytics', enhancedAnalyticsController.getDashboard);
app.get('/enhanced/analytics/books', enhancedAnalyticsController.getBookAnalytics);
app.get('/enhanced/analytics/users', enhancedAnalyticsController.getUserAnalytics);
app.get('/enhanced/analytics/performance', enhancedAnalyticsController.getPerformanceMetrics);

// === ENHANCED ADMIN ROUTES ===
app.get('/enhanced/admin', enhancedAdminController.getDashboard);
app.get('/enhanced/admin/settings', enhancedAdminController.getSettings);
app.post('/enhanced/admin/settings', enhancedAdminController.updateSettings);
app.get('/enhanced/admin/users', enhancedAdminController.getUserManagement);
app.get('/enhanced/admin/system', enhancedAdminController.getSystemInfo);

// === ENHANCED API ROUTES ===
app.get('/enhanced/api/books', enhancedApiController.getBooks);
app.get('/enhanced/api/users', enhancedApiController.getUsers);
app.get('/enhanced/api/analytics', enhancedApiController.getAnalyticsData);
app.get('/enhanced/api/search', enhancedApiController.searchContent);
app.post('/enhanced/api/theme', enhancedApiController.updateTheme);
app.post('/enhanced/api/language', enhancedApiController.updateLanguage);

// === UTILITY ROUTES ===
app.post('/enhanced/language', enhancedChangeLanguage);
app.get('/enhanced/health', (req: Request, res: Response) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: '2.0.0-enhanced',
    features: 'all-systems-operational',
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
  });
});

// Enhanced Error Handling
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error("🚨 Enhanced App Error:", err);
  
  if (req.xhr || req.headers.accept?.includes('application/json')) {
    res.status(500).json({
      error: 'Internal Server Error',
      message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
    });
  } else {
    res.status(500).render('error', {
      title: 'Error',
      error: process.env.NODE_ENV === 'development' ? err : {},
      message: 'Something went wrong in the enhanced application'
    });
  }
});

// 404 Handler
app.use((req: Request, res: Response) => {
  console.log(`🔍 Enhanced 404: ${req.originalUrl}`);
  res.status(404).render('404', {
    title: 'Page Not Found',
    url: req.originalUrl
  });
});

export default app;

// Start Enhanced Server
if (require.main === module) {
  const port = app.get("port");
  
  server.listen(port, () => {
    console.log(`🌟 Enhanced SignumLBRI is running on port ${port}`);
    console.log(`🔗 Access the enhanced application at: http://localhost:${port}/enhanced`);
    console.log("✨ Features: Modern UI, Advanced Analytics, Enhanced UX");
  });
}
