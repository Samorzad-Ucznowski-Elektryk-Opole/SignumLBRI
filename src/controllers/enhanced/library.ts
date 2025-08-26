/**
 * 📚 Enhanced Library Controller - Digital Library Management
 * 
 * Features:
 * - Advanced book search and filtering
 * - Digital book catalog management
 * - Reading lists and favorites
 * - Book recommendations
 * - Library statistics and analytics
 */

import { Request, Response } from "../types/express-session-types";
import { User } from "../../models/User";
import { Book } from "../../models/Book";
import { BookListing } from "../../models/BookListing";

/**
 * GET /enhanced/library
 * Enhanced Library Dashboard
 */
export const getLibraryDashboard = async (req: Request, res: Response) => {
  try {
    const user = req.user;
    const lang = req.language || 'pl';
    
    // Get library statistics
    const [
      totalBooks,
      availableBooks,
      categoriesCount,
      recentBooks,
      popularBooks,
      userFavorites
    ] = await Promise.all([
      Book.countDocuments(),
      BookListing.countDocuments({ status: 'available' }),
      Book.distinct('category').then(categories => categories.length),
      Book.find()
        .sort({ createdAt: -1 })
        .limit(6)
        .populate('school', 'name')
        .lean(),
      Book.find()
        .sort({ views: -1 })
        .limit(6)
        .populate('school', 'name')
        .lean(),
      user ? getUserFavorites(user._id) : []
    ]);

    // Get categories with book counts
    const categoryStats = await Book.aggregate([
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 8 }
    ]);

    // Get reading statistics for user
    let userStats = null;
    if (user) {
      userStats = await getUserReadingStats(user._id);
    }

    const dashboardData = {
      stats: {
        totalBooks: totalBooks,
        availableBooks: availableBooks,
        categoriesCount: categoriesCount,
        conversionRate: totalBooks > 0 ? ((availableBooks / totalBooks) * 100).toFixed(1) : '0'
      },
      recentBooks: recentBooks,
      popularBooks: popularBooks,
      categoryStats: categoryStats,
      userFavorites: userFavorites,
      userStats: userStats
    };

    res.render('enhanced/library/dashboard', {
      title: getLocalizedText('library.dashboard.title', lang),
      user: user,
      data: dashboardData,
      lang: lang,
      page: 'library'
    });

  } catch (error) {
    console.error('Enhanced Library Dashboard Error:', error);
    res.status(500).render('enhanced/error', {
      title: getLocalizedText('errors.500.title', req.language || 'pl'),
      error: {
        status: 500,
        message: getLocalizedText('errors.500.message', req.language || 'pl')
      },
      user: req.user,
      lang: req.language || 'pl'
    });
  }
};

/**
 * GET /enhanced/library/browse
 * Enhanced Book Browsing with Advanced Filters
 */
export const browseBooks = async (req: Request, res: Response) => {
  try {
    const user = req.user;
    const lang = req.language || 'pl';
    
    // Parse query parameters
    const page = Math.max(parseInt(req.query.page as string) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit as string) || 12, 1), 50);
    const search = req.query.search as string || '';
    const category = req.query.category as string || '';
    const minPrice = parseFloat(req.query.minPrice as string) || 0;
    const maxPrice = parseFloat(req.query.maxPrice as string) || 1000;
    const availability = req.query.availability as string || 'all';
    const sortBy = req.query.sortBy as string || 'createdAt';
    const sortOrder = req.query.sortOrder as string || 'desc';

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

    if (category && category !== 'all') {
      searchQuery.category = category;
    }

    if (minPrice > 0 || maxPrice < 1000) {
      searchQuery.price = { $gte: minPrice, $lte: maxPrice };
    }

    // Build sort object
    const sortObject: any = {};
    sortObject[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const skip = (page - 1) * limit;

    // Execute queries
    const [books, totalBooks, categories, priceRange] = await Promise.all([
      Book.find(searchQuery)
        .sort(sortObject)
        .skip(skip)
        .limit(limit)
        .populate('school', 'name')
        .lean(),
      Book.countDocuments(searchQuery),
      Book.distinct('category'),
      Book.aggregate([
        { $group: {
          _id: null,
          min: { $min: '$price' },
          max: { $max: '$price' },
          avg: { $avg: '$price' }
        }}
      ])
    ]);

    // Add availability information
    const booksWithAvailability = await Promise.all(
      books.map(async (book: any) => {
        const availableCount = await BookListing.countDocuments({
          book: book._id,
          status: 'available'
        });
        
        return {
          ...book,
          availableCount: availableCount,
          isAvailable: availableCount > 0
        };
      })
    );

    const totalPages = Math.ceil(totalBooks / limit);

    const browseData = {
      books: booksWithAvailability,
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
        minPrice: minPrice,
        maxPrice: maxPrice,
        availability: availability,
        sortBy: sortBy,
        sortOrder: sortOrder,
        categories: categories.sort(),
        priceRange: priceRange[0] || { min: 0, max: 100, avg: 50 }
      }
    };

    res.render('enhanced/library/browse', {
      title: getLocalizedText('library.browse.title', lang),
      user: user,
      data: browseData,
      lang: lang,
      page: 'library-browse'
    });

  } catch (error) {
    console.error('Enhanced Library Browse Error:', error);
    res.status(500).render('enhanced/error', {
      title: getLocalizedText('errors.500.title', req.language || 'pl'),
      error: {
        status: 500,
        message: getLocalizedText('errors.500.message', req.language || 'pl')
      },
      user: req.user,
      lang: req.language || 'pl'
    });
  }
};

/**
 * GET /enhanced/library/book/:id
 * Enhanced Book Details Page
 */
export const getBookDetails = async (req: Request, res: Response) => {
  try {
    const user = req.user;
    const lang = req.language || 'pl';
    const bookId = req.params.id;

    // Get book details with related information
    const [book, listings, similarBooks] = await Promise.all([
      Book.findById(bookId).populate('school', 'name').lean(),
      BookListing.find({ book: bookId })
        .populate('seller', 'profile email')
        .sort({ price: 1 })
        .lean(),
      getSimilarBooks(bookId)
    ]);

    if (!book) {
      return res.status(404).render('enhanced/error', {
        title: getLocalizedText('errors.404.title', lang),
        error: {
          status: 404,
          message: getLocalizedText('library.book.notFound', lang)
        },
        user: user,
        lang: lang
      });
    }

    // Update view count
    await Book.findByIdAndUpdate(bookId, { $inc: { views: 1 } });

    // Check if user has this book in favorites
    let isFavorite = false;
    if (user) {
      isFavorite = await checkIsFavorite(user._id, bookId);
    }

    // Calculate statistics
    const availableListings = listings.filter(l => l.status === 'available');
    const priceStats = calculatePriceStats(availableListings);

    const bookData = {
      book: {
        ...book,
        isFavorite: isFavorite,
        availableCount: availableListings.length,
        totalListings: listings.length
      },
      listings: {
        available: availableListings,
        sold: listings.filter(l => l.status === 'sold').slice(0, 5),
        priceStats: priceStats
      },
      similarBooks: similarBooks
    };

    res.render('enhanced/library/book-details', {
      title: `${book.title} - ${getLocalizedText('library.book.details', lang)}`,
      user: user,
      data: bookData,
      lang: lang,
      page: 'book-details'
    });

  } catch (error) {
    console.error('Enhanced Book Details Error:', error);
    res.status(500).render('enhanced/error', {
      title: getLocalizedText('errors.500.title', req.language || 'pl'),
      error: {
        status: 500,
        message: getLocalizedText('errors.500.message', req.language || 'pl')
      },
      user: req.user,
      lang: req.language || 'pl'
    });
  }
};

/**
 * POST /enhanced/library/favorites/toggle/:bookId
 * Toggle Book Favorite Status
 */
export const toggleFavorite = async (req: Request, res: Response) => {
  try {
    const user = req.user;
    
    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }

    const bookId = req.params.bookId;
    
    // Check if book exists
    const book = await Book.findById(bookId);
    if (!book) {
      return res.status(404).json({
        success: false,
        error: 'Book not found'
      });
    }

    const isFavorite = await checkIsFavorite(user._id, bookId);
    
    if (isFavorite) {
      // Remove from favorites
      await removeFavorite(user._id, bookId);
    } else {
      // Add to favorites
      await addFavorite(user._id, bookId);
    }

    res.json({
      success: true,
      data: {
        isFavorite: !isFavorite,
        message: !isFavorite ? 'Added to favorites' : 'Removed from favorites'
      }
    });

  } catch (error) {
    console.error('Enhanced Toggle Favorite Error:', error);
    res.status(500).json({
      success: false,
      error: 'Unable to update favorite status'
    });
  }
};

/**
 * GET /enhanced/library/favorites
 * User's Favorite Books
 */
export const getFavorites = async (req: Request, res: Response) => {
  try {
    const user = req.user;
    const lang = req.language || 'pl';

    if (!user) {
      return res.redirect('/enhanced/auth/login');
    }

    const page = Math.max(parseInt(req.query.page as string) || 1, 1);
    const limit = 12;

    const favorites = await getUserFavorites(user._id, page, limit);
    const totalFavorites = await getFavoriteCount(user._id);
    const totalPages = Math.ceil(totalFavorites / limit);

    const favoritesData = {
      favorites: favorites,
      pagination: {
        currentPage: page,
        totalPages: totalPages,
        totalFavorites: totalFavorites,
        hasNext: page < totalPages,
        hasPrev: page > 1,
        limit: limit
      }
    };

    res.render('enhanced/library/favorites', {
      title: getLocalizedText('library.favorites.title', lang),
      user: user,
      data: favoritesData,
      lang: lang,
      page: 'favorites'
    });

  } catch (error) {
    console.error('Enhanced Favorites Error:', error);
    res.status(500).render('enhanced/error', {
      title: getLocalizedText('errors.500.title', req.language || 'pl'),
      error: {
        status: 500,
        message: getLocalizedText('errors.500.message', req.language || 'pl')
      },
      user: req.user,
      lang: req.language || 'pl'
    });
  }
};

// === HELPER FUNCTIONS ===

/**
 * Get localized text
 */
function getLocalizedText(key: string, lang: string): string {
  const translations: any = {
    pl: {
      'library.dashboard.title': 'Panel Biblioteki',
      'library.browse.title': 'Przeglądaj Książki',
      'library.book.details': 'Szczegóły Książki',
      'library.book.notFound': 'Książka nie została znaleziona',
      'library.favorites.title': 'Ulubione Książki',
      'errors.404.title': 'Nie znaleziono',
      'errors.500.title': 'Błąd serwera',
      'errors.500.message': 'Wystąpił błąd serwera'
    },
    en: {
      'library.dashboard.title': 'Library Dashboard',
      'library.browse.title': 'Browse Books',
      'library.book.details': 'Book Details',
      'library.book.notFound': 'Book not found',
      'library.favorites.title': 'Favorite Books',
      'errors.404.title': 'Not Found',
      'errors.500.title': 'Server Error',
      'errors.500.message': 'A server error occurred'
    },
    uk: {
      'library.dashboard.title': 'Панель Бібліотеки',
      'library.browse.title': 'Переглянути Книги',
      'library.book.details': 'Деталі Книги',
      'library.book.notFound': 'Книга не знайдена',
      'library.favorites.title': 'Улюблені Книги',
      'errors.404.title': 'Не знайдено',
      'errors.500.title': 'Помилка сервера',
      'errors.500.message': 'Виникла помилка сервера'
    }
  };

  return translations[lang]?.[key] || key;
}

// In a real implementation, these would be database operations
async function getUserFavorites(userId: string, page = 1, limit = 12) {
  // Mock implementation - replace with actual database query
  return [];
}

async function getUserReadingStats(userId: string) {
  // Mock implementation - replace with actual database query
  return {
    booksRead: 0,
    favoriteBooks: 0,
    averageRating: 0
  };
}

async function getSimilarBooks(bookId: string) {
  // Mock implementation - replace with actual similarity algorithm
  return [];
}

async function checkIsFavorite(userId: string, bookId: string): Promise<boolean> {
  // Mock implementation - replace with actual database query
  return false;
}

async function addFavorite(userId: string, bookId: string) {
  // Mock implementation - replace with actual database operation
  console.log(`Added book ${bookId} to favorites for user ${userId}`);
}

async function removeFavorite(userId: string, bookId: string) {
  // Mock implementation - replace with actual database operation
  console.log(`Removed book ${bookId} from favorites for user ${userId}`);
}

async function getFavoriteCount(userId: string): Promise<number> {
  // Mock implementation - replace with actual database query
  return 0;
}

function calculatePriceStats(listings: any[]) {
  if (listings.length === 0) {
    return { min: 0, max: 0, avg: 0 };
  }

  const prices = listings.map(l => l.price || 0);
  return {
    min: Math.min(...prices),
    max: Math.max(...prices),
    avg: prices.reduce((a, b) => a + b, 0) / prices.length
  };
}
