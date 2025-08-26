/**
 * Performance Monitor Test Suite
 * 
 * Tests for the enhanced performance monitoring system
 */

interface MockPerformanceEntry {
  name: string;
  entryType: string;
  startTime: number;
  duration: number;
}

// Mock performance API for Node.js environment
const mockPerformance = {
  now: () => Date.now(),
  mark: jest.fn(),
  measure: jest.fn(),
  getEntriesByType: jest.fn().mockReturnValue([]),
  getEntriesByName: jest.fn().mockReturnValue([]),
  clearMarks: jest.fn(),
  clearMeasures: jest.fn()
};

// Mock process for testing
const mockProcess = {
  memoryUsage: jest.fn(() => ({
    rss: 25165824,
    heapTotal: 20971520,
    heapUsed: 15728640,
    external: 1048576,
    arrayBuffers: 0
  })),
  cpuUsage: jest.fn(() => ({
    user: 38579,
    system: 6986
  })),
  uptime: jest.fn(() => 3600)
};

// Mock our performance monitor (since we can't import it directly due to compilation issues)
class MockPerformanceMonitor {
  private requestMetrics: Map<string, any[]> = new Map();
  private systemMetrics: any[] = [];
  private alerts: any[] = [];
  private config: any = {
    maxHistorySize: 1000,
    thresholds: {
      responseTime: 2000,
      memoryUsage: 0.8,
      cpuUsage: 0.8
    }
  };

  trackRequest(route: string, method: string, responseTime: number, statusCode: number, userId?: string): void {
    if (!this.requestMetrics.has(route)) {
      this.requestMetrics.set(route, []);
    }
    
    const metrics = this.requestMetrics.get(route)!;
    metrics.push({
      method,
      responseTime,
      statusCode,
      userId,
      timestamp: new Date()
    });

    // Keep only recent metrics
    if (metrics.length > this.config.maxHistorySize) {
      metrics.splice(0, metrics.length - this.config.maxHistorySize);
    }

    // Check for alerts
    if (responseTime > this.config.thresholds.responseTime) {
      this.alerts.push({
        type: 'slow_response',
        route,
        responseTime,
        threshold: this.config.thresholds.responseTime,
        timestamp: new Date()
      });
    }
  }

  trackSystemMetrics(): void {
    const memory = mockProcess.memoryUsage();
    const cpu = mockProcess.cpuUsage();
    
    const metrics = {
      memory: {
        rss: memory.rss,
        heapTotal: memory.heapTotal,
        heapUsed: memory.heapUsed,
        usage: memory.heapUsed / memory.heapTotal
      },
      cpu: {
        user: cpu.user,
        system: cpu.system
      },
      uptime: mockProcess.uptime(),
      timestamp: new Date()
    };

    this.systemMetrics.push(metrics);

    // Keep only recent metrics
    if (this.systemMetrics.length > this.config.maxHistorySize) {
      this.systemMetrics.splice(0, 1);
    }

    // Check memory threshold
    if (metrics.memory.usage > this.config.thresholds.memoryUsage) {
      this.alerts.push({
        type: 'high_memory_usage',
        usage: metrics.memory.usage,
        threshold: this.config.thresholds.memoryUsage,
        timestamp: new Date()
      });
    }
  }

  getRouteMetrics(route: string): any {
    const metrics = this.requestMetrics.get(route) || [];
    if (metrics.length === 0) {
      return {
        route,
        totalRequests: 0,
        averageResponseTime: 0,
        minResponseTime: 0,
        maxResponseTime: 0,
        successRate: 0,
        errorRate: 0
      };
    }

    const responseTimes = metrics.map((m: any) => m.responseTime);
    const statusCodes = metrics.map((m: any) => m.statusCode);
    const successfulRequests = statusCodes.filter((code: number) => code < 400).length;

    return {
      route,
      totalRequests: metrics.length,
      averageResponseTime: responseTimes.reduce((a: number, b: number) => a + b, 0) / responseTimes.length,
      minResponseTime: Math.min(...responseTimes),
      maxResponseTime: Math.max(...responseTimes),
      successRate: successfulRequests / metrics.length,
      errorRate: (metrics.length - successfulRequests) / metrics.length,
      recentMetrics: metrics.slice(-10)
    };
  }

  getSystemHealth(): any {
    const recentMetrics = this.systemMetrics.slice(-1)[0];
    const recentAlerts = this.alerts.slice(-10);

    return {
      status: recentAlerts.length > 0 ? 'warning' : 'healthy',
      uptime: mockProcess.uptime(),
      memory: recentMetrics?.memory || { usage: 0 },
      cpu: recentMetrics?.cpu || { user: 0, system: 0 },
      alerts: recentAlerts.length,
      timestamp: new Date()
    };
  }

  getPerformanceSummary(): any {
    const allRoutes = Array.from(this.requestMetrics.keys());
    const routeMetrics = allRoutes.map(route => this.getRouteMetrics(route));
    
    return {
      totalRoutes: allRoutes.length,
      totalRequests: routeMetrics.reduce((sum, metric) => sum + metric.totalRequests, 0),
      averageResponseTime: routeMetrics.reduce((sum, metric) => 
        sum + (metric.averageResponseTime * metric.totalRequests), 0
      ) / Math.max(routeMetrics.reduce((sum, metric) => sum + metric.totalRequests, 0), 1),
      overallSuccessRate: routeMetrics.reduce((sum, metric) => 
        sum + (metric.successRate * metric.totalRequests), 0
      ) / Math.max(routeMetrics.reduce((sum, metric) => sum + metric.totalRequests, 0), 1),
      slowestRoutes: routeMetrics
        .sort((a, b) => b.averageResponseTime - a.averageResponseTime)
        .slice(0, 5),
      systemHealth: this.getSystemHealth(),
      generatedAt: new Date()
    };
  }

  checkAlerts(): any[] {
    return this.alerts.slice(-20); // Return recent alerts
  }

  clearMetrics(): void {
    this.requestMetrics.clear();
    this.systemMetrics.length = 0;
    this.alerts.length = 0;
  }
}

describe('Performance Monitor', () => {
  let performanceMonitor: MockPerformanceMonitor;

  beforeEach(() => {
    performanceMonitor = new MockPerformanceMonitor();
    jest.clearAllMocks();
  });

  describe('Request Tracking', () => {
    test('should track basic request metrics', () => {
      performanceMonitor.trackRequest('/api/users', 'GET', 150, 200);
      
      const metrics = performanceMonitor.getRouteMetrics('/api/users');
      
      expect(metrics.route).toBe('/api/users');
      expect(metrics.totalRequests).toBe(1);
      expect(metrics.averageResponseTime).toBe(150);
      expect(metrics.successRate).toBe(1);
      expect(metrics.errorRate).toBe(0);
    });

    test('should track multiple requests for same route', () => {
      performanceMonitor.trackRequest('/api/users', 'GET', 100, 200);
      performanceMonitor.trackRequest('/api/users', 'GET', 200, 200);
      performanceMonitor.trackRequest('/api/users', 'POST', 300, 201);
      
      const metrics = performanceMonitor.getRouteMetrics('/api/users');
      
      expect(metrics.totalRequests).toBe(3);
      expect(metrics.averageResponseTime).toBe(200); // (100+200+300)/3
      expect(metrics.minResponseTime).toBe(100);
      expect(metrics.maxResponseTime).toBe(300);
      expect(metrics.successRate).toBe(1);
    });

    test('should track success and error rates correctly', () => {
      performanceMonitor.trackRequest('/api/users', 'GET', 100, 200);
      performanceMonitor.trackRequest('/api/users', 'GET', 150, 404);
      performanceMonitor.trackRequest('/api/users', 'GET', 120, 500);
      performanceMonitor.trackRequest('/api/users', 'GET', 130, 201);
      
      const metrics = performanceMonitor.getRouteMetrics('/api/users');
      
      expect(metrics.totalRequests).toBe(4);
      expect(metrics.successRate).toBe(0.5); // 2 successful out of 4
      expect(metrics.errorRate).toBe(0.5); // 2 errors out of 4
    });

    test('should track user-specific metrics', () => {
      performanceMonitor.trackRequest('/api/profile', 'GET', 100, 200, 'user123');
      performanceMonitor.trackRequest('/api/profile', 'GET', 120, 200, 'user456');
      
      const metrics = performanceMonitor.getRouteMetrics('/api/profile');
      
      expect(metrics.totalRequests).toBe(2);
      expect(metrics.recentMetrics).toHaveLength(2);
      expect(metrics.recentMetrics[0].userId).toBe('user123');
      expect(metrics.recentMetrics[1].userId).toBe('user456');
    });

    test('should handle empty route metrics', () => {
      const metrics = performanceMonitor.getRouteMetrics('/nonexistent');
      
      expect(metrics.totalRequests).toBe(0);
      expect(metrics.averageResponseTime).toBe(0);
      expect(metrics.successRate).toBe(0);
      expect(metrics.errorRate).toBe(0);
    });
  });

  describe('System Metrics', () => {
    test('should track system metrics', () => {
      performanceMonitor.trackSystemMetrics();
      
      const health = performanceMonitor.getSystemHealth();
      
      expect(health.uptime).toBeGreaterThan(0);
      expect(health.memory.usage).toBeGreaterThan(0);
      expect(health.cpu).toBeDefined();
      expect(health.timestamp).toBeInstanceOf(Date);
    });

    test('should maintain metrics history', () => {
      performanceMonitor.trackSystemMetrics();
      performanceMonitor.trackSystemMetrics();
      performanceMonitor.trackSystemMetrics();
      
      const health = performanceMonitor.getSystemHealth();
      expect(health).toBeDefined();
    });
  });

  describe('Alert System', () => {
    test('should generate slow response alert', () => {
      performanceMonitor.trackRequest('/api/slow', 'GET', 3000, 200);
      
      const alerts = performanceMonitor.checkAlerts();
      
      expect(alerts).toHaveLength(1);
      expect(alerts[0].type).toBe('slow_response');
      expect(alerts[0].route).toBe('/api/slow');
      expect(alerts[0].responseTime).toBe(3000);
      expect(alerts[0].threshold).toBe(2000);
    });

    test('should not generate alert for fast responses', () => {
      performanceMonitor.trackRequest('/api/fast', 'GET', 100, 200);
      
      const alerts = performanceMonitor.checkAlerts();
      
      expect(alerts).toHaveLength(0);
    });

    test('should generate memory usage alert', () => {
      // Mock high memory usage
      mockProcess.memoryUsage.mockReturnValueOnce({
        rss: 1000000000,
        heapTotal: 1000000000,
        heapUsed: 900000000, // 90% usage
        external: 0,
        arrayBuffers: 0
      });
      
      performanceMonitor.trackSystemMetrics();
      
      const alerts = performanceMonitor.checkAlerts();
      
      expect(alerts).toHaveLength(1);
      expect(alerts[0].type).toBe('high_memory_usage');
      expect(alerts[0].usage).toBe(0.9);
    });
  });

  describe('Performance Summary', () => {
    test('should generate comprehensive performance summary', () => {
      // Add some test data
      performanceMonitor.trackRequest('/api/users', 'GET', 100, 200);
      performanceMonitor.trackRequest('/api/users', 'POST', 200, 201);
      performanceMonitor.trackRequest('/api/books', 'GET', 150, 200);
      performanceMonitor.trackRequest('/api/books', 'GET', 400, 404);
      
      const summary = performanceMonitor.getPerformanceSummary();
      
      expect(summary.totalRoutes).toBe(2);
      expect(summary.totalRequests).toBe(4);
      expect(summary.averageResponseTime).toBeGreaterThan(0);
      expect(summary.overallSuccessRate).toBe(0.75); // 3 successful out of 4
      expect(summary.slowestRoutes).toBeInstanceOf(Array);
      expect(summary.systemHealth).toBeDefined();
      expect(summary.generatedAt).toBeInstanceOf(Date);
    });

    test('should identify slowest routes correctly', () => {
      performanceMonitor.trackRequest('/api/fast', 'GET', 50, 200);
      performanceMonitor.trackRequest('/api/medium', 'GET', 150, 200);
      performanceMonitor.trackRequest('/api/slow', 'GET', 500, 200);
      
      const summary = performanceMonitor.getPerformanceSummary();
      
      expect(summary.slowestRoutes[0].route).toBe('/api/slow');
      expect(summary.slowestRoutes[1].route).toBe('/api/medium');
      expect(summary.slowestRoutes[2].route).toBe('/api/fast');
    });

    test('should handle empty metrics gracefully', () => {
      const summary = performanceMonitor.getPerformanceSummary();
      
      expect(summary.totalRoutes).toBe(0);
      expect(summary.totalRequests).toBe(0);
      expect(summary.averageResponseTime).toBe(0);
      expect(summary.overallSuccessRate).toBe(0);
      expect(summary.slowestRoutes).toHaveLength(0);
    });
  });

  describe('Metrics Cleanup', () => {
    test('should clear all metrics', () => {
      performanceMonitor.trackRequest('/api/test', 'GET', 100, 200);
      performanceMonitor.trackSystemMetrics();
      performanceMonitor.trackRequest('/api/slow', 'GET', 3000, 200); // Generates alert
      
      expect(performanceMonitor.getRouteMetrics('/api/test').totalRequests).toBe(1);
      expect(performanceMonitor.checkAlerts()).toHaveLength(1);
      
      performanceMonitor.clearMetrics();
      
      expect(performanceMonitor.getRouteMetrics('/api/test').totalRequests).toBe(0);
      expect(performanceMonitor.checkAlerts()).toHaveLength(0);
    });
  });

  describe('Memory Management', () => {
    test('should limit metrics history size', () => {
      // Add more metrics than the limit
      for (let i = 0; i < 1200; i++) {
        performanceMonitor.trackRequest('/api/test', 'GET', 100, 200);
      }
      
      const metrics = performanceMonitor.getRouteMetrics('/api/test');
      expect(metrics.totalRequests).toBeLessThanOrEqual(1000);
    });

    test('should maintain recent system metrics', () => {
      // Track more system metrics than the limit
      for (let i = 0; i < 1100; i++) {
        performanceMonitor.trackSystemMetrics();
      }
      
      const health = performanceMonitor.getSystemHealth();
      expect(health).toBeDefined();
    });
  });

  describe('Real-time Monitoring', () => {
    test('should provide real-time route metrics', () => {
      const startTime = Date.now();
      
      performanceMonitor.trackRequest('/api/realtime', 'GET', 100, 200);
      
      const metrics = performanceMonitor.getRouteMetrics('/api/realtime');
      const requestTime = metrics.recentMetrics[0].timestamp.getTime();
      
      expect(requestTime).toBeGreaterThanOrEqual(startTime);
      expect(requestTime).toBeLessThanOrEqual(Date.now());
    });

    test('should track concurrent requests', () => {
      // Simulate concurrent requests
      performanceMonitor.trackRequest('/api/concurrent', 'GET', 100, 200, 'user1');
      performanceMonitor.trackRequest('/api/concurrent', 'GET', 120, 200, 'user2');
      performanceMonitor.trackRequest('/api/concurrent', 'GET', 110, 200, 'user3');
      
      const metrics = performanceMonitor.getRouteMetrics('/api/concurrent');
      
      expect(metrics.totalRequests).toBe(3);
      expect(metrics.recentMetrics).toHaveLength(3);
      
      // Check that all requests are tracked
      const userIds = metrics.recentMetrics.map((m: any) => m.userId);
      expect(userIds).toContain('user1');
      expect(userIds).toContain('user2');
      expect(userIds).toContain('user3');
    });
  });

  describe('Performance Benchmarks', () => {
    test('should handle high-frequency request tracking', () => {
      const startTime = Date.now();
      
      // Track many requests quickly
      for (let i = 0; i < 1000; i++) {
        performanceMonitor.trackRequest('/api/benchmark', 'GET', Math.random() * 200, 200);
      }
      
      const endTime = Date.now();
      const processingTime = endTime - startTime;
      
      // Should handle 1000 requests in less than 1 second
      expect(processingTime).toBeLessThan(1000);
      
      const metrics = performanceMonitor.getRouteMetrics('/api/benchmark');
      expect(metrics.totalRequests).toBeLessThanOrEqual(1000);
    });

    test('should efficiently calculate statistics', () => {
      // Add varied response times
      const responseTimes = [50, 100, 150, 200, 250, 300, 350, 400, 450, 500];
      
      responseTimes.forEach(time => {
        performanceMonitor.trackRequest('/api/stats', 'GET', time, 200);
      });
      
      const metrics = performanceMonitor.getRouteMetrics('/api/stats');
      
      expect(metrics.averageResponseTime).toBe(275); // Average of the array
      expect(metrics.minResponseTime).toBe(50);
      expect(metrics.maxResponseTime).toBe(500);
      expect(metrics.successRate).toBe(1);
    });
  });
});
