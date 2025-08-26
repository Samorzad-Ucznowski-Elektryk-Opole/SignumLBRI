/**
 * SignumLBRI - Server Entry Point
 * Punkt wejściowy serwera dla aplikacji TypeScript
 */

import app from './app';
import { createServer } from 'http';

const PORT = process.env.PORT || 4000;

// Konfiguracja zaawansowanego monitorowania (jak w enhanced-app.js)
console.log('🚀 SignumLBRI TypeScript Server Starting...');
console.log('⏰ Started at:', new Date().toISOString());
console.log('🖥️  System Information:');
console.log('   Node.js version:', process.version);
console.log('   Platform:', process.platform, process.arch);
console.log('   PID:', process.pid);
console.log('   Working directory:', process.cwd());
console.log('   Environment:', process.env.NODE_ENV || 'development');
console.log('🌐 PORT:', PORT);
console.log('');

// Create HTTP server
const server = createServer(app);

// Enhanced error handling
server.on('error', (error: NodeJS.ErrnoException) => {
  if (error.code === 'EADDRINUSE') {
    console.error(`❌ Port ${PORT} is already in use`);
    process.exit(1);
  } else {
    console.error('❌ Server error:', error);
    process.exit(1);
  }
});

// Graceful shutdown handling
let isShuttingDown = false;

const gracefulShutdown = (signal: string) => {
  if (isShuttingDown) return;
  isShuttingDown = true;
  
  console.log('');
  console.log(`🛑 Received ${signal}, shutting down gracefully...`);
  
  server.close(() => {
    console.log('✅ HTTP server closed');
    console.log('👋 SignumLBRI stopped');
    process.exit(0);
  });
  
  // Force shutdown after 10 seconds
  setTimeout(() => {
    console.log('⏰ Force shutdown after timeout');
    process.exit(1);
  }, 10000);
};

// Handle shutdown signals
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGUSR2', () => gracefulShutdown('SIGUSR2')); // nodemon restart

// Global error handlers
process.on('uncaughtException', (error) => {
  console.error('');
  console.error('💥 [CRITICAL] Uncaught Exception:', error.name);
  console.error('📋 [CRITICAL] Error message:', error.message);
  console.error('📍 [CRITICAL] Stack trace:', error.stack);
  console.error('⚠️  [CRITICAL] Application will restart...');
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('');
  console.error('💥 [CRITICAL] Unhandled Promise Rejection:', reason);
  console.error('📋 [CRITICAL] Promise:', promise);
  console.error('⚠️  [CRITICAL] Application will restart...');
  process.exit(1);
});

// Start server
server.listen(PORT, '0.0.0.0', () => {
  console.log('');
  console.log('🎉 SignumLBRI TypeScript Application Started Successfully!');
  console.log('');
  console.log('📍 Server Information:');
  console.log(`   🌐 URL: http://localhost:${PORT}`);
  console.log(`   🚀 Port: ${PORT}`);
  console.log(`   📚 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log('');
  console.log('📋 Available Endpoints:');
  console.log('   🏠 Home: http://localhost:4000/');
  console.log('   📚 Books: http://localhost:4000/books');
  console.log('   👤 Users: http://localhost:4000/login');
  console.log('   ⚙️  Admin: http://localhost:4000/admin');
  console.log('   🔌 API: http://localhost:4000/api/*');
  console.log('   🏥 Health: http://localhost:4000/health');
  console.log('');
  console.log('✨ Features:');
  console.log('   🎨 Modern Glassmorphism UI');
  console.log('   🌍 Multi-language support (PL/EN/UK)');
  console.log('   🌙 Dark/Light theme switching');
  console.log('   📱 Responsive mobile design');
  console.log('   🔍 Advanced search system');
  console.log('');
  console.log('Press Ctrl+C to stop the server');
  console.log('');
});

export default server;
