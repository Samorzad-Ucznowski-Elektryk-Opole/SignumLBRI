/// <reference types="jest" />

import { BookDictionary } from '../../src/models/BookDictionary';
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
    it('should create a book dictionary entry', async () => {
      const bookData = {
        isbn: '9788326736568',
        title: 'Test Book',
        publisher: 'Test Publisher',
        authors: 'Test Author',
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
      expect(savedBook.status).toBe('pending');
    });
  });
});
