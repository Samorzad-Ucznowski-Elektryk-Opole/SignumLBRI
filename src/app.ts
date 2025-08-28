/**
 * SignumLBRI - Main Application Configuration (Minimal Setup)
 */

// For now, we'll use a minimal setup that can compile
// Full setup will be done after npm install through Docker

const express = require('express');
const path = require('path');

const app = express();

// Basic middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, '../public')));

// Flash messages middleware
app.use((req: any, res: any, next: any) => {
  res.locals.messages = {
    errors: [],
    success: [],
    info: []
  };
  next();
});

// View engine setup
app.set('view engine', 'pug');
app.set('views', [
  path.join(__dirname, '../views'),
  path.join(__dirname, '../views/enhanced')
]);

// Health check
app.get('/health', (req: any, res: any) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage()
  });
});

// Basic routes
app.get('/', (req: any, res: any) => {
  try {
    res.render('home', {
      title: 'SignumLBRI - Strona główna',
      user: null,
      lang: 'pl',
      version: 'latest',
      setup: false,
      disableLogin: false,
      isLandingPage: true
    });
  } catch (error) {
    console.error('Home page render error:', error);
    res.json({
      message: "SignumLBRI Homepage (Fallback)",
      timestamp: new Date().toISOString(),
      status: "working",
      note: "Template rendering failed, showing fallback JSON response"
    });
  }
});

// Template test route
app.get('/test-template', (req: any, res: any) => {
  res.render('home', {
    title: 'SignumLBRI - Strona główna',
    user: null,
    lang: 'pl',
    version: 'latest',
    setup: false,
    disableLogin: false,
    isLandingPage: true
  });
});

app.get('/login', (req: any, res: any) => {
  res.render('account/login', {
    title: 'SignumLBRI - Logowanie',
    user: null,
    lang: 'pl'
  });
});

app.get('/books', (req: any, res: any) => {
  res.render('book/search', {
    title: 'SignumLBRI - Książki',
    user: null,
    lang: 'pl',
    books: []
  });
});

// 404 handler
app.use('*', (req: any, res: any) => {
  res.status(404).json({
    error: 'Not Found',
    status: 404,
    path: req.originalUrl
  });
});

// Global error handler
app.use((error: any, req: any, res: any, next: any) => {
  console.error('Error:', error);
  res.status(500).json({
    error: 'Internal server error',
    status: 500
  });
});

export default app;
