import mongoose from "mongoose";

export type BookFairDocument = mongoose.Document & {
  name: string;
  description: string;
  location: string;
  startDate: Date;
  endDate: Date;
  
  // Status
  status: 'planning' | 'registration' | 'active' | 'completed' | 'cancelled';
  
  // Configuration
  maxExhibitors: number;
  entryFee: number;
  
  // Contact info
  contactEmail: string;
  contactPhone: string;
  website?: string;
  
  // Organizer
  organizerId: mongoose.Types.ObjectId;
  
  // Metadata
  createdAt: Date;
  updatedAt: Date;
  
  // Features
  features: {
    hasDigitalCatalog: boolean;
    hasARNavigation: boolean;
    hasBookExchange: boolean;
    hasMobileApp: boolean;
  };
};

const bookFairSchema = new mongoose.Schema<BookFairDocument>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200
    },
    description: {
      type: String,
      required: true,
      trim: true,
      maxlength: 1000
    },
    location: {
      type: String,
      required: true,
      trim: true,
      maxlength: 300
    },
    startDate: {
      type: Date,
      required: true,
      index: true
    },
    endDate: {
      type: Date,
      required: true,
      index: true,
      validate: {
        validator: function(this: BookFairDocument, value: Date) {
          return value > this.startDate;
        },
        message: 'End date must be after start date'
      }
    },
    status: {
      type: String,
      enum: ['planning', 'registration', 'active', 'completed', 'cancelled'],
      default: 'planning',
      index: true
    },
    maxExhibitors: {
      type: Number,
      required: true,
      min: 1,
      max: 1000,
      default: 50
    },
    entryFee: {
      type: Number,
      required: true,
      min: 0,
      default: 0
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
    website: {
      type: String,
      trim: true,
      match: [/^https?:\/\/.+/, 'Please enter a valid URL']
    },
    organizerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    features: {
      hasDigitalCatalog: {
        type: Boolean,
        default: true
      },
      hasARNavigation: {
        type: Boolean,
        default: false
      },
      hasBookExchange: {
        type: Boolean,
        default: true
      },
      hasMobileApp: {
        type: Boolean,
        default: true
      }
    }
  },
  {
    timestamps: true
  }
);

// Indexes for performance
bookFairSchema.index({ startDate: 1, endDate: 1 });
bookFairSchema.index({ status: 1, startDate: 1 });
bookFairSchema.index({ organizerId: 1, status: 1 });

// Virtual for duration
bookFairSchema.virtual('duration').get(function() {
  const days = Math.ceil((this.endDate.getTime() - this.startDate.getTime()) / (1000 * 60 * 60 * 24));
  return days;
});

// Method to check if fair is active
bookFairSchema.methods.isActive = function() {
  const now = new Date();
  return this.status === 'active' && now >= this.startDate && now <= this.endDate;
};

// Method to check if registration is open
bookFairSchema.methods.isRegistrationOpen = function() {
  const now = new Date();
  return this.status === 'registration' && now < this.startDate;
};

export const BookFair = mongoose.model<BookFairDocument>("BookFair", bookFairSchema);
