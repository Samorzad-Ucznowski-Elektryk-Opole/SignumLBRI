import mongoose from "mongoose";

export type BookDictionaryDocument = mongoose.Document & {
  isbn: string;
  title: string;
  publisher: string;
  authors: string;
  year: number;
  newPrice: number;
  usedPrice: number;
  
  // Status tracking
  status: 'pending' | 'approved' | 'rejected';
  
  // Metadata
  submittedBy: mongoose.Types.ObjectId;
  submittedAt: Date;
  reviewedBy?: mongoose.Types.ObjectId;
  reviewedAt?: Date;
  rejectionReason?: string;
  
  // Additional fields
  notes?: string;
  category?: string;
  subject?: string;
  grade?: string;
};

const bookDictionarySchema = new mongoose.Schema<BookDictionaryDocument>(
  {
    isbn: {
      type: String,
      required: true,
      trim: true,
      index: true
    },
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200
    },
    publisher: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100
    },
    authors: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200
    },
    year: {
      type: Number,
      required: true,
      min: 1900,
      max: new Date().getFullYear() + 5
    },
    newPrice: {
      type: Number,
      required: true,
      min: 0
    },
    usedPrice: {
      type: Number,
      required: true,
      min: 0
    },
    
    // Status tracking
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
      index: true
    },
    
    // Metadata
    submittedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    submittedAt: {
      type: Date,
      default: Date.now
    },
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    },
    reviewedAt: {
      type: Date
    },
    rejectionReason: {
      type: String,
      trim: true,
      maxlength: 500
    },
    
    // Additional fields
    notes: {
      type: String,
      trim: true,
      maxlength: 1000
    },
    category: {
      type: String,
      trim: true,
      maxlength: 50
    },
    subject: {
      type: String,
      trim: true,
      maxlength: 50
    },
    grade: {
      type: String,
      trim: true,
      maxlength: 10
    }
  },
  { 
    timestamps: true,
    indexes: [
      { isbn: 1, status: 1 },
      { title: 'text', publisher: 'text', authors: 'text' },
      { status: 1, submittedAt: -1 }
    ]
  }
);

// Create compound index for unique ISBN per approved status
bookDictionarySchema.index({ isbn: 1, status: 1 }, { 
  unique: true, 
  partialFilterExpression: { status: 'approved' }
});

export const BookDictionary = mongoose.model<BookDictionaryDocument>("BookDictionary", bookDictionarySchema);
