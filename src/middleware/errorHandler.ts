/**
 * Enhanced Error Handling System for SignumLBRI
 * Provides centralized error management with logging, monitoring, and user-friendly responses
 */

import { Request, Response, NextFunction } from 'express';
import logger from '../util/logger';
import { ValidationError } from 'express-validator';
import { MongoError } from 'mongodb';
import mongoose from 'mongoose';

export interface AppError extends Error {
  statusCode: number;
  isOperational: boolean;
  code?: string;
  severity?: 'low' | 'medium' | 'high' | 'critical';
  context?: Record<string, any>;
}

/**
 * Custom error classes for different error types
 */
export class ValidationAppError extends Error implements AppError {
  statusCode = 400;
  isOperational = true;
  severity: 'low' | 'medium' | 'high' | 'critical' = 'low';

  constructor(message: string, public context?: Record<string, any>) {
    super(message);
    this.name = 'ValidationAppError';
    Error.captureStackTrace(this, this.constructor);
  }
}

export class AuthenticationError extends Error implements AppError {
  statusCode = 401;
  isOperational = true;
  severity: 'low' | 'medium' | 'high' | 'critical' = 'medium';

  constructor(message: string = 'Authentication required', public context?: Record<string, any>) {
    super(message);
    this.name = 'AuthenticationError';
    Error.captureStackTrace(this, this.constructor);
  }
}

export class AuthorizationError extends Error implements AppError {
  statusCode = 403;
  isOperational = true;
  severity: 'low' | 'medium' | 'high' | 'critical' = 'medium';

  constructor(message: string = 'Insufficient permissions', public context?: Record<string, any>) {
    super(message);
    this.name = 'AuthorizationError';
    Error.captureStackTrace(this, this.constructor);
  }
}

export class NotFoundError extends Error implements AppError {
  statusCode = 404;
  isOperational = true;
  severity: 'low' | 'medium' | 'high' | 'critical' = 'low';

  constructor(resource: string = 'Resource', public context?: Record<string, any>) {
    super(`${resource} not found`);
    this.name = 'NotFoundError';
    Error.captureStackTrace(this, this.constructor);
  }
}

export class BusinessLogicError extends Error implements AppError {
  statusCode = 422;
  isOperational = true;
  severity: 'low' | 'medium' | 'high' | 'critical' = 'medium';

  constructor(message: string, public context?: Record<string, any>) {
    super(message);
    this.name = 'BusinessLogicError';
    Error.captureStackTrace(this, this.constructor);
  }
}

export class DatabaseError extends Error implements AppError {
  statusCode = 500;
  isOperational = true;
  severity: 'low' | 'medium' | 'high' | 'critical' = 'high';

  constructor(message: string, public context?: Record<string, any>) {
    super(message);
    this.name = 'DatabaseError';
    Error.captureStackTrace(this, this.constructor);
  }
}

export class ExternalServiceError extends Error implements AppError {
  statusCode = 503;
  isOperational = true;
  severity: 'low' | 'medium' | 'high' | 'critical' = 'medium';

  constructor(service: string, message?: string, public context?: Record<string, any>) {
    super(message || `External service ${service} is unavailable`);
    this.name = 'ExternalServiceError';
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Error transformation utilities
 */
export function transformError(error: any): AppError {
  // MongoDB errors
  if (error instanceof MongoError || error.name === 'MongoError') {
    if (error.code === 11000) {
      return new ValidationAppError('Duplicate entry detected', { 
        mongoCode: error.code,
        keyPattern: error.keyPattern 
      });
    }
    return new DatabaseError('Database operation failed', { 
      mongoError: error.message,
      mongoCode: error.code 
    });
  }

  // Mongoose validation errors
  if (error instanceof mongoose.Error.ValidationError) {
    const messages = Object.values(error.errors).map(e => e.message);
    return new ValidationAppError(`Validation failed: ${messages.join(', ')}`, {
      validationErrors: messages
    });
  }

  // Cast errors (invalid ObjectId, etc.)
  if (error instanceof mongoose.Error.CastError) {
    return new ValidationAppError(`Invalid ${error.path}: ${error.value}`, {
      path: error.path,
      value: error.value,
      type: error.kind
    });
  }

  // Express validator errors
  if (Array.isArray(error) && error.length > 0 && error[0].msg) {
    const messages = error.map((e: ValidationError) => e.msg);
    return new ValidationAppError(`Validation failed: ${messages.join(', ')}`, {
      validationErrors: error
    });
  }

  // Already transformed errors
  if (error.isOperational) {
    return error as AppError;
  }

  // Unknown errors - treat as internal server error
  return {
    ...error,
    statusCode: 500,
    isOperational: false,
    severity: 'critical'
  } as AppError;
}

/**
 * Enhanced error logging with context
 */
export function logError(error: AppError, req?: Request): void {
  const errorContext = {
    name: error.name,
    message: error.message,
    statusCode: error.statusCode,
    severity: error.severity,
    stack: error.stack,
    isOperational: error.isOperational,
    context: error.context,
    ...(req && {
      request: {
        method: req.method,
        url: req.url,
        originalUrl: req.originalUrl,
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        referer: req.get('Referer'),
        userId: req.user?.id,
        sessionId: req.sessionID,
        body: sanitizeLogData(req.body),
        query: sanitizeLogData(req.query),
        params: req.params
      }
    }),
    timestamp: new Date().toISOString()
  };

  // Log based on severity
  switch (error.severity) {
    case 'critical':
      logger.error('CRITICAL ERROR', errorContext);
      break;
    case 'high':
      logger.error('HIGH SEVERITY ERROR', errorContext);
      break;
    case 'medium':
      logger.warn('MEDIUM SEVERITY ERROR', errorContext);
      break;
    case 'low':
    default:
      logger.info('LOW SEVERITY ERROR', errorContext);
      break;
  }
}

/**
 * Sanitize sensitive data from logs
 */
function sanitizeLogData(data: any): any {
  if (!data || typeof data !== 'object') return data;

  const sensitiveFields = ['password', 'token', 'secret', 'apiKey', 'creditCard', 'ssn'];
  const sanitized = { ...data };

  Object.keys(sanitized).forEach(key => {
    if (sensitiveFields.some(field => key.toLowerCase().includes(field.toLowerCase()))) {
      sanitized[key] = '[REDACTED]';
    }
  });

  return sanitized;
}

/**
 * Central error handler middleware
 */
export function errorHandler(
  error: any,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const transformedError = transformError(error);
  
  // Log the error
  logError(transformedError, req);

  // Determine response based on environment and error type
  const isDevelopment = process.env.NODE_ENV === 'development';
  const isProduction = process.env.NODE_ENV === 'production';

  let responseMessage = transformedError.message;
  let statusCode = transformedError.statusCode || 500;

  // In production, don't leak internal error details
  if (isProduction && !transformedError.isOperational) {
    responseMessage = 'Internal Server Error';
    statusCode = 500;
  }

  // For API requests, return JSON
  if (req.xhr || req.get('Content-Type') === 'application/json' || req.originalUrl.startsWith('/api/')) {
    return res.status(statusCode).json({
      error: {
        message: responseMessage,
        statusCode,
        ...(isDevelopment && {
          stack: transformedError.stack,
          context: transformedError.context
        })
      }
    });
  }

  // For regular requests, render error page
  res.status(statusCode).render('error', {
    message: responseMessage,
    statusCode,
    error: isDevelopment ? transformedError : {},
    title: 'Error'
  });
}

/**
 * Async error wrapper for route handlers
 */
export function asyncHandler(fn: Function) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

/**
 * 404 Not Found handler
 */
export function notFoundHandler(req: Request, res: Response, next: NextFunction): void {
  const error = new NotFoundError('Page', {
    requestedUrl: req.originalUrl,
    method: req.method
  });
  next(error);
}

/**
 * Unhandled rejection and exception handlers
 */
export function setupGlobalErrorHandlers(): void {
  process.on('uncaughtException', (error: Error) => {
    logger.error('UNCAUGHT EXCEPTION - Server shutting down', {
      error: error.message,
      stack: error.stack
    });
    
    // Graceful shutdown
    process.exit(1);
  });

  process.on('unhandledRejection', (reason: any, promise: Promise<any>) => {
    logger.error('UNHANDLED REJECTION', {
      reason: reason?.message || reason,
      stack: reason?.stack,
      promise: promise.toString()
    });
    
    // Convert to exception and let uncaughtException handler deal with it
    throw new Error(`Unhandled Rejection: ${reason?.message || reason}`);
  });
}

/**
 * Health check endpoint with error monitoring
 */
export function healthCheck(req: Request, res: Response): void {
  const healthStatus = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    version: process.env.npm_package_version,
    environment: process.env.NODE_ENV,
    database: 'connected' // This should be dynamically checked
  };

  res.status(200).json(healthStatus);
}

/**
 * Error rate limiting for repeated errors
 */
const errorRateLimit = new Map<string, { count: number; lastSeen: number }>();

export function shouldRateLimit(error: AppError, req: Request): boolean {
  const key = `${req.ip}-${error.name}-${error.message}`;
  const now = Date.now();
  const existing = errorRateLimit.get(key);

  if (existing) {
    // Reset counter if it's been more than 5 minutes
    if (now - existing.lastSeen > 5 * 60 * 1000) {
      existing.count = 1;
      existing.lastSeen = now;
    } else {
      existing.count++;
      existing.lastSeen = now;
    }

    // Rate limit after 5 identical errors within 5 minutes
    return existing.count > 5;
  }

  errorRateLimit.set(key, { count: 1, lastSeen: now });
  return false;
}

export default {
  AppError,
  ValidationAppError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  BusinessLogicError,
  DatabaseError,
  ExternalServiceError,
  transformError,
  logError,
  errorHandler,
  asyncHandler,
  notFoundHandler,
  setupGlobalErrorHandlers,
  healthCheck
};
