/**
 * Simplified Enhanced Models - Core Implementation
 * Basic enhanced models without external dependencies until Node.js is properly set up
 */

// Base interfaces and types (can be expanded once dependencies are available)

export interface BaseDocument {
  _id: string;
  id: string;
  createdAt: Date;
  updatedAt: Date;
  save(): Promise<this>;
  remove(): Promise<void>;
}

export enum ListingStatus {
  PENDING = 'pending',
  ACCEPTED = 'accepted', 
  REJECTED = 'rejected',
  SOLD = 'sold',
  RESERVED = 'reserved',
  EXPIRED = 'expired',
  CANCELLED = 'cancelled'
}

export enum BookCondition {
  NEW = 'new',
  EXCELLENT = 'excellent',
  VERY_GOOD = 'very_good',
  GOOD = 'good',
  FAIR = 'fair',
  POOR = 'poor'
}

export enum UserRole {
  STUDENT = 'student',
  TEACHER = 'teacher',
  STAFF = 'staff',
  ADMIN = 'admin',
  SUPER_ADMIN = 'super_admin'
}

export enum UserStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  SUSPENDED = 'suspended',
  PENDING_VERIFICATION = 'pending_verification',
  BLOCKED = 'blocked'
}

// Enhanced Book Interface
export interface EnhancedBook extends BaseDocument {
  title: string;
  authors: string[];
  publisher: string;
  isbn: string;
  isbn13?: string;
  year: number;
  pages?: number;
  language: string;
  genre?: string[];
  description?: string;
  thumbnailUrl?: string;
  coverImageUrl?: string;
  subject?: string;
  gradeLevel?: number[];
  curriculum?: string;
  edition?: string;
  searchTerms: string[];
  popularity: number;
  averageRating?: number;
  totalRatings?: number;
  
  // Methods (will be implemented when mongoose is available)
  generateSearchTerms(): void;
  updatePopularity(): Promise<void>;
  getAvailableListings(): Promise<any[]>;
  isAvailableInSchool(schoolId: string): Promise<boolean>;
}

// Enhanced BookListing Interface  
export interface EnhancedBookListing extends BaseDocument {
  book: string; // ObjectId reference
  bookOwner: string; // ObjectId reference
  school: string; // ObjectId reference
  condition: BookCondition;
  price: number;
  originalPrice?: number;
  saleType: 'sell' | 'exchange' | 'donate';
  description?: string;
  notes?: string;
  status: ListingStatus;
  statusHistory: Array<{
    status: ListingStatus;
    timestamp: Date;
    changedBy?: string;
    reason?: string;
  }>;
  availableFrom: Date;
  availableTo?: Date;
  isActive: boolean;
  isPromoted: boolean;
  contactMethod: string[];
  preferredPickupLocation?: string;
  shippingAvailable: boolean;
  shippingCost?: number;
  images: Array<{
    url: string;
    description?: string;
    isPrimary: boolean;
    uploadedAt: Date;
  }>;
  viewCount: number;
  favoriteCount: number;
  inquiryCount: number;
  lastViewed?: Date;
  qualityScore: number;
  trustScore: number;
  reportCount: number;
  
  // Virtual properties
  isAvailable: boolean;
  daysListed: number;
  discountPercentage: number;
  primaryImage?: any;
  
  // Methods
  incrementViewCount(): Promise<void>;
  addToFavorites(userId: string): Promise<void>;
  removeFromFavorites(userId: string): Promise<void>;
  updateStatus(newStatus: ListingStatus, userId?: string, reason?: string): Promise<void>;
  calculateQualityScore(): number;
  isExpired(): boolean;
  getRelatedListings(limit?: number): Promise<EnhancedBookListing[]>;
}

// Enhanced User Interface
export interface EnhancedUser extends BaseDocument {
  email: string;
  password?: string;
  username?: string;
  profile: {
    name: string;
    surname: string;
    displayName?: string;
    bio?: string;
    avatar?: string;
    phoneNumber?: string;
    address?: {
      street?: string;
      city?: string;
      postalCode?: string;
      country?: string;
    };
    socialLinks?: {
      facebook?: string;
      instagram?: string;
      linkedin?: string;
    };
    preferences?: {
      language: string;
      currency: string;
      timezone: string;
      notifications: string[];
    };
  };
  role: UserRole;
  permissions: string[];
  schools: string[]; // ObjectId references
  primarySchool?: string; // ObjectId reference
  status: UserStatus;
  accountProvider: 'local' | 'google' | 'facebook' | 'microsoft';
  providerId?: string;
  emailVerified: boolean;
  emailVerificationToken?: string;
  emailVerificationExpires?: Date;
  phoneVerified: boolean;
  phoneVerificationCode?: string;
  phoneVerificationExpires?: Date;
  passwordResetToken?: string;
  passwordResetExpires?: Date;
  security: {
    twoFactorEnabled: boolean;
    twoFactorSecret?: string;
    twoFactorBackupCodes?: string[];
    loginAttempts: number;
    lockUntil?: Date;
    lastPasswordChange?: Date;
    passwordHistory?: string[];
    trustedDevices?: Array<{
      deviceId: string;
      deviceName: string;
      firstSeen: Date;
      lastSeen: Date;
      location?: string;
    }>;
  };
  activity: {
    loginCount: number;
    lastLogin?: Date;
    lastActiveAt?: Date;
    totalListings: number;
    successfulSales: number;
    totalPurchases: number;
    averageRating?: number;
    totalReviews: number;
    trustScore: number;
    reputationPoints: number;
  };
  
  // Virtual properties
  fullName: string;
  initials: string;
  isActive: boolean;
  isNewUser: boolean;
  
  // Methods
  comparePassword(candidatePassword: string): Promise<boolean>;
  generatePasswordResetToken(): string;
  generateEmailVerificationToken(): string;
  incrementLoginAttempts(): Promise<void>;
  resetLoginAttempts(): Promise<void>;
  isLocked(): boolean;
  updateLastActive(): Promise<void>;
  calculateTrustScore(): Promise<number>;
  hasPermission(permission: string): boolean;
  canAccessSchool(schoolId: string): boolean;
  getPublicProfile(): any;
  generateAPIToken(): string;
}

// Enhanced School Interface
export interface EnhancedSchool extends BaseDocument {
  name: string;
  address: {
    street: string;
    city: string;
    postalCode: string;
    country: string;
  };
  contactInfo: {
    phone?: string;
    email?: string;
    website?: string;
  };
  type: 'primary' | 'secondary' | 'high' | 'technical' | 'university';
  isActive: boolean;
  settings: {
    allowPublicListings: boolean;
    requireApproval: boolean;
    maxListingDuration: number;
    featuredListingsLimit: number;
  };
  statistics: {
    totalUsers: number;
    totalListings: number;
    activeListings: number;
    completedTransactions: number;
  };
  
  // Methods
  getActiveUsers(): Promise<EnhancedUser[]>;
  getActiveListings(): Promise<EnhancedBookListing[]>;
  updateStatistics(): Promise<void>;
}

// Performance utility functions (simplified until monitoring system is ready)
export const trackOperation = async <T>(
  operationName: string,
  operation: () => Promise<T>
): Promise<T> => {
  const startTime = Date.now();
  try {
    const result = await operation();
    const duration = Date.now() - startTime;
    console.log(`[PERF] ${operationName}: ${duration}ms`);
    return result;
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(`[PERF] ${operationName} failed after ${duration}ms:`, error);
    throw error;
  }
};

// Basic cache simulation (until Redis cache is integrated)
export const simpleCache = {
  store: new Map<string, { data: any; expires: number }>(),
  
  async get<T>(key: string): Promise<T | null> {
    const cached = this.store.get(key);
    if (!cached) return null;
    
    if (Date.now() > cached.expires) {
      this.store.delete(key);
      return null;
    }
    
    return cached.data;
  },
  
  async set<T>(key: string, data: T, ttlSeconds: number = 300): Promise<void> {
    this.store.set(key, {
      data,
      expires: Date.now() + (ttlSeconds * 1000)
    });
  },
  
  async delete(key: string): Promise<void> {
    this.store.delete(key);
  },
  
  async clear(): Promise<void> {
    this.store.clear();
  }
};

// Validation utilities
export const validateISBN = (isbn: string): boolean => {
  const cleanISBN = isbn.replace(/[^0-9X]/gi, '');
  
  if (cleanISBN.length === 10) {
    return validateISBN10(cleanISBN);
  } else if (cleanISBN.length === 13) {
    return validateISBN13(cleanISBN);
  }
  
  return false;
};

const validateISBN10 = (isbn: string): boolean => {
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(isbn[i]) * (10 - i);
  }
  const checkDigit = isbn[9].toUpperCase() === 'X' ? 10 : parseInt(isbn[9]);
  sum += checkDigit;
  return sum % 11 === 0;
};

const validateISBN13 = (isbn: string): boolean => {
  let sum = 0;
  for (let i = 0; i < 12; i++) {
    const weight = i % 2 === 0 ? 1 : 3;
    sum += parseInt(isbn[i]) * weight;
  }
  const checkDigit = (10 - (sum % 10)) % 10;
  return checkDigit === parseInt(isbn[12]);
};

export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validatePhoneNumber = (phone: string): boolean => {
  const phoneRegex = /^\+?[\d\s\-\(\)]+$/;
  return phoneRegex.test(phone);
};

// Search utilities
export const generateSearchTerms = (text: string): string[] => {
  const terms = new Set<string>();
  
  text.toLowerCase()
    .split(/\s+/)
    .forEach(word => {
      const cleaned = word.replace(/[^\w]/g, '');
      if (cleaned.length > 2) {
        terms.add(cleaned);
      }
    });
  
  return Array.from(terms);
};

// Logger placeholder (until Winston is available)
export const logger = {
  info: (message: string, meta?: any) => {
    console.log(`[INFO] ${message}`, meta ? JSON.stringify(meta) : '');
  },
  
  error: (message: string, meta?: any) => {
    console.error(`[ERROR] ${message}`, meta ? JSON.stringify(meta) : '');
  },
  
  warn: (message: string, meta?: any) => {
    console.warn(`[WARN] ${message}`, meta ? JSON.stringify(meta) : '');
  },
  
  debug: (message: string, meta?: any) => {
    console.debug(`[DEBUG] ${message}`, meta ? JSON.stringify(meta) : '');
  }
};

// Export all enhanced interfaces and utilities
// Note: Full mongoose models will be exported once dependencies are properly installed
// For now, we export the interfaces and utilities

// Default export with all utilities
export default {
  trackOperation,
  simpleCache,
  validateISBN,
  validateEmail,
  validatePhoneNumber,
  generateSearchTerms,
  logger,
  ListingStatus,
  BookCondition,
  UserRole,
  UserStatus
};
