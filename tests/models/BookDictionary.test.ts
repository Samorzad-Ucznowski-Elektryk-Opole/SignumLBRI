/// <reference types="jest" />

import { BookDictionary, BookDictionaryDocument } from '../../src/models/BookDictionary';
import { User } from '../../src/models/User';

describe('BookDictionary Model', () => {
  let testUser: any;

  beforeEach(async () => {
    // Create a test user for admin actions
    testUser = new User({
      email: 'admin@test.com',
      password: 'password123',
      profile: {
        name: 'Admin User',
        gender: 'Male',
        location: 'Test Location',
        website: 'http://test.com',
        picture: 'test.jpg'
      }
    });
    await testUser.save();
  });

  describe('Creation', () => {
    it('should create a book dictionary entry with required fields', async () => {
      const bookData = {
        isbn: '9788326736568',
        title: 'Ponad słowami 2 (cz. 1). Zakres podstawowy i rozszerzony',
        publisher: 'Nowa Era',
        authors: 'Małgorzata Chmiel, Anna Cisowska, Joanna Kościerzyńska i in.',
        year: 2020,
        newPrice: 52.90,
        usedPrice: 40.40,
        submittedBy: testUser._id,
        submittedAt: new Date()
      };

      const book = new BookDictionary(bookData);
      const savedBook = await book.save();

      expect(savedBook._id).toBeDefined();
      expect(savedBook.isbn).toBe(bookData.isbn);
      expect(savedBook.title).toBe(bookData.title);
      expect(savedBook.status).toBe('pending'); // Default status
      expect(savedBook.submittedBy).toEqual(testUser._id);
    });

    it('should require ISBN field', async () => {
      const bookData = {
        title: 'Test Book',
        publisher: 'Test Publisher',
        authors: 'Test Author',
        year: 2023,
        newPrice: 50.00,
        usedPrice: 35.00,
        submittedBy: testUser._id,
        submittedAt: new Date()
      };

      const book = new BookDictionary(bookData);
      
      await expect(book.save()).rejects.toThrow();
    });

    it('should require title field', async () => {
      const bookData = {
        isbn: '9788326736568',
        publisher: 'Test Publisher',
        authors: 'Test Author',
        year: 2023,
        newPrice: 50.00,
        usedPrice: 35.00,
        submittedBy: testUser._id,
        submittedAt: new Date()
      };

      const book = new BookDictionary(bookData);
      
      await expect(book.save()).rejects.toThrow();
    });
  });
});

  describe('Status Management', () => {
    let testBook: any;

    beforeEach(async () => {
      testBook = new BookDictionary({
        isbn: '9788326736568',
        title: 'Test Book',
        publisher: 'Test Publisher',
        authors: 'Test Author',
        yearPublished: 2023,
        newPrice: 50.00,
        usedPrice: 35.00
      });
      await testBook.save();
    });

    it('should allow approval with admin details', async () => {
      testBook.status = 'approved';
      testBook.approvedBy = testUser._id;
      testBook.approvedAt = new Date();

      const updatedBook = await testBook.save();

      expect(updatedBook.status).toBe('approved');
      expect(updatedBook.approvedBy).toEqual(testUser._id);
      expect(updatedBook.approvedAt).toBeDefined();
    });

    it('should allow rejection with reason', async () => {
      testBook.status = 'rejected';
      testBook.rejectedBy = testUser._id;
      testBook.rejectedAt = new Date();
      testBook.rejectionReason = 'Duplicate entry';

      const updatedBook = await testBook.save();

      expect(updatedBook.status).toBe('rejected');
      expect(updatedBook.rejectedBy).toEqual(testUser._id);
      expect(updatedBook.rejectedAt).toBeDefined();
      expect(updatedBook.rejectionReason).toBe('Duplicate entry');
    });

    it('should validate status enum values', async () => {
      testBook.status = 'invalid_status' as any;
      
      await expect(testBook.save()).rejects.toThrow();
    });
  });

  describe('Duplicate Detection', () => {
    it('should prevent duplicate ISBN entries', async () => {
      const bookData = {
        isbn: '9788326736568',
        title: 'First Book',
        publisher: 'Test Publisher',
        authors: 'Test Author',
        yearPublished: 2023,
        newPrice: 50.00,
        usedPrice: 35.00
      };

      // Create first book
      const firstBook = new BookDictionary(bookData);
      await firstBook.save();

      // Try to create second book with same ISBN
      const duplicateBook = new BookDictionary({
        ...bookData,
        title: 'Second Book' // Different title but same ISBN
      });

      await expect(duplicateBook.save()).rejects.toThrow();
    });
  });

  describe('Query Methods', () => {
    beforeEach(async () => {
      // Create test books with different statuses
      const books = [
        {
          isbn: '9788326736568',
          title: 'Book 1',
          publisher: 'Publisher A',
          authors: 'Author 1',
          yearPublished: 2020,
          newPrice: 50.00,
          usedPrice: 35.00,
          status: 'pending'
        },
        {
          isbn: '9788302187636',
          title: 'Book 2',
          publisher: 'Publisher B',
          authors: 'Author 2',
          yearPublished: 2021,
          newPrice: 60.00,
          usedPrice: 45.00,
          status: 'approved',
          approvedBy: testUser._id,
          approvedAt: new Date()
        },
        {
          isbn: '9788326738777',
          title: 'Book 3',
          publisher: 'Publisher C',
          authors: 'Author 3',
          yearPublished: 2022,
          newPrice: 70.00,
          usedPrice: 55.00,
          status: 'rejected',
          rejectedBy: testUser._id,
          rejectedAt: new Date(),
          rejectionReason: 'Outdated edition'
        }
      ];

      await BookDictionary.insertMany(books);
    });

    it('should find pending books', async () => {
      const pendingBooks = await BookDictionary.find({ status: 'pending' });
      expect(pendingBooks).toHaveLength(1);
      expect(pendingBooks[0].title).toBe('Book 1');
    });

    it('should find approved books', async () => {
      const approvedBooks = await BookDictionary.find({ status: 'approved' });
      expect(approvedBooks).toHaveLength(1);
      expect(approvedBooks[0].title).toBe('Book 2');
    });

    it('should search by title', async () => {
      const searchResults = await BookDictionary.find({ 
        title: { $regex: 'Book 2', $options: 'i' } 
      });
      expect(searchResults).toHaveLength(1);
      expect(searchResults[0].title).toBe('Book 2');
    });

    it('should search by ISBN', async () => {
      const book = await BookDictionary.findOne({ isbn: '9788326738777' });
      expect(book).toBeTruthy();
      expect(book!.title).toBe('Book 3');
    });
  });

  describe('Price Validation', () => {
    it('should require positive prices', async () => {
      const bookData = {
        isbn: '9788326736568',
        title: 'Test Book',
        publisher: 'Test Publisher',
        authors: 'Test Author',
        yearPublished: 2023,
        newPrice: -10.00, // Negative price
        usedPrice: 35.00
      };

      const book = new BookDictionary(bookData);
      
      await expect(book.save()).rejects.toThrow();
    });

    it('should allow zero prices', async () => {
      const bookData = {
        isbn: '9788326736568',
        title: 'Free Book',
        publisher: 'Test Publisher',
        authors: 'Test Author',
        yearPublished: 2023,
        newPrice: 0.00,
        usedPrice: 0.00
      };

      const book = new BookDictionary(bookData);
      const savedBook = await book.save();

      expect(savedBook.newPrice).toBe(0);
      expect(savedBook.usedPrice).toBe(0);
    });
  });
});
