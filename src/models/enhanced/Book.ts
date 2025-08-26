/**
 * Enhanced Book Model with Advanced Features
 * Includes validation, hooks, indexing, and performance optimizations
 */

import mongoose, { Document, Schema, Model } from 'mongoose';
import { cache, CacheKeys } from '../util/cache';
import { trackDatabaseQuery } from '../util/performanceMonitor';
import logger from '../util/logger';

// ISBN validation utility
function isValidISBN(isbn: string): boolean {
  const cleanISBN = isbn.replace(/[^0-9X]/gi, '');
  
  if (cleanISBN.length === 10) {
    return isValidISBN10(cleanISBN);
  } else if (cleanISBN.length === 13) {
    return isValidISBN13(cleanISBN);
  }
  
  return false;
}

function isValidISBN10(isbn: string): boolean {
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(isbn[i]) * (10 - i);
  }
  const checkDigit = isbn[9].toUpperCase() === 'X' ? 10 : parseInt(isbn[9]);
  sum += checkDigit;
  return sum % 11 === 0;
}

function isValidISBN13(isbn: string): boolean {
  let sum = 0;
  for (let i = 0; i < 12; i++) {
    const weight = i % 2 === 0 ? 1 : 3;
    sum += parseInt(isbn[i]) * weight;
  }
  const checkDigit = (10 - (sum % 10)) % 10;
  return checkDigit === parseInt(isbn[12]);
}

// Book Interface
export interface BookDocument extends Document {
  title: string;
  authors: string[];
  publisher: string;
  isbn: string;
  isbn13?: string;
  year: number;
  pages?: number;
  language: string;
  genre?: string[];
  description?: string;
  thumbnailUrl?: string;
  coverImageUrl?: string;
  
  // Academic specific fields
  subject?: string;
  gradeLevel?: number[];
  curriculum?: string;
  edition?: string;
  
  // Metadata
  createdAt: Date;
  updatedAt: Date;
  createdBy?: mongoose.Types.ObjectId;
  lastModifiedBy?: mongoose.Types.ObjectId;
  
  // Computed fields
  searchTerms: string[];
  popularity: number;
  averageRating?: number;
  totalRatings?: number;
  
  // Methods
  generateSearchTerms(): void;
  updatePopularity(): Promise<void>;
  getAvailableListings(): Promise<any[]>;
  isAvailableInSchool(schoolId: string): Promise<boolean>;
}

// Book Schema
const bookSchema = new Schema<BookDocument>({
  title: {
    type: String,
    required: [true, 'Book title is required'],
    trim: true,
    maxlength: [500, 'Title cannot exceed 500 characters'],
    index: 'text'
  },
  
  authors: {
    type: [String],
    required: [true, 'At least one author is required'],
    validate: {
      validator: (authors: string[]) => authors.length > 0,
      message: 'Book must have at least one author'
    }
  },
  
  publisher: {
    type: String,
    required: [true, 'Publisher is required'],
    trim: true,
    maxlength: [200, 'Publisher name cannot exceed 200 characters']
  },
  
  isbn: {
    type: String,
    required: [true, 'ISBN is required'],
    unique: true,
    validate: {
      validator: isValidISBN,
      message: 'Invalid ISBN format'
    },
    transform: (value: string) => value.replace(/[^0-9X]/gi, '')
  },
  
  isbn13: {
    type: String,
    validate: {
      validator: (value: string) => !value || isValidISBN13(value),
      message: 'Invalid ISBN-13 format'
    }
  },
  
  year: {
    type: Number,
    required: [true, 'Publication year is required'],
    min: [1000, 'Publication year must be after 1000'],
    max: [new Date().getFullYear() + 2, 'Publication year cannot be more than 2 years in the future']
  },
  
  pages: {
    type: Number,
    min: [1, 'Page count must be positive'],
    max: [10000, 'Page count seems unrealistic']
  },
  
  language: {
    type: String,
    required: [true, 'Language is required'],
    enum: {
      values: ['pl', 'en', 'de', 'fr', 'es', 'uk', 'ru', 'other'],
      message: 'Language must be one of: pl, en, de, fr, es, uk, ru, other'
    },
    default: 'pl'
  },
  
  genre: [{
    type: String,
    enum: [
      'textbook', 'workbook', 'atlas', 'dictionary', 'reference',
      'literature', 'science', 'mathematics', 'history', 'geography',
      'language', 'art', 'music', 'physical_education', 'computer_science',
      'other'
    ]
  }],
  
  description: {
    type: String,
    maxlength: [2000, 'Description cannot exceed 2000 characters'],
    trim: true
  },
  
  thumbnailUrl: {
    type: String,
    validate: {
      validator: (url: string) => !url || /^https?:\/\/.+/.test(url),
      message: 'Invalid thumbnail URL'
    }
  },
  
  coverImageUrl: {
    type: String,
    validate: {
      validator: (url: string) => !url || /^https?:\/\/.+/.test(url),
      message: 'Invalid cover image URL'
    }
  },
  
  // Academic fields
  subject: {
    type: String,
    enum: [
      'mathematics', 'physics', 'chemistry', 'biology', 'geography',
      'history', 'polish', 'english', 'german', 'french', 'spanish',
      'computer_science', 'art', 'music', 'physical_education',
      'religion', 'ethics', 'social_studies', 'other'
    ]
  },
  
  gradeLevel: [{
    type: Number,
    min: 1,
    max: 13
  }],
  
  curriculum: {
    type: String,
    maxlength: [100, 'Curriculum name cannot exceed 100 characters']
  },
  
  edition: {
    type: String,
    maxlength: [50, 'Edition cannot exceed 50 characters']
  },
  
  // Metadata
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  
  lastModifiedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  
  // Computed fields
  searchTerms: [{
    type: String,
    index: true
  }],
  
  popularity: {
    type: Number,
    default: 0,
    min: 0
  },
  
  averageRating: {
    type: Number,
    min: 0,
    max: 5
  },
  
  totalRatings: {
    type: Number,
    default: 0,
    min: 0
  }
  
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for performance
bookSchema.index({ isbn: 1 }, { unique: true });
bookSchema.index({ title: 'text', 'authors': 'text', publisher: 'text' });
bookSchema.index({ subject: 1, gradeLevel: 1 });
bookSchema.index({ publisher: 1, year: -1 });
bookSchema.index({ searchTerms: 1 });
bookSchema.index({ popularity: -1 });
bookSchema.index({ createdAt: -1 });

// Virtual fields
bookSchema.virtual('displayTitle').get(function(this: BookDocument) {
  return `${this.title} (${this.year})`;
});

bookSchema.virtual('authorsString').get(function(this: BookDocument) {
  return this.authors.join(', ');
});

bookSchema.virtual('isRecent').get(function(this: BookDocument) {
  const currentYear = new Date().getFullYear();
  return this.year >= currentYear - 5;
});

// Instance Methods
bookSchema.methods.generateSearchTerms = function(this: BookDocument): void {
  const terms: Set<string> = new Set();
  
  // Add title words
  this.title.toLowerCase().split(/\s+/).forEach(word => {
    if (word.length > 2) terms.add(word);
  });
  
  // Add author names
  this.authors.forEach(author => {
    author.toLowerCase().split(/\s+/).forEach(word => {
      if (word.length > 2) terms.add(word);
    });
  });
  
  // Add publisher words
  this.publisher.toLowerCase().split(/\s+/).forEach(word => {
    if (word.length > 2) terms.add(word);
  });
  
  // Add ISBN
  terms.add(this.isbn);
  if (this.isbn13) terms.add(this.isbn13);
  
  // Add subject
  if (this.subject) terms.add(this.subject);
  
  this.searchTerms = Array.from(terms);
};

bookSchema.methods.updatePopularity = async function(this: BookDocument): Promise<void> {
  try {
    // Count active book listings for this book
    const BookListing = mongoose.model('BookListing');
    const activeListings = await BookListing.countDocuments({
      book: this._id,
      status: { $in: ['accepted', 'pending'] }
    });
    
    // Count sold listings (popularity indicator)
    const soldListings = await BookListing.countDocuments({
      book: this._id,
      status: 'sold'
    });
    
    // Calculate popularity score
    this.popularity = (activeListings * 1) + (soldListings * 2);
    
    // Invalidate cache
    await cache.delete(CacheKeys.bookAd(this._id.toString()));
    
  } catch (error) {
    logger.error('Failed to update book popularity', { bookId: this._id, error });
  }
};

bookSchema.methods.getAvailableListings = async function(this: BookDocument): Promise<any[]> {
  try {
    const cacheKey = `book_listings:${this._id}`;
    let listings = await cache.get(cacheKey);
    
    if (!listings) {
      const BookListing = mongoose.model('BookListing');
      listings = await trackDatabaseQuery(
        `getAvailableListings:${this._id}`,
        () => BookListing.find({
          book: this._id,
          status: 'accepted'
        })
        .populate('bookOwner', 'profile.name profile.surname email')
        .populate('school', 'name')
        .sort({ price: 1 })
        .lean()
        .exec()
      );
      
      await cache.set(cacheKey, listings, 300); // Cache for 5 minutes
    }
    
    return listings;
  } catch (error) {
    logger.error('Failed to get available listings', { bookId: this._id, error });
    return [];
  }
};

bookSchema.methods.isAvailableInSchool = async function(this: BookDocument, schoolId: string): Promise<boolean> {
  try {
    const cacheKey = `book_available:${this._id}:${schoolId}`;
    let isAvailable = await cache.get(cacheKey);
    
    if (isAvailable === null) {
      const BookListing = mongoose.model('BookListing');
      const count = await trackDatabaseQuery(
        `isAvailableInSchool:${this._id}:${schoolId}`,
        () => BookListing.countDocuments({
          book: this._id,
          school: schoolId,
          status: 'accepted'
        })
      );
      
      isAvailable = count > 0;
      await cache.set(cacheKey, isAvailable, 180); // Cache for 3 minutes
    }
    
    return isAvailable;
  } catch (error) {
    logger.error('Failed to check book availability', { bookId: this._id, schoolId, error });
    return false;
  }
};

// Static Methods
bookSchema.statics.findByISBN = async function(isbn: string): Promise<BookDocument | null> {
  const cleanISBN = isbn.replace(/[^0-9X]/gi, '');
  return await this.findOne({
    $or: [
      { isbn: cleanISBN },
      { isbn13: cleanISBN }
    ]
  });
};

bookSchema.statics.searchBooks = async function(
  query: string, 
  filters: any = {}, 
  limit: number = 20,
  skip: number = 0
): Promise<BookDocument[]> {
  const searchCriteria: any = {};
  
  if (query) {
    // Text search with fallback to searchTerms
    searchCriteria.$or = [
      { $text: { $search: query } },
      { searchTerms: { $in: query.toLowerCase().split(/\s+/) } }
    ];
  }
  
  // Apply filters
  if (filters.subject) searchCriteria.subject = filters.subject;
  if (filters.gradeLevel) searchCriteria.gradeLevel = { $in: filters.gradeLevel };
  if (filters.language) searchCriteria.language = filters.language;
  if (filters.publisher) searchCriteria.publisher = new RegExp(filters.publisher, 'i');
  if (filters.yearFrom) searchCriteria.year = { $gte: filters.yearFrom };
  if (filters.yearTo) {
    searchCriteria.year = { ...searchCriteria.year, $lte: filters.yearTo };
  }
  
  return await trackDatabaseQuery(
    `searchBooks:${JSON.stringify({ query, filters })}`,
    () => this.find(searchCriteria)
      .sort({ popularity: -1, createdAt: -1 })
      .limit(limit)
      .skip(skip)
      .lean()
      .exec()
  );
};

bookSchema.statics.getPopularBooks = async function(limit: number = 10): Promise<BookDocument[]> {
  const cacheKey = `popular_books:${limit}`;
  let popularBooks = await cache.get(cacheKey);
  
  if (!popularBooks) {
    popularBooks = await trackDatabaseQuery(
      'getPopularBooks',
      () => this.find({})
        .sort({ popularity: -1, averageRating: -1 })
        .limit(limit)
        .lean()
        .exec()
    );
    
    await cache.set(cacheKey, popularBooks, 600); // Cache for 10 minutes
  }
  
  return popularBooks;
};

// Pre-save hooks
bookSchema.pre('save', function(this: BookDocument, next) {
  // Generate search terms
  this.generateSearchTerms();
  
  // Convert ISBN-10 to ISBN-13 if needed
  if (this.isbn.length === 10 && !this.isbn13) {
    this.isbn13 = convertISBN10to13(this.isbn);
  }
  
  next();
});

// Post-save hooks
bookSchema.post('save', async function(this: BookDocument) {
  // Update popularity after save
  await this.updatePopularity();
  
  // Invalidate related caches
  await cache.delete(`popular_books:10`);
  await cache.delete(`book_${this._id}`);
});

// Pre-remove hooks
bookSchema.pre('remove', async function(this: BookDocument, next) {
  // Check if book has active listings
  const BookListing = mongoose.model('BookListing');
  const activeListings = await BookListing.countDocuments({
    book: this._id,
    status: { $in: ['accepted', 'pending'] }
  });
  
  if (activeListings > 0) {
    const error = new Error('Cannot delete book with active listings');
    return next(error);
  }
  
  next();
});

// Helper function
function convertISBN10to13(isbn10: string): string {
  const isbn12 = '978' + isbn10.substring(0, 9);
  let sum = 0;
  
  for (let i = 0; i < 12; i++) {
    const weight = i % 2 === 0 ? 1 : 3;
    sum += parseInt(isbn12[i]) * weight;
  }
  
  const checkDigit = (10 - (sum % 10)) % 10;
  return isbn12 + checkDigit;
}

// Create and export model
export const Book: Model<BookDocument> = mongoose.model<BookDocument>('Book', bookSchema);

export default Book;
