/**
 * Comprehensive Validation and Security Integration
 * Usage examples for maximum security implementation
 */

import { BasicValidator, validateRequestData } from './basicValidator';
import SecurityMiddleware from './securityMiddleware';

/**
 * User Registration Validation
 */
export const validateUserRegistration = validateRequestData({
  email: (email: string) => BasicValidator.validateEmail(email),
  password: (password: string) => BasicValidator.validatePassword(password),
  firstName: (name: string) => BasicValidator.validateName(name, 'Imię'),
  lastName: (name: string) => BasicValidator.validateName(name, 'Nazwisko'),
  phone: (phone: string) => BasicValidator.validatePhone(phone),
  school: (schoolId: string) => BasicValidator.validateMongoId(schoolId, 'Szkoła')
});

/**
 * Book Ad Creation Validation
 */
export const validateBookAdCreation = validateRequestData({
  bookId: (bookId: string) => BasicValidator.validateMongoId(bookId, 'Książka'),
  originalPrice: (price: any) => BasicValidator.validatePrice(price, 'Cena oryginalna'),
  condition: (condition: string) => BasicValidator.validateBookCondition(condition),
  description: (description: string) => BasicValidator.validateText(description, 0, 1000, 'Opis')
});

/**
 * Search Validation
 */
export const validateBookSearch = validateRequestData({
  q: (query: string) => BasicValidator.validateSearchQuery(query),
  school: (schoolId: string) => schoolId ? BasicValidator.validateMongoId(schoolId, 'Szkoła') : { isValid: true, errors: [] },
  condition: (condition: string) => condition ? BasicValidator.validateBookCondition(condition) : { isValid: true, errors: [] },
  minPrice: (price: any) => price ? BasicValidator.validatePrice(price, 'Cena minimalna') : { isValid: true, errors: [] },
  maxPrice: (price: any) => price ? BasicValidator.validatePrice(price, 'Cena maksymalna') : { isValid: true, errors: [] }
});

/**
 * Complete Security Stack Setup
 * Use this in your main application file
 */
export function setupSecurityStack(app: any) {
  // Initialize security middleware
  SecurityMiddleware.initialize();
  
  // Apply security middleware in order
  app.use(SecurityMiddleware.suspiciousActivityDetection());
  app.use(SecurityMiddleware.botDetection());
  app.use(SecurityMiddleware.rateLimit(100, 15 * 60 * 1000)); // 100 requests per 15 minutes
  app.use(SecurityMiddleware.securityHeaders());
  app.use(SecurityMiddleware.sanitizeInput());
  app.use(SecurityMiddleware.sqlInjectionProtection());
  
  console.log('🛡️  Complete security stack initialized');
}

/**
 * File Upload Route Protection
 */
export function setupFileUploadSecurity(app: any) {
  // Apply file-specific security
  app.use('/api/upload/*', SecurityMiddleware.fileUploadSecurity());
  app.use('/api/upload/*', SecurityMiddleware.rateLimit(10, 5 * 60 * 1000)); // 10 uploads per 5 minutes
  
  console.log('📁 File upload security initialized');
}

/**
 * CSRF Protection for Forms
 */
export function setupCSRFProtection(app: any) {
  app.use(SecurityMiddleware.csrfProtection());
  
  console.log('🔒 CSRF protection initialized');
}

/**
 * API Route Validation Examples
 */

// Example: User registration with full security
export const secureUserRegistrationRoute = [
  SecurityMiddleware.rateLimit(5, 10 * 60 * 1000), // 5 attempts per 10 minutes
  validateUserRegistration,
  async (req: any, res: any) => {
    try {
      // At this point, data is validated and sanitized
      const { email, password, firstName, lastName, phone, school } = req.sanitizedData;
      
      // Your business logic here
      console.log('✅ Validated user registration data:', req.sanitizedData);
      
      res.json({
        success: true,
        message: 'Rejestracja zakończona pomyślnie'
      });
    } catch (error) {
      console.error('❌ Registration error:', error);
      res.status(500).json({
        success: false,
        message: 'Błąd serwera'
      });
    }
  }
];

// Example: Book search with validation
export const secureBookSearchRoute = [
  SecurityMiddleware.rateLimit(50, 60 * 1000), // 50 searches per minute
  validateBookSearch,
  async (req: any, res: any) => {
    try {
      const searchParams = req.sanitizedData;
      
      console.log('🔍 Validated search params:', searchParams);
      
      // Your search logic here
      
      res.json({
        success: true,
        data: {
          books: [],
          total: 0
        }
      });
    } catch (error) {
      console.error('❌ Search error:', error);
      res.status(500).json({
        success: false,
        message: 'Błąd wyszukiwania'
      });
    }
  }
];

// Example: File upload with maximum security
export const secureFileUploadRoute = [
  SecurityMiddleware.rateLimit(5, 5 * 60 * 1000), // 5 uploads per 5 minutes
  SecurityMiddleware.fileUploadSecurity(),
  async (req: any, res: any) => {
    try {
      if (!req.files || req.files.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Nie wybrano plików'
        });
      }
      
      console.log('📁 Secure file upload:', req.files.map((f: any) => ({
        name: f.originalname,
        size: f.size,
        type: f.mimetype
      })));
      
      // Your file processing logic here
      
      res.json({
        success: true,
        message: 'Pliki przesłane pomyślnie',
        files: req.files.length
      });
    } catch (error) {
      console.error('❌ Upload error:', error);
      res.status(500).json({
        success: false,
        message: 'Błąd przesyłania plików'
      });
    }
  }
];

/**
 * Security Monitoring and Logging
 */
export class SecurityMonitor {
  
  static logSecurityEvent(type: string, details: any, req: any) {
    const event = {
      timestamp: new Date().toISOString(),
      type,
      ip: req.ip || 'unknown',
      userAgent: req.headers['user-agent'] || 'unknown',
      url: req.url,
      method: req.method,
      details
    };
    
    console.log(`🔔 SECURITY EVENT: ${JSON.stringify(event)}`);
    
    // In production, send to logging service
    // await logToSecurityService(event);
  }
  
  static async handleSecurityIncident(severity: 'low' | 'medium' | 'high' | 'critical', message: string, req: any) {
    const incident = {
      timestamp: new Date().toISOString(),
      severity,
      message,
      ip: req.ip,
      details: {
        userAgent: req.headers['user-agent'],
        url: req.url,
        method: req.method,
        body: req.body,
        query: req.query
      }
    };
    
    console.error(`🚨 SECURITY INCIDENT [${severity.toUpperCase()}]: ${message}`);
    
    if (severity === 'critical' || severity === 'high') {
      // In production: send alerts, block IP, etc.
      console.error('🔴 CRITICAL SECURITY INCIDENT - IMMEDIATE ACTION REQUIRED');
    }
    
    return incident;
  }
}

/**
 * Database Security Helpers
 */
export class DatabaseSecurity {
  
  /**
   * Sanitize data before database operations
   */
  static sanitizeForDatabase(data: any): any {
    if (!data || typeof data !== 'object') return data;
    
    if (Array.isArray(data)) {
      return data.map(item => this.sanitizeForDatabase(item));
    }
    
    const sanitized: any = {};
    
    for (const [key, value] of Object.entries(data)) {
      // Skip prototype pollution attempts
      if (key === '__proto__' || key === 'constructor' || key === 'prototype') {
        continue;
      }
      
      if (typeof value === 'string') {
        sanitized[key] = value.trim();
      } else if (typeof value === 'object' && value !== null) {
        sanitized[key] = this.sanitizeForDatabase(value);
      } else {
        sanitized[key] = value;
      }
    }
    
    return sanitized;
  }
  
  /**
   * Validate MongoDB query for security
   */
  static validateMongoQuery(query: any): boolean {
    const dangerousOperators = ['$where', '$expr', '$function', '$accumulator'];
    const queryString = JSON.stringify(query);
    
    return !dangerousOperators.some(op => queryString.includes(op));
  }
}

export default {
  validateUserRegistration,
  validateBookAdCreation,
  validateBookSearch,
  setupSecurityStack,
  setupFileUploadSecurity,
  setupCSRFProtection,
  secureUserRegistrationRoute,
  secureBookSearchRoute,
  secureFileUploadRoute,
  SecurityMonitor,
  DatabaseSecurity
};
