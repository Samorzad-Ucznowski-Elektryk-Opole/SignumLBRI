/**
 * Enhanced Error Handler Test Suite
 * 
 * Comprehensive tests for the advanced error handling system
 */

import { Request, Response, NextFunction } from 'express';
import {
  AppError,
  ValidationAppError,
  AuthenticationError,
  AuthorizationError,
  BusinessLogicError,
  ExternalServiceError,
  DatabaseError,
  errorHandler,
  transformError
} from '../../src/middleware/errorHandler';

// Mock implementations
const mockRequest = () => {
  const req = {} as Request;
  req.method = 'GET';
  req.url = '/test';
  req.headers = {};
  req.ip = '127.0.0.1';
  return req;
};

const mockResponse = () => {
  const res = {} as Response;
  res.status = jest.fn().mockReturnThis();
  res.json = jest.fn().mockReturnThis();
  res.locals = {};
  return res;
};

const mockNext = jest.fn() as NextFunction;

describe('Enhanced Error Handler', () => {
  let req: Request;
  let res: Response;
  let next: NextFunction;

  beforeEach(() => {
    req = mockRequest();
    res = mockResponse();
    next = mockNext;
    jest.clearAllMocks();
  });

  describe('Error Classes', () => {
    test('ValidationAppError should create proper error structure', () => {
      const error = new ValidationAppError('Invalid email format', 'email');
      
      expect(error).toBeInstanceOf(AppError);
      expect(error.name).toBe('ValidationAppError');
      expect(error.message).toBe('Invalid email format');
      expect(error.statusCode).toBe(400);
      expect(error.field).toBe('email');
      expect(error.isOperational).toBe(true);
    });

    test('AuthenticationError should create proper error structure', () => {
      const error = new AuthenticationError('Invalid credentials');
      
      expect(error).toBeInstanceOf(AppError);
      expect(error.name).toBe('AuthenticationError');
      expect(error.message).toBe('Invalid credentials');
      expect(error.statusCode).toBe(401);
      expect(error.isOperational).toBe(true);
    });

    test('AuthorizationError should create proper error structure', () => {
      const error = new AuthorizationError('Access denied', 'admin');
      
      expect(error).toBeInstanceOf(AppError);
      expect(error.name).toBe('AuthorizationError');
      expect(error.message).toBe('Access denied');
      expect(error.statusCode).toBe(403);
      expect(error.requiredRole).toBe('admin');
      expect(error.isOperational).toBe(true);
    });

    test('BusinessLogicError should create proper error structure', () => {
      const error = new BusinessLogicError('Insufficient funds', 'INSUFFICIENT_BALANCE');
      
      expect(error).toBeInstanceOf(AppError);
      expect(error.name).toBe('BusinessLogicError');
      expect(error.message).toBe('Insufficient funds');
      expect(error.statusCode).toBe(422);
      expect(error.code).toBe('INSUFFICIENT_BALANCE');
      expect(error.isOperational).toBe(true);
    });

    test('ExternalServiceError should create proper error structure', () => {
      const error = new ExternalServiceError('Payment gateway timeout', 'PaymentService');
      
      expect(error).toBeInstanceOf(AppError);
      expect(error.name).toBe('ExternalServiceError');
      expect(error.message).toBe('Payment gateway timeout');
      expect(error.statusCode).toBe(503);
      expect(error.service).toBe('PaymentService');
      expect(error.isOperational).toBe(true);
    });

    test('DatabaseError should create proper error structure', () => {
      const error = new DatabaseError('Connection timeout', 'TIMEOUT', 'users');
      
      expect(error).toBeInstanceOf(AppError);
      expect(error.name).toBe('DatabaseError');
      expect(error.message).toBe('Connection timeout');
      expect(error.statusCode).toBe(500);
      expect(error.code).toBe('TIMEOUT');
      expect(error.table).toBe('users');
      expect(error.isOperational).toBe(true);
    });
  });

  describe('Error Transformation', () => {
    test('should transform mongoose validation error', () => {
      const mongooseError = {
        name: 'ValidationError',
        errors: {
          email: { message: 'Email is required', path: 'email' },
          name: { message: 'Name is required', path: 'name' }
        }
      };

      const transformed = transformError(mongooseError);
      
      expect(transformed).toBeInstanceOf(ValidationAppError);
      expect(transformed.message).toContain('Validation failed');
      expect(transformed.details).toEqual([
        { field: 'email', message: 'Email is required' },
        { field: 'name', message: 'Name is required' }
      ]);
    });

    test('should transform mongoose duplicate key error', () => {
      const duplicateError = {
        name: 'MongoError',
        code: 11000,
        keyPattern: { email: 1 },
        keyValue: { email: 'test@example.com' }
      };

      const transformed = transformError(duplicateError);
      
      expect(transformed).toBeInstanceOf(ValidationAppError);
      expect(transformed.message).toContain('already exists');
      expect(transformed.field).toBe('email');
    });

    test('should transform JWT errors', () => {
      const jwtError = {
        name: 'JsonWebTokenError',
        message: 'invalid signature'
      };

      const transformed = transformError(jwtError);
      
      expect(transformed).toBeInstanceOf(AuthenticationError);
      expect(transformed.message).toBe('Invalid or expired token');
    });

    test('should pass through AppError instances', () => {
      const appError = new ValidationAppError('Test error');
      
      const transformed = transformError(appError);
      
      expect(transformed).toBe(appError);
    });

    test('should transform generic errors', () => {
      const genericError = new Error('Something went wrong');
      
      const transformed = transformError(genericError);
      
      expect(transformed).toBeInstanceOf(AppError);
      expect(transformed.message).toBe('Something went wrong');
      expect(transformed.statusCode).toBe(500);
    });
  });

  describe('Error Handler Middleware', () => {
    test('should handle ValidationAppError correctly', () => {
      const error = new ValidationAppError('Invalid input', 'email');
      
      errorHandler(error, req, res, next);
      
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: {
          type: 'ValidationAppError',
          message: 'Invalid input',
          field: 'email',
          timestamp: expect.any(String),
          path: '/test',
          method: 'GET'
        }
      });
    });

    test('should handle AuthenticationError correctly', () => {
      const error = new AuthenticationError('Invalid credentials');
      
      errorHandler(error, req, res, next);
      
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        error: {
          type: 'AuthenticationError',
          message: 'Invalid credentials',
          timestamp: expect.any(String),
          path: '/test',
          method: 'GET'
        }
      });
    });

    test('should handle BusinessLogicError correctly', () => {
      const error = new BusinessLogicError('Insufficient funds', 'INSUFFICIENT_BALANCE');
      
      errorHandler(error, req, res, next);
      
      expect(res.status).toHaveBeenCalledWith(422);
      expect(res.json).toHaveBeenCalledWith({
        error: {
          type: 'BusinessLogicError',
          message: 'Insufficient funds',
          code: 'INSUFFICIENT_BALANCE',
          timestamp: expect.any(String),
          path: '/test',
          method: 'GET'
        }
      });
    });

    test('should transform and handle non-AppError instances', () => {
      const genericError = new Error('Database connection failed');
      
      errorHandler(genericError, req, res, next);
      
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        error: {
          type: 'AppError',
          message: 'Database connection failed',
          timestamp: expect.any(String),
          path: '/test',
          method: 'GET'
        }
      });
    });

    test('should include stack trace in development mode', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';
      
      const error = new AppError('Test error', 500);
      error.stack = 'Error: Test error\n    at Object.<anonymous>';
      
      errorHandler(error, req, res, next);
      
      expect(res.json).toHaveBeenCalledWith({
        error: {
          type: 'AppError',
          message: 'Test error',
          stack: 'Error: Test error\n    at Object.<anonymous>',
          timestamp: expect.any(String),
          path: '/test',
          method: 'GET'
        }
      });
      
      process.env.NODE_ENV = originalEnv;
    });

    test('should not include stack trace in production mode', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';
      
      const error = new AppError('Test error', 500);
      error.stack = 'Error: Test error\n    at Object.<anonymous>';
      
      errorHandler(error, req, res, next);
      
      expect(res.json).toHaveBeenCalledWith({
        error: {
          type: 'AppError',
          message: 'Test error',
          timestamp: expect.any(String),
          path: '/test',
          method: 'GET'
        }
      });
      
      process.env.NODE_ENV = originalEnv;
    });

    test('should handle errors with sensitive data', () => {
      req.body = {
        email: 'test@example.com',
        password: 'secret123',
        creditCard: '1234-5678-9012-3456'
      };
      
      const error = new ValidationAppError('Invalid input');
      
      errorHandler(error, req, res, next);
      
      const responseCall = (res.json as jest.Mock).mock.calls[0][0];
      expect(responseCall.error.body).toEqual({
        email: 'test@example.com',
        password: '[REDACTED]',
        creditCard: '[REDACTED]'
      });
    });

    test('should increment error count in response locals', () => {
      const error = new AppError('Test error', 500);
      
      errorHandler(error, req, res, next);
      
      expect(res.locals.errorCount).toBe(1);
      
      // Second error
      errorHandler(error, req, res, next);
      expect(res.locals.errorCount).toBe(2);
    });

    test('should handle circular reference in error object', () => {
      const circularError: any = new Error('Circular reference test');
      circularError.circular = circularError;
      
      expect(() => {
        errorHandler(circularError, req, res, next);
      }).not.toThrow();
      
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalled();
    });
  });

  describe('Data Sanitization', () => {
    test('should sanitize password fields', () => {
      req.body = { password: 'secret123', confirmPassword: 'secret123' };
      
      const error = new ValidationAppError('Test error');
      errorHandler(error, req, res, next);
      
      const responseCall = (res.json as jest.Mock).mock.calls[0][0];
      expect(responseCall.error.body.password).toBe('[REDACTED]');
      expect(responseCall.error.body.confirmPassword).toBe('[REDACTED]');
    });

    test('should sanitize credit card fields', () => {
      req.body = { 
        creditCard: '1234-5678-9012-3456',
        ccNumber: '4111111111111111',
        cardNumber: '5555555555554444'
      };
      
      const error = new ValidationAppError('Test error');
      errorHandler(error, req, res, next);
      
      const responseCall = (res.json as jest.Mock).mock.calls[0][0];
      expect(responseCall.error.body.creditCard).toBe('[REDACTED]');
      expect(responseCall.error.body.ccNumber).toBe('[REDACTED]');
      expect(responseCall.error.body.cardNumber).toBe('[REDACTED]');
    });

    test('should sanitize token fields', () => {
      req.headers = { authorization: 'Bearer secret-token' };
      req.body = { 
        token: 'secret-token',
        accessToken: 'access-secret',
        refreshToken: 'refresh-secret'
      };
      
      const error = new ValidationAppError('Test error');
      errorHandler(error, req, res, next);
      
      const responseCall = (res.json as jest.Mock).mock.calls[0][0];
      expect(responseCall.error.headers.authorization).toBe('[REDACTED]');
      expect(responseCall.error.body.token).toBe('[REDACTED]');
      expect(responseCall.error.body.accessToken).toBe('[REDACTED]');
      expect(responseCall.error.body.refreshToken).toBe('[REDACTED]');
    });

    test('should preserve non-sensitive data', () => {
      req.body = {
        email: 'test@example.com',
        name: 'John Doe',
        age: 25,
        password: 'secret123'
      };
      
      const error = new ValidationAppError('Test error');
      errorHandler(error, req, res, next);
      
      const responseCall = (res.json as jest.Mock).mock.calls[0][0];
      expect(responseCall.error.body.email).toBe('test@example.com');
      expect(responseCall.error.body.name).toBe('John Doe');
      expect(responseCall.error.body.age).toBe(25);
      expect(responseCall.error.body.password).toBe('[REDACTED]');
    });
  });

  describe('Edge Cases', () => {
    test('should handle null error', () => {
      expect(() => {
        errorHandler(null as any, req, res, next);
      }).not.toThrow();
      
      expect(res.status).toHaveBeenCalledWith(500);
    });

    test('should handle undefined error', () => {
      expect(() => {
        errorHandler(undefined as any, req, res, next);
      }).not.toThrow();
      
      expect(res.status).toHaveBeenCalledWith(500);
    });

    test('should handle error with no message', () => {
      const error = new Error();
      error.message = '';
      
      errorHandler(error, req, res, next);
      
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.objectContaining({
            message: 'An unexpected error occurred'
          })
        })
      );
    });

    test('should handle very large error objects', () => {
      const largeError = new Error('Test error');
      (largeError as any).largeData = 'x'.repeat(10000);
      
      expect(() => {
        errorHandler(largeError, req, res, next);
      }).not.toThrow();
      
      expect(res.status).toHaveBeenCalledWith(500);
    });
  });
});

describe('Error Handler Integration', () => {
  test('should work with Express error handling flow', () => {
    const error = new ValidationAppError('Test validation error');
    const req = mockRequest();
    const res = mockResponse();
    const next = jest.fn();
    
    // Simulate middleware chain
    errorHandler(error, req, res, next);
    
    // Should not call next() as this is the final error handler
    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalled();
  });

  test('should preserve request ID if present', () => {
    const req = mockRequest();
    (req as any).id = 'req-12345';
    
    const error = new AppError('Test error', 500);
    
    errorHandler(error, req, res, next);
    
    const responseCall = (res.json as jest.Mock).mock.calls[0][0];
    expect(responseCall.error.requestId).toBe('req-12345');
  });

  test('should handle async error contexts', async () => {
    const asyncError = new Promise((_, reject) => {
      reject(new ValidationAppError('Async validation failed'));
    });
    
    try {
      await asyncError;
    } catch (error) {
      errorHandler(error as Error, req, res, next);
      
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.objectContaining({
            message: 'Async validation failed'
          })
        })
      );
    }
  });
});
