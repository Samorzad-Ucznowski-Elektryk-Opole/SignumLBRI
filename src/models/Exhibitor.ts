import mongoose from "mongoose";

export type ExhibitorDocument = mongoose.Document & {
  bookFairId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  
  // Company Info
  companyName: string;
  companyDescription: string;
  companyLogo?: string;
  website?: string;
  
  // Contact
  contactPerson: string;
  contactEmail: string;
  contactPhone: string;
  
  // Booth Info
  boothSize: 'small' | 'medium' | 'large' | 'premium';
  boothNumber?: string;
  boothPreferences?: string;
  
  // Status
  status: 'pending' | 'approved' | 'rejected' | 'cancelled';
  applicationDate: Date;
  approvedDate?: Date;
  rejectedDate?: Date;
  rejectionReason?: string;
  
  // Payment
  paymentStatus: 'pending' | 'paid' | 'refunded';
  paymentAmount: number;
  paymentDate?: Date;
  
  // Catalog/Books
  bookCategories: string[];
  featuredBooks: string[];
  hasSchoolBooks: boolean;
  hasDigitalContent: boolean;
  
  // Events
  plannedEvents: Array<{
    title: string;
    description: string;
    startTime: Date;
    endTime: Date;
    eventType: 'meeting' | 'presentation' | 'signing' | 'workshop' | 'other';
  }>;
  
  // Metadata
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
};

const exhibitorSchema = new mongoose.Schema<ExhibitorDocument>(
  {
    bookFairId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'BookFair',
      required: true,
      index: true
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    companyName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100
    },
    companyDescription: {
      type: String,
      required: true,
      trim: true,
      maxlength: 500
    },
    companyLogo: {
      type: String,
      trim: true
    },
    website: {
      type: String,
      trim: true,
      match: [/^https?:\/\/.+/, 'Please enter a valid URL']
    },
    contactPerson: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100
    },
    contactEmail: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
    },
    contactPhone: {
      type: String,
      required: true,
      trim: true
    },
    boothSize: {
      type: String,
      enum: ['small', 'medium', 'large', 'premium'],
      required: true,
      default: 'small'
    },
    boothNumber: {
      type: String,
      trim: true,
      index: true,
      sparse: true
    },
    boothPreferences: {
      type: String,
      trim: true,
      maxlength: 300
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected', 'cancelled'],
      default: 'pending',
      index: true
    },
    applicationDate: {
      type: Date,
      default: Date.now,
      required: true
    },
    approvedDate: {
      type: Date
    },
    rejectedDate: {
      type: Date
    },
    rejectionReason: {
      type: String,
      trim: true,
      maxlength: 300
    },
    paymentStatus: {
      type: String,
      enum: ['pending', 'paid', 'refunded'],
      default: 'pending',
      index: true
    },
    paymentAmount: {
      type: Number,
      required: true,
      min: 0
    },
    paymentDate: {
      type: Date
    },
    bookCategories: [{
      type: String,
      trim: true,
      enum: ['fiction', 'non-fiction', 'educational', 'children', 'academic', 'technical', 'art', 'other']
    }],
    featuredBooks: [{
      type: String,
      trim: true,
      maxlength: 200
    }],
    hasSchoolBooks: {
      type: Boolean,
      default: false,
      index: true
    },
    hasDigitalContent: {
      type: Boolean,
      default: false
    },
    plannedEvents: [{
      title: {
        type: String,
        required: true,
        trim: true,
        maxlength: 100
      },
      description: {
        type: String,
        trim: true,
        maxlength: 300
      },
      startTime: {
        type: Date,
        required: true
      },
      endTime: {
        type: Date,
        required: true,
        validate: {
          validator: function(value: Date) {
            return value > this.startTime;
          },
          message: 'End time must be after start time'
        }
      },
      eventType: {
        type: String,
        enum: ['meeting', 'presentation', 'signing', 'workshop', 'other'],
        default: 'other'
      }
    }],
    notes: {
      type: String,
      trim: true,
      maxlength: 1000
    }
  },
  {
    timestamps: true
  }
);

// Indexes for performance
exhibitorSchema.index({ bookFairId: 1, status: 1 });
exhibitorSchema.index({ userId: 1, bookFairId: 1 });
exhibitorSchema.index({ hasSchoolBooks: 1, status: 1 });
exhibitorSchema.index({ paymentStatus: 1, status: 1 });

// Compound index for unique exhibitor per fair per user
exhibitorSchema.index({ bookFairId: 1, userId: 1 }, { unique: true });

// Virtual for booth price calculation
exhibitorSchema.virtual('boothPrice').get(function() {
  const prices = {
    small: 500,
    medium: 1000,
    large: 1500,
    premium: 2500
  };
  return prices[this.boothSize] || 500;
});

// Method to check if application can be modified
exhibitorSchema.methods.canModify = function() {
  return this.status === 'pending';
};

// Method to approve application
exhibitorSchema.methods.approve = function(approvedBy: mongoose.Types.ObjectId) {
  this.status = 'approved';
  this.approvedDate = new Date();
  return this.save();
};

// Method to reject application
exhibitorSchema.methods.reject = function(reason: string, rejectedBy: mongoose.Types.ObjectId) {
  this.status = 'rejected';
  this.rejectedDate = new Date();
  this.rejectionReason = reason;
  return this.save();
};

export const Exhibitor = mongoose.model<ExhibitorDocument>("Exhibitor", exhibitorSchema);
