import validator from 'validator';
import path from 'path';

interface FileInfo {
  originalname: string;
  mimetype: string;
  size: number;
  buffer?: Buffer;
}

interface RequestInfo {
  ip?: string;
  connection?: { remoteAddress?: string };
  socket?: { remoteAddress?: string };
}

/**
 * Input Sanitization Utilities
 * Maximum security focused sanitization functions
 */

export class InputSanitizer {
  
  /**
   * Sanitize text input for security
   */
  static sanitizeText(input: string): string {
    if (!input || typeof input !== 'string') return '';
    
    return validator.escape(
      input.trim()
        .replace(/[\u0000-\u001f\u007f-\u009f]/g, '') // Remove control characters
        .replace(/[\u200b-\u200d\ufeff]/g, '') // Remove zero-width characters
        .replace(/script|javascript|vbscript|onload|onerror|onclick/gi, '') // Remove potential XSS
    );
  }

  /**
   * Sanitize HTML input (allows basic formatting)
   */
  static sanitizeHTML(input: string): string {
    if (!input || typeof input !== 'string') return '';
    
    // Allow only basic HTML tags for descriptions
    const allowedTags = '<p><br><b><i><u><strong><em>';
    
    return validator.escape(input)
      .replace(/&lt;(\/?)([bi]|strong|em|p)&gt;/gi, '<$1$2>') // Restore allowed tags
      .replace(/&lt;br\s*\/?&gt;/gi, '<br>'); // Restore line breaks
  }

  /**
   * Sanitize email addresses
   */
  static sanitizeEmail(email: string): string {
    if (!email || typeof email !== 'string') return '';
    
    return validator.normalizeEmail(email.toLowerCase().trim(), {
      gmail_remove_dots: false,
      gmail_remove_subaddress: false,
      outlookdotcom_remove_subaddress: false,
      yahoo_remove_subaddress: false,
      icloud_remove_subaddress: false
    }) || '';
  }

  /**
   * Sanitize phone numbers
   */
  static sanitizePhone(phone: string): string {
    if (!phone || typeof phone !== 'string') return '';
    
    return phone.replace(/[^\d\+\-\(\)\s]/g, '').trim();
  }

  /**
   * Sanitize file paths and names
   */
  static sanitizeFileName(filename: string): string {
    if (!filename || typeof filename !== 'string') return '';
    
    return path.basename(filename)
      .replace(/[^a-zA-Z0-9._-]/g, '_')
      .replace(/_{2,}/g, '_')
      .substring(0, 100);
  }

  /**
   * Sanitize MongoDB ObjectId
   */
  static sanitizeMongoId(id: string): string {
    if (!id || typeof id !== 'string') return '';
    
    return id.replace(/[^a-f0-9]/gi, '').substring(0, 24);
  }

  /**
   * Sanitize numeric values
   */
  static sanitizeNumber(value: any, min = 0, max = Number.MAX_SAFE_INTEGER): number {
    const num = parseFloat(value);
    if (isNaN(num)) return min;
    
    return Math.min(Math.max(num, min), max);
  }

  /**
   * Sanitize URL inputs
   */
  static sanitizeUrl(url: string): string {
    if (!url || typeof url !== 'string') return '';
    
    try {
      const parsedUrl = new URL(url);
      
      // Only allow HTTP and HTTPS
      if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
        return '';
      }
      
      return parsedUrl.toString();
    } catch {
      return '';
    }
  }

  /**
   * Remove potential SQL injection patterns
   */
  static sanitizeSqlInput(input: string): string {
    if (!input || typeof input !== 'string') return '';
    
    return input
      .replace(/['";\\]/g, '') // Remove SQL special characters
      .replace(/\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION|SCRIPT)\b/gi, '') // Remove SQL keywords
      .trim();
  }

  /**
   * Sanitize search queries
   */
  static sanitizeSearchQuery(query: string): string {
    if (!query || typeof query !== 'string') return '';
    
    return query
      .trim()
      .replace(/[^\p{L}\p{N}\s\-_]/gu, '') // Only letters, numbers, spaces, hyphens, underscores
      .replace(/\s{2,}/g, ' ') // Replace multiple spaces with single space
      .substring(0, 100);
  }

  /**
   * Sanitize request body recursively
   */
  static sanitizeRequestBody(body: any): any {
    if (!body || typeof body !== 'object') return body;
    
    if (Array.isArray(body)) {
      return body.map(item => this.sanitizeRequestBody(item));
    }
    
    const sanitized: any = {};
    
    for (const [key, value] of Object.entries(body)) {
      const cleanKey = this.sanitizeText(key);
      
      if (typeof value === 'string') {
        sanitized[cleanKey] = this.sanitizeText(value);
      } else if (typeof value === 'object' && value !== null) {
        sanitized[cleanKey] = this.sanitizeRequestBody(value);
      } else {
        sanitized[cleanKey] = value;
      }
    }
    
    return sanitized;
  }
}

/**
 * File Upload Security
 */

export class FileUploadSecurity {
  
  private static readonly ALLOWED_MIME_TYPES = [
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'image/svg+xml'
  ];
  
  private static readonly ALLOWED_EXTENSIONS = [
    '.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg'
  ];
  
  private static readonly MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
  private static readonly MAX_FILES_COUNT = 5;
  
  /**
   * Validate file upload security
   */
  static validateFile(file: FileInfo): { valid: boolean; error?: string } {
    // Check file size
    if (file.size > this.MAX_FILE_SIZE) {
      return { valid: false, error: 'Plik jest za duży (maksymalnie 5MB)' };
    }
    
    // Check MIME type
    if (!this.ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      return { valid: false, error: 'Nieprawidłowy typ pliku' };
    }
    
    // Check file extension
    const ext = path.extname(file.originalname).toLowerCase();
    if (!this.ALLOWED_EXTENSIONS.includes(ext)) {
      return { valid: false, error: 'Nieprawidłowe rozszerzenie pliku' };
    }
    
    // Check for potential malicious content
    if (this.containsMaliciousContent(file)) {
      return { valid: false, error: 'Plik zawiera podejrzaną zawartość' };
    }
    
    return { valid: true };
  }
  
  /**
   * Check for malicious content in files
   */
  private static containsMaliciousContent(file: FileInfo): boolean {
    const dangerousPatterns = [
      /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
      /javascript:/gi,
      /vbscript:/gi,
      /onload\s*=/gi,
      /onerror\s*=/gi,
      /onclick\s*=/gi,
      /<iframe/gi,
      /<object/gi,
      /<embed/gi
    ];
    
    const fileContent = file.buffer?.toString() || '';
    
    return dangerousPatterns.some(pattern => pattern.test(fileContent));
  }
  
  /**
   * Generate secure filename
   */
  static generateSecureFilename(originalName: string): string {
    const ext = path.extname(originalName);
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 15);
    
    return `${timestamp}_${randomString}${ext}`;
  }
}

/**
 * Rate Limiting Utilities
 */

export class RateLimitSecurity {
  
  private static readonly requestCounts = new Map<string, { count: number; resetTime: number }>();
  
  /**
   * Check if request should be rate limited
   */
  static shouldRateLimit(identifier: string, maxRequests: number, windowMs: number): boolean {
    const now = Date.now();
    const requestData = this.requestCounts.get(identifier);
    
    if (!requestData || now > requestData.resetTime) {
      this.requestCounts.set(identifier, {
        count: 1,
        resetTime: now + windowMs
      });
      return false;
    }
    
    if (requestData.count >= maxRequests) {
      return true;
    }
    
    requestData.count++;
    return false;
  }
  
  /**
   * Get client identifier for rate limiting
   */
  static getClientIdentifier(req: RequestInfo): string {
    return req.ip || 
           req.connection?.remoteAddress || 
           req.socket?.remoteAddress || 
           'unknown';
  }
}

/**
 * Security Headers Utility
 */

export class SecurityHeaders {
  
  /**
   * Set security headers on response
   */
  static setSecurityHeaders(res: any): void {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
    res.setHeader('Content-Security-Policy', 
      "default-src 'self'; " +
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'; " +
      "style-src 'self' 'unsafe-inline'; " +
      "img-src 'self' data: https:; " +
      "font-src 'self' data:; " +
      "connect-src 'self';"
    );
  }
}

/**
 * CSRF Protection
 */

export class CSRFProtection {
  
  /**
   * Generate CSRF token
   */
  static generateToken(): string {
    return Math.random().toString(36).substring(2, 15) +
           Math.random().toString(36).substring(2, 15) +
           Date.now().toString(36);
  }
  
  /**
   * Validate CSRF token
   */
  static validateToken(sessionToken: string, requestToken: string): boolean {
    return sessionToken === requestToken && 
           requestToken.length >= 20 &&
           /^[a-z0-9]+$/.test(requestToken);
  }
}

export default {
  InputSanitizer,
  FileUploadSecurity,
  RateLimitSecurity,
  SecurityHeaders,
  CSRFProtection
};
