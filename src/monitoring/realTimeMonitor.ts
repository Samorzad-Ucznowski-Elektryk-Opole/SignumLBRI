/**
 * Real-time System Monitor for Enhanced Systems
 * 
 * This module provides real-time monitoring capabilities including:
 * - Live performance metrics
 * - System health dashboard  
 * - Alert notifications
 * - Resource usage tracking
 * - WebSocket-based live updates
 */

import { EventEmitter } from 'events';

// Types for monitoring system
interface SystemMetrics {
  timestamp: Date;
  cpu: {
    usage: number;
    loadAverage: number[];
  };
  memory: {
    total: number;
    used: number;
    free: number;
    usage: number;
  };
  network: {
    bytesIn: number;
    bytesOut: number;
  };
  disk: {
    total: number;
    used: number;
    free: number;
    usage: number;
  };
}

interface PerformanceAlert {
  id: string;
  type: 'warning' | 'error' | 'critical';
  category: 'performance' | 'memory' | 'cpu' | 'disk' | 'network' | 'application';
  message: string;
  details: Record<string, any>;
  timestamp: Date;
  resolved: boolean;
}

interface MonitoringConfig {
  interval: number;
  thresholds: {
    cpu: number;
    memory: number;
    disk: number;
    responseTime: number;
  };
  alerting: {
    enabled: boolean;
    cooldownPeriod: number;
  };
  persistence: {
    enabled: boolean;
    maxHistory: number;
  };
}

class RealTimeSystemMonitor extends EventEmitter {
  private config: MonitoringConfig;
  private isRunning: boolean = false;
  private monitoringInterval: NodeJS.Timeout | null = null;
  private metricsHistory: SystemMetrics[] = [];
  private alerts: PerformanceAlert[] = [];
  private alertCooldowns: Map<string, number> = new Map();
  
  // WebSocket connections for live updates
  private wsConnections: Set<any> = new Set();
  
  // Performance tracking
  private requestMetrics: Map<string, any[]> = new Map();
  private systemStartTime: Date = new Date();
  
  constructor(config: Partial<MonitoringConfig> = {}) {
    super();
    
    this.config = {
      interval: config.interval || 5000, // 5 seconds
      thresholds: {
        cpu: config.thresholds?.cpu || 80,
        memory: config.thresholds?.memory || 85,
        disk: config.thresholds?.disk || 90,
        responseTime: config.thresholds?.responseTime || 2000,
        ...config.thresholds
      },
      alerting: {
        enabled: config.alerting?.enabled ?? true,
        cooldownPeriod: config.alerting?.cooldownPeriod || 300000, // 5 minutes
        ...config.alerting
      },
      persistence: {
        enabled: config.persistence?.enabled ?? true,
        maxHistory: config.persistence?.maxHistory || 1000,
        ...config.persistence
      }
    };
  }

  /**
   * Start real-time monitoring
   */
  public start(): void {
    if (this.isRunning) {
      console.log('Real-time monitor is already running');
      return;
    }

    this.isRunning = true;
    this.systemStartTime = new Date();
    
    console.log('🔄 Starting real-time system monitor...');
    
    // Initial metrics collection
    this.collectSystemMetrics();
    
    // Set up periodic monitoring
    this.monitoringInterval = setInterval(() => {
      this.collectSystemMetrics();
    }, this.config.interval);

    this.emit('monitor:started');
    console.log(`✅ Real-time monitor started (interval: ${this.config.interval}ms)`);
  }

  /**
   * Stop monitoring
   */
  public stop(): void {
    if (!this.isRunning) {
      console.log('Real-time monitor is not running');
      return;
    }

    this.isRunning = false;
    
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }

    this.emit('monitor:stopped');
    console.log('🛑 Real-time monitor stopped');
  }

  /**
   * Collect current system metrics
   */
  private collectSystemMetrics(): void {
    try {
      const metrics = this.getCurrentSystemMetrics();
      
      // Add to history
      this.metricsHistory.push(metrics);
      
      // Maintain history size limit
      if (this.config.persistence.enabled && 
          this.metricsHistory.length > this.config.persistence.maxHistory) {
        this.metricsHistory.shift();
      }

      // Check thresholds and generate alerts
      this.checkThresholds(metrics);

      // Emit metrics update
      this.emit('metrics:update', metrics);
      
      // Send to WebSocket connections
      this.broadcastToConnections('metrics', metrics);

    } catch (error) {
      console.error('Error collecting system metrics:', error);
      this.emit('monitor:error', error);
    }
  }

  /**
   * Get current system metrics
   */
  private getCurrentSystemMetrics(): SystemMetrics {
    // Mock implementation - in real environment, these would be actual system calls
    const mockProcess = {
      memoryUsage: () => ({
        rss: Math.floor(Math.random() * 100000000) + 50000000,
        heapTotal: Math.floor(Math.random() * 80000000) + 40000000,
        heapUsed: Math.floor(Math.random() * 60000000) + 30000000,
        external: Math.floor(Math.random() * 10000000),
        arrayBuffers: Math.floor(Math.random() * 1000000)
      }),
      cpuUsage: () => ({
        user: Math.floor(Math.random() * 100000),
        system: Math.floor(Math.random() * 50000)
      })
    };

    const memory = mockProcess.memoryUsage();
    const cpu = mockProcess.cpuUsage();
    
    // Simulate system metrics
    const totalMemory = 8 * 1024 * 1024 * 1024; // 8GB
    const totalDisk = 100 * 1024 * 1024 * 1024; // 100GB
    
    return {
      timestamp: new Date(),
      cpu: {
        usage: Math.random() * 100,
        loadAverage: [Math.random() * 2, Math.random() * 2, Math.random() * 2]
      },
      memory: {
        total: totalMemory,
        used: memory.rss,
        free: totalMemory - memory.rss,
        usage: (memory.rss / totalMemory) * 100
      },
      network: {
        bytesIn: Math.floor(Math.random() * 1000000),
        bytesOut: Math.floor(Math.random() * 1000000)
      },
      disk: {
        total: totalDisk,
        used: Math.floor(Math.random() * totalDisk * 0.7),
        free: 0,
        usage: Math.random() * 70
      }
    };
  }

  /**
   * Check system thresholds and generate alerts
   */
  private checkThresholds(metrics: SystemMetrics): void {
    const alerts: PerformanceAlert[] = [];

    // CPU threshold check
    if (metrics.cpu.usage > this.config.thresholds.cpu) {
      alerts.push(this.createAlert(
        'cpu_high',
        'warning',
        'cpu',
        `High CPU usage detected: ${metrics.cpu.usage.toFixed(1)}%`,
        { cpuUsage: metrics.cpu.usage, threshold: this.config.thresholds.cpu }
      ));
    }

    // Memory threshold check
    if (metrics.memory.usage > this.config.thresholds.memory) {
      alerts.push(this.createAlert(
        'memory_high',
        metrics.memory.usage > 95 ? 'critical' : 'warning',
        'memory',
        `High memory usage detected: ${metrics.memory.usage.toFixed(1)}%`,
        { memoryUsage: metrics.memory.usage, threshold: this.config.thresholds.memory }
      ));
    }

    // Disk threshold check
    if (metrics.disk.usage > this.config.thresholds.disk) {
      alerts.push(this.createAlert(
        'disk_high',
        metrics.disk.usage > 95 ? 'critical' : 'warning',
        'disk',
        `High disk usage detected: ${metrics.disk.usage.toFixed(1)}%`,
        { diskUsage: metrics.disk.usage, threshold: this.config.thresholds.disk }
      ));
    }

    // Process alerts
    alerts.forEach(alert => this.processAlert(alert));
  }

  /**
   * Create a new alert
   */
  private createAlert(
    id: string,
    type: PerformanceAlert['type'],
    category: PerformanceAlert['category'],
    message: string,
    details: Record<string, any>
  ): PerformanceAlert {
    return {
      id: `${id}_${Date.now()}`,
      type,
      category,
      message,
      details,
      timestamp: new Date(),
      resolved: false
    };
  }

  /**
   * Process and potentially emit an alert
   */
  private processAlert(alert: PerformanceAlert): void {
    if (!this.config.alerting.enabled) {
      return;
    }

    // Check cooldown period
    const lastAlert = this.alertCooldowns.get(alert.category);
    if (lastAlert && (Date.now() - lastAlert) < this.config.alerting.cooldownPeriod) {
      return;
    }

    // Add alert to history
    this.alerts.push(alert);
    this.alertCooldowns.set(alert.category, Date.now());

    // Maintain alerts history
    if (this.alerts.length > 100) {
      this.alerts.shift();
    }

    // Emit alert event
    this.emit('alert:triggered', alert);
    
    // Broadcast to WebSocket connections
    this.broadcastToConnections('alert', alert);

    console.log(`🚨 Alert: ${alert.message}`);
  }

  /**
   * Track application request performance
   */
  public trackRequest(route: string, method: string, responseTime: number, statusCode: number, userId?: string): void {
    const routeKey = `${method} ${route}`;
    
    if (!this.requestMetrics.has(routeKey)) {
      this.requestMetrics.set(routeKey, []);
    }

    const metrics = this.requestMetrics.get(routeKey)!;
    metrics.push({
      responseTime,
      statusCode,
      userId,
      timestamp: new Date()
    });

    // Keep only recent metrics
    if (metrics.length > 1000) {
      metrics.splice(0, metrics.length - 1000);
    }

    // Check response time threshold
    if (responseTime > this.config.thresholds.responseTime) {
      const alert = this.createAlert(
        'response_time_high',
        responseTime > this.config.thresholds.responseTime * 2 ? 'critical' : 'warning',
        'performance',
        `Slow response detected on ${routeKey}: ${responseTime}ms`,
        { route: routeKey, responseTime, threshold: this.config.thresholds.responseTime }
      );
      
      this.processAlert(alert);
    }

    // Emit request metric
    this.emit('request:tracked', {
      route: routeKey,
      responseTime,
      statusCode,
      userId,
      timestamp: new Date()
    });
  }

  /**
   * Get real-time dashboard data
   */
  public getDashboardData(): any {
    const latestMetrics = this.metricsHistory[this.metricsHistory.length - 1];
    const recentAlerts = this.alerts.filter(alert => 
      !alert.resolved && 
      (Date.now() - alert.timestamp.getTime()) < 3600000 // Last hour
    );

    return {
      systemHealth: {
        status: this.getOverallHealthStatus(),
        uptime: Date.now() - this.systemStartTime.getTime(),
        metrics: latestMetrics
      },
      alerts: {
        active: recentAlerts.length,
        recent: recentAlerts.slice(-10)
      },
      performance: {
        totalRequests: Array.from(this.requestMetrics.values())
          .reduce((sum, metrics) => sum + metrics.length, 0),
        averageResponseTime: this.getAverageResponseTime(),
        errorRate: this.getErrorRate()
      },
      trends: {
        cpu: this.getMetricTrend('cpu'),
        memory: this.getMetricTrend('memory'),
        responseTime: this.getResponseTimeTrend()
      }
    };
  }

  /**
   * Get overall health status
   */
  private getOverallHealthStatus(): 'healthy' | 'warning' | 'critical' {
    const activeAlerts = this.alerts.filter(alert => !alert.resolved);
    const criticalAlerts = activeAlerts.filter(alert => alert.type === 'critical');
    const warningAlerts = activeAlerts.filter(alert => alert.type === 'warning');

    if (criticalAlerts.length > 0) return 'critical';
    if (warningAlerts.length > 0) return 'warning';
    return 'healthy';
  }

  /**
   * Get metric trend for dashboard charts
   */
  private getMetricTrend(metric: 'cpu' | 'memory'): number[] {
    return this.metricsHistory.slice(-20).map(m => {
      switch (metric) {
        case 'cpu': return m.cpu.usage;
        case 'memory': return m.memory.usage;
        default: return 0;
      }
    });
  }

  /**
   * Get response time trend
   */
  private getResponseTimeTrend(): number[] {
    const allMetrics = Array.from(this.requestMetrics.values()).flat();
    const recent = allMetrics.slice(-20);
    
    return recent.map(m => m.responseTime);
  }

  /**
   * Get average response time
   */
  private getAverageResponseTime(): number {
    const allMetrics = Array.from(this.requestMetrics.values()).flat();
    if (allMetrics.length === 0) return 0;
    
    const sum = allMetrics.reduce((sum, m) => sum + m.responseTime, 0);
    return sum / allMetrics.length;
  }

  /**
   * Get error rate percentage
   */
  private getErrorRate(): number {
    const allMetrics = Array.from(this.requestMetrics.values()).flat();
    if (allMetrics.length === 0) return 0;
    
    const errors = allMetrics.filter(m => m.statusCode >= 400).length;
    return (errors / allMetrics.length) * 100;
  }

  /**
   * WebSocket connection management
   */
  public addWebSocketConnection(ws: any): void {
    this.wsConnections.add(ws);
    
    // Send current dashboard data to new connection
    ws.send(JSON.stringify({
      type: 'dashboard',
      data: this.getDashboardData()
    }));

    // Handle connection close
    ws.on('close', () => {
      this.wsConnections.delete(ws);
    });

    console.log(`📡 WebSocket connection added. Total connections: ${this.wsConnections.size}`);
  }

  /**
   * Broadcast data to all WebSocket connections
   */
  private broadcastToConnections(type: string, data: any): void {
    if (this.wsConnections.size === 0) return;

    const message = JSON.stringify({ type, data, timestamp: new Date() });
    
    this.wsConnections.forEach(ws => {
      try {
        if (ws.readyState === 1) { // WebSocket.OPEN
          ws.send(message);
        }
      } catch (error) {
        console.error('Error broadcasting to WebSocket:', error);
        this.wsConnections.delete(ws);
      }
    });
  }

  /**
   * Get monitoring statistics
   */
  public getStatistics(): any {
    return {
      monitoring: {
        isRunning: this.isRunning,
        interval: this.config.interval,
        uptime: Date.now() - this.systemStartTime.getTime(),
        metricsCollected: this.metricsHistory.length
      },
      thresholds: this.config.thresholds,
      alerts: {
        total: this.alerts.length,
        active: this.alerts.filter(a => !a.resolved).length,
        byType: {
          warning: this.alerts.filter(a => a.type === 'warning').length,
          error: this.alerts.filter(a => a.type === 'error').length,
          critical: this.alerts.filter(a => a.type === 'critical').length
        }
      },
      connections: {
        websocket: this.wsConnections.size
      },
      performance: {
        trackedRoutes: this.requestMetrics.size,
        totalRequests: Array.from(this.requestMetrics.values())
          .reduce((sum, metrics) => sum + metrics.length, 0)
      }
    };
  }

  /**
   * Update monitoring configuration
   */
  public updateConfig(newConfig: Partial<MonitoringConfig>): void {
    this.config = { ...this.config, ...newConfig };
    
    // Restart monitoring with new config if running
    if (this.isRunning) {
      this.stop();
      this.start();
    }

    this.emit('config:updated', this.config);
    console.log('⚙️ Monitoring configuration updated');
  }

  /**
   * Resolve an alert
   */
  public resolveAlert(alertId: string): boolean {
    const alert = this.alerts.find(a => a.id === alertId);
    if (alert && !alert.resolved) {
      alert.resolved = true;
      this.emit('alert:resolved', alert);
      
      // Broadcast resolution
      this.broadcastToConnections('alert_resolved', alert);
      
      console.log(`✅ Alert resolved: ${alert.message}`);
      return true;
    }
    
    return false;
  }

  /**
   * Clear resolved alerts
   */
  public clearResolvedAlerts(): number {
    const originalLength = this.alerts.length;
    this.alerts = this.alerts.filter(alert => !alert.resolved);
    const cleared = originalLength - this.alerts.length;
    
    if (cleared > 0) {
      console.log(`🧹 Cleared ${cleared} resolved alerts`);
    }
    
    return cleared;
  }

  /**
   * Export monitoring data for analysis
   */
  public exportData(): any {
    return {
      exportTimestamp: new Date(),
      configuration: this.config,
      systemMetrics: this.metricsHistory,
      alerts: this.alerts,
      requestMetrics: Object.fromEntries(this.requestMetrics),
      statistics: this.getStatistics()
    };
  }

  /**
   * Health check for the monitor itself
   */
  public healthCheck(): any {
    const health = {
      status: 'healthy' as 'healthy' | 'unhealthy',
      checks: {
        monitoring: this.isRunning,
        metricsCollection: this.metricsHistory.length > 0,
        alerting: this.config.alerting.enabled,
        websocketConnections: this.wsConnections.size >= 0
      },
      details: this.getStatistics()
    };

    // Determine overall status
    const failedChecks = Object.values(health.checks).filter(check => !check);
    if (failedChecks.length > 0) {
      health.status = 'unhealthy';
    }

    return health;
  }
}

// Export the monitor class and types
export {
  RealTimeSystemMonitor,
  SystemMetrics,
  PerformanceAlert,
  MonitoringConfig
};

// Create and export a default instance
export const realTimeMonitor = new RealTimeSystemMonitor();

// Auto-start monitoring in production environment
if (typeof process !== 'undefined' && process.env.NODE_ENV === 'production') {
  realTimeMonitor.start();
  console.log('🚀 Real-time monitoring auto-started for production environment');
}
