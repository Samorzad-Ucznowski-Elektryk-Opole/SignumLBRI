import { body, param, query, ValidationChain } from "express-validator";
import { Request } from "express";
import { PublicUser } from "../models/PublicUser";
import { User } from "../models/User";

/**
 * Common validation rules
 */

export const emailValidation = body('email')
  .isEmail()
  .withMessage('Nieprawidłowy format adresu email')
  .normalizeEmail()
  .isLength({ min: 5, max: 100 })
  .withMessage('Email musi mieć od 5 do 100 znaków');

export const passwordValidation = body('password')
  .isLength({ min: 8, max: 128 })
  .withMessage('Hasło musi mieć od 8 do 128 znaków')
  .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
  .withMessage('Hasło musi zawierać: małą literę, wielką literę, cyfrę i znak specjalny');

export const nameValidation = (fieldName: string) => 
  body(fieldName)
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage(`${fieldName} musi mieć od 1 do 50 znaków`)
    .matches(/^[a-zA-ZąćęłńóśźżĄĆĘŁŃÓŚŹŻ\s\-']+$/)
    .withMessage(`${fieldName} może zawierać tylko litery, spacje, myślniki i apostrofy`);

export const phoneValidation = body('phone')
  .trim()
  .matches(/^[+]?[0-9\s\-\(\)]{9,15}$/)
  .withMessage('Nieprawidłowy format numeru telefonu')
  .isLength({ min: 9, max: 15 })
  .withMessage('Numer telefonu musi mieć od 9 do 15 znaków');

export const mongoIdValidation = (fieldName: string) =>
  param(fieldName)
    .isMongoId()
    .withMessage(`Nieprawidłowy identyfikator ${fieldName}`);

/**
 * Public User Validation Rules
 */

export const validatePublicUserRegistration = [
  emailValidation
    .custom(async (email) => {
      const existingUser = await PublicUser.findOne({ email });
      if (existingUser) {
        throw new Error('Ten adres email jest już zarejestrowany');
      }
      
      const existingInternalUser = await User.findOne({ email });
      if (existingInternalUser) {
        throw new Error('Ten adres email jest już używany w systemie');
      }
      
      return true;
    }),
    
  passwordValidation,
  
  body('confirmPassword')
    .custom((value, { req }) => {
      if (value !== req.body.password) {
        throw new Error('Hasła nie są identyczne');
      }
      return true;
    }),
    
  nameValidation('firstName'),
  nameValidation('lastName'),
  phoneValidation,
  
  body('school')
    .isMongoId()
    .withMessage('Wybierz prawidłową szkołę'),
    
  body('acceptTerms')
    .isBoolean()
    .custom((value) => {
      if (!value) {
        throw new Error('Musisz zaakceptować regulamin');
      }
      return true;
    }),
    
  body('acceptPrivacy')
    .isBoolean()
    .custom((value) => {
      if (!value) {
        throw new Error('Musisz zaakceptować politykę prywatności');
      }
      return true;
    })
];

export const validatePublicUserLogin = [
  body('email')
    .isEmail()
    .withMessage('Nieprawidłowy format adresu email')
    .normalizeEmail(),
    
  body('password')
    .notEmpty()
    .withMessage('Hasło jest wymagane')
    .isLength({ max: 128 })
    .withMessage('Hasło jest za długie')
];

export const validatePublicUserUpdate = [
  nameValidation('firstName'),
  nameValidation('lastName'),
  phoneValidation,
  
  body('currentPassword')
    .optional()
    .notEmpty()
    .withMessage('Wprowadź aktualne hasło'),
    
  body('newPassword')
    .optional()
    .isLength({ min: 8, max: 128 })
    .withMessage('Nowe hasło musi mieć od 8 do 128 znaków')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .withMessage('Nowe hasło musi zawierać: małą literę, wielką literę, cyfrę i znak specjalny'),
    
  body('confirmNewPassword')
    .optional()
    .custom((value, { req }) => {
      if (req.body.newPassword && value !== req.body.newPassword) {
        throw new Error('Nowe hasła nie są identyczne');
      }
      return true;
    })
];

/**
 * Book Ad Validation Rules
 */

export const validateBookAdCreate = [
  body('bookId')
    .isMongoId()
    .withMessage('Wybierz prawidłową książkę'),
    
  body('originalPrice')
    .isFloat({ min: 0, max: 10000 })
    .withMessage('Cena oryginalna musi być liczbą od 0 do 10000 PLN'),
    
  body('condition')
    .isIn(['nowa', 'bardzo-dobry', 'dobry', 'zadowalający'])
    .withMessage('Wybierz prawidłowy stan książki'),
    
  body('description')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Opis nie może być dłuższy niż 1000 znaków')
    .escape(), // Escape HTML for security
    
  body('deliveryMethod')
    .optional()
    .isIn(['pickup', 'personal'])
    .withMessage('Wybierz prawidłowy sposób dostawy')
];

export const validateBookAdUpdate = [
  mongoIdValidation('id'),
  
  body('originalPrice')
    .optional()
    .isFloat({ min: 0, max: 10000 })
    .withMessage('Cena oryginalna musi być liczbą od 0 do 10000 PLN'),
    
  body('condition')
    .optional()
    .isIn(['nowa', 'bardzo-dobry', 'dobry', 'zadowalający'])
    .withMessage('Wybierz prawidłowy stan książki'),
    
  body('description')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Opis nie może być dłuższy niż 1000 znaków')
    .escape()
];

export const validateBookAdStatusUpdate = [
  mongoIdValidation('id'),
  
  body('status')
    .isIn(['draft', 'pending_verification', 'published', 'reserved', 'sold', 'rejected'])
    .withMessage('Nieprawidłowy status ogłoszenia'),
    
  body('rejectionReason')
    .optional()
    .trim()
    .isLength({ min: 5, max: 500 })
    .withMessage('Powód odrzucenia musi mieć od 5 do 500 znaków')
    .escape()
];

/**
 * Shopping Cart Validation Rules
 */

export const validateAddToCart = [
  body('bookAdId')
    .isMongoId()
    .withMessage('Nieprawidłowy identyfikator ogłoszenia'),
    
  body('quantity')
    .optional()
    .isInt({ min: 1, max: 1 })
    .withMessage('Można dodać tylko 1 egzemplarz książki')
];

export const validateRemoveFromCart = [
  body('bookAdId')
    .isMongoId()
    .withMessage('Nieprawidłowy identyfikator ogłoszenia')
];

/**
 * Search and Filter Validation Rules
 */

export const validateBookSearch = [
  query('q')
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Zapytanie wyszukiwania musi mieć od 1 do 100 znaków')
    .escape(),
    
  query('school')
    .optional()
    .isMongoId()
    .withMessage('Nieprawidłowy identyfikator szkoły'),
    
  query('condition')
    .optional()
    .isIn(['nowa', 'bardzo-dobry', 'dobry', 'zadowalający'])
    .withMessage('Nieprawidłowy stan książki'),
    
  query('minPrice')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Minimalna cena musi być liczbą nieujemną'),
    
  query('maxPrice')
    .optional()
    .isFloat({ min: 0, max: 10000 })
    .withMessage('Maksymalna cena musi być liczbą od 0 do 10000'),
    
  query('sortBy')
    .optional()
    .isIn(['price', 'date', 'title', 'condition'])
    .withMessage('Nieprawidłowy sposób sortowania'),
    
  query('sortOrder')
    .optional()
    .isIn(['asc', 'desc'])
    .withMessage('Nieprawidłowy kierunek sortowania'),
    
  query('page')
    .optional()
    .isInt({ min: 1, max: 1000 })
    .withMessage('Numer strony musi być liczbą od 1 do 1000'),
    
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit wyników musi być liczbą od 1 do 100')
];

/**
 * Admin Validation Rules
 */

export const validateAdminUserApproval = [
  mongoIdValidation('userId'),
  
  body('action')
    .isIn(['approve', 'reject', 'suspend', 'activate'])
    .withMessage('Nieprawidłowa akcja'),
    
  body('reason')
    .optional()
    .trim()
    .isLength({ min: 5, max: 500 })
    .withMessage('Powód musi mieć od 5 do 500 znaków')
    .escape()
];

export const validateSalesTransaction = [
  body('qrData')
    .notEmpty()
    .withMessage('Dane QR są wymagane')
    .isJSON()
    .withMessage('Nieprawidłowy format danych QR'),
    
  body('paymentMethod')
    .optional()
    .isIn(['cash', 'card', 'transfer'])
    .withMessage('Nieprawidłowy sposób płatności'),
    
  body('notes')
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage('Notatki nie mogą być dłuższe niż 200 znaków')
    .escape()
];

/**
 * File Upload Validation Rules
 */

export const validateImageUpload = [
  body('images')
    .custom((value, { req }) => {
      if (!req.files || !Array.isArray(req.files) || req.files.length === 0) {
        throw new Error('Wybierz co najmniej jeden plik');
      }
      
      if (req.files.length > 5) {
        throw new Error('Można przesłać maksymalnie 5 zdjęć');
      }
      
      const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
      const maxSize = 5 * 1024 * 1024; // 5MB
      
      for (const file of req.files) {
        if (!allowedTypes.includes(file.mimetype)) {
          throw new Error('Dozwolone są tylko pliki: JPEG, PNG, GIF, WebP');
        }
        
        if (file.size > maxSize) {
          throw new Error('Rozmiar pliku nie może przekraczać 5MB');
        }
      }
      
      return true;
    })
];

/**
 * Email Validation Rules
 */

export const validateEmailVerification = [
  body('token')
    .notEmpty()
    .withMessage('Token weryfikacyjny jest wymagany')
    .isLength({ min: 32, max: 64 })
    .withMessage('Nieprawidłowy token weryfikacyjny')
    .matches(/^[a-zA-Z0-9]+$/)
    .withMessage('Token może zawierać tylko litery i cyfry')
];

export const validatePasswordReset = [
  body('email')
    .isEmail()
    .withMessage('Nieprawidłowy format adresu email')
    .normalizeEmail()
];

export const validateNewPassword = [
  body('token')
    .notEmpty()
    .withMessage('Token resetowania hasła jest wymagany')
    .isLength({ min: 32, max: 64 })
    .withMessage('Nieprawidłowy token resetowania')
    .matches(/^[a-zA-Z0-9]+$/)
    .withMessage('Token może zawierać tylko litery i cyfry'),
    
  passwordValidation,
  
  body('confirmPassword')
    .custom((value, { req }) => {
      if (value !== req.body.password) {
        throw new Error('Hasła nie są identyczne');
      }
      return true;
    })
];

/**
 * Rate Limiting Validators
 */

export const validateRateLimit = (maxRequests: number, windowMs: number, message: string) => {
  return (req: any, res: any, next: any) => {
    // This would integrate with express-rate-limit middleware
    // Implementation depends on your rate limiting strategy
    next();
  };
};

export default {
  // Public User validators
  validatePublicUserRegistration,
  validatePublicUserLogin,
  validatePublicUserUpdate,
  
  // Book Ad validators
  validateBookAdCreate,
  validateBookAdUpdate,
  validateBookAdStatusUpdate,
  
  // Shopping Cart validators
  validateAddToCart,
  validateRemoveFromCart,
  
  // Search validators
  validateBookSearch,
  
  // Admin validators
  validateAdminUserApproval,
  validateSalesTransaction,
  
  // File upload validators
  validateImageUpload,
  
  // Auth validators
  validateEmailVerification,
  validatePasswordReset,
  validateNewPassword,
  
  // Common validators
  emailValidation,
  passwordValidation,
  nameValidation,
  phoneValidation,
  mongoIdValidation
};
