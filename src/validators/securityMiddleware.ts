/**
 * Security Middleware for Maximum Protection
 */

export class SecurityMiddleware {
  
  private static requestCounts = new Map<string, { count: number; resetTime: number }>();
  private static suspiciousIPs = new Set<string>();
  private static csrfTokens = new Map<string, string>();
  
  /**
   * Rate limiting middleware
   */
  static rateLimit(maxRequests = 100, windowMs = 15 * 60 * 1000) {
    return (req: any, res: any, next: any) => {
      const clientId = this.getClientIP(req);
      const now = Date.now();
      const requestData = this.requestCounts.get(clientId);
      
      // Check if IP is already flagged as suspicious
      if (this.suspiciousIPs.has(clientId)) {
        return res.status(429).json({
          success: false,
          message: 'IP zablokowane z powodu podejrzanej aktywności',
          retryAfter: Math.ceil(windowMs / 1000)
        });
      }
      
      if (!requestData || now > requestData.resetTime) {
        this.requestCounts.set(clientId, {
          count: 1,
          resetTime: now + windowMs
        });
        return next();
      }
      
      if (requestData.count >= maxRequests) {
        // Flag IP as suspicious after multiple rate limit violations
        if (requestData.count >= maxRequests * 2) {
          this.suspiciousIPs.add(clientId);
          console.warn(`🔴 SUSPICIOUS IP BLOCKED: ${clientId}`);
        }
        
        return res.status(429).json({
          success: false,
          message: 'Zbyt wiele żądań. Spróbuj ponownie później.',
          retryAfter: Math.ceil((requestData.resetTime - now) / 1000)
        });
      }
      
      requestData.count++;
      next();
    };
  }
  
  /**
   * Security headers middleware
   */
  static securityHeaders() {
    return (req: any, res: any, next: any) => {
      // Prevent MIME sniffing
      res.setHeader('X-Content-Type-Options', 'nosniff');
      
      // Prevent clickjacking
      res.setHeader('X-Frame-Options', 'DENY');
      
      // XSS Protection
      res.setHeader('X-XSS-Protection', '1; mode=block');
      
      // Referrer Policy
      res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
      
      // Permissions Policy
      res.setHeader('Permissions-Policy', 
        'camera=(), microphone=(), geolocation=(), payment=(), usb=()');
      
      // Content Security Policy
      res.setHeader('Content-Security-Policy', [
        "default-src 'self'",
        "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
        "style-src 'self' 'unsafe-inline'",
        "img-src 'self' data: https:",
        "font-src 'self' data:",
        "connect-src 'self'",
        "media-src 'none'",
        "object-src 'none'",
        "child-src 'none'",
        "worker-src 'none'",
        "form-action 'self'",
        "base-uri 'self'",
        "manifest-src 'self'"
      ].join('; '));
      
      // HSTS - Force HTTPS
      if (req.secure || req.headers['x-forwarded-proto'] === 'https') {
        res.setHeader('Strict-Transport-Security', 
          'max-age=31536000; includeSubDomains; preload');
      }
      
      next();
    };
  }
  
  /**
   * Input sanitization middleware
   */
  static sanitizeInput() {
    return (req: any, res: any, next: any) => {
      if (req.body) {
        req.body = this.sanitizeObject(req.body);
      }
      
      if (req.query) {
        req.query = this.sanitizeObject(req.query);
      }
      
      if (req.params) {
        req.params = this.sanitizeObject(req.params);
      }
      
      next();
    };
  }
  
  /**
   * CSRF Protection middleware
   */
  static csrfProtection() {
    return (req: any, res: any, next: any) => {
      if (req.method === 'GET') {
        // Generate and store CSRF token for GET requests
        const token = this.generateCSRFToken();
        const sessionId = req.sessionID || req.session?.id || 'anonymous';
        
        this.csrfTokens.set(sessionId, token);
        res.locals.csrfToken = token;
        
        return next();
      }
      
      // Validate CSRF token for POST, PUT, DELETE requests
      const sessionId = req.sessionID || req.session?.id;
      const submittedToken = req.body._csrf || req.headers['x-csrf-token'];
      const storedToken = this.csrfTokens.get(sessionId);
      
      if (!storedToken || !submittedToken || storedToken !== submittedToken) {
        return res.status(403).json({
          success: false,
          message: 'Nieprawidłowy token CSRF'
        });
      }
      
      next();
    };
  }
  
  /**
   * File upload security middleware
   */
  static fileUploadSecurity() {
    return (req: any, res: any, next: any) => {
      if (!req.files || !Array.isArray(req.files)) {
        return next();
      }
      
      const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
      const maxSize = 5 * 1024 * 1024; // 5MB
      const maxFiles = 5;
      
      if (req.files.length > maxFiles) {
        return res.status(400).json({
          success: false,
          message: `Maksymalnie ${maxFiles} plików na raz`
        });
      }
      
      for (const file of req.files) {
        // Check file type
        if (!allowedTypes.includes(file.mimetype)) {
          return res.status(400).json({
            success: false,
            message: 'Dozwolone tylko pliki: JPEG, PNG, GIF, WebP'
          });
        }
        
        // Check file size
        if (file.size > maxSize) {
          return res.status(400).json({
            success: false,
            message: 'Plik nie może być większy niż 5MB'
          });
        }
        
        // Check for malicious content
        if (this.containsMaliciousContent(file)) {
          console.warn(`🔴 MALICIOUS FILE DETECTED: ${file.originalname} from ${this.getClientIP(req)}`);
          return res.status(400).json({
            success: false,
            message: 'Wykryto podejrzaną zawartość pliku'
          });
        }
        
        // Sanitize filename
        file.originalname = file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_');
      }
      
      next();
    };
  }
  
  /**
   * SQL Injection protection middleware
   */
  static sqlInjectionProtection() {
    return (req: any, res: any, next: any) => {
      const clientId = this.getClientIP(req);
      
      if (this.detectSQLInjection(req.body) || 
          this.detectSQLInjection(req.query) || 
          this.detectSQLInjection(req.params)) {
        
        console.warn(`🔴 SQL INJECTION ATTEMPT: ${clientId} - ${JSON.stringify({
          body: req.body,
          query: req.query,
          params: req.params
        })}`);
        
        // Block the IP immediately
        this.suspiciousIPs.add(clientId);
        
        return res.status(400).json({
          success: false,
          message: 'Wykryto nieprawidłowe dane wejściowe'
        });
      }
      
      next();
    };
  }
  
  /**
   * Bot and crawler detection
   */
  static botDetection() {
    return (req: any, res: any, next: any) => {
      const userAgent = req.headers['user-agent'] || '';
      const clientId = this.getClientIP(req);
      
      // Common bot patterns
      const botPatterns = [
        /bot/i, /crawler/i, /spider/i, /scraper/i,
        /curl/i, /wget/i, /python/i, /http/i,
        /postman/i, /insomnia/i, /automated/i
      ];
      
      if (botPatterns.some(pattern => pattern.test(userAgent))) {
        console.warn(`BOT DETECTED: ${clientId} - ${userAgent}`);
        
        // Allow legitimate bots but with rate limiting
        req.isBot = true;
      }
      
      next();
    };
  }
  
  /**
   * Suspicious activity detection
   */
  static suspiciousActivityDetection() {
    return (req: any, res: any, next: any) => {
      const clientId = this.getClientIP(req);
      const suspiciousPatterns = [
        /\.\.\//g, // Directory traversal
        /<script/gi, // XSS attempts
        /union\s+select/gi, // SQL injection
        /drop\s+table/gi, // SQL injection
        /javascript:/gi, // XSS
        /vbscript:/gi, // XSS
        /data:text\/html/gi, // Data URI XSS
        /eval\s*\(/gi, // Code injection
        /exec\s*\(/gi, // Code injection
      ];
      
      const requestString = JSON.stringify({
        url: req.url,
        body: req.body,
        query: req.query,
        headers: req.headers
      });
      
      if (suspiciousPatterns.some(pattern => pattern.test(requestString))) {
        console.warn(`🔴 SUSPICIOUS ACTIVITY: ${clientId} - ${req.method} ${req.url}`);
        
        // Block IP after suspicious activity
        this.suspiciousIPs.add(clientId);
        
        return res.status(400).json({
          success: false,
          message: 'Wykryto podejrzaną aktywność'
        });
      }
      
      next();
    };
  }
  
  // Helper methods
  
  private static getClientIP(req: any): string {
    return req.ip || 
           req.connection?.remoteAddress || 
           req.socket?.remoteAddress ||
           req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
           req.headers['x-real-ip'] ||
           'unknown';
  }
  
  private static sanitizeObject(obj: any): any {
    if (!obj || typeof obj !== 'object') return obj;
    
    if (Array.isArray(obj)) {
      return obj.map(item => this.sanitizeObject(item));
    }
    
    const sanitized: any = {};
    
    for (const [key, value] of Object.entries(obj)) {
      const cleanKey = this.sanitizeString(key);
      
      if (typeof value === 'string') {
        sanitized[cleanKey] = this.sanitizeString(value);
      } else if (typeof value === 'object' && value !== null) {
        sanitized[cleanKey] = this.sanitizeObject(value);
      } else {
        sanitized[cleanKey] = value;
      }
    }
    
    return sanitized;
  }
  
  private static sanitizeString(str: string): string {
    return str
      .replace(/[\u0000-\u001f\u007f-\u009f]/g, '') // Control characters
      .replace(/[\u200b-\u200d\ufeff]/g, '') // Zero-width characters
      .trim();
  }
  
  private static generateCSRFToken(): string {
    return Array.from({ length: 32 }, () => 
      Math.random().toString(36)[2] || '0'
    ).join('');
  }
  
  private static detectSQLInjection(data: any): boolean {
    if (!data) return false;
    
    const sqlPatterns = [
      /(\bunion\s+select\b)/gi,
      /(\bdrop\s+table\b)/gi,
      /(\binsert\s+into\b)/gi,
      /(\bupdate\s+set\b)/gi,
      /(\bdelete\s+from\b)/gi,
      /(\bselect\s+\*\s+from\b)/gi,
      /(;|\||\|\||&&|--)/g,
      /('(\s*or\s*'*1'*\s*=\s*'*1|[^']*'?\s*or\s*[^']*'?\s*=\s*[^']*'?))/gi
    ];
    
    const dataString = typeof data === 'string' ? data : JSON.stringify(data);
    
    return sqlPatterns.some(pattern => pattern.test(dataString));
  }
  
  private static containsMaliciousContent(file: any): boolean {
    if (!file.buffer) return false;
    
    const content = file.buffer.toString('utf8', 0, Math.min(file.size, 1024)); // Check first 1KB
    
    const maliciousPatterns = [
      /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
      /javascript:/gi,
      /vbscript:/gi,
      /onload\s*=/gi,
      /onerror\s*=/gi,
      /onclick\s*=/gi,
      /<iframe/gi,
      /<object/gi,
      /<embed/gi,
      /eval\s*\(/gi,
      /function\s*\(/gi
    ];
    
    return maliciousPatterns.some(pattern => pattern.test(content));
  }
  
  /**
   * Clean up old rate limit data periodically
   */
  static cleanup() {
    setInterval(() => {
      const now = Date.now();
      
      // Clean expired rate limit entries
      for (const [key, data] of this.requestCounts.entries()) {
        if (now > data.resetTime) {
          this.requestCounts.delete(key);
        }
      }
      
      // Clear suspicious IPs after 24 hours
      const dayAgo = now - 24 * 60 * 60 * 1000;
      // In a real implementation, you'd track when IPs were blocked
      
      // Clean old CSRF tokens
      if (this.csrfTokens.size > 10000) {
        this.csrfTokens.clear();
      }
      
    }, 60 * 60 * 1000); // Run every hour
  }
  
  /**
   * Initialize security middleware
   */
  static initialize() {
    this.cleanup();
    
    console.log('Security middleware initialized with maximum protection');
    console.log('Features enabled:');
    console.log('   - Rate limiting with IP blocking');
    console.log('   - Security headers (CSP, HSTS, etc.)');
    console.log('   - Input sanitization');
    console.log('   - CSRF protection');
    console.log('   - File upload security');
    console.log('   - SQL injection detection');
    console.log('   - Bot detection');
    console.log('   - Suspicious activity monitoring');
  }
}

export default SecurityMiddleware;
