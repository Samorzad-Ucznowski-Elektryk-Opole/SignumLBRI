/**
 * Simplified Performance Monitor - Core Implementation  
 * Performance tracking and monitoring without external dependencies
 */

// Performance metrics interfaces
export interface PerformanceMetrics {
  timestamp: number;
  duration: number;
  success: boolean;
  error?: string;
  metadata?: Record<string, any>;
}

export interface RouteMetrics {
  path: string;
  method: string;
  totalRequests: number;
  totalDuration: number;
  averageDuration: number;
  errorCount: number;
  errorRate: number;
  successCount: number;
  lastRequest?: number;
  minDuration: number;
  maxDuration: number;
}

export interface SystemMetrics {
  uptime: number;
  memoryUsage: {
    used: number;
    free: number;
    total: number;
    percentage: number;
  };
  cpuUsage?: number;
  activeConnections: number;
  totalRequests: number;
  errorRate: number;
  averageResponseTime: number;
}

// Simple performance monitor implementation
export class SimplePerformanceMonitor {
  private routeMetrics: Map<string, RouteMetrics> = new Map();
  private systemMetrics: SystemMetrics;
  private startTime: number = Date.now();
  private requestCount: number = 0;
  private errorCount: number = 0;
  private totalResponseTime: number = 0;
  
  constructor() {
    this.systemMetrics = {
      uptime: 0,
      memoryUsage: { used: 0, free: 0, total: 0, percentage: 0 },
      activeConnections: 0,
      totalRequests: 0,
      errorRate: 0,
      averageResponseTime: 0
    };
    
    this.initializeMonitoring();
  }
  
  // Track request performance
  trackRequest(req: any, res: any, next: any): void {
    const startTime = Date.now();
    const routeKey = `${req.method} ${req.route?.path || req.path}`;
    
    // Increment active connections
    this.systemMetrics.activeConnections++;
    
    // Track response
    const originalSend = res.send;
    res.send = (body: any) => {
      const duration = Date.now() - startTime;
      const success = res.statusCode < 400;
      
      this.recordRequest(routeKey, duration, success, {
        statusCode: res.statusCode,
        userAgent: req.get('User-Agent'),
        ip: req.ip
      });
      
      // Decrement active connections
      this.systemMetrics.activeConnections--;
      
      return originalSend.call(res, body);
    };
    
    next();
  }
  
  // Record individual request metrics
  private recordRequest(routeKey: string, duration: number, success: boolean, metadata?: any): void {
    // Update global metrics
    this.requestCount++;
    this.totalResponseTime += duration;
    if (!success) this.errorCount++;
    
    // Update route-specific metrics
    let metrics = this.routeMetrics.get(routeKey);
    if (!metrics) {
      const [method, path] = routeKey.split(' ', 2);
      metrics = {
        path,
        method,
        totalRequests: 0,
        totalDuration: 0,
        averageDuration: 0,
        errorCount: 0,
        errorRate: 0,
        successCount: 0,
        minDuration: duration,
        maxDuration: duration
      };
      this.routeMetrics.set(routeKey, metrics);
    }
    
    metrics.totalRequests++;
    metrics.totalDuration += duration;
    metrics.averageDuration = metrics.totalDuration / metrics.totalRequests;
    metrics.lastRequest = Date.now();
    metrics.minDuration = Math.min(metrics.minDuration, duration);
    metrics.maxDuration = Math.max(metrics.maxDuration, duration);
    
    if (success) {
      metrics.successCount++;
    } else {
      metrics.errorCount++;
    }
    
    metrics.errorRate = (metrics.errorCount / metrics.totalRequests) * 100;
  }
  
  // Track database operations
  trackDatabaseQuery<T>(operationName: string, operation: () => Promise<T>): Promise<T> {
    return this.trackOperation(`db:${operationName}`, operation);
  }
  
  // Track generic operations
  async trackOperation<T>(operationName: string, operation: () => Promise<T>): Promise<T> {
    const startTime = Date.now();
    
    try {
      const result = await operation();
      const duration = Date.now() - startTime;
      
      console.log(`[PERF] ${operationName}: ${duration}ms ✓`);
      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      console.error(`[PERF] ${operationName}: ${duration}ms ✗`, error);
      throw error;
    }
  }
  
  // Get route metrics
  getRouteMetrics(routeKey?: string): RouteMetrics | RouteMetrics[] {
    if (routeKey) {
      return this.routeMetrics.get(routeKey) || this.createEmptyRouteMetrics(routeKey);
    }
    
    return Array.from(this.routeMetrics.values());
  }
  
  // Get system metrics
  getSystemMetrics(): SystemMetrics {
    this.updateSystemMetrics();
    return { ...this.systemMetrics };
  }
  
  // Get performance summary
  getPerformanceSummary(): {
    system: SystemMetrics;
    topRoutes: RouteMetrics[];
    slowestRoutes: RouteMetrics[];
    errorRoutes: RouteMetrics[];
  } {
    const allRoutes = Array.from(this.routeMetrics.values());
    
    return {
      system: this.getSystemMetrics(),
      topRoutes: allRoutes
        .sort((a, b) => b.totalRequests - a.totalRequests)
        .slice(0, 10),
      slowestRoutes: allRoutes
        .sort((a, b) => b.averageDuration - a.averageDuration)
        .slice(0, 10),
      errorRoutes: allRoutes
        .filter(r => r.errorCount > 0)
        .sort((a, b) => b.errorRate - a.errorRate)
        .slice(0, 10)
    };
  }
  
  // Reset metrics
  resetMetrics(): void {
    this.routeMetrics.clear();
    this.requestCount = 0;
    this.errorCount = 0;
    this.totalResponseTime = 0;
    this.startTime = Date.now();
    console.log('[PERF] Metrics reset');
  }
  
  // Generate performance report
  generateReport(): string {
    const summary = this.getPerformanceSummary();
    const uptime = this.formatDuration(summary.system.uptime);
    
    let report = `Performance Report (Uptime: ${uptime})\n`;
    report += `${'='.repeat(50)}\n\n`;
    
    // System metrics
    report += `System Metrics:\n`;
    report += `- Total Requests: ${summary.system.totalRequests}\n`;
    report += `- Error Rate: ${summary.system.errorRate.toFixed(2)}%\n`;
    report += `- Average Response Time: ${summary.system.averageResponseTime.toFixed(2)}ms\n`;
    report += `- Active Connections: ${summary.system.activeConnections}\n`;
    report += `- Memory Usage: ${summary.system.memoryUsage.percentage.toFixed(1)}%\n\n`;
    
    // Top routes
    report += `Top Routes (by request count):\n`;
    summary.topRoutes.forEach((route, index) => {
      report += `${index + 1}. ${route.method} ${route.path} - ${route.totalRequests} requests (${route.averageDuration.toFixed(2)}ms avg)\n`;
    });
    
    report += `\nSlowest Routes:\n`;
    summary.slowestRoutes.forEach((route, index) => {
      report += `${index + 1}. ${route.method} ${route.path} - ${route.averageDuration.toFixed(2)}ms avg (${route.totalRequests} requests)\n`;
    });
    
    if (summary.errorRoutes.length > 0) {
      report += `\nRoutes with Errors:\n`;
      summary.errorRoutes.forEach((route, index) => {
        report += `${index + 1}. ${route.method} ${route.path} - ${route.errorRate.toFixed(2)}% error rate (${route.errorCount}/${route.totalRequests})\n`;
      });
    }
    
    return report;
  }
  
  // Alert system for performance issues
  checkAlerts(): Array<{ type: string; message: string; severity: 'low' | 'medium' | 'high' }> {
    const alerts = [];
    const summary = this.getPerformanceSummary();
    
    // High error rate
    if (summary.system.errorRate > 5) {
      alerts.push({
        type: 'high_error_rate',
        message: `System error rate is ${summary.system.errorRate.toFixed(2)}% (threshold: 5%)`,
        severity: (summary.system.errorRate > 10 ? 'high' : 'medium') as 'high' | 'medium'
      });
    }
    
    // Slow average response time
    if (summary.system.averageResponseTime > 2000) {
      alerts.push({
        type: 'slow_response_time',
        message: `Average response time is ${summary.system.averageResponseTime.toFixed(2)}ms (threshold: 2000ms)`,
        severity: (summary.system.averageResponseTime > 5000 ? 'high' : 'medium') as 'high' | 'medium'
      });
    }
    
    // High memory usage
    if (summary.system.memoryUsage.percentage > 85) {
      alerts.push({
        type: 'high_memory_usage',
        message: `Memory usage is ${summary.system.memoryUsage.percentage.toFixed(1)}% (threshold: 85%)`,
        severity: (summary.system.memoryUsage.percentage > 95 ? 'high' : 'medium') as 'high' | 'medium'
      });
    }
    
    // Check individual routes
    summary.slowestRoutes.forEach(route => {
      if (route.averageDuration > 5000 && route.totalRequests > 10) {
        alerts.push({
          type: 'slow_route',
          message: `Route ${route.method} ${route.path} has average response time of ${route.averageDuration.toFixed(2)}ms`,
          severity: 'medium' as 'medium'
        });
      }
    });
    
    return alerts;
  }
  
  // Private helper methods
  private initializeMonitoring(): void {
    // Update system metrics every 30 seconds
    setInterval(() => {
      this.updateSystemMetrics();
    }, 30000);
    
    // Log performance summary every 5 minutes
    setInterval(() => {
      const alerts = this.checkAlerts();
      if (alerts.length > 0) {
        console.warn('[PERF] Performance alerts detected:', alerts);
      }
    }, 300000);
  }
  
  private updateSystemMetrics(): void {
    this.systemMetrics.uptime = Date.now() - this.startTime;
    this.systemMetrics.totalRequests = this.requestCount;
    this.systemMetrics.errorRate = this.requestCount > 0 ? (this.errorCount / this.requestCount) * 100 : 0;
    this.systemMetrics.averageResponseTime = this.requestCount > 0 ? this.totalResponseTime / this.requestCount : 0;
    
    // Basic memory usage (simplified - fallback implementation)
    try {
      // Try to access process if available (Node.js environment)
      const processObj = (globalThis as any).process;
      if (processObj && processObj.memoryUsage) {
        const memUsage = processObj.memoryUsage();
        const totalMem = 1024 * 1024 * 1024; // Assume 1GB total (placeholder)
        this.systemMetrics.memoryUsage = {
          used: memUsage.heapUsed,
          free: totalMem - memUsage.heapUsed,
          total: totalMem,
          percentage: (memUsage.heapUsed / totalMem) * 100
        };
      } else {
        // Fallback for environments without process.memoryUsage
        this.systemMetrics.memoryUsage = {
          used: 50 * 1024 * 1024, // 50MB placeholder
          free: 950 * 1024 * 1024, // 950MB placeholder  
          total: 1024 * 1024 * 1024, // 1GB placeholder
          percentage: 5 // 5% placeholder
        };
      }
    } catch (error) {
      // Fallback if memory access fails
      this.systemMetrics.memoryUsage = {
        used: 0,
        free: 0,
        total: 0,
        percentage: 0
      };
    }
  }
  
  private createEmptyRouteMetrics(routeKey: string): RouteMetrics {
    const [method, path] = routeKey.split(' ', 2);
    return {
      path: path || '/',
      method: method || 'GET',
      totalRequests: 0,
      totalDuration: 0,
      averageDuration: 0,
      errorCount: 0,
      errorRate: 0,
      successCount: 0,
      minDuration: 0,
      maxDuration: 0
    };
  }
  
  private formatDuration(ms: number): string {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    
    if (days > 0) return `${days}d ${hours % 24}h`;
    if (hours > 0) return `${hours}h ${minutes % 60}m`;
    if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
    return `${seconds}s`;
  }
}

// Create global performance monitor instance
export const performanceMonitor = new SimplePerformanceMonitor();

// Export tracking function for compatibility
export const trackDatabaseQuery = <T>(operationName: string, operation: () => Promise<T>): Promise<T> => {
  return performanceMonitor.trackDatabaseQuery(operationName, operation);
};

// Middleware factory
export const createPerformanceMiddleware = () => {
  return (req: any, res: any, next: any) => {
    performanceMonitor.trackRequest(req, res, next);
  };
};

// Health check endpoint data
export const getHealthMetrics = () => {
  const summary = performanceMonitor.getPerformanceSummary();
  const alerts = performanceMonitor.checkAlerts();
  
  return {
    status: alerts.some(a => a.severity === 'high') ? 'unhealthy' : 
            alerts.some(a => a.severity === 'medium') ? 'degraded' : 'healthy',
    uptime: summary.system.uptime,
    metrics: summary.system,
    alerts: alerts.length > 0 ? alerts : undefined,
    timestamp: Date.now()
  };
};

// Export default
export default performanceMonitor;
