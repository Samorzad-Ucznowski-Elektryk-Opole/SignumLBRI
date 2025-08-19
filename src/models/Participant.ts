import mongoose from "mongoose";

export type ParticipantDocument = mongoose.Document & {
  bookFairId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  
  // Profile
  displayName: string;
  avatar?: string;
  
  // Preferences
  preferredGenres: string[];
  ageGroup: 'child' | 'teen' | 'adult' | 'senior';
  interests: string[];
  
  // Schedule & Events
  registeredEvents: mongoose.Types.ObjectId[];
  favoriteExhibitors: mongoose.Types.ObjectId[];
  personalSchedule: Array<{
    eventId: mongoose.Types.ObjectId;
    reminderSet: boolean;
    notes?: string;
  }>;
  
  // Gamification
  points: number;
  badges: Array<{
    badgeId: string;
    name: string;
    description: string;
    earnedDate: Date;
    icon?: string;
  }>;
  level: number;
  
  // Activity Tracking
  visitedBooths: Array<{
    exhibitorId: mongoose.Types.ObjectId;
    visitDate: Date;
    duration?: number; // minutes
    rating?: number; // 1-5
    notes?: string;
  }>;
  
  // Personalization
  recommendations: Array<{
    type: 'book' | 'event' | 'exhibitor';
    title: string;
    description: string;
    targetId?: mongoose.Types.ObjectId;
    relevanceScore: number;
    generatedAt: Date;
    viewed: boolean;
    clicked: boolean;
  }>;
  
  // Social Features
  friends: mongoose.Types.ObjectId[];
  followedExhibitors: mongoose.Types.ObjectId[];
  sharedContent: Array<{
    contentType: 'event' | 'book' | 'exhibitor';
    contentId: mongoose.Types.ObjectId;
    sharedAt: Date;
    platform?: string;
  }>;
  
  // Privacy & Settings
  profileVisibility: 'public' | 'friends' | 'private';
  allowRecommendations: boolean;
  allowNotifications: boolean;
  allowLocationTracking: boolean;
  
  // Check-in Status
  checkedIn: boolean;
  checkInTime?: Date;
  checkOutTime?: Date;
  currentLocation?: {
    type: string;
    coordinates: [number, number];
  };
  
  // Metadata
  registrationDate: Date;
  lastActive: Date;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
};

const participantSchema = new mongoose.Schema<ParticipantDocument>(
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
    displayName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 50
    },
    avatar: {
      type: String,
      trim: true
    },
    preferredGenres: [{
      type: String,
      trim: true,
      enum: ['fiction', 'non-fiction', 'educational', 'children', 'academic', 'technical', 'art', 'biography', 'history', 'science', 'fantasy', 'mystery', 'romance', 'other']
    }],
    ageGroup: {
      type: String,
      enum: ['child', 'teen', 'adult', 'senior'],
      required: true,
      index: true
    },
    interests: [{
      type: String,
      trim: true,
      maxlength: 50
    }],
    registeredEvents: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'FairEvent'
    }],
    favoriteExhibitors: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Exhibitor'
    }],
    personalSchedule: [{
      eventId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'FairEvent',
        required: true
      },
      reminderSet: {
        type: Boolean,
        default: false
      },
      notes: {
        type: String,
        trim: true,
        maxlength: 300
      }
    }],
    points: {
      type: Number,
      default: 0,
      min: 0,
      index: true
    },
    badges: [{
      badgeId: {
        type: String,
        required: true
      },
      name: {
        type: String,
        required: true,
        trim: true,
        maxlength: 50
      },
      description: {
        type: String,
        trim: true,
        maxlength: 200
      },
      earnedDate: {
        type: Date,
        default: Date.now
      },
      icon: {
        type: String,
        trim: true
      }
    }],
    level: {
      type: Number,
      default: 1,
      min: 1,
      max: 100,
      index: true
    },
    visitedBooths: [{
      exhibitorId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Exhibitor',
        required: true
      },
      visitDate: {
        type: Date,
        default: Date.now
      },
      duration: {
        type: Number,
        min: 0
      },
      rating: {
        type: Number,
        min: 1,
        max: 5
      },
      notes: {
        type: String,
        trim: true,
        maxlength: 300
      }
    }],
    recommendations: [{
      type: {
        type: String,
        enum: ['book', 'event', 'exhibitor'],
        required: true
      },
      title: {
        type: String,
        required: true,
        trim: true,
        maxlength: 150
      },
      description: {
        type: String,
        trim: true,
        maxlength: 300
      },
      targetId: {
        type: mongoose.Schema.Types.ObjectId
      },
      relevanceScore: {
        type: Number,
        min: 0,
        max: 1,
        required: true
      },
      generatedAt: {
        type: Date,
        default: Date.now
      },
      viewed: {
        type: Boolean,
        default: false
      },
      clicked: {
        type: Boolean,
        default: false
      }
    }],
    friends: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Participant'
    }],
    followedExhibitors: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Exhibitor'
    }],
    sharedContent: [{
      contentType: {
        type: String,
        enum: ['event', 'book', 'exhibitor'],
        required: true
      },
      contentId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true
      },
      sharedAt: {
        type: Date,
        default: Date.now
      },
      platform: {
        type: String,
        trim: true,
        maxlength: 50
      }
    }],
    profileVisibility: {
      type: String,
      enum: ['public', 'friends', 'private'],
      default: 'public'
    },
    allowRecommendations: {
      type: Boolean,
      default: true
    },
    allowNotifications: {
      type: Boolean,
      default: true
    },
    allowLocationTracking: {
      type: Boolean,
      default: false
    },
    checkedIn: {
      type: Boolean,
      default: false,
      index: true
    },
    checkInTime: {
      type: Date
    },
    checkOutTime: {
      type: Date
    },
    currentLocation: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point'
      },
      coordinates: {
        type: [Number],
        default: [0, 0]
      }
    },
    registrationDate: {
      type: Date,
      default: Date.now,
      required: true
    },
    lastActive: {
      type: Date,
      default: Date.now,
      index: true
    },
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
participantSchema.index({ bookFairId: 1, userId: 1 }, { unique: true });
participantSchema.index({ bookFairId: 1, level: 1 });
participantSchema.index({ bookFairId: 1, points: -1 });
participantSchema.index({ bookFairId: 1, ageGroup: 1 });
participantSchema.index({ bookFairId: 1, checkedIn: 1 });
participantSchema.index({ currentLocation: '2dsphere' });

// Virtual for total events attended
participantSchema.virtual('eventsAttended').get(function() {
  return this.registeredEvents.length;
});

// Virtual for completion percentage (estimated)
participantSchema.virtual('fairCompletionPercent').get(function() {
  const totalActivities = this.visitedBooths.length + this.registeredEvents.length;
  const maxActivities = 20; // arbitrary benchmark
  return Math.min(100, (totalActivities / maxActivities) * 100);
});

// Method to add points and check for level up
participantSchema.methods.addPoints = function(points: number, reason?: string) {
  this.points += points;
  const newLevel = Math.floor(this.points / 100) + 1;
  
  if (newLevel > this.level) {
    this.level = newLevel;
    // Could trigger badge earning logic here
  }
  
  this.lastActive = new Date();
  return this.save();
};

// Method to check in to fair
participantSchema.methods.checkIn = function(coordinates?: [number, number]) {
  if (this.checkedIn) {
    throw new Error('Already checked in');
  }
  
  this.checkedIn = true;
  this.checkInTime = new Date();
  this.lastActive = new Date();
  
  if (coordinates) {
    this.currentLocation = {
      type: 'Point',
      coordinates
    };
  }
  
  // Award check-in points
  this.points += 10;
  
  return this.save();
};

// Method to visit booth
participantSchema.methods.visitBooth = function(exhibitorId: mongoose.Types.ObjectId, rating?: number, notes?: string) {
  const existingVisit = this.visitedBooths.find(
    visit => visit.exhibitorId.toString() === exhibitorId.toString()
  );
  
  if (existingVisit) {
    // Update existing visit
    if (rating) existingVisit.rating = rating;
    if (notes) existingVisit.notes = notes;
  } else {
    // New visit
    this.visitedBooths.push({
      exhibitorId,
      visitDate: new Date(),
      rating,
      notes
    });
    
    // Award visit points
    this.points += 5;
  }
  
  this.lastActive = new Date();
  return this.save();
};

// Method to add badge
participantSchema.methods.earnBadge = function(badgeId: string, name: string, description: string, icon?: string) {
  const existingBadge = this.badges.find(badge => badge.badgeId === badgeId);
  
  if (!existingBadge) {
    this.badges.push({
      badgeId,
      name,
      description,
      earnedDate: new Date(),
      icon
    });
    
    // Award badge points
    this.points += 25;
    
    this.lastActive = new Date();
    return this.save();
  }
  
  return Promise.resolve(this);
};

export const Participant = mongoose.model<ParticipantDocument>("Participant", participantSchema);
