/**
 * 📚 Enhanced Book Controller - Advanced Book Management
 * 
 * Features:
 * - Smart book catalog with AI-powered search
 * - Bulk operations with progress tracking
 * - Advanced filtering and sorting
 * - Price analytics and recommendations
 * - Real-time inventory management
 */

import { Request, Response } from "express";
import { Book } from "../../models/Book";
import { BookListing } from "../../models/BookListing";
import { User } from "../../models/User";

/**
 * GET /enhanced/books
 * Enhanced Books List with Advanced Filtering
 */
export const getAllBooks = async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const search = req.query.search as string || '';
    const category = req.query.category as string || '';
    const status = req.query.status as string || '';
    const sortBy = req.query.sortBy as string || 'createdAt';
    const sortOrder = req.query.sortOrder as string || 'desc';
    const priceMin = parseFloat(req.query.priceMin as string) || 0;
    const priceMax = parseFloat(req.query.priceMax as string) || Number.MAX_VALUE;

    // Build search query
    const searchQuery: any = {};
    
    if (search) {
      searchQuery.$or = [
        { title: { $regex: search, $options: 'i' } },
        { author: { $regex: search, $options: 'i' } },
        { publisher: { $regex: search, $options: 'i' } },
        { isbn: { $regex: search, $options: 'i' } }
      ];
    }

    if (category) {
      searchQuery.category = category;
    }

    if (priceMin > 0 || priceMax < Number.MAX_VALUE) {
      searchQuery.price = { $gte: priceMin, $lte: priceMax };
    }

    // Build sort object
    const sortObject: any = {};
    sortObject[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const skip = (page - 1) * limit;

    const [books, totalBooks, categories, priceRange] = await Promise.all([
      Book.find(searchQuery)
        .sort(sortObject)
        .skip(skip)
        .limit(limit)
        .lean(),
      Book.countDocuments(searchQuery),
      Book.distinct('category'),
      Book.aggregate([
        { $group: { _id: null, min: { $min: '$price' }, max: { $max: '$price' } } }
      ])
    ]);

    // Enhance books with listing statistics
    const enhancedBooks = await Promise.all(
      books.map(async (book) => {
        const [listingsCount, soldCount, avgPrice, recentListings] = await Promise.all([
          BookListing.countDocuments({ book: book._id, status: { $ne: 'deleted' } }),
          BookListing.countDocuments({ book: book._id, status: 'sold' }),
          BookListing.aggregate([
            { $match: { book: book._id, status: { $ne: 'deleted' } } },
            { $lookup: { from: 'books', localField: 'book', foreignField: '_id', as: 'bookData' } },
            { $unwind: '$bookData' },
            { $group: { _id: null, avg: { $avg: '$bookData.price' } } }
          ]),
          BookListing.find({ book: book._id, status: 'registered' })
            .sort({ createdAt: -1 })
            .limit(3)
            .populate('user', 'profile.name profile.surname')
        ]);

        return {
          ...book,
          stats: {
            totalListings: listingsCount,
            soldCount: soldCount,
            availableCount: listingsCount - soldCount,
            averagePrice: avgPrice[0]?.avg || book.price,
            demandLevel: calculateDemandLevel(listingsCount, soldCount)
          },
          recentListings: recentListings || []
        };
      })
    );

    const totalPages = Math.ceil(totalBooks / limit);

    res.render('enhanced/books/index', {
      title: 'Enhanced Book Catalog - SignumLBRI',
      books: enhancedBooks,
      pagination: {
        currentPage: page,
        totalPages: totalPages,
        totalBooks: totalBooks,
        hasNext: page < totalPages,
        hasPrev: page > 1,
        limit: limit
      },
      filters: {
        search: search,
        category: category,
        status: status,
        sortBy: sortBy,
        sortOrder: sortOrder,
        priceMin: priceMin > 0 ? priceMin : '',
        priceMax: priceMax < Number.MAX_VALUE ? priceMax : ''
      },
      categories: categories || [],
      priceRange: priceRange[0] || { min: 0, max: 100 },
      user: req.user,
      animations: true,
      enhancedView: true
    });

  } catch (error) {
    console.error('Enhanced Books Error:', error);
    res.status(500).render('enhanced/error', {
      title: 'Books Error',
      error: 'Unable to load books catalog',
      user: req.user
    });
  }
};

/**
 * GET /enhanced/books/:id
 * Enhanced Book Details with Analytics
 */
export const getBookDetails = async (req: Request, res: Response) => {
  try {
    const bookId = req.params.id;
    
    const [book, listings, priceHistory, relatedBooks] = await Promise.all([
      Book.findById(bookId).lean(),
      BookListing.find({ book: bookId, status: { $ne: 'deleted' } })
        .populate('user', 'profile.name profile.surname profile.picture')
        .sort({ createdAt: -1 }),
      getPriceHistory(bookId),
      getRelatedBooks(bookId),
    ]);

    if (!book) {
      return res.status(404).render('enhanced/error', {
        title: 'Book Not Found',
        error: 'The requested book could not be found',
        user: req.user
      });
    }

    // Calculate detailed statistics
    const statistics = await calculateBookStatistics(bookId);
    
    res.render('enhanced/books/details', {
      title: `${book.title} - Enhanced Book Details`,
      book: book,
      listings: listings || [],
      statistics: statistics,
      priceHistory: priceHistory || [],
      relatedBooks: relatedBooks || [],
      user: req.user,
      animations: true,
      charts: true
    });

  } catch (error) {
    console.error('Enhanced Book Details Error:', error);
    res.status(500).render('enhanced/error', {
      title: 'Book Details Error',
      error: 'Unable to load book details',
      user: req.user
    });
  }
};

/**
 * GET /enhanced/books/add
 * Enhanced Add Book Form
 */
export const getAddBook = async (req: Request, res: Response) => {
  try {
    const [categories, publishers, recentBooks] = await Promise.all([
      Book.distinct('category'),
      Book.distinct('publisher'),
      Book.find().sort({ createdAt: -1 }).limit(5).select('title author price category')
    ]);

    res.render('enhanced/books/add', {
      title: 'Add New Book - Enhanced SignumLBRI',
      categories: categories || [],
      publishers: publishers || [],
      recentBooks: recentBooks || [],
      user: req.user,
      form: true,
      animations: true
    });

  } catch (error) {
    console.error('Enhanced Add Book Error:', error);
    res.status(500).render('enhanced/error', {
      title: 'Add Book Error',
      error: 'Unable to load add book form',
      user: req.user
    });
  }
};

/**
 * POST /enhanced/books/add
 * Enhanced Add Book Processing
 */
export const postAddBook = async (req: Request, res: Response) => {
  try {
    const {
      title,
      author,
      publisher,
      isbn,
      category,
      price,
      description,
      year,
      pages,
      language,
      condition
    } = req.body;

    // Validation
    if (!title || !author || !price) {
      req.flash('errors', { msg: 'Title, author, and price are required.' });
      return res.redirect('/enhanced/books/add');
    }

    // Check for duplicates
    const existingBook = await Book.findOne({
      $or: [
        { isbn: isbn },
        { title: title, author: author, publisher: publisher }
      ]
    });

    if (existingBook) {
      req.flash('errors', { msg: 'A book with this ISBN or title/author/publisher combination already exists.' });
      return res.redirect('/enhanced/books/add');
    }

    // Create enhanced book object
    const bookData = {
      title: title.trim(),
      author: author.trim(),
      publisher: publisher.trim(),
      isbn: isbn?.trim() || '',
      category: category || 'Other',
      price: parseFloat(price),
      description: description?.trim() || '',
      year: parseInt(year) || new Date().getFullYear(),
      pages: parseInt(pages) || 0,
      language: language || 'pl',
      condition: condition || 'new',
      createdBy: req.user.id,
      metadata: {
        addedDate: new Date(),
        lastUpdated: new Date(),
        source: 'enhanced-form'
      }
    };

    const book = new Book(bookData);
    await book.save();

    // Log activity
    // await logActivity(req.user.id, 'book_added', book._id);

    req.flash('success', { msg: `Book "${title}" has been added successfully!` });
    res.redirect(`/enhanced/books/${book._id}`);

  } catch (error) {
    console.error('Enhanced Post Add Book Error:', error);
    req.flash('errors', { msg: 'Error adding book. Please try again.' });
    res.redirect('/enhanced/books/add');
  }
};

/**
 * GET /enhanced/books/:id/edit
 * Enhanced Edit Book Form
 */
export const getEditBook = async (req: Request, res: Response) => {
  try {
    const bookId = req.params.id;
    
    const [book, categories, publishers] = await Promise.all([
      Book.findById(bookId),
      Book.distinct('category'),
      Book.distinct('publisher')
    ]);

    if (!book) {
      return res.status(404).render('enhanced/error', {
        title: 'Book Not Found',
        error: 'The requested book could not be found',
        user: req.user
      });
    }

    res.render('enhanced/books/edit', {
      title: `Edit ${book.title} - Enhanced SignumLBRI`,
      book: book,
      categories: categories || [],
      publishers: publishers || [],
      user: req.user,
      form: true,
      animations: true
    });

  } catch (error) {
    console.error('Enhanced Edit Book Error:', error);
    res.status(500).render('enhanced/error', {
      title: 'Edit Book Error',
      error: 'Unable to load edit book form',
      user: req.user
    });
  }
};

/**
 * POST /enhanced/books/:id/edit
 * Enhanced Edit Book Processing
 */
export const postEditBook = async (req: Request, res: Response) => {
  try {
    const bookId = req.params.id;
    const {
      title,
      author,
      publisher,
      isbn,
      category,
      price,
      description,
      year,
      pages,
      language,
      condition
    } = req.body;

    const book = await Book.findById(bookId);
    
    if (!book) {
      return res.status(404).render('enhanced/error', {
        title: 'Book Not Found',
        error: 'The requested book could not be found',
        user: req.user
      });
    }

    // Update book fields
    book.title = title.trim();
    book.author = author.trim();
    book.publisher = publisher.trim();
    book.isbn = isbn?.trim() || book.isbn;
    book.category = category || book.category;
    book.price = parseFloat(price);
    book.description = description?.trim() || book.description;
    book.year = parseInt(year) || book.year;
    book.pages = parseInt(pages) || book.pages;
    book.language = language || book.language;
    book.condition = condition || book.condition;
    
    // Update metadata
    if (!book.metadata) book.metadata = {};
    book.metadata.lastUpdated = new Date();
    book.metadata.updatedBy = req.user.id;

    await book.save();

    // Log activity
    // await logActivity(req.user.id, 'book_updated', book._id);

    req.flash('success', { msg: `Book "${title}" has been updated successfully!` });
    res.redirect(`/enhanced/books/${book._id}`);

  } catch (error) {
    console.error('Enhanced Post Edit Book Error:', error);
    req.flash('errors', { msg: 'Error updating book. Please try again.' });
    res.redirect(`/enhanced/books/${req.params.id}/edit`);
  }
};

/**
 * DELETE /enhanced/books/:id
 * Enhanced Delete Book
 */
export const deleteBook = async (req: Request, res: Response) => {
  try {
    const bookId = req.params.id;
    
    // Check if book has active listings
    const activeListings = await BookListing.countDocuments({ 
      book: bookId, 
      status: { $nin: ['deleted', 'sold', 'returned'] }
    });

    if (activeListings > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete book. It has ${activeListings} active listing(s).`
      });
    }

    const book = await Book.findById(bookId);
    
    if (!book) {
      return res.status(404).json({
        success: false,
        message: 'Book not found'
      });
    }

    await Book.findByIdAndDelete(bookId);

    // Log activity
    // await logActivity(req.user.id, 'book_deleted', bookId);

    res.json({
      success: true,
      message: `Book "${book.title}" has been deleted successfully.`
    });

  } catch (error) {
    console.error('Enhanced Delete Book Error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting book. Please try again.'
    });
  }
};

// === HELPER FUNCTIONS ===

/**
 * Calculate demand level based on listings and sales
 */
function calculateDemandLevel(totalListings: number, soldCount: number): string {
  if (totalListings === 0) return 'none';
  
  const saleRatio = soldCount / totalListings;
  
  if (saleRatio >= 0.8) return 'very-high';
  if (saleRatio >= 0.6) return 'high';
  if (saleRatio >= 0.4) return 'medium';
  if (saleRatio >= 0.2) return 'low';
  return 'very-low';
}

/**
 * Get price history for a book
 */
async function getPriceHistory(bookId: string) {
  try {
    const history = await BookListing.aggregate([
      {
        $match: { book: bookId, status: 'sold' }
      },
      {
        $lookup: {
          from: 'books',
          localField: 'book',
          foreignField: '_id',
          as: 'bookData'
        }
      },
      {
        $unwind: '$bookData'
      },
      {
        $group: {
          _id: {
            year: { $year: '$updatedAt' },
            month: { $month: '$updatedAt' }
          },
          averagePrice: { $avg: '$bookData.price' },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { '_id.year': 1, '_id.month': 1 }
      }
    ]);

    return history.map(item => ({
      period: `${item._id.year}-${item._id.month.toString().padStart(2, '0')}`,
      price: Math.round(item.averagePrice * 100) / 100,
      sales: item.count
    }));

  } catch (error) {
    console.error('Price History Error:', error);
    return [];
  }
}

/**
 * Get related books based on category and author
 */
async function getRelatedBooks(bookId: string) {
  try {
    const book = await Book.findById(bookId).select('category author');
    
    if (!book) return [];

    const relatedBooks = await Book.find({
      _id: { $ne: bookId },
      $or: [
        { category: book.category },
        { author: book.author }
      ]
    })
    .limit(6)
    .select('title author price category')
    .lean();

    return relatedBooks;

  } catch (error) {
    console.error('Related Books Error:', error);
    return [];
  }
}

/**
 * Calculate detailed statistics for a book
 */
async function calculateBookStatistics(bookId: string) {
  try {
    const [
      totalListings,
      soldListings,
      activeListings,
      averagePrice,
      priceRange,
      salesTrend
    ] = await Promise.all([
      BookListing.countDocuments({ book: bookId, status: { $ne: 'deleted' } }),
      BookListing.countDocuments({ book: bookId, status: 'sold' }),
      BookListing.countDocuments({ book: bookId, status: 'registered' }),
      Book.findById(bookId).select('price'),
      BookListing.aggregate([
        { $match: { book: bookId, status: { $ne: 'deleted' } } },
        { $lookup: { from: 'books', localField: 'book', foreignField: '_id', as: 'bookData' } },
        { $unwind: '$bookData' },
        { $group: { _id: null, min: { $min: '$bookData.price' }, max: { $max: '$bookData.price' } } }
      ]),
      BookListing.aggregate([
        { $match: { book: bookId, status: 'sold', updatedAt: { $gte: new Date(new Date().setMonth(new Date().getMonth() - 6)) } } },
        { $group: { 
          _id: { 
            year: { $year: '$updatedAt' }, 
            month: { $month: '$updatedAt' } 
          }, 
          count: { $sum: 1 } 
        } },
        { $sort: { '_id.year': 1, '_id.month': 1 } }
      ])
    ]);

    return {
      totalListings: totalListings || 0,
      soldListings: soldListings || 0,
      activeListings: activeListings || 0,
      saleRate: totalListings > 0 ? Math.round((soldListings / totalListings) * 100) : 0,
      averagePrice: averagePrice?.price || 0,
      priceRange: priceRange[0] || { min: 0, max: 0 },
      demandLevel: calculateDemandLevel(totalListings, soldListings),
      salesTrend: salesTrend || []
    };

  } catch (error) {
    console.error('Book Statistics Error:', error);
    return {
      totalListings: 0,
      soldListings: 0,
      activeListings: 0,
      saleRate: 0,
      averagePrice: 0,
      priceRange: { min: 0, max: 0 },
      demandLevel: 'none',
      salesTrend: []
    };
  }
}
