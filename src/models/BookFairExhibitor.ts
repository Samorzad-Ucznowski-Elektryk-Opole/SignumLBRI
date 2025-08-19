import mongoose from "mongoose";

export type BookFairExhibitorDocument = mongoose.Document & {
  bookFairId: mongoose.Types.ObjectId;
  exhibitorId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;  // For user info
  companyName: string;
  contactPerson: string;
  email: string;
  phone: string;
  website?: string;
  description?: string;
  specialOffers?: string;
  tableNumber?: string;
  registrationDate: Date;
  approvalStatus: 'pending' | 'approved' | 'rejected';
  approvedBy?: mongoose.Types.ObjectId;
  approvalDate?: Date;
  notes?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
};

const bookFairExhibitorSchema = new mongoose.Schema<BookFairExhibitorDocument>({
  bookFairId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'BookFair',
    required: true
  },
  exhibitorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Exhibitor',
    required: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  companyName: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  contactPerson: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  email: {
    type: String,
    required: true,
    lowercase: true,
    trim: true,
    maxlength: 100
  },
  phone: {
    type: String,
    required: true,
    trim: true,
    maxlength: 20
  },
  website: {
    type: String,
    trim: true,
    maxlength: 200
  },
  description: {
    type: String,
    trim: true,
    maxlength: 1000
  },
  specialOffers: {
    type: String,
    trim: true,
    maxlength: 500
  },
  tableNumber: {
    type: String,
    trim: true,
    maxlength: 10
  },
  registrationDate: {
    type: Date,
    required: true,
    default: Date.now
  },
  approvalStatus: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending',
    required: true
  },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  approvalDate: {
    type: Date
  },
  notes: {
    type: String,
    trim: true,
    maxlength: 500
  },
  isActive: {
    type: Boolean,
    default: true,
    required: true
  }
}, {
  timestamps: true
});

// Indexy dla wydajności
bookFairExhibitorSchema.index({ bookFairId: 1 });
bookFairExhibitorSchema.index({ exhibitorId: 1 });
bookFairExhibitorSchema.index({ userId: 1 });
bookFairExhibitorSchema.index({ approvalStatus: 1 });
bookFairExhibitorSchema.index({ registrationDate: -1 });

// Walidacja - jeden wystawca może się zarejestrować tylko raz na jedne targi
bookFairExhibitorSchema.index(
  { bookFairId: 1, exhibitorId: 1 }, 
  { unique: true }
);

export const BookFairExhibitor = mongoose.model<BookFairExhibitorDocument>("BookFairExhibitor", bookFairExhibitorSchema);
