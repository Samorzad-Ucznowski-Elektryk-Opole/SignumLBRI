/**
 * Advanced Performance Monitoring System for SignumLBRI
 * Provides real-time metrics, profiling, and optimization insights
 */

import { Request, Response, NextFunction } from 'express';
import logger from '../util/logger';
import { cache, CacheKeys } from './cache';

export interface PerformanceMetrics {
  requestCount: number;
  averageResponseTime: number;
  errorRate: number;
  slowestEndpoints: Array<{ route: string; avgTime: number; count: number }>;
  databaseQueryTimes: Array<{ query: string; time: number; timestamp: Date }>;
  memoryUsage: NodeJS.MemoryUsage;
  activeConnections: number;
  timestamp: Date;
}

export interface RouteMetrics {
  route: string;
  method: string;
  count: number;
  totalTime: number;
  averageTime: number;
  minTime: number;
  maxTime: number;
  errorCount: number;
  lastAccess: Date;
}

class PerformanceMonitor {
  private metrics: Map<string, RouteMetrics> = new Map();
  private requestTimes: Array<{ time: number; timestamp: Date }> = [];
  private dbQueryTimes: Array<{ query: string; time: number; timestamp: Date }> = [];
  private activeRequests = 0;
  private startTime = Date.now();
  private readonly MAX_STORED_REQUESTS = 1000;
  private readonly MAX_DB_QUERIES = 500;

  /**
   * Middleware to track request performance
   */
  trackRequest() {
    return (req: Request, res: Response, next: NextFunction) => {
      const startTime = Date.now();
      const route = `${req.method} ${req.route?.path || req.path}`;
      
      this.activeRequests++;

      // Override res.end to capture response time
      const originalEnd = res.end;
      res.end = function(chunk?: any, encoding?: any) {
        const endTime = Date.now();
        const responseTime = endTime - startTime;
        
        // Update metrics
        const monitor = (req as any).performanceMonitor;
        if (monitor) {
          monitor.updateRouteMetrics(route, responseTime, res.statusCode >= 400);
          monitor.addRequestTime(responseTime);
        }
        
        monitor.activeRequests--;
        
        // Call original end
        return originalEnd.call(this, chunk, encoding);
      };

      // Add monitor to request for access in other middleware
      (req as any).performanceMonitor = this;
      
      next();
    };
  }

  /**
   * Update route-specific metrics
   */
  private updateRouteMetrics(route: string, responseTime: number, isError: boolean): void {
    const existing = this.metrics.get(route);
    
    if (existing) {
      existing.count++;
      existing.totalTime += responseTime;
      existing.averageTime = existing.totalTime / existing.count;
      existing.minTime = Math.min(existing.minTime, responseTime);
      existing.maxTime = Math.max(existing.maxTime, responseTime);
      existing.lastAccess = new Date();
      
      if (isError) {
        existing.errorCount++;
      }
    } else {
      this.metrics.set(route, {
        route,
        method: route.split(' ')[0],
        count: 1,
        totalTime: responseTime,
        averageTime: responseTime,
        minTime: responseTime,
        maxTime: responseTime,
        errorCount: isError ? 1 : 0,
        lastAccess: new Date()
      });
    }
  }

  /**
   * Add request time to tracking
   */
  private addRequestTime(time: number): void {
    this.requestTimes.push({ time, timestamp: new Date() });
    
    // Keep only recent requests
    if (this.requestTimes.length > this.MAX_STORED_REQUESTS) {
      this.requestTimes.shift();
    }
  }

  /**
   * Track database query performance
   */
  trackDatabaseQuery(query: string, executionTime: number): void {
    this.dbQueryTimes.push({
      query: this.sanitizeQuery(query),
      time: executionTime,
      timestamp: new Date()
    });

    // Keep only recent queries
    if (this.dbQueryTimes.length > this.MAX_DB_QUERIES) {
      this.dbQueryTimes.shift();
    }

    // Log slow queries
    if (executionTime > 1000) {
      logger.warn('Slow database query detected', {
        query: this.sanitizeQuery(query),
        executionTime,
        timestamp: new Date()
      });
    }
  }

  /**
   * Get comprehensive performance metrics
   */
  getMetrics(): PerformanceMetrics {
    const now = Date.now();
    const uptime = now - this.startTime;
    
    // Calculate averages
    const totalRequests = this.requestTimes.length;
    const averageResponseTime = totalRequests > 0 
      ? this.requestTimes.reduce((sum, req) => sum + req.time, 0) / totalRequests 
      : 0;

    // Calculate error rate
    const totalErrors = Array.from(this.metrics.values())
      .reduce((sum, metric) => sum + metric.errorCount, 0);
    const totalRequestCount = Array.from(this.metrics.values())
      .reduce((sum, metric) => sum + metric.count, 0);
    const errorRate = totalRequestCount > 0 ? (totalErrors / totalRequestCount) * 100 : 0;

    // Get slowest endpoints
    const slowestEndpoints = Array.from(this.metrics.values())
      .sort((a, b) => b.averageTime - a.averageTime)
      .slice(0, 10)
      .map(metric => ({
        route: metric.route,
        avgTime: Math.round(metric.averageTime),
        count: metric.count
      }));

    return {
      requestCount: totalRequestCount,
      averageResponseTime: Math.round(averageResponseTime),
      errorRate: Math.round(errorRate * 100) / 100,
      slowestEndpoints,
      databaseQueryTimes: this.dbQueryTimes.slice(-10), // Last 10 queries
      memoryUsage: process.memoryUsage(),
      activeConnections: this.activeRequests,
      timestamp: new Date()
    };
  }

  /**
   * Get detailed route metrics
   */
  getRouteMetrics(): RouteMetrics[] {
    return Array.from(this.metrics.values())
      .sort((a, b) => b.count - a.count);
  }

  /**
   * Get performance alerts
   */
  getAlerts(): Array<{ type: string; message: string; severity: 'low' | 'medium' | 'high' }> {
    const alerts: Array<{ type: string; message: string; severity: 'low' | 'medium' | 'high' }> = [];
    const metrics = this.getMetrics();

    // High response time alert
    if (metrics.averageResponseTime > 2000) {
      alerts.push({
        type: 'high_response_time',
        message: `Average response time is ${metrics.averageResponseTime}ms (threshold: 2000ms)`,
        severity: 'high'
      });
    }

    // High error rate alert
    if (metrics.errorRate > 5) {
      alerts.push({
        type: 'high_error_rate',
        message: `Error rate is ${metrics.errorRate}% (threshold: 5%)`,
        severity: 'high'
      });
    }

    // High memory usage alert
    const memoryUsageMB = metrics.memoryUsage.heapUsed / 1024 / 1024;
    if (memoryUsageMB > 512) {
      alerts.push({
        type: 'high_memory_usage',
        message: `Memory usage is ${Math.round(memoryUsageMB)}MB (threshold: 512MB)`,
        severity: 'medium'
      });
    }

    // Slow database queries
    const slowQueries = this.dbQueryTimes.filter(q => q.time > 1000).length;
    if (slowQueries > 5) {
      alerts.push({
        type: 'slow_database_queries',
        message: `${slowQueries} slow database queries detected in recent activity`,
        severity: 'medium'
      });
    }

    return alerts;
  }

  /**
   * Generate performance report
   */
  async generateReport(): Promise<string> {
    const metrics = this.getMetrics();
    const routeMetrics = this.getRouteMetrics();
    const alerts = this.getAlerts();

    const report = `
# SignumLBRI Performance Report
Generated: ${metrics.timestamp.toISOString()}

## Overall Metrics
- Total Requests: ${metrics.requestCount}
- Average Response Time: ${metrics.averageResponseTime}ms
- Error Rate: ${metrics.errorRate}%
- Active Connections: ${metrics.activeConnections}
- Memory Usage: ${Math.round(metrics.memoryUsage.heapUsed / 1024 / 1024)}MB

## Slowest Endpoints
${metrics.slowestEndpoints.map(endpoint => 
  `- ${endpoint.route}: ${endpoint.avgTime}ms (${endpoint.count} requests)`
).join('\n')}

## Route Performance
${routeMetrics.slice(0, 10).map(route => 
  `- ${route.route}: ${route.averageTime}ms avg, ${route.count} requests, ${route.errorCount} errors`
).join('\n')}

## Recent Database Queries
${metrics.databaseQueryTimes.map(query => 
  `- ${query.query}: ${query.time}ms at ${query.timestamp.toISOString()}`
).join('\n')}

## Active Alerts
${alerts.length > 0 ? alerts.map(alert => 
  `- [${alert.severity.toUpperCase()}] ${alert.type}: ${alert.message}`
).join('\n') : 'No active alerts'}

## Recommendations
${this.generateRecommendations(metrics, alerts)}
    `;

    // Cache the report
    await cache.set('performance_report', report, 300); // 5 minutes
    
    return report;
  }

  /**
   * Generate performance recommendations
   */
  private generateRecommendations(metrics: PerformanceMetrics, alerts: any[]): string {
    const recommendations: string[] = [];

    if (metrics.averageResponseTime > 1000) {
      recommendations.push('- Consider implementing caching for frequently accessed data');
      recommendations.push('- Review database query optimization opportunities');
    }

    if (metrics.errorRate > 2) {
      recommendations.push('- Investigate and fix recurring error patterns');
      recommendations.push('- Implement better error handling and validation');
    }

    const memoryUsageMB = metrics.memoryUsage.heapUsed / 1024 / 1024;
    if (memoryUsageMB > 256) {
      recommendations.push('- Consider implementing memory cleanup routines');
      recommendations.push('- Review for potential memory leaks');
    }

    if (recommendations.length === 0) {
      recommendations.push('- Performance is within acceptable ranges');
      recommendations.push('- Continue monitoring for optimization opportunities');
    }

    return recommendations.join('\n');
  }

  /**
   * Reset metrics (useful for testing or periodic resets)
   */
  resetMetrics(): void {
    this.metrics.clear();
    this.requestTimes = [];
    this.dbQueryTimes = [];
    this.startTime = Date.now();
    logger.info('Performance metrics reset');
  }

  /**
   * Sanitize database query for logging (remove sensitive data)
   */
  private sanitizeQuery(query: string): string {
    // Remove potential sensitive data patterns
    return query
      .replace(/password.*?['"][^'"]*['"]*/gi, 'password: [REDACTED]')
      .replace(/token.*?['"][^'"]*['"]*/gi, 'token: [REDACTED]')
      .replace(/secret.*?['"][^'"]*['"]*/gi, 'secret: [REDACTED]')
      .substring(0, 200); // Limit length
  }
}

// Singleton instance
export const performanceMonitor = new PerformanceMonitor();

/**
 * Middleware factory for performance monitoring
 */
export function createPerformanceMiddleware() {
  return performanceMonitor.trackRequest();
}

/**
 * Database query wrapper with performance tracking
 */
export function trackDatabaseQuery<T>(
  queryName: string,
  queryFunction: () => Promise<T>
): Promise<T> {
  const startTime = Date.now();
  
  return queryFunction()
    .then(result => {
      const endTime = Date.now();
      performanceMonitor.trackDatabaseQuery(queryName, endTime - startTime);
      return result;
    })
    .catch(error => {
      const endTime = Date.now();
      performanceMonitor.trackDatabaseQuery(`ERROR: ${queryName}`, endTime - startTime);
      throw error;
    });
}

/**
 * Express route for performance metrics API
 */
export function performanceApiRoute(req: Request, res: Response): void {
  try {
    const metrics = performanceMonitor.getMetrics();
    const routeMetrics = performanceMonitor.getRouteMetrics();
    const alerts = performanceMonitor.getAlerts();

    res.json({
      success: true,
      data: {
        metrics,
        routes: routeMetrics,
        alerts
      }
    });
  } catch (error) {
    logger.error('Error generating performance API response', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate performance metrics'
    });
  }
}

/**
 * Express route for performance report
 */
export async function performanceReportRoute(req: Request, res: Response): Promise<void> {
  try {
    const report = await performanceMonitor.generateReport();
    res.setHeader('Content-Type', 'text/plain');
    res.send(report);
  } catch (error) {
    logger.error('Error generating performance report', error);
    res.status(500).send('Failed to generate performance report');
  }
}

export default performanceMonitor;
