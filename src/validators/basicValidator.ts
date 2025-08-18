/**
 * Basic Input Validation and Sanitization
 * Security-focused validation without external dependencies
 */

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  sanitized?: any;
}

export class BasicValidator {
  
  /**
   * Validate email format
   */
  static validateEmail(email: string): ValidationResult {
    const errors: string[] = [];
    
    if (!email || typeof email !== 'string') {
      errors.push('Email jest wymagany');
      return { isValid: false, errors };
    }
    
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    
    if (!emailRegex.test(email)) {
      errors.push('Nieprawidłowy format adresu email');
    }
    
    if (email.length > 100) {
      errors.push('Email nie może być dłuższy niż 100 znaków');
    }
    
    const sanitized = email.toLowerCase().trim();
    
    return {
      isValid: errors.length === 0,
      errors,
      sanitized
    };
  }
  
  /**
   * Validate password strength
   */
  static validatePassword(password: string): ValidationResult {
    const errors: string[] = [];
    
    if (!password || typeof password !== 'string') {
      errors.push('Hasło jest wymagane');
      return { isValid: false, errors };
    }
    
    if (password.length < 8) {
      errors.push('Hasło musi mieć co najmniej 8 znaków');
    }
    
    if (password.length > 128) {
      errors.push('Hasło nie może być dłuższe niż 128 znaków');
    }
    
    if (!/[a-z]/.test(password)) {
      errors.push('Hasło musi zawierać małą literę');
    }
    
    if (!/[A-Z]/.test(password)) {
      errors.push('Hasło musi zawierać wielką literę');
    }
    
    if (!/\d/.test(password)) {
      errors.push('Hasło musi zawierać cyfrę');
    }
    
    if (!/[@$!%*?&]/.test(password)) {
      errors.push('Hasło musi zawierać znak specjalny (@$!%*?&)');
    }
    
    return {
      isValid: errors.length === 0,
      errors,
      sanitized: password // Don't sanitize passwords
    };
  }
  
  /**
   * Validate text input
   */
  static validateText(text: string, minLength = 1, maxLength = 100, fieldName = 'Pole'): ValidationResult {
    const errors: string[] = [];
    
    if (!text || typeof text !== 'string') {
      errors.push(`${fieldName} jest wymagane`);
      return { isValid: false, errors };
    }
    
    const trimmed = text.trim();
    
    if (trimmed.length < minLength) {
      errors.push(`${fieldName} musi mieć co najmniej ${minLength} znaków`);
    }
    
    if (trimmed.length > maxLength) {
      errors.push(`${fieldName} nie może być dłuższe niż ${maxLength} znaków`);
    }
    
    // Check for suspicious patterns
    const dangerousPatterns = [
      /<script/i,
      /javascript:/i,
      /vbscript:/i,
      /onload\s*=/i,
      /onerror\s*=/i,
      /onclick\s*=/i
    ];
    
    if (dangerousPatterns.some(pattern => pattern.test(trimmed))) {
      errors.push(`${fieldName} zawiera niedozwolone znaki`);
    }
    
    // Sanitize HTML
    const sanitized = trimmed
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;')
      .replace(/\//g, '&#x2F;');
    
    return {
      isValid: errors.length === 0,
      errors,
      sanitized
    };
  }
  
  /**
   * Validate name (Polish characters allowed)
   */
  static validateName(name: string, fieldName = 'Imię'): ValidationResult {
    const errors: string[] = [];
    
    if (!name || typeof name !== 'string') {
      errors.push(`${fieldName} jest wymagane`);
      return { isValid: false, errors };
    }
    
    const trimmed = name.trim();
    
    if (trimmed.length < 1 || trimmed.length > 50) {
      errors.push(`${fieldName} musi mieć od 1 do 50 znaków`);
    }
    
    // Allow Polish characters, letters, spaces, hyphens, apostrophes
    const nameRegex = /^[a-zA-ZąćęłńóśźżĄĆĘŁŃÓŚŹŻ\s\-']+$/;
    
    if (!nameRegex.test(trimmed)) {
      errors.push(`${fieldName} może zawierać tylko litery, spacje, myślniki i apostrofy`);
    }
    
    const sanitized = trimmed
      .replace(/\s{2,}/g, ' ') // Replace multiple spaces with single space
      .replace(/^[\s\-']+|[\s\-']+$/g, ''); // Trim special characters from ends
    
    return {
      isValid: errors.length === 0,
      errors,
      sanitized
    };
  }
  
  /**
   * Validate phone number
   */
  static validatePhone(phone: string): ValidationResult {
    const errors: string[] = [];
    
    if (!phone || typeof phone !== 'string') {
      errors.push('Numer telefonu jest wymagany');
      return { isValid: false, errors };
    }
    
    // Remove all non-digit characters except + at the beginning
    const cleaned = phone.replace(/[^\d+]/g, '');
    
    if (cleaned.length < 9 || cleaned.length > 15) {
      errors.push('Numer telefonu musi mieć od 9 do 15 cyfr');
    }
    
    const phoneRegex = /^[+]?[0-9]{9,14}$/;
    
    if (!phoneRegex.test(cleaned)) {
      errors.push('Nieprawidłowy format numeru telefonu');
    }
    
    return {
      isValid: errors.length === 0,
      errors,
      sanitized: cleaned
    };
  }
  
  /**
   * Validate MongoDB ObjectId
   */
  static validateMongoId(id: string, fieldName = 'ID'): ValidationResult {
    const errors: string[] = [];
    
    if (!id || typeof id !== 'string') {
      errors.push(`${fieldName} jest wymagane`);
      return { isValid: false, errors };
    }
    
    const mongoIdRegex = /^[a-f\d]{24}$/i;
    
    if (!mongoIdRegex.test(id)) {
      errors.push(`Nieprawidłowy ${fieldName}`);
    }
    
    return {
      isValid: errors.length === 0,
      errors,
      sanitized: id.toLowerCase()
    };
  }
  
  /**
   * Validate price
   */
  static validatePrice(price: any, fieldName = 'Cena'): ValidationResult {
    const errors: string[] = [];
    
    const numPrice = parseFloat(price);
    
    if (isNaN(numPrice)) {
      errors.push(`${fieldName} musi być liczbą`);
      return { isValid: false, errors };
    }
    
    if (numPrice < 0) {
      errors.push(`${fieldName} nie może być ujemna`);
    }
    
    if (numPrice > 10000) {
      errors.push(`${fieldName} nie może przekraczać 10000 PLN`);
    }
    
    // Round to 2 decimal places
    const sanitized = Math.round(numPrice * 100) / 100;
    
    return {
      isValid: errors.length === 0,
      errors,
      sanitized
    };
  }
  
  /**
   * Validate book condition
   */
  static validateBookCondition(condition: string): ValidationResult {
    const errors: string[] = [];
    const allowedConditions = ['nowa', 'bardzo-dobry', 'dobry', 'zadowalający'];
    
    if (!condition || typeof condition !== 'string') {
      errors.push('Stan książki jest wymagany');
      return { isValid: false, errors };
    }
    
    if (!allowedConditions.includes(condition)) {
      errors.push('Nieprawidłowy stan książki');
    }
    
    return {
      isValid: errors.length === 0,
      errors,
      sanitized: condition
    };
  }
  
  /**
   * Validate search query
   */
  static validateSearchQuery(query: string): ValidationResult {
    const errors: string[] = [];
    
    if (query && typeof query === 'string') {
      if (query.length > 100) {
        errors.push('Zapytanie wyszukiwania nie może być dłuższe niż 100 znaków');
      }
      
      // Remove potentially dangerous characters
      const sanitized = query
        .trim()
        .replace(/[^\p{L}\p{N}\s\-_]/gu, '')
        .replace(/\s{2,}/g, ' ')
        .substring(0, 100);
      
      return {
        isValid: errors.length === 0,
        errors,
        sanitized
      };
    }
    
    return {
      isValid: true,
      errors: [],
      sanitized: ''
    };
  }
  
  /**
   * Validate file upload
   */
  static validateFileUpload(file: any): ValidationResult {
    const errors: string[] = [];
    
    if (!file) {
      errors.push('Plik jest wymagany');
      return { isValid: false, errors };
    }
    
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    const maxSize = 5 * 1024 * 1024; // 5MB
    
    if (!allowedTypes.includes(file.mimetype)) {
      errors.push('Dozwolone są tylko pliki: JPEG, PNG, GIF, WebP');
    }
    
    if (file.size > maxSize) {
      errors.push('Rozmiar pliku nie może przekraczać 5MB');
    }
    
    // Check for malicious content in filename
    if (/[<>:"\\|?*]/.test(file.originalname)) {
      errors.push('Nazwa pliku zawiera niedozwolone znaki');
    }
    
    return {
      isValid: errors.length === 0,
      errors,
      sanitized: {
        ...file,
        originalname: file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_')
      }
    };
  }
}

/**
 * Middleware function to validate request data
 */

export function validateRequestData(validations: { [key: string]: (value: any) => ValidationResult }) {
  return (req: any, res: any, next: any) => {
    const errors: { [key: string]: string[] } = {};
    const sanitizedData: { [key: string]: any } = {};
    
    for (const [field, validator] of Object.entries(validations)) {
      const value = req.body[field];
      const result = validator(value);
      
      if (!result.isValid) {
        errors[field] = result.errors;
      } else if (result.sanitized !== undefined) {
        sanitizedData[field] = result.sanitized;
        req.body[field] = result.sanitized;
      }
    }
    
    if (Object.keys(errors).length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Błędy walidacji',
        errors
      });
    }
    
    req.sanitizedData = sanitizedData;
    next();
  };
}

export default {
  BasicValidator,
  validateRequestData
};
