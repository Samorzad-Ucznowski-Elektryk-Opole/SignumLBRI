/**
 * Enhanced User Model with Advanced Features
 * Comprehensive user management with authentication, authorization, and activity tracking
 */

import mongoose, { Document, Schema, Model, Types } from 'mongoose';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { cache } from '../util/cache';
import { trackDatabaseQuery } from '../util/performanceMonitor';
import logger from '../util/logger';

// Enums for type safety
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

export enum AccountProvider {
  LOCAL = 'local',
  GOOGLE = 'google',
  FACEBOOK = 'facebook',
  MICROSOFT = 'microsoft'
}

export enum NotificationPreference {
  EMAIL = 'email',
  SMS = 'sms',
  PUSH = 'push',
  IN_APP = 'in_app'
}

// Profile interface
interface UserProfile {
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
    notifications: NotificationPreference[];
  };
}

// Security settings interface
interface SecuritySettings {
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
}

// Activity tracking interface
interface ActivityStats {
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
}

// User Document interface
export interface UserDocument extends Document {
  // Basic authentication
  email: string;
  password?: string;
  username?: string;
  
  // Profile information
  profile: UserProfile;
  
  // Role and permissions
  role: UserRole;
  permissions: string[];
  schools: Types.ObjectId[];
  primarySchool?: Types.ObjectId;
  
  // Account status
  status: UserStatus;
  accountProvider: AccountProvider;
  providerId?: string;
  
  // Verification
  emailVerified: boolean;
  emailVerificationToken?: string;
  emailVerificationExpires?: Date;
  phoneVerified: boolean;
  phoneVerificationCode?: string;
  phoneVerificationExpires?: Date;
  
  // Password reset
  passwordResetToken?: string;
  passwordResetExpires?: Date;
  
  // Security
  security: SecuritySettings;
  
  // Activity and statistics
  activity: ActivityStats;
  
  // Metadata
  createdAt: Date;
  updatedAt: Date;
  lastModifiedBy?: Types.ObjectId;
  
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
  canAccessSchool(schoolId: Types.ObjectId): boolean;
  getPublicProfile(): any;
  generateAPIToken(): string;
}

// User Schema
const userSchema = new Schema<UserDocument>({
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    validate: {
      validator: (email: string) => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
      },
      message: 'Please enter a valid email address'
    },
    index: true
  },
  
  password: {
    type: String,
    minlength: [6, 'Password must be at least 6 characters long'],
    select: false, // Don't include in queries by default
    validate: {
      validator: function(this: UserDocument, password: string) {
        // Only validate if password is being set (not for OAuth users)
        if (this.accountProvider !== AccountProvider.LOCAL) return true;
        return password && password.length >= 6;
      },
      message: 'Password is required for local accounts'
    }
  },
  
  username: {
    type: String,
    unique: true,
    sparse: true,
    trim: true,
    minlength: [3, 'Username must be at least 3 characters long'],
    maxlength: [30, 'Username cannot exceed 30 characters'],
    validate: {
      validator: (username: string) => {
        return !username || /^[a-zA-Z0-9_]+$/.test(username);
      },
      message: 'Username can only contain letters, numbers, and underscores'
    }
  },
  
  // Profile
  profile: {
    name: {
      type: String,
      required: [true, 'First name is required'],
      trim: true,
      maxlength: [50, 'First name cannot exceed 50 characters']
    },
    
    surname: {
      type: String,
      required: [true, 'Last name is required'],
      trim: true,
      maxlength: [50, 'Last name cannot exceed 50 characters']
    },
    
    displayName: {
      type: String,
      trim: true,
      maxlength: [100, 'Display name cannot exceed 100 characters']
    },
    
    bio: {
      type: String,
      maxlength: [500, 'Bio cannot exceed 500 characters'],
      trim: true
    },
    
    avatar: {
      type: String,
      validate: {
        validator: (url: string) => !url || /^https?:\/\/.+/.test(url),
        message: 'Invalid avatar URL'
      }
    },
    
    phoneNumber: {
      type: String,
      validate: {
        validator: (phone: string) => {
          return !phone || /^\+?[\d\s\-\(\)]+$/.test(phone);
        },
        message: 'Invalid phone number format'
      }
    },
    
    address: {
      street: { type: String, maxlength: 200 },
      city: { type: String, maxlength: 100 },
      postalCode: { type: String, maxlength: 20 },
      country: { type: String, maxlength: 100, default: 'Poland' }
    },
    
    socialLinks: {
      facebook: {
        type: String,
        validate: {
          validator: (url: string) => !url || /^https?:\/\/(www\.)?facebook\.com\//.test(url),
          message: 'Invalid Facebook URL'
        }
      },
      instagram: {
        type: String,
        validate: {
          validator: (url: string) => !url || /^https?:\/\/(www\.)?instagram\.com\//.test(url),
          message: 'Invalid Instagram URL'
        }
      },
      linkedin: {
        type: String,
        validate: {
          validator: (url: string) => !url || /^https?:\/\/(www\.)?linkedin\.com\//.test(url),
          message: 'Invalid LinkedIn URL'
        }
      }
    },
    
    preferences: {
      language: {
        type: String,
        enum: ['pl', 'en', 'uk', 'de', 'fr'],
        default: 'pl'
      },
      currency: {
        type: String,
        enum: ['PLN', 'EUR', 'USD'],
        default: 'PLN'
      },
      timezone: {
        type: String,
        default: 'Europe/Warsaw'
      },
      notifications: [{
        type: String,
        enum: Object.values(NotificationPreference),
        default: [NotificationPreference.EMAIL, NotificationPreference.IN_APP]
      }]
    }
  },
  
  // Role and permissions
  role: {
    type: String,
    enum: Object.values(UserRole),
    default: UserRole.STUDENT,
    index: true
  },
  
  permissions: [{
    type: String,
    enum: [
      'books.create', 'books.edit', 'books.delete', 'books.moderate',
      'listings.create', 'listings.edit', 'listings.delete', 'listings.moderate',
      'users.view', 'users.edit', 'users.delete', 'users.moderate',
      'schools.view', 'schools.edit', 'schools.create', 'schools.delete',
      'reports.view', 'reports.create', 'reports.moderate',
      'admin.access', 'system.manage'
    ]
  }],
  
  schools: [{
    type: Schema.Types.ObjectId,
    ref: 'School',
    index: true
  }],
  
  primarySchool: {
    type: Schema.Types.ObjectId,
    ref: 'School'
  },
  
  // Account status
  status: {
    type: String,
    enum: Object.values(UserStatus),
    default: UserStatus.PENDING_VERIFICATION,
    index: true
  },
  
  accountProvider: {
    type: String,
    enum: Object.values(AccountProvider),
    default: AccountProvider.LOCAL
  },
  
  providerId: {
    type: String,
    sparse: true,
    index: true
  },
  
  // Verification
  emailVerified: {
    type: Boolean,
    default: false,
    index: true
  },
  
  emailVerificationToken: {
    type: String,
    select: false
  },
  
  emailVerificationExpires: {
    type: Date,
    select: false
  },
  
  phoneVerified: {
    type: Boolean,
    default: false
  },
  
  phoneVerificationCode: {
    type: String,
    select: false
  },
  
  phoneVerificationExpires: {
    type: Date,
    select: false
  },
  
  // Password reset
  passwordResetToken: {
    type: String,
    select: false
  },
  
  passwordResetExpires: {
    type: Date,
    select: false
  },
  
  // Security settings
  security: {
    twoFactorEnabled: {
      type: Boolean,
      default: false
    },
    
    twoFactorSecret: {
      type: String,
      select: false
    },
    
    twoFactorBackupCodes: [{
      type: String,
      select: false
    }],
    
    loginAttempts: {
      type: Number,
      default: 0
    },
    
    lockUntil: {
      type: Date,
      index: true
    },
    
    lastPasswordChange: {
      type: Date,
      default: Date.now
    },
    
    passwordHistory: [{
      type: String,
      select: false
    }],
    
    trustedDevices: [{
      deviceId: { type: String, required: true },
      deviceName: { type: String, required: true },
      firstSeen: { type: Date, default: Date.now },
      lastSeen: { type: Date, default: Date.now },
      location: String
    }]
  },
  
  // Activity and statistics
  activity: {
    loginCount: {
      type: Number,
      default: 0
    },
    
    lastLogin: {
      type: Date,
      index: true
    },
    
    lastActiveAt: {
      type: Date,
      default: Date.now,
      index: true
    },
    
    totalListings: {
      type: Number,
      default: 0,
      min: 0
    },
    
    successfulSales: {
      type: Number,
      default: 0,
      min: 0
    },
    
    totalPurchases: {
      type: Number,
      default: 0,
      min: 0
    },
    
    averageRating: {
      type: Number,
      min: 0,
      max: 5
    },
    
    totalReviews: {
      type: Number,
      default: 0,
      min: 0
    },
    
    trustScore: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    },
    
    reputationPoints: {
      type: Number,
      default: 0,
      min: 0
    }
  },
  
  lastModifiedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  }
  
}, {
  timestamps: true,
  toJSON: { 
    virtuals: true,
    transform: function(doc, ret) {
      delete ret.password;
      delete ret.security.twoFactorSecret;
      delete ret.security.twoFactorBackupCodes;
      delete ret.security.passwordHistory;
      return ret;
    }
  },
  toObject: { virtuals: true }
});

// Indexes
userSchema.index({ email: 1 }, { unique: true });
userSchema.index({ username: 1 }, { unique: true, sparse: true });
userSchema.index({ role: 1, status: 1 });
userSchema.index({ schools: 1 });
userSchema.index({ 'profile.name': 'text', 'profile.surname': 'text' });
userSchema.index({ createdAt: -1 });
userSchema.index({ 'activity.lastActiveAt': -1 });

// Virtual fields
userSchema.virtual('fullName').get(function(this: UserDocument) {
  return `${this.profile.name} ${this.profile.surname}`;
});

userSchema.virtual('initials').get(function(this: UserDocument) {
  return `${this.profile.name[0]}${this.profile.surname[0]}`.toUpperCase();
});

userSchema.virtual('isActive').get(function(this: UserDocument) {
  return this.status === UserStatus.ACTIVE;
});

userSchema.virtual('isNewUser').get(function(this: UserDocument) {
  const daysSinceCreation = (Date.now() - this.createdAt.getTime()) / (1000 * 60 * 60 * 24);
  return daysSinceCreation <= 7;
});

// Instance Methods
userSchema.methods.comparePassword = async function(candidatePassword: string): Promise<boolean> {
  if (!this.password) return false;
  return await bcrypt.compare(candidatePassword, this.password);
};

userSchema.methods.generatePasswordResetToken = function(): string {
  const resetToken = crypto.randomBytes(32).toString('hex');
  this.passwordResetToken = crypto.createHash('sha256').update(resetToken).digest('hex');
  this.passwordResetExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
  return resetToken;
};

userSchema.methods.generateEmailVerificationToken = function(): string {
  const verificationToken = crypto.randomBytes(32).toString('hex');
  this.emailVerificationToken = crypto.createHash('sha256').update(verificationToken).digest('hex');
  this.emailVerificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
  return verificationToken;
};

userSchema.methods.incrementLoginAttempts = async function(): Promise<void> {
  // If we have a previous lock that has expired, restart at 1
  if (this.security.lockUntil && this.security.lockUntil < new Date()) {
    return await this.updateOne({
      $set: {
        'security.loginAttempts': 1
      },
      $unset: {
        'security.lockUntil': 1
      }
    });
  }
  
  const updates: any = { $inc: { 'security.loginAttempts': 1 } };
  
  // Lock account after 5 failed attempts
  if (this.security.loginAttempts + 1 >= 5 && !this.isLocked()) {
    updates.$set = { 'security.lockUntil': Date.now() + 2 * 60 * 60 * 1000 }; // 2 hours
  }
  
  return await this.updateOne(updates);
};

userSchema.methods.resetLoginAttempts = async function(): Promise<void> {
  return await this.updateOne({
    $unset: {
      'security.loginAttempts': 1,
      'security.lockUntil': 1
    }
  });
};

userSchema.methods.isLocked = function(): boolean {
  return !!(this.security.lockUntil && this.security.lockUntil > new Date());
};

userSchema.methods.updateLastActive = async function(): Promise<void> {
  this.activity.lastActiveAt = new Date();
  await this.save();
  
  // Invalidate cache
  await cache.delete(`user:${this.id}`);
};

userSchema.methods.calculateTrustScore = async function(): Promise<number> {
  let score = 0;
  
  // Base score for verified accounts
  if (this.emailVerified) score += 20;
  if (this.phoneVerified) score += 15;
  
  // Account age bonus
  const accountAge = (Date.now() - this.createdAt.getTime()) / (1000 * 60 * 60 * 24);
  if (accountAge > 30) score += 10;
  if (accountAge > 90) score += 10;
  if (accountAge > 365) score += 15;
  
  // Activity bonus
  if (this.activity.totalListings > 5) score += 10;
  if (this.activity.successfulSales > 3) score += 15;
  
  // Rating bonus
  if (this.activity.averageRating) {
    score += (this.activity.averageRating - 3) * 5; // Max 10 points
  }
  
  // Penalty for reports (would need to implement reporting system)
  // score -= reportCount * 5;
  
  this.activity.trustScore = Math.max(0, Math.min(100, score));
  return this.activity.trustScore;
};

userSchema.methods.hasPermission = function(permission: string): boolean {
  return this.permissions.includes(permission);
};

userSchema.methods.canAccessSchool = function(schoolId: Types.ObjectId): boolean {
  return this.schools.some(school => school.equals(schoolId));
};

userSchema.methods.getPublicProfile = function(): any {
  return {
    id: this.id,
    profile: {
      name: this.profile.name,
      surname: this.profile.surname,
      displayName: this.profile.displayName,
      avatar: this.profile.avatar
    },
    activity: {
      totalListings: this.activity.totalListings,
      successfulSales: this.activity.successfulSales,
      averageRating: this.activity.averageRating,
      trustScore: this.activity.trustScore
    },
    memberSince: this.createdAt
  };
};

userSchema.methods.generateAPIToken = function(): string {
  const payload = {
    userId: this.id,
    email: this.email,
    role: this.role,
    timestamp: Date.now()
  };
  
  return crypto
    .createHmac('sha256', process.env.JWT_SECRET || 'fallback-secret')
    .update(JSON.stringify(payload))
    .digest('hex');
};

// Static Methods
userSchema.statics.findByEmail = async function(email: string): Promise<UserDocument | null> {
  return await this.findOne({ email: email.toLowerCase() }).select('+password');
};

userSchema.statics.findActiveUsers = async function(limit: number = 20): Promise<UserDocument[]> {
  return await trackDatabaseQuery(
    'findActiveUsers',
    () => this.find({ 
      status: UserStatus.ACTIVE 
    })
    .populate('schools', 'name')
    .sort({ 'activity.lastActiveAt': -1 })
    .limit(limit)
    .lean()
    .exec()
  );
};

userSchema.statics.getUserStats = async function(): Promise<any> {
  const cacheKey = 'user_stats';
  let stats = await cache.get(cacheKey);
  
  if (!stats) {
    const [total, active, verified] = await Promise.all([
      this.countDocuments({}),
      this.countDocuments({ status: UserStatus.ACTIVE }),
      this.countDocuments({ emailVerified: true })
    ]);
    
    stats = {
      total,
      active,
      verified,
      verificationRate: total > 0 ? ((verified / total) * 100).toFixed(1) : 0
    };
    
    await cache.set(cacheKey, stats, 600); // Cache for 10 minutes
  }
  
  return stats;
};

// Pre-save middleware
userSchema.pre('save', async function(next: any) {
  // Hash password if modified
  if (this.isModified('password') && this.password) {
    const saltRounds = 12;
    this.password = await bcrypt.hash(this.password, saltRounds);
    
    // Add to password history (keep last 5)
    if (!this.security.passwordHistory) {
      this.security.passwordHistory = [];
    }
    this.security.passwordHistory.push(this.password);
    if (this.security.passwordHistory.length > 5) {
      this.security.passwordHistory.shift();
    }
    
    this.security.lastPasswordChange = new Date();
  }
  
  // Set display name if not provided
  if (!this.profile.displayName) {
    this.profile.displayName = this.fullName;
  }
  
  // Update trust score
  await this.calculateTrustScore();
  
  next();
});

// Post-save middleware
userSchema.post('save', async function(this: UserDocument) {
  // Invalidate related caches
  await Promise.all([
    cache.delete(`user:${this.id}`),
    cache.delete('user_stats')
  ]);
});

// Create and export model
export const User: Model<UserDocument> = mongoose.model<UserDocument>('User', userSchema);

export default User;
