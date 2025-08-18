import mongoose from "mongoose";
import { PublicUserDocument } from "./PublicUser";
import { SchoolDocument } from "./School";
import { BookAdDocument } from "./BookAd";

export type ShoppingCartItemDocument = {
  bookAd: BookAdDocument;
  addedAt: Date;
  reservationExpires: Date;
  quantity: number; // Always 1 for books, but kept for extensibility
};

export type ShoppingCartDocument = mongoose.Document & {
  user: PublicUserDocument;
  school: SchoolDocument;
  items: ShoppingCartItemDocument[];
  
  totalAmount: number;
  totalItems: number;
  
  status: 'active' | 'reserved' | 'completed' | 'expired' | 'cancelled';
  
  // Reservation details
  reservationCode?: string;
  reservedAt?: Date;
  reservationExpires?: Date;
  
  // Completion
  completedAt?: Date;
  completedBy?: mongoose.Types.ObjectId; // UserDocument (physical seller)
  paymentAmount?: number;
  
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
  
  // Methods
  addItem: (bookAdId: mongoose.Types.ObjectId) => Promise<void>;
  removeItem: (bookAdId: mongoose.Types.ObjectId) => Promise<void>;
  calculateTotal: () => number;
  generateReservationCode: () => string;
  isExpired: () => boolean;
  canBeReserved: () => boolean;
  reserveCart: () => Promise<void>;
};

const shoppingCartItemSchema = new mongoose.Schema({
  bookAd: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "BookAd",
    required: true
  },
  addedAt: {
    type: Date,
    default: Date.now
  },
  reservationExpires: {
    type: Date,
    default: function() {
      return new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours from now
    }
  },
  quantity: {
    type: Number,
    default: 1,
    min: 1
  }
}, { _id: false });

const shoppingCartSchema = new mongoose.Schema<ShoppingCartDocument>(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "PublicUser",
      required: true
    },
    school: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "School",
      required: true
    },
    items: [shoppingCartItemSchema],
    
    totalAmount: {
      type: Number,
      default: 0,
      min: 0
    },
    totalItems: {
      type: Number,
      default: 0,
      min: 0
    },
    
    status: {
      type: String,
      enum: ['active', 'reserved', 'completed', 'expired', 'cancelled'],
      default: 'active'
    },
    
    // Reservation
    reservationCode: {
      type: String,
      unique: true,
      sparse: true
    },
    reservedAt: Date,
    reservationExpires: Date,
    
    // Completion
    completedAt: Date,
    completedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    },
    paymentAmount: Number
  },
  {
    timestamps: true
  }
);

/**
 * Pre-save middleware to calculate totals
 */
shoppingCartSchema.pre('save', function(next) {
  this.totalItems = this.items.length;
  
  // Calculate total amount (will need to populate bookAd.sellPrice)
  if (this.isModified('items')) {
    // We'll calculate this in the methods after population
    this.totalAmount = 0;
  }
  
  next();
});

/**
 * Add item to cart
 */
shoppingCartSchema.methods.addItem = async function(bookAdId: mongoose.Types.ObjectId) {
  // Check if item already exists
  const existingItem = this.items.find(item => item.bookAd.toString() === bookAdId.toString());
  if (existingItem) {
    throw new Error('Item already in cart');
  }
  
  // Check if we can add more items (business rule: max 20 items)
  if (this.items.length >= 20) {
    throw new Error('Cart is full (maximum 20 items)');
  }
  
  const BookAd = mongoose.model('BookAd');
  const bookAd = await BookAd.findById(bookAdId);
  
  if (!bookAd) {
    throw new Error('Book ad not found');
  }
  
  if (!bookAd.canBeReserved()) {
    throw new Error('Book is not available for reservation');
  }
  
  // Add item to cart
  this.items.push({
    bookAd: bookAdId,
    addedAt: new Date(),
    reservationExpires: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24h
    quantity: 1
  });
  
  await this.save();
};

/**
 * Remove item from cart
 */
shoppingCartSchema.methods.removeItem = async function(bookAdId: mongoose.Types.ObjectId) {
  this.items = this.items.filter(item => item.bookAd.toString() !== bookAdId.toString());
  await this.save();
};

/**
 * Calculate total amount (requires populated items)
 */
shoppingCartSchema.methods.calculateTotal = function() {
  let total = 0;
  
  for (const item of this.items) {
    if (item.bookAd && typeof item.bookAd === 'object' && 'sellPrice' in item.bookAd) {
      total += (item.bookAd as any).sellPrice * item.quantity;
    }
  }
  
  this.totalAmount = total;
  return total;
};

/**
 * Generate unique reservation code
 */
shoppingCartSchema.methods.generateReservationCode = function() {
  const timestamp = Date.now().toString(36).toUpperCase();
  const userId = this.user.toString().substr(-4).toUpperCase();
  const random = Math.random().toString(36).substr(2, 4).toUpperCase();
  return `RC-${timestamp}-${userId}-${random}`;
};

/**
 * Check if cart is expired
 */
shoppingCartSchema.methods.isExpired = function() {
  if (this.status === 'reserved' && this.reservationExpires) {
    return new Date() > this.reservationExpires;
  }
  return false;
};

/**
 * Check if cart can be reserved
 */
shoppingCartSchema.methods.canBeReserved = function() {
  return this.status === 'active' && this.items.length > 0;
};

/**
 * Reserve the cart
 */
shoppingCartSchema.methods.reserveCart = async function() {
  if (!this.canBeReserved()) {
    throw new Error('Cart cannot be reserved');
  }
  
  // Generate reservation code
  this.reservationCode = this.generateReservationCode();
  this.status = 'reserved';
  this.reservedAt = new Date();
  this.reservationExpires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
  
  // Update all book ads to reserved status
  const BookAd = mongoose.model('BookAd');
  const bookAdIds = this.items.map(item => item.bookAd);
  
  await BookAd.updateMany(
    { _id: { $in: bookAdIds } },
    { 
      status: 'reserved',
      reservedBy: this.user,
      reservedAt: this.reservedAt,
      reservationExpires: this.reservationExpires,
      reservationCode: this.reservationCode
    }
  );
  
  await this.save();
};

/**
 * Static method to clean expired carts
 */
shoppingCartSchema.statics.cleanExpiredCarts = async function() {
  const expiredCarts = await this.find({
    status: 'reserved',
    reservationExpires: { $lt: new Date() }
  });
  
  for (const cart of expiredCarts) {
    cart.status = 'expired';
    await cart.save();
    
    // Release reserved book ads
    const BookAd = mongoose.model('BookAd');
    const bookAdIds = cart.items.map((item: any) => item.bookAd);
    
    await BookAd.updateMany(
      { _id: { $in: bookAdIds } },
      { 
        $unset: { 
          reservedBy: 1,
          reservedAt: 1,
          reservationExpires: 1,
          reservationCode: 1
        },
        status: 'published'
      }
    );
  }
  
  return expiredCarts.length;
};

/**
 * Indexes for performance
 */
shoppingCartSchema.index({ user: 1, status: 1 });
shoppingCartSchema.index({ school: 1, status: 1 });
shoppingCartSchema.index({ reservationCode: 1 });
shoppingCartSchema.index({ reservationExpires: 1 });
shoppingCartSchema.index({ status: 1, createdAt: -1 });

export const ShoppingCart = mongoose.model<ShoppingCartDocument>("ShoppingCart", shoppingCartSchema);
