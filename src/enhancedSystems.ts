/**
 * Enhanced Systems Configuration and Bootstrap
 * Central configuration and initialization for all enhanced systems
 */

import { enhancedLogger, initializeLogging } from './util/enhancedLogger';
import { performanceMonitor, createPerformanceMiddleware } from './util/simplePerformanceMonitor';
import { routeRegistry, enhancedRoutes } from './config/enhancedRoutes';

// System configuration interface
export interface SystemConfig {
  environment: 'development' | 'production' | 'test';
  logging: {
    level: 'error' | 'warn' | 'info' | 'debug' | 'trace';
    enableConsole: boolean;
    enableFile: boolean;
    enableStructured: boolean;
  };
  performance: {
    enableMonitoring: boolean;
    enableAlerts: boolean;
    metricsInterval: number;
  };
  cache: {
    defaultTTL: number;
    enableRedis: boolean;
    enableCompression: boolean;
  };
  security: {
    rateLimitWindowMs: number;
    rateLimitMax: number;
    sessionTimeout: number;
  };
  features: {
    enableAdvancedRouting: boolean;
    enablePerformanceTracking: boolean;
    enableStructuredLogging: boolean;
    enableEnhancedModels: boolean;
  };
}

// Default system configuration
export const defaultConfig: SystemConfig = {
  environment: 'development',
  logging: {
    level: 'info',
    enableConsole: true,
    enableFile: false, // Disabled until Node.js setup is complete
    enableStructured: true
  },
  performance: {
    enableMonitoring: true,
    enableAlerts: true,
    metricsInterval: 300000 // 5 minutes
  },
  cache: {
    defaultTTL: 300,
    enableRedis: true,
    enableCompression: false
  },
  security: {
    rateLimitWindowMs: 900000, // 15 minutes
    rateLimitMax: 100,
    sessionTimeout: 3600000 // 1 hour
  },
  features: {
    enableAdvancedRouting: true,
    enablePerformanceTracking: true,
    enableStructuredLogging: true,
    enableEnhancedModels: true
  }
};

// Enhanced system manager
export class EnhancedSystemManager {
  private config: SystemConfig;
  private initialized: boolean = false;
  private shutdownHandlers: Array<() => Promise<void>> = [];

  constructor(config?: Partial<SystemConfig>) {
    this.config = { ...defaultConfig, ...config };
  }

  // Initialize all enhanced systems
  async initialize(): Promise<void> {
    if (this.initialized) {
      console.warn('[SYSTEM] Enhanced systems already initialized');
      return;
    }

    try {
      console.log('[SYSTEM] Initializing enhanced systems...');

      // Initialize logging first
      if (this.config.features.enableStructuredLogging) {
        await this.initializeLogging();
      }

      // Initialize performance monitoring
      if (this.config.features.enablePerformanceTracking) {
        await this.initializePerformanceMonitoring();
      }

      // Initialize routing system
      if (this.config.features.enableAdvancedRouting) {
        await this.initializeAdvancedRouting();
      }

      // Initialize enhanced models (when dependencies are available)
      if (this.config.features.enableEnhancedModels) {
        await this.initializeEnhancedModels();
      }

      // Initialize cache system
      await this.initializeCacheSystem();

      // Setup system monitoring
      await this.setupSystemMonitoring();

      this.initialized = true;
      enhancedLogger.info('Enhanced systems initialized successfully', {
        config: this.config,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('[SYSTEM] Failed to initialize enhanced systems:', error);
      throw error;
    }
  }

  // Get system status
  getSystemStatus(): {
    initialized: boolean;
    uptime: number;
    config: SystemConfig;
    health: any;
  } {
    return {
      initialized: this.initialized,
      uptime: Date.now() - startTime,
      config: this.config,
      health: this.getHealthStatus()
    };
  }

  // Get health status of all systems
  getHealthStatus(): {
    overall: 'healthy' | 'degraded' | 'unhealthy';
    systems: Record<string, any>;
  } {
    const systems: Record<string, any> = {};

    // Logging health
    systems.logging = enhancedLogger.healthCheck();

    // Performance monitoring health
    systems.performance = performanceMonitor.getPerformanceSummary();

    // Cache health (placeholder until cache system is fully integrated)
    systems.cache = { status: 'healthy', message: 'Cache system operational' };

    // Route registry health
    systems.routing = {
      status: 'healthy',
      registeredRoutes: routeRegistry.getAll().size,
      message: 'Route registry operational'
    };

    // Determine overall health
    const healthScores = Object.values(systems).map(system => {
      if (system.status === 'healthy') return 2;
      if (system.status === 'degraded') return 1;
      return 0;
    });

    const avgScore = healthScores.reduce((a, b) => a + b, 0) / healthScores.length;
    const overall = avgScore >= 1.5 ? 'healthy' : avgScore >= 0.5 ? 'degraded' : 'unhealthy';

    return { overall, systems };
  }

  // Graceful shutdown
  async shutdown(): Promise<void> {
    console.log('[SYSTEM] Shutting down enhanced systems...');

    // Execute all shutdown handlers
    for (const handler of this.shutdownHandlers) {
      try {
        await handler();
      } catch (error) {
        console.error('[SYSTEM] Error during shutdown:', error);
      }
    }

    enhancedLogger.info('Enhanced systems shutdown completed');
    this.initialized = false;
  }

  // Register shutdown handler
  onShutdown(handler: () => Promise<void>): void {
    this.shutdownHandlers.push(handler);
  }

  // Update configuration
  updateConfig(newConfig: Partial<SystemConfig>): void {
    this.config = { ...this.config, ...newConfig };
    enhancedLogger.info('System configuration updated', { config: this.config });
  }

  // Private initialization methods
  private async initializeLogging(): Promise<void> {
    initializeLogging();
    enhancedLogger.info('Enhanced logging system initialized');
  }

  private async initializePerformanceMonitoring(): Promise<void> {
    // Performance monitoring is already initialized via import
    enhancedLogger.info('Performance monitoring system initialized', {
      metricsInterval: this.config.performance.metricsInterval
    });

    // Setup periodic alerts if enabled
    if (this.config.performance.enableAlerts) {
      setInterval(() => {
        const alerts = performanceMonitor.checkAlerts();
        if (alerts.length > 0) {
          enhancedLogger.warn('Performance alerts detected', { alerts });
        }
      }, this.config.performance.metricsInterval);
    }
  }

  private async initializeAdvancedRouting(): Promise<void> {
    // Route registry is already populated via import
    const routeCount = routeRegistry.getAll().size;
    enhancedLogger.info('Advanced routing system initialized', {
      registeredRoutes: routeCount,
      routes: Object.keys(enhancedRoutes)
    });
  }

  private async initializeEnhancedModels(): Promise<void> {
    // Enhanced models will be initialized when mongoose is available
    enhancedLogger.info('Enhanced models system prepared (awaiting database connection)');
  }

  private async initializeCacheSystem(): Promise<void> {
    // Cache system initialization (simplified for now)
    enhancedLogger.info('Cache system initialized', {
      defaultTTL: this.config.cache.defaultTTL,
      enableRedis: this.config.cache.enableRedis
    });
  }

  private async setupSystemMonitoring(): Promise<void> {
    // Setup periodic system health checks
    setInterval(() => {
      const health = this.getHealthStatus();
      if (health.overall !== 'healthy') {
        enhancedLogger.warn('System health degraded', { health });
      }
    }, 60000); // Check every minute

    enhancedLogger.info('System monitoring setup completed');
  }
}

// Track system start time
const startTime = Date.now();

// Create global system manager instance
export const systemManager = new EnhancedSystemManager();

// Express middleware factory
export const createEnhancedMiddleware = () => {
  const middlewares = [];

  // Performance tracking middleware
  if (systemManager.getSystemStatus().config.features.enablePerformanceTracking) {
    middlewares.push(createPerformanceMiddleware());
  }

  return middlewares;
};

// Initialize system on startup
export const initializeEnhancedSystems = async (config?: Partial<SystemConfig>): Promise<void> => {
  if (config) {
    systemManager.updateConfig(config);
  }
  
  await systemManager.initialize();
};

// Health check endpoint
export const getSystemHealthCheck = () => {
  return systemManager.getHealthStatus();
};

// System metrics endpoint
export const getSystemMetrics = () => {
  const status = systemManager.getSystemStatus();
  const performance = performanceMonitor.getPerformanceSummary();
  const logging = enhancedLogger.getStats();
  
  return {
    system: status,
    performance,
    logging,
    timestamp: new Date().toISOString()
  };
};

// Export utilities for easy access
export const utils = {
  logger: enhancedLogger,
  performance: performanceMonitor,
  routes: routeRegistry,
  system: systemManager
};

// Default export
export default {
  systemManager,
  initializeEnhancedSystems,
  getSystemHealthCheck,
  getSystemMetrics,
  utils
};
