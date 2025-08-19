import mongoose from "mongoose";

export type FairEventDocument = mongoose.Document & {
  bookFairId: mongoose.Types.ObjectId;
  exhibitorId?: mongoose.Types.ObjectId;
  organizerId?: mongoose.Types.ObjectId;
  
  // Event Details
  title: string;
  description: string;
  eventType: 'presentation' | 'workshop' | 'signing' | 'meeting' | 'general' | 'announcement' | 'contest' | 'performance';
  
  // Timing
  startTime: Date;
  endTime: Date;
  timezone: string;
  
  // Location
  location: string;
  boothNumber?: string;
  isVirtual: boolean;
  virtualLink?: string;
  
  // Audience
  targetAudience: 'all' | 'students' | 'teachers' | 'parents' | 'exhibitors' | 'organizers';
  maxParticipants?: number;
  ageGroup?: string;
  
  // Registration
  requiresRegistration: boolean;
  registrationDeadline?: Date;
  registeredParticipants: mongoose.Types.ObjectId[];
  waitingList: mongoose.Types.ObjectId[];
  
  // Content
  featuredBooks?: string[];
  materials?: string[];
  presenter?: string;
  presenterBio?: string;
  
  // Media
  images?: string[];
  documents?: string[];
  
  // Status
  status: 'draft' | 'published' | 'cancelled' | 'completed';
  publishDate?: Date;
  cancelledReason?: string;
  
  // Notifications
  sendReminder: boolean;
  reminderSent: boolean;
  
  // Metadata
  createdBy: mongoose.Types.ObjectId;
  tags?: string[];
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
};

const fairEventSchema = new mongoose.Schema<FairEventDocument>(
  {
    bookFairId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'BookFair',
      required: true,
      index: true
    },
    exhibitorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Exhibitor',
      index: true
    },
    organizerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      index: true
    },
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 150
    },
    description: {
      type: String,
      required: true,
      trim: true,
      maxlength: 1000
    },
    eventType: {
      type: String,
      enum: ['presentation', 'workshop', 'signing', 'meeting', 'general', 'announcement', 'contest', 'performance'],
      required: true,
      index: true
    },
    startTime: {
      type: Date,
      required: true,
      index: true
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
    timezone: {
      type: String,
      required: true,
      default: 'Europe/Warsaw'
    },
    location: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100
    },
    boothNumber: {
      type: String,
      trim: true,
      index: true
    },
    isVirtual: {
      type: Boolean,
      default: false,
      index: true
    },
    virtualLink: {
      type: String,
      trim: true,
      match: [/^https?:\/\/.+/, 'Please enter a valid URL']
    },
    targetAudience: {
      type: String,
      enum: ['all', 'students', 'teachers', 'parents', 'exhibitors', 'organizers'],
      default: 'all',
      index: true
    },
    maxParticipants: {
      type: Number,
      min: 1,
      max: 1000
    },
    ageGroup: {
      type: String,
      trim: true,
      maxlength: 50
    },
    requiresRegistration: {
      type: Boolean,
      default: false,
      index: true
    },
    registrationDeadline: {
      type: Date
    },
    registeredParticipants: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }],
    waitingList: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }],
    featuredBooks: [{
      type: String,
      trim: true,
      maxlength: 200
    }],
    materials: [{
      type: String,
      trim: true,
      maxlength: 200
    }],
    presenter: {
      type: String,
      trim: true,
      maxlength: 100
    },
    presenterBio: {
      type: String,
      trim: true,
      maxlength: 500
    },
    images: [{
      type: String,
      trim: true
    }],
    documents: [{
      type: String,
      trim: true
    }],
    status: {
      type: String,
      enum: ['draft', 'published', 'cancelled', 'completed'],
      default: 'draft',
      index: true
    },
    publishDate: {
      type: Date
    },
    cancelledReason: {
      type: String,
      trim: true,
      maxlength: 300
    },
    sendReminder: {
      type: Boolean,
      default: true
    },
    reminderSent: {
      type: Boolean,
      default: false,
      index: true
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    tags: [{
      type: String,
      trim: true,
      maxlength: 50
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
fairEventSchema.index({ bookFairId: 1, startTime: 1 });
fairEventSchema.index({ bookFairId: 1, eventType: 1, status: 1 });
fairEventSchema.index({ bookFairId: 1, targetAudience: 1, status: 1 });
fairEventSchema.index({ startTime: 1, endTime: 1 });
fairEventSchema.index({ exhibitorId: 1, status: 1 });

// Virtual for event duration in minutes
fairEventSchema.virtual('durationMinutes').get(function() {
  return Math.round((this.endTime.getTime() - this.startTime.getTime()) / (1000 * 60));
});

// Virtual to check if registration is still open
fairEventSchema.virtual('registrationOpen').get(function() {
  if (!this.requiresRegistration) return false;
  if (!this.registrationDeadline) return this.status === 'published';
  return this.status === 'published' && new Date() < this.registrationDeadline;
});

// Virtual to check if event has available spots
fairEventSchema.virtual('hasAvailableSpots').get(function() {
  if (!this.maxParticipants) return true;
  return this.registeredParticipants.length < this.maxParticipants;
});

// Method to register participant
fairEventSchema.methods.registerParticipant = function(participantId: mongoose.Types.ObjectId) {
  if (!this.registrationOpen) {
    throw new Error('Registration is not open');
  }
  
  if (this.registeredParticipants.includes(participantId)) {
    throw new Error('Participant already registered');
  }
  
  if (this.hasAvailableSpots) {
    this.registeredParticipants.push(participantId);
  } else {
    this.waitingList.push(participantId);
  }
  
  return this.save();
};

// Method to cancel event
fairEventSchema.methods.cancel = function(reason: string) {
  this.status = 'cancelled';
  this.cancelledReason = reason;
  return this.save();
};

// Method to publish event
fairEventSchema.methods.publish = function() {
  if (this.status !== 'draft') {
    throw new Error('Can only publish draft events');
  }
  this.status = 'published';
  this.publishDate = new Date();
  return this.save();
};

export const FairEvent = mongoose.model<FairEventDocument>("FairEvent", fairEventSchema);
