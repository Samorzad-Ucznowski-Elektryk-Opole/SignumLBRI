/**
 * Enhanced BookListing Model with Advanced Features
 * Comprehensive book listing management with validation, caching, and monitoring
 */

import mongoose, { Document, Schema, Model, Types } from 'mongoose';
import { cache } from '../util/cache';
import { trackDatabaseQuery } from '../util/performanceMonitor';
import logger from '../util/logger';

// Enums for better type safety
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

export enum SaleType {
  SELL = 'sell',
  EXCHANGE = 'exchange',
  DONATE = 'donate'
}

// BookListing Interface
export interface BookListingDocument extends Document {
  // Core fields
  book: Types.ObjectId;
  bookOwner: Types.ObjectId;
  school: Types.ObjectId;
  
  // Listing details
  condition: BookCondition;
  price: number;
  originalPrice?: number;
  saleType: SaleType;
  description?: string;
  notes?: string;
  
  // Status and workflow
  status: ListingStatus;
  statusHistory: Array<{
    status: ListingStatus;
    timestamp: Date;
    changedBy?: Types.ObjectId;
    reason?: string;
  }>;
  
  // Availability
  availableFrom: Date;
  availableTo?: Date;
  isActive: boolean;
  isPromoted: boolean;
  
  // Contact and logistics
  contactMethod: string[];
  preferredPickupLocation?: string;
  shippingAvailable: boolean;
  shippingCost?: number;
  
  // Images and media
  images: Array<{
    url: string;
    description?: string;
    isPrimary: boolean;
    uploadedAt: Date;
  }>;
  
  // Interaction tracking
  viewCount: number;
  favoriteCount: number;
  inquiryCount: number;
  lastViewed?: Date;
  
  // Quality and trust
  qualityScore: number;
  trustScore: number;
  reportCount: number;
  
  // Metadata
  createdAt: Date;
  updatedAt: Date;
  moderatedBy?: Types.ObjectId;
  moderatedAt?: Date;
  
  // Exchange specific
  exchangeFor?: string[];
  exchangeWithBooks?: Types.ObjectId[];
  
  // Methods
  incrementViewCount(): Promise<void>;
  addToFavorites(userId: Types.ObjectId): Promise<void>;
  removeFromFavorites(userId: Types.ObjectId): Promise<void>;
  updateStatus(newStatus: ListingStatus, userId?: Types.ObjectId, reason?: string): Promise<void>;
  calculateQualityScore(): number;
  isExpired(): boolean;
  getRelatedListings(limit?: number): Promise<BookListingDocument[]>;
  generateSEOMetadata(): any;
}

// BookListing Schema
const bookListingSchema = new Schema<BookListingDocument>({
  book: {
    type: Schema.Types.ObjectId,
    ref: 'Book',
    required: [true, 'Book reference is required'],
    index: true
  },
  
  bookOwner: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Book owner is required'],
    index: true
  },
  
  school: {
    type: Schema.Types.ObjectId,
    ref: 'School',
    required: [true, 'School is required'],
    index: true
  },
  
  condition: {
    type: String,
    enum: Object.values(BookCondition),
    required: [true, 'Book condition is required'],
    index: true
  },
  
  price: {
    type: Number,
    required: function(this: BookListingDocument) {
      return this.saleType === SaleType.SELL;
    },
    min: [0, 'Price cannot be negative'],
    max: [10000, 'Price seems unrealistic'],
    index: true
  },
  
  originalPrice: {
    type: Number,
    min: [0, 'Original price cannot be negative'],
    validate: {
      validator: function(this: BookListingDocument, value: number) {
        return !this.price || !value || value >= this.price;
      },
      message: 'Original price must be higher than selling price'
    }
  },
  
  saleType: {
    type: String,
    enum: Object.values(SaleType),
    required: [true, 'Sale type is required'],
    default: SaleType.SELL,
    index: true
  },
  
  description: {
    type: String,
    maxlength: [1000, 'Description cannot exceed 1000 characters'],
    trim: true
  },
  
  notes: {
    type: String,
    maxlength: [500, 'Notes cannot exceed 500 characters'],
    trim: true
  },
  
  status: {
    type: String,
    enum: Object.values(ListingStatus),
    default: ListingStatus.PENDING,
    index: true
  },
  
  statusHistory: [{
    status: {
      type: String,
      enum: Object.values(ListingStatus),
      required: true
    },
    timestamp: {
      type: Date,
      default: Date.now
    },
    changedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User'
    },
    reason: {
      type: String,
      maxlength: 200
    }
  }],
  
  availableFrom: {
    type: Date,
    default: Date.now,
    index: true
  },
  
  availableTo: {
    type: Date,
    validate: {
      validator: function(this: BookListingDocument, value: Date) {
        return !value || value > this.availableFrom;
      },
      message: 'Available to date must be after available from date'
    },
    index: true
  },
  
  isActive: {
    type: Boolean,
    default: true,
    index: true
  },
  
  isPromoted: {
    type: Boolean,
    default: false,
    index: true
  },
  
  contactMethod: [{
    type: String,
    enum: ['email', 'phone', 'messenger', 'whatsapp', 'school_meeting'],
    required: true
  }],
  
  preferredPickupLocation: {
    type: String,
    maxlength: [200, 'Pickup location cannot exceed 200 characters']
  },
  
  shippingAvailable: {
    type: Boolean,
    default: false,
    index: true
  },
  
  shippingCost: {
    type: Number,
    min: [0, 'Shipping cost cannot be negative'],
    required: function(this: BookListingDocument) {
      return this.shippingAvailable;
    }
  },
  
  images: [{
    url: {
      type: String,
      required: true,
      validate: {
        validator: (url: string) => /^https?:\/\/.+/.test(url),
        message: 'Invalid image URL'
      }
    },
    description: {
      type: String,
      maxlength: [200, 'Image description cannot exceed 200 characters']
    },
    isPrimary: {
      type: Boolean,
      default: false
    },
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],
  
  viewCount: {
    type: Number,
    default: 0,
    min: 0
  },
  
  favoriteCount: {
    type: Number,
    default: 0,
    min: 0
  },
  
  inquiryCount: {
    type: Number,
    default: 0,
    min: 0
  },
  
  lastViewed: {
    type: Date
  },
  
  qualityScore: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  
  trustScore: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  
  reportCount: {
    type: Number,
    default: 0,
    min: 0
  },
  
  moderatedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  
  moderatedAt: {
    type: Date
  },
  
  // Exchange specific fields
  exchangeFor: [{
    type: String,
    maxlength: [100, 'Exchange item cannot exceed 100 characters']
  }],
  
  exchangeWithBooks: [{
    type: Schema.Types.ObjectId,
    ref: 'Book'
  }]
  
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Compound indexes for performance
bookListingSchema.index({ book: 1, school: 1, status: 1 });
bookListingSchema.index({ bookOwner: 1, status: 1, createdAt: -1 });
bookListingSchema.index({ school: 1, saleType: 1, isActive: 1 });
bookListingSchema.index({ price: 1, condition: 1 });
bookListingSchema.index({ status: 1, availableFrom: 1, availableTo: 1 });
bookListingSchema.index({ isPromoted: -1, qualityScore: -1, createdAt: -1 });

// Text index for search
bookListingSchema.index({
  description: 'text',
  notes: 'text',
  'exchangeFor': 'text'
});

// Virtual fields
bookListingSchema.virtual('isAvailable').get(function(this: BookListingDocument) {
  if (!this.isActive || this.status !== ListingStatus.ACCEPTED) {
    return false;
  }
  
  const now = new Date();
  if (this.availableFrom > now) return false;
  if (this.availableTo && this.availableTo < now) return false;
  
  return true;
});

bookListingSchema.virtual('daysListed').get(function(this: BookListingDocument) {
  const now = new Date();
  const diffTime = Math.abs(now.getTime() - this.createdAt.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
});

bookListingSchema.virtual('discountPercentage').get(function(this: BookListingDocument) {
  if (!this.originalPrice || !this.price) return 0;
  return Math.round(((this.originalPrice - this.price) / this.originalPrice) * 100);
});

bookListingSchema.virtual('primaryImage').get(function(this: BookListingDocument) {
  return this.images.find(img => img.isPrimary) || this.images[0] || null;
});

// Instance Methods
bookListingSchema.methods.incrementViewCount = async function(this: BookListingDocument): Promise<void> {
  try {
    this.viewCount += 1;
    this.lastViewed = new Date();
    await this.save();
    
    // Update cache
    await cache.delete(`listing:${this.id}`);
    
  } catch (error) {
    logger.error('Failed to increment view count', { listingId: this.id, error });
  }
};

bookListingSchema.methods.addToFavorites = async function(this: BookListingDocument, userId: Types.ObjectId): Promise<void> {
  try {
    // Check if already favorited (would need separate UserFavorites model)
    this.favoriteCount += 1;
    await this.save();
    
  } catch (error) {
    logger.error('Failed to add to favorites', { listingId: this.id, userId, error });
  }
};

bookListingSchema.methods.removeFromFavorites = async function(this: BookListingDocument, userId: Types.ObjectId): Promise<void> {
  try {
    this.favoriteCount = Math.max(0, this.favoriteCount - 1);
    await this.save();
    
  } catch (error) {
    logger.error('Failed to remove from favorites', { listingId: this.id, userId, error });
  }
};

bookListingSchema.methods.updateStatus = async function(
  this: BookListingDocument,
  newStatus: ListingStatus,
  userId?: Types.ObjectId,
  reason?: string
): Promise<void> {
  try {
    const oldStatus = this.status;
    this.status = newStatus;
    
    // Add to history
    this.statusHistory.push({
      status: newStatus,
      timestamp: new Date(),
      changedBy: userId,
      reason
    } as any);
    
    // Special handling for status changes
    if (newStatus === ListingStatus.SOLD) {
      this.isActive = false;
    } else if (newStatus === ListingStatus.ACCEPTED && oldStatus === ListingStatus.PENDING) {
      this.isActive = true;
    }
    
    await this.save();
    
    // Invalidate caches
    await cache.delete(`listing:${this.id}`);
    await cache.delete(`user_listings:${this.bookOwner}`);
    
    logger.info('Listing status updated', {
      listingId: this.id,
      oldStatus,
      newStatus,
      userId: userId?.toString(),
      reason
    });
    
  } catch (error) {
    logger.error('Failed to update listing status', {
      listingId: this.id,
      newStatus,
      error
    });
    throw error;
  }
};

bookListingSchema.methods.calculateQualityScore = function(this: BookListingDocument): number {
  let score = 0;
  
  // Base score from condition
  const conditionScores = {
    [BookCondition.NEW]: 100,
    [BookCondition.EXCELLENT]: 90,
    [BookCondition.VERY_GOOD]: 80,
    [BookCondition.GOOD]: 70,
    [BookCondition.FAIR]: 60,
    [BookCondition.POOR]: 50
  };
  
  score += conditionScores[this.condition] || 50;
  
  // Bonus for having images
  if (this.images.length > 0) score += 10;
  if (this.images.length > 2) score += 5;
  
  // Bonus for detailed description
  if (this.description && this.description.length > 50) score += 10;
  if (this.description && this.description.length > 200) score += 5;
  
  // Penalty for reports
  score -= (this.reportCount * 5);
  
  // Ensure score is within bounds
  return Math.max(0, Math.min(100, score));
};

bookListingSchema.methods.isExpired = function(this: BookListingDocument): boolean {
  if (!this.availableTo) return false;
  return new Date() > this.availableTo;
};

bookListingSchema.methods.getRelatedListings = async function(
  this: BookListingDocument,
  limit: number = 5
): Promise<BookListingDocument[]> {
  try {
    const cacheKey = `related_listings:${this.id}:${limit}`;
    let relatedListings = await cache.get(cacheKey);
    
    if (!relatedListings) {
      relatedListings = await trackDatabaseQuery(
        `getRelatedListings:${this.id}`,
        () => BookListing.find({
          $and: [
            { _id: { $ne: this.id } },
            { book: this.book },
            { status: ListingStatus.ACCEPTED },
            { isActive: true }
          ]
        })
        .populate('bookOwner', 'profile.name profile.surname')
        .populate('school', 'name')
        .sort({ qualityScore: -1, createdAt: -1 })
        .limit(limit)
        .lean()
        .exec()
      );
      
      await cache.set(cacheKey, relatedListings, 300); // Cache for 5 minutes
    }
    
    return relatedListings;
  } catch (error) {
    logger.error('Failed to get related listings', { listingId: this.id, error });
    return [];
  }
};

bookListingSchema.methods.generateSEOMetadata = function(this: BookListingDocument): any {
  const bookTitle = (this as any).book?.title || 'Book';
  const price = this.price ? `${this.price}zł` : 'Exchange';
  const condition = this.condition.replace('_', ' ');
  
  return {
    title: `${bookTitle} - ${condition} condition - ${price}`,
    description: this.description || `${bookTitle} in ${condition} condition available for ${this.saleType}`,
    keywords: [
      bookTitle,
      'textbook',
      'school book',
      condition,
      this.saleType,
      'SignumLBRI'
    ].join(', ')
  };
};

// Static Methods
bookListingSchema.statics.findActiveListings = async function(
  filters: any = {},
  sort: any = { createdAt: -1 },
  limit: number = 20,
  skip: number = 0
): Promise<BookListingDocument[]> {
  const query = {
    status: ListingStatus.ACCEPTED,
    isActive: true,
    ...filters
  };
  
  return await trackDatabaseQuery(
    `findActiveListings:${JSON.stringify({ filters, sort, limit, skip })}`,
    () => this.find(query)
      .populate('book', 'title authors publisher year isbn')
      .populate('bookOwner', 'profile.name profile.surname')
      .populate('school', 'name')
      .sort(sort)
      .limit(limit)
      .skip(skip)
      .lean()
      .exec()
  );
};

bookListingSchema.statics.getUserListings = async function(
  userId: Types.ObjectId,
  includeInactive: boolean = false
): Promise<BookListingDocument[]> {
  const cacheKey = `user_listings:${userId}:${includeInactive}`;
  let listings = await cache.get(cacheKey);
  
  if (!listings) {
    const query: any = { bookOwner: userId };
    if (!includeInactive) {
      query.status = { $in: [ListingStatus.ACCEPTED, ListingStatus.PENDING] };
    }
    
    listings = await trackDatabaseQuery(
      `getUserListings:${userId}`,
      () => this.find(query)
        .populate('book', 'title authors publisher year')
        .populate('school', 'name')
        .sort({ createdAt: -1 })
        .lean()
        .exec()
    );
    
    await cache.set(cacheKey, listings, 300); // Cache for 5 minutes
  }
  
  return listings;
};

bookListingSchema.statics.getListingsStats = async function(): Promise<any> {
  const cacheKey = 'listings_stats';
  let stats = await cache.get(cacheKey);
  
  if (!stats) {
    const [totalListings, activeListings, soldListings] = await Promise.all([
      this.countDocuments({}),
      this.countDocuments({ status: ListingStatus.ACCEPTED, isActive: true }),
      this.countDocuments({ status: ListingStatus.SOLD })
    ]);
    
    stats = {
      total: totalListings,
      active: activeListings,
      sold: soldListings,
      successRate: totalListings > 0 ? ((soldListings / totalListings) * 100).toFixed(1) : 0
    };
    
    await cache.set(cacheKey, stats, 600); // Cache for 10 minutes
  }
  
  return stats;
};

// Pre-save hooks
bookListingSchema.pre('save', function(next: any) {
  // Calculate quality score
  this.qualityScore = this.calculateQualityScore();
  
  // Ensure only one primary image
  if (this.images.length > 0) {
    const primaryCount = this.images.filter(img => img.isPrimary).length;
    if (primaryCount === 0) {
      this.images[0].isPrimary = true;
    } else if (primaryCount > 1) {
      // Set only the first one as primary
      this.images.forEach((img, index) => {
        img.isPrimary = index === 0;
      });
    }
  }
  
  // Set initial status history if new document
  if (this.isNew && this.statusHistory.length === 0) {
    this.statusHistory.push({
      status: this.status,
      timestamp: new Date()
    } as any);
  }
  
  next();
});

// Post-save hooks
bookListingSchema.post('save', async function(this: BookListingDocument) {
  // Invalidate related caches
  await Promise.all([
    cache.delete(`listing:${this.id}`),
    cache.delete(`user_listings:${this.bookOwner}`),
    cache.delete(`book_listings:${this.book}`),
    cache.delete('listings_stats')
  ]);
});

// Create and export model
export const BookListing: Model<BookListingDocument> = mongoose.model<BookListingDocument>('BookListing', bookListingSchema);

export default BookListing;
