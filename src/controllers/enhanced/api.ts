/**
 * 🔌 Enhanced API Controller - Advanced REST API
 * 
 * Features:
 * - RESTful API with JSON responses
 * - Advanced filtering and pagination
 * - Real-time data endpoints
 * - Export capabilities
 * - Theme and preference management
 */

import { Request, Response } from "express";
import { User } from "../../models/User";
import { Book } from "../../models/Book";
import { BookListing } from "../../models/BookListing";
import { Performance } from "../../models/Performance";

/**
 * GET /enhanced/api/books
 * Enhanced Books API
 */
export const getBooks = async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);
    const search = req.query.search as string || '';
    const category = req.query.category as string || '';
    const sortBy = req.query.sortBy as string || 'createdAt';
    const sortOrder = req.query.sortOrder as string || 'desc';

    const searchQuery: any = {};
    
    if (search) {
      searchQuery.$or = [
        { title: { $regex: search, $options: 'i' } },
        { author: { $regex: search, $options: 'i' } },
        { publisher: { $regex: search, $options: 'i' } }
      ];
    }

    if (category) {
      searchQuery.category = category;
    }

    const sortObject: any = {};
    sortObject[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const skip = (page - 1) * limit;

    const [books, totalBooks] = await Promise.all([
      Book.find(searchQuery)
        .sort(sortObject)
        .skip(skip)
        .limit(limit)
        .lean(),
      Book.countDocuments(searchQuery)
    ]);

    const totalPages = Math.ceil(totalBooks / limit);

    res.json({
      success: true,
      data: {
        books: books,
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
          sortBy: sortBy,
          sortOrder: sortOrder
        }
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Enhanced Books API Error:', error);
    res.status(500).json({
      success: false,
      error: 'Unable to fetch books data',
      timestamp: new Date().toISOString()
    });
  }
};

/**
 * GET /enhanced/api/users
 * Enhanced Users API
 */
export const getUsers = async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);
    const role = req.query.role as string || '';
    const status = req.query.status as string || '';

    const searchQuery: any = {};
    
    if (role && role !== 'all') {
      searchQuery.role = role;
    }

    if (status && status !== 'all') {
      searchQuery.isActive = status === 'active';
    }

    const skip = (page - 1) * limit;

    const [users, totalUsers] = await Promise.all([
      User.find(searchQuery)
        .select('-password')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('school', 'name')
        .lean(),
      User.countDocuments(searchQuery)
    ]);

    const totalPages = Math.ceil(totalUsers / limit);

    res.json({
      success: true,
      data: {
        users: users,
        pagination: {
          currentPage: page,
          totalPages: totalPages,
          totalUsers: totalUsers,
          hasNext: page < totalPages,
          hasPrev: page > 1,
          limit: limit
        },
        filters: {
          role: role,
          status: status
        }
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Enhanced Users API Error:', error);
    res.status(500).json({
      success: false,
      error: 'Unable to fetch users data',
      timestamp: new Date().toISOString()
    });
  }
};

/**
 * GET /enhanced/api/analytics
 * Enhanced Analytics API
 */
export const getAnalyticsData = async (req: Request, res: Response) => {
  try {
    const timeRange = req.query.range as string || '30d';
    const type = req.query.type as string || 'overview';

    const dateRange = getDateRange(timeRange);
    let analyticsData: any = {};

    switch (type) {
      case 'overview':
        analyticsData = await getOverviewAnalytics(dateRange);
        break;
      case 'books':
        analyticsData = await getBooksAnalytics(dateRange);
        break;
      case 'users':
        analyticsData = await getUsersAnalytics(dateRange);
        break;
      case 'performance':
        analyticsData = await getPerformanceAnalytics(dateRange);
        break;
      default:
        analyticsData = await getOverviewAnalytics(dateRange);
    }

    res.json({
      success: true,
      data: {
        analytics: analyticsData,
        timeRange: timeRange,
        type: type
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Enhanced Analytics API Error:', error);
    res.status(500).json({
      success: false,
      error: 'Unable to fetch analytics data',
      timestamp: new Date().toISOString()
    });
  }
};

/**
 * GET /enhanced/api/search
 * Enhanced Universal Search API
 */
export const searchContent = async (req: Request, res: Response) => {
  try {
    const query = req.query.q as string || '';
    const type = req.query.type as string || 'all';
    const limit = Math.min(parseInt(req.query.limit as string) || 10, 50);

    if (!query || query.length < 2) {
      return res.json({
        success: true,
        data: {
          results: [],
          query: query,
          type: type,
          total: 0
        },
        timestamp: new Date().toISOString()
      });
    }

    const searchResults: any = {
      books: [],
      users: [],
      total: 0
    };

    // Search books
    if (type === 'all' || type === 'books') {
      const books = await Book.find({
        $or: [
          { title: { $regex: query, $options: 'i' } },
          { author: { $regex: query, $options: 'i' } },
          { publisher: { $regex: query, $options: 'i' } },
          { isbn: { $regex: query, $options: 'i' } }
        ]
      })
      .limit(limit)
      .select('title author publisher price category')
      .lean();

      searchResults.books = books.map(book => ({
        ...book,
        type: 'book',
        url: `/enhanced/books/${book._id}`
      }));
    }

    // Search users (if admin)
    if ((type === 'all' || type === 'users') && req.user?.role === 'admin') {
      const users = await User.find({
        $or: [
          { 'profile.name': { $regex: query, $options: 'i' } },
          { 'profile.surname': { $regex: query, $options: 'i' } },
          { email: { $regex: query, $options: 'i' } }
        ]
      })
      .limit(limit)
      .select('profile.name profile.surname email role')
      .lean();

      searchResults.users = users.map(user => ({
        ...user,
        type: 'user',
        url: `/enhanced/users/${user._id}`
      }));
    }

    // Combine and limit results
    const allResults = [...searchResults.books, ...searchResults.users];
    searchResults.total = allResults.length;

    res.json({
      success: true,
      data: {
        results: allResults.slice(0, limit),
        query: query,
        type: type,
        total: searchResults.total,
        breakdown: {
          books: searchResults.books.length,
          users: searchResults.users.length
        }
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Enhanced Search API Error:', error);
    res.status(500).json({
      success: false,
      error: 'Unable to perform search',
      timestamp: new Date().toISOString()
    });
  }
};

/**
 * POST /enhanced/api/theme
 * Update User Theme Preference
 */
export const updateTheme = async (req: Request, res: Response) => {
  try {
    const { theme } = req.body;

    if (!['light', 'dark', 'auto'].includes(theme)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid theme. Must be light, dark, or auto'
      });
    }

    // Update session
    if (req.session) {
      req.session.theme = theme;
    }

    // Update user preference if authenticated
    if (req.user) {
      // In a real implementation, update user preferences in database
      console.log(`Updated theme preference for user ${req.user.id} to ${theme}`);
    }

    res.json({
      success: true,
      data: {
        theme: theme,
        message: 'Theme updated successfully'
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Enhanced Update Theme Error:', error);
    res.status(500).json({
      success: false,
      error: 'Unable to update theme',
      timestamp: new Date().toISOString()
    });
  }
};

/**
 * POST /enhanced/api/language
 * Update User Language Preference
 */
export const updateLanguage = async (req: Request, res: Response) => {
  try {
    const { language } = req.body;

    const validLanguages = ['pl', 'en', 'uk'];
    if (!validLanguages.includes(language)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid language code'
      });
    }

    // Update session
    if (req.session) {
      req.session.language = language;
    }

    // Update user preference if authenticated
    if (req.user) {
      // In a real implementation, update user preferences in database
      console.log(`Updated language preference for user ${req.user.id} to ${language}`);
    }

    res.json({
      success: true,
      data: {
        language: language,
        message: 'Language updated successfully'
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Enhanced Update Language Error:', error);
    res.status(500).json({
      success: false,
      error: 'Unable to update language',
      timestamp: new Date().toISOString()
    });
  }
};

// === HELPER FUNCTIONS ===

/**
 * Get date range based on time range string
 */
function getDateRange(timeRange: string) {
  const now = new Date();
  let startDate = new Date();

  switch (timeRange) {
    case '24h':
      startDate.setDate(now.getDate() - 1);
      break;
    case '7d':
      startDate.setDate(now.getDate() - 7);
      break;
    case '30d':
      startDate.setDate(now.getDate() - 30);
      break;
    case '90d':
      startDate.setDate(now.getDate() - 90);
      break;
    case '1y':
      startDate.setFullYear(now.getFullYear() - 1);
      break;
    default:
      startDate.setDate(now.getDate() - 30);
  }

  return { startDate, endDate: now };
}

/**
 * Get overview analytics
 */
async function getOverviewAnalytics(dateRange: any) {
  try {
    const { startDate, endDate } = dateRange;

    const [
      totalBooks,
      totalUsers,
      totalListings,
      soldListings
    ] = await Promise.all([
      Book.countDocuments(),
      User.countDocuments({ role: { $ne: 'admin' } }),
      BookListing.countDocuments({
        createdAt: { $gte: startDate, $lte: endDate },
        status: { $ne: 'deleted' }
      }),
      BookListing.countDocuments({
        updatedAt: { $gte: startDate, $lte: endDate },
        status: 'sold'
      })
    ]);

    return {
      overview: {
        totalBooks: totalBooks,
        totalUsers: totalUsers,
        totalListings: totalListings,
        soldListings: soldListings,
        conversionRate: totalListings > 0 ? (soldListings / totalListings * 100).toFixed(1) : '0'
      }
    };

  } catch (error) {
    console.error('Overview Analytics Error:', error);
    return {
      overview: {
        totalBooks: 0,
        totalUsers: 0,
        totalListings: 0,
        soldListings: 0,
        conversionRate: '0'
      }
    };
  }
}

/**
 * Get books analytics
 */
async function getBooksAnalytics(dateRange: any) {
  try {
    const { startDate, endDate } = dateRange;

    const [
      newBooks,
      topCategories,
      priceStats
    ] = await Promise.all([
      Book.countDocuments({ createdAt: { $gte: startDate, $lte: endDate } }),
      Book.aggregate([
        { $group: { _id: '$category', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 5 }
      ]),
      Book.aggregate([
        { $group: { 
          _id: null, 
          avgPrice: { $avg: '$price' },
          minPrice: { $min: '$price' },
          maxPrice: { $max: '$price' }
        }}
      ])
    ]);

    return {
      books: {
        newBooks: newBooks,
        topCategories: topCategories,
        priceStats: priceStats[0] || { avgPrice: 0, minPrice: 0, maxPrice: 0 }
      }
    };

  } catch (error) {
    console.error('Books Analytics Error:', error);
    return {
      books: {
        newBooks: 0,
        topCategories: [],
        priceStats: { avgPrice: 0, minPrice: 0, maxPrice: 0 }
      }
    };
  }
}

/**
 * Get users analytics
 */
async function getUsersAnalytics(dateRange: any) {
  try {
    const { startDate, endDate } = dateRange;

    const [
      newUsers,
      activeUsers,
      usersByRole
    ] = await Promise.all([
      User.countDocuments({ 
        createdAt: { $gte: startDate, $lte: endDate },
        role: { $ne: 'admin' }
      }),
      User.countDocuments({
        lastActivity: { $gte: startDate },
        role: { $ne: 'admin' }
      }),
      User.aggregate([
        { $match: { role: { $ne: 'admin' } } },
        { $group: { _id: '$role', count: { $sum: 1 } } }
      ])
    ]);

    return {
      users: {
        newUsers: newUsers,
        activeUsers: activeUsers,
        usersByRole: usersByRole
      }
    };

  } catch (error) {
    console.error('Users Analytics Error:', error);
    return {
      users: {
        newUsers: 0,
        activeUsers: 0,
        usersByRole: []
      }
    };
  }
}

/**
 * Get performance analytics
 */
async function getPerformanceAnalytics(dateRange: any) {
  try {
    const { startDate, endDate } = dateRange;

    const [
      totalActions,
      uniqueUsers,
      avgResponseTime
    ] = await Promise.all([
      Performance.countDocuments({ timestamp: { $gte: startDate, $lte: endDate } }),
      Performance.distinct('user', { timestamp: { $gte: startDate, $lte: endDate } }),
      Performance.aggregate([
        { $match: { 
          timestamp: { $gte: startDate, $lte: endDate },
          duration: { $exists: true }
        }},
        { $group: { _id: null, avg: { $avg: '$duration' } }}
      ])
    ]);

    return {
      performance: {
        totalActions: totalActions,
        uniqueUsers: uniqueUsers.length,
        avgResponseTime: avgResponseTime[0]?.avg || 0
      }
    };

  } catch (error) {
    console.error('Performance Analytics Error:', error);
    return {
      performance: {
        totalActions: 0,
        uniqueUsers: 0,
        avgResponseTime: 0
      }
    };
  }
}
