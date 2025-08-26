/**
 * Enhanced Logging System - Advanced Logging with Multiple Outputs
 * Building on existing logger.ts with structured logging and advanced features
 */

// Log levels and interfaces
export enum LogLevel {
  ERROR = 0,
  WARN = 1,
  INFO = 2,
  DEBUG = 3,
  TRACE = 4
}

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  metadata?: Record<string, any>;
  category?: string;
  userId?: string;
  requestId?: string;
  sessionId?: string;
  ip?: string;
  userAgent?: string;
  stack?: string;
}

export interface LoggerConfig {
  level: LogLevel;
  enableConsole: boolean;
  enableFile: boolean;
  enableStructured: boolean;
  maxFileSize: number;
  maxFiles: number;
  logDirectory: string;
  categories: string[];
}

// Enhanced logger implementation
export class EnhancedLogger {
  private config: LoggerConfig;
  private logBuffer: LogEntry[] = [];
  private flushInterval?: any;
  
  constructor(config?: Partial<LoggerConfig>) {
    this.config = {
      level: LogLevel.INFO,
      enableConsole: true,
      enableFile: false, // Disabled until file system is available
      enableStructured: true,
      maxFileSize: 10 * 1024 * 1024, // 10MB
      maxFiles: 5,
      logDirectory: './logs',
      categories: ['system', 'auth', 'database', 'api', 'performance', 'error'],
      ...config
    };
    
    // Initialize periodic log flushing
    if (this.config.enableFile) {
      this.flushInterval = setInterval(() => {
        this.flushLogs();
      }, 5000); // Flush every 5 seconds
    }
  }
  
  // Main logging method
  private log(level: LogLevel, message: string, metadata?: Record<string, any>, category?: string): void {
    if (level > this.config.level) return;
    
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      metadata,
      category
    };
    
    // Add to buffer for file logging
    if (this.config.enableFile) {
      this.logBuffer.push(entry);
    }
    
    // Console output
    if (this.config.enableConsole) {
      this.writeToConsole(entry);
    }
  }
  
  // Public logging methods
  error(message: string, metadata?: Record<string, any>, category: string = 'error'): void {
    this.log(LogLevel.ERROR, message, metadata, category);
  }
  
  warn(message: string, metadata?: Record<string, any>, category: string = 'system'): void {
    this.log(LogLevel.WARN, message, metadata, category);
  }
  
  info(message: string, metadata?: Record<string, any>, category: string = 'system'): void {
    this.log(LogLevel.INFO, message, metadata, category);
  }
  
  debug(message: string, metadata?: Record<string, any>, category: string = 'system'): void {
    this.log(LogLevel.DEBUG, message, metadata, category);
  }
  
  trace(message: string, metadata?: Record<string, any>, category: string = 'system'): void {
    this.log(LogLevel.TRACE, message, metadata, category);
  }
  
  // Specialized logging methods
  logRequest(req: any, res: any, duration?: number): void {
    this.info('HTTP Request', {
      method: req.method,
      url: req.originalUrl || req.url,
      statusCode: res.statusCode,
      duration: duration ? `${duration}ms` : undefined,
      userAgent: req.get('User-Agent'),
      ip: req.ip || req.connection?.remoteAddress,
      userId: req.user?.id,
      sessionId: req.session?.id
    }, 'api');
  }
  
  logDatabaseQuery(operation: string, collection: string, duration: number, error?: any): void {
    if (error) {
      this.error('Database Query Failed', {
        operation,
        collection,
        duration: `${duration}ms`,
        error: error.message,
        stack: error.stack
      }, 'database');
    } else {
      this.debug('Database Query', {
        operation,
        collection,
        duration: `${duration}ms`
      }, 'database');
    }
  }
  
  logAuthentication(event: string, userId?: string, success: boolean = true, metadata?: Record<string, any>): void {
    const level = success ? LogLevel.INFO : LogLevel.WARN;
    this.log(level, `Authentication: ${event}`, {
      userId,
      success,
      ...metadata
    }, 'auth');
  }
  
  logPerformanceMetric(metric: string, value: number, unit: string = 'ms', metadata?: Record<string, any>): void {
    this.info(`Performance Metric: ${metric}`, {
      value,
      unit,
      ...metadata
    }, 'performance');
  }
  
  logBusinessEvent(event: string, metadata?: Record<string, any>): void {
    this.info(`Business Event: ${event}`, metadata, 'business');
  }
  
  logSecurityEvent(event: string, severity: 'low' | 'medium' | 'high', metadata?: Record<string, any>): void {
    const level = severity === 'high' ? LogLevel.ERROR : severity === 'medium' ? LogLevel.WARN : LogLevel.INFO;
    this.log(level, `Security Event: ${event}`, {
      severity,
      ...metadata
    }, 'security');
  }
  
  // Structured logging for API responses
  logApiResponse(req: any, res: any, body: any, duration: number): void {
    const logData = {
      request: {
        method: req.method,
        url: req.originalUrl || req.url,
        headers: this.sanitizeHeaders(req.headers),
        query: req.query,
        params: req.params,
        body: this.sanitizeBody(req.body)
      },
      response: {
        statusCode: res.statusCode,
        headers: this.sanitizeHeaders(res.getHeaders()),
        body: this.sanitizeBody(body)
      },
      timing: {
        duration: `${duration}ms`,
        timestamp: new Date().toISOString()
      },
      user: {
        id: req.user?.id,
        email: req.user?.email,
        role: req.user?.role
      },
      client: {
        ip: req.ip || req.connection?.remoteAddress,
        userAgent: req.get('User-Agent')
      }
    };
    
    if (res.statusCode >= 400) {
      this.error('API Error Response', logData, 'api');
    } else {
      this.debug('API Response', logData, 'api');
    }
  }
  
  // Error logging with stack traces
  logError(error: Error, context?: Record<string, any>, category: string = 'error'): void {
    this.error(error.message, {
      name: error.name,
      stack: error.stack,
      context
    }, category);
  }
  
  // Batch logging for performance
  logBatch(entries: Array<{ level: LogLevel; message: string; metadata?: Record<string, any>; category?: string }>): void {
    entries.forEach(entry => {
      this.log(entry.level, entry.message, entry.metadata, entry.category);
    });
  }
  
  // Query logs by criteria
  queryLogs(criteria: {
    level?: LogLevel;
    category?: string;
    timeFrom?: Date;
    timeTo?: Date;
    userId?: string;
    limit?: number;
  }): LogEntry[] {
    let filteredLogs = [...this.logBuffer];
    
    if (criteria.level !== undefined) {
      filteredLogs = filteredLogs.filter(log => log.level <= criteria.level!);
    }
    
    if (criteria.category) {
      filteredLogs = filteredLogs.filter(log => log.category === criteria.category);
    }
    
    if (criteria.timeFrom) {
      filteredLogs = filteredLogs.filter(log => new Date(log.timestamp) >= criteria.timeFrom!);
    }
    
    if (criteria.timeTo) {
      filteredLogs = filteredLogs.filter(log => new Date(log.timestamp) <= criteria.timeTo!);
    }
    
    if (criteria.userId) {
      filteredLogs = filteredLogs.filter(log => log.userId === criteria.userId);
    }
    
    if (criteria.limit) {
      filteredLogs = filteredLogs.slice(0, criteria.limit);
    }
    
    return filteredLogs;
  }
  
  // Get logging statistics
  getStats(): {
    totalLogs: number;
    logsByLevel: Record<string, number>;
    logsByCategory: Record<string, number>;
    recentErrors: LogEntry[];
  } {
    const stats = {
      totalLogs: this.logBuffer.length,
      logsByLevel: {} as Record<string, number>,
      logsByCategory: {} as Record<string, number>,
      recentErrors: [] as LogEntry[]
    };
    
    // Count by level
    Object.values(LogLevel).forEach(level => {
      if (typeof level === 'number') {
        const levelName = LogLevel[level];
        stats.logsByLevel[levelName] = this.logBuffer.filter(log => log.level === level).length;
      }
    });
    
    // Count by category
    this.logBuffer.forEach(log => {
      const category = log.category || 'unknown';
      stats.logsByCategory[category] = (stats.logsByCategory[category] || 0) + 1;
    });
    
    // Recent errors (last 10)
    stats.recentErrors = this.logBuffer
      .filter(log => log.level === LogLevel.ERROR)
      .slice(-10);
    
    return stats;
  }
  
  // Clear logs
  clearLogs(): void {
    this.logBuffer = [];
    console.log('[LOGGER] Log buffer cleared');
  }
  
  // Change log level dynamically
  setLogLevel(level: LogLevel): void {
    this.config.level = level;
    this.info(`Log level changed to ${LogLevel[level]}`, { level });
  }
  
  // Health check for logger
  healthCheck(): { status: string; stats: any; config: any } {
    const stats = this.getStats();
    return {
      status: 'healthy',
      stats,
      config: {
        level: LogLevel[this.config.level],
        enableConsole: this.config.enableConsole,
        enableFile: this.config.enableFile,
        bufferSize: this.logBuffer.length
      }
    };
  }
  
  // Private helper methods
  private writeToConsole(entry: LogEntry): void {
    const levelName = LogLevel[entry.level];
    const timestamp = entry.timestamp;
    const category = entry.category ? `[${entry.category.toUpperCase()}]` : '';
    
    let logMessage = `${timestamp} ${levelName} ${category} ${entry.message}`;
    
    if (entry.metadata && Object.keys(entry.metadata).length > 0) {
      if (this.config.enableStructured) {
        logMessage += ` ${JSON.stringify(entry.metadata)}`;
      } else {
        logMessage += ` ${this.formatMetadata(entry.metadata)}`;
      }
    }
    
    // Use appropriate console method
    switch (entry.level) {
      case LogLevel.ERROR:
        console.error(logMessage);
        break;
      case LogLevel.WARN:
        console.warn(logMessage);
        break;
      case LogLevel.DEBUG:
      case LogLevel.TRACE:
        console.debug(logMessage);
        break;
      default:
        console.log(logMessage);
    }
  }
  
  private formatMetadata(metadata: Record<string, any>): string {
    return Object.entries(metadata)
      .map(([key, value]) => `${key}=${typeof value === 'object' ? JSON.stringify(value) : value}`)
      .join(' ');
  }
  
  private sanitizeHeaders(headers: any): Record<string, any> {
    const sanitized = { ...headers };
    
    // Remove sensitive headers
    const sensitiveHeaders = ['authorization', 'cookie', 'x-api-key', 'x-auth-token'];
    sensitiveHeaders.forEach(header => {
      if (sanitized[header]) {
        sanitized[header] = '[REDACTED]';
      }
    });
    
    return sanitized;
  }
  
  private sanitizeBody(body: any): any {
    if (!body || typeof body !== 'object') return body;
    
    const sanitized = { ...body };
    
    // Remove sensitive fields
    const sensitiveFields = ['password', 'token', 'secret', 'apiKey', 'creditCard'];
    sensitiveFields.forEach(field => {
      if (sanitized[field]) {
        sanitized[field] = '[REDACTED]';
      }
    });
    
    return sanitized;
  }
  
  private flushLogs(): void {
    if (this.logBuffer.length === 0) return;
    
    // TODO: Implement file writing when file system is available
    console.log(`[LOGGER] Would flush ${this.logBuffer.length} log entries to file`);
    
    // For now, keep only recent logs in memory (last 1000)
    if (this.logBuffer.length > 1000) {
      this.logBuffer = this.logBuffer.slice(-1000);
    }
  }
  
  // Cleanup
  destroy(): void {
    if (this.flushInterval) {
      clearInterval(this.flushInterval);
    }
    this.flushLogs();
  }
}

// Create global logger instance
export const enhancedLogger = new EnhancedLogger({
  level: LogLevel.INFO,
  enableConsole: true,
  enableFile: false,
  enableStructured: true
});

// Export for compatibility with existing code
export const logger = enhancedLogger;

// Middleware factory for request logging
export const createLoggingMiddleware = () => {
  return (req: any, res: any, next: any) => {
    const startTime = Date.now();
    
    // Override res.end to capture response
    const originalEnd = res.end;
    res.end = function(chunk: any, encoding?: any) {
      const duration = Date.now() - startTime;
      enhancedLogger.logRequest(req, res, duration);
      
      originalEnd.call(res, chunk, encoding);
    };
    
    next();
  };
};

// Error logging middleware
export const createErrorLoggingMiddleware = () => {
  return (error: Error, req: any, res: any, next: any) => {
    enhancedLogger.logError(error, {
      url: req.originalUrl || req.url,
      method: req.method,
      userId: req.user?.id,
      ip: req.ip,
      userAgent: req.get('User-Agent')
    });
    
    next(error);
  };
};

// Initialize logging system
export const initializeLogging = (): void => {
  console.log('[LOGGER] Enhanced logging system initialized');
  
  // Log system startup
  enhancedLogger.info('System starting up', {
    timestamp: new Date().toISOString(),
    nodeVersion: (globalThis as any).process?.version || 'unknown',
    platform: (globalThis as any).process?.platform || 'unknown'
  }, 'system');
  
  // Handle uncaught exceptions
  try {
    const processObj = (globalThis as any).process;
    if (processObj) {
      processObj.on('uncaughtException', (error: Error) => {
        enhancedLogger.logError(error, { type: 'uncaughtException' }, 'system');
      });
      
      processObj.on('unhandledRejection', (reason: any, promise: Promise<any>) => {
        enhancedLogger.error('Unhandled Promise Rejection', {
          reason: reason?.message || reason,
          stack: reason?.stack
        }, 'system');
      });
    }
  } catch (e) {
    // Ignore if process events are not available
  }
};

export default enhancedLogger;
