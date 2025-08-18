import mongoose from "mongoose";
import { PublicUserDocument } from "./PublicUser";
import { BookDocument } from "./Book";
import { SchoolDocument } from "./School";
import { UserDocument } from "./User";

export type BookAdDocument = mongoose.Document & {
  owner: PublicUserDocument;
  book: BookDocument;
  
  // Pricing
  originalPrice: number;
  sellPrice: number; // originalPrice + margin
  margin: number; // default 5 PLN
  
  // Book condition and details
  condition: 'excellent' | 'good' | 'acceptable' | 'poor';
  description: string;
  images: string[]; // Array of image URLs
  
  // School and categorization
  school: SchoolDocument;
  subject?: string;
  class?: string;
  
  // Status workflow
  status: 'draft' | 'pending_verification' | 'verified' | 'published' | 'reserved' | 'sold' | 'returned' | 'rejected';
  
  // Admin verification
  verifiedBy?: UserDocument;
  verifiedAt?: Date;
  verificationNotes?: string;
  rejectionReason?: string;
  
  // Physical delivery to collection point
  deliveredToPoint: boolean;
  deliveredAt?: Date;
  deliveredBy?: UserDocument;
  
  // Reservation system
  reservedBy?: PublicUserDocument;
  reservedAt?: Date;
  reservationExpires?: Date;
  reservationCode?: string;
  
  // Sale completion
  soldBy?: UserDocument; // Physical seller who completed the sale
  soldAt?: Date;
  saleNotes?: string;
  
  // Return to owner
  returnedAt?: Date;
  returnReason?: string;
  
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
  
  // Methods
  calculateSellPrice: () => number;
  generateReservationCode: () => string;
  isAvailable: () => boolean;
  canBeReserved: () => boolean;
  getStatusDisplay: () => string;
  getImageUrls: () => string[];
};

const bookAdSchema = new mongoose.Schema<BookAdDocument>(
  {
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "PublicUser",
      required: true
    },
    book: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Book",
      required: true
    },
    
    // Pricing
    originalPrice: {
      type: Number,
      required: true,
      min: 1,
      max: 1000
    },
    sellPrice: {
      type: Number,
      required: true,
      min: 1
    },
    margin: {
      type: Number,
      default: 5.00 // 5 PLN margin
    },
    
    // Condition and details
    condition: {
      type: String,
      enum: ['excellent', 'good', 'acceptable', 'poor'],
      required: true
    },
    description: {
      type: String,
      maxlength: 1000,
      trim: true,
      default: ''
    },
    images: [{
      type: String,
      trim: true
    }],
    
    // Categorization
    school: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "School",
      required: true
    },
    subject: {
      type: String,
      trim: true,
      maxlength: 100
    },
    class: {
      type: String,
      trim: true,
      maxlength: 20
    },
    
    // Status
    status: {
      type: String,
      enum: ['draft', 'pending_verification', 'verified', 'published', 'reserved', 'sold', 'returned', 'rejected'],
      default: 'draft'
    },
    
    // Verification
    verifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    },
    verifiedAt: Date,
    verificationNotes: {
      type: String,
      maxlength: 500
    },
    rejectionReason: {
      type: String,
      maxlength: 500
    },
    
    // Delivery
    deliveredToPoint: {
      type: Boolean,
      default: false
    },
    deliveredAt: Date,
    deliveredBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    },
    
    // Reservation
    reservedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "PublicUser"
    },
    reservedAt: Date,
    reservationExpires: Date,
    reservationCode: {
      type: String,
      unique: true,
      sparse: true // Only unique if not null
    },
    
    // Sale
    soldBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    },
    soldAt: Date,
    saleNotes: {
      type: String,
      maxlength: 500
    },
    
    // Return
    returnedAt: Date,
    returnReason: {
      type: String,
      maxlength: 500
    }
  },
  {
    timestamps: true
  }
);

/**
 * Pre-save middleware to calculate sell price
 */
bookAdSchema.pre('save', function(next) {
  if (this.isModified('originalPrice') || this.isModified('margin')) {
    this.sellPrice = this.originalPrice + this.margin;
  }
  next();
});

/**
 * Calculate sell price with margin
 */
bookAdSchema.methods.calculateSellPrice = function() {
  return this.originalPrice + this.margin;
};

/**
 * Generate unique reservation code
 */
bookAdSchema.methods.generateReservationCode = function() {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substr(2, 5).toUpperCase();
  return `${timestamp}${random}`;
};

/**
 * Check if book ad is available for purchase
 */
bookAdSchema.methods.isAvailable = function() {
  return this.status === 'published' && this.deliveredToPoint;
};

/**
 * Check if book can be reserved
 */
bookAdSchema.methods.canBeReserved = function() {
  return this.isAvailable() && !this.reservedBy;
};

/**
 * Get human-readable status
 */
bookAdSchema.methods.getStatusDisplay = function() {
  const statusMap = {
    'draft': 'Szkic',
    'pending_verification': 'Oczekuje weryfikacji',
    'verified': 'Zweryfikowane - czeka na dostawę',
    'published': 'Dostępne do kupienia',
    'reserved': 'Zarezerwowane',
    'sold': 'Sprzedane',
    'returned': 'Zwrócone właścicielowi',
    'rejected': 'Odrzucone'
  };
  return statusMap[this.status] || this.status;
};

/**
 * Get image URLs for display
 */
bookAdSchema.methods.getImageUrls = function() {
  if (this.images && this.images.length > 0) {
    return this.images.map(img => `/api/bookads/${this._id}/images/${img}`);
  }
  // Return book cover if no ad images
  if (this.book && this.book.getImageLink) {
    return [this.book.getImageLink()];
  }
  return ['/images/no-book-image.png']; // Default placeholder
};

/**
 * Performance-optimized indexes for 2025 standards
 */
// Core business queries - compound indexes for maximum efficiency
bookAdSchema.index({ school: 1, status: 1, createdAt: -1 }); // School browsing with sorting
bookAdSchema.index({ owner: 1, status: 1, createdAt: -1 }); // User's ads management
bookAdSchema.index({ status: 1, school: 1, subject: 1 }); // Subject filtering
bookAdSchema.index({ status: 1, school: 1, class: 1 }); // Class filtering
bookAdSchema.index({ status: 1, sellPrice: 1 }); // Price range queries

// E-commerce specific indexes
bookAdSchema.index({ reservationCode: 1 }, { unique: true, sparse: true }); // Quick QR lookups
bookAdSchema.index({ reservedBy: 1, reservationExpires: 1 }); // Reservation management
bookAdSchema.index({ status: 1, reservationExpires: 1 }); // Expired cleanup jobs

// Search and analytics indexes
bookAdSchema.index({ condition: 1, sellPrice: 1 }); // Condition-price analytics
bookAdSchema.index({ createdAt: -1 }); // Timeline queries
bookAdSchema.index({ 'book': 1, status: 1 }); // Book popularity tracking

/**
 * Advanced text search index with weights
 */
bookAdSchema.index({
  description: 'text',
  subject: 'text',
  class: 'text'
}, {
  weights: {
    subject: 10,
    class: 5,
    description: 1
  },
  name: 'BookAdSearchIndex'
});

export const BookAd = mongoose.model<BookAdDocument>("BookAd", bookAdSchema);
