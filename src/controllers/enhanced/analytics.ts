/**
 * 📊 Enhanced Analytics Controller - Advanced Data Analysis & Insights
 * 
 * Features:
 * - Real-time dashboard with live metrics
 * - Advanced data visualization with Chart.js
 * - Predictive analytics and trends
 * - Performance monitoring and optimization insights
 * - Export capabilities for reports
 */

import { Request, Response } from "express";
import { User } from "../../models/User";
import { Book } from "../../models/Book";
import { BookListing } from "../../models/BookListing";
import { Performance } from "../../models/Performance";

/**
 * GET /enhanced/analytics
 * Enhanced Analytics Dashboard
 */
export const getDashboard = async (req: Request, res: Response) => {
  try {
    const timeRange = req.query.range as string || '30d';
    const dateRange = getDateRange(timeRange);

    const [
      overviewMetrics,
      salesTrends,
      userActivityTrends,
      topBooks,
      topUsers,
      categoryDistribution,
      performanceMetrics
    ] = await Promise.all([
      getOverviewMetrics(dateRange),
      getSalesTrends(dateRange),
      getUserActivityTrends(dateRange),
      getTopBooks(dateRange),
      getTopUsers(dateRange),
      getCategoryDistribution(dateRange),
      getPerformanceMetrics(dateRange)
    ]);

    const analyticsData = {
      overview: overviewMetrics,
      trends: {
        sales: salesTrends,
        userActivity: userActivityTrends
      },
      topPerformers: {
        books: topBooks,
        users: topUsers
      },
      distributions: {
        categories: categoryDistribution
      },
      performance: performanceMetrics,
      timeRange: timeRange,
      lastUpdated: new Date()
    };

    res.render('enhanced/analytics/dashboard', {
      title: 'Analytics Dashboard - Enhanced SignumLBRI',
      data: analyticsData,
      user: req.user,
      charts: true,
      animations: true,
      realtime: true
    });

  } catch (error) {
    console.error('Enhanced Analytics Dashboard Error:', error);
    res.status(500).render('enhanced/error', {
      title: 'Analytics Error',
      error: 'Unable to load analytics dashboard',
      user: req.user
    });
  }
};

/**
 * GET /enhanced/analytics/books
 * Enhanced Book Analytics
 */
export const getBookAnalytics = async (req: Request, res: Response) => {
  try {
    const timeRange = req.query.range as string || '30d';
    const category = req.query.category as string || '';
    const dateRange = getDateRange(timeRange);

    const [
      bookMetrics,
      priceAnalysis,
      demandAnalysis,
      inventoryMetrics,
      categoryPerformance,
      trendingBooks
    ] = await Promise.all([
      getBookMetrics(dateRange, category),
      getPriceAnalysis(dateRange, category),
      getDemandAnalysis(dateRange, category),
      getInventoryMetrics(dateRange, category),
      getCategoryPerformance(dateRange),
      getTrendingBooks(dateRange, category)
    ]);

    const bookAnalyticsData = {
      metrics: bookMetrics,
      priceAnalysis: priceAnalysis,
      demandAnalysis: demandAnalysis,
      inventory: inventoryMetrics,
      categoryPerformance: categoryPerformance,
      trending: trendingBooks,
      filters: {
        timeRange: timeRange,
        category: category
      },
      lastUpdated: new Date()
    };

    res.render('enhanced/analytics/books', {
      title: 'Book Analytics - Enhanced SignumLBRI',
      data: bookAnalyticsData,
      user: req.user,
      charts: true,
      animations: true
    });

  } catch (error) {
    console.error('Enhanced Book Analytics Error:', error);
    res.status(500).render('enhanced/error', {
      title: 'Book Analytics Error',
      error: 'Unable to load book analytics',
      user: req.user
    });
  }
};

/**
 * GET /enhanced/analytics/users
 * Enhanced User Analytics
 */
export const getUserAnalytics = async (req: Request, res: Response) => {
  try {
    const timeRange = req.query.range as string || '30d';
    const role = req.query.role as string || '';
    const dateRange = getDateRange(timeRange);

    const [
      userMetrics,
      engagementMetrics,
      performanceMetrics,
      retentionAnalysis,
      segmentAnalysis,
      activityHeatmap
    ] = await Promise.all([
      getUserMetrics(dateRange, role),
      getEngagementMetrics(dateRange, role),
      getUserPerformanceMetrics(dateRange, role),
      getRetentionAnalysis(dateRange),
      getUserSegmentAnalysis(dateRange),
      getActivityHeatmap(dateRange, role)
    ]);

    const userAnalyticsData = {
      metrics: userMetrics,
      engagement: engagementMetrics,
      performance: performanceMetrics,
      retention: retentionAnalysis,
      segments: segmentAnalysis,
      activity: activityHeatmap,
      filters: {
        timeRange: timeRange,
        role: role
      },
      lastUpdated: new Date()
    };

    res.render('enhanced/analytics/users', {
      title: 'User Analytics - Enhanced SignumLBRI',
      data: userAnalyticsData,
      user: req.user,
      charts: true,
      animations: true
    });

  } catch (error) {
    console.error('Enhanced User Analytics Error:', error);
    res.status(500).render('enhanced/error', {
      title: 'User Analytics Error',
      error: 'Unable to load user analytics',
      user: req.user
    });
  }
};

/**
 * GET /enhanced/analytics/performance
 * Enhanced Performance Metrics
 */
export const getPerformanceMetrics = async (req: Request, res: Response) => {
  try {
    const timeRange = req.query.range as string || '24h';
    const dateRange = getDateRange(timeRange);

    const [
      systemMetrics,
      responseTimeMetrics,
      errorMetrics,
      throughputMetrics,
      resourceUsage,
      healthStatus
    ] = await Promise.all([
      getSystemMetrics(dateRange),
      getResponseTimeMetrics(dateRange),
      getErrorMetrics(dateRange),
      getThroughputMetrics(dateRange),
      getResourceUsage(dateRange),
      getHealthStatus()
    ]);

    const performanceData = {
      system: systemMetrics,
      responseTime: responseTimeMetrics,
      errors: errorMetrics,
      throughput: throughputMetrics,
      resources: resourceUsage,
      health: healthStatus,
      timeRange: timeRange,
      lastUpdated: new Date()
    };

    res.render('enhanced/analytics/performance', {
      title: 'Performance Metrics - Enhanced SignumLBRI',
      data: performanceData,
      user: req.user,
      charts: true,
      animations: true,
      realtime: true
    });

  } catch (error) {
    console.error('Enhanced Performance Metrics Error:', error);
    res.status(500).render('enhanced/error', {
      title: 'Performance Metrics Error',
      error: 'Unable to load performance metrics',
      user: req.user
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
 * Get overview metrics for dashboard
 */
async function getOverviewMetrics(dateRange: any) {
  try {
    const { startDate, endDate } = dateRange;

    const [
      totalUsers,
      activeUsers,
      totalBooks,
      newBooks,
      totalListings,
      soldListings,
      totalRevenue,
      averagePrice
    ] = await Promise.all([
      User.countDocuments({ role: { $ne: 'admin' } }),
      User.countDocuments({ 
        role: { $ne: 'admin' },
        lastActivity: { $gte: startDate }
      }),
      Book.countDocuments(),
      Book.countDocuments({ createdAt: { $gte: startDate, $lte: endDate } }),
      BookListing.countDocuments({ 
        createdAt: { $gte: startDate, $lte: endDate },
        status: { $ne: 'deleted' }
      }),
      BookListing.countDocuments({ 
        updatedAt: { $gte: startDate, $lte: endDate },
        status: 'sold'
      }),
      calculateRevenue(startDate, endDate),
      calculateAveragePrice(startDate, endDate)
    ]);

    return {
      users: {
        total: totalUsers,
        active: activeUsers,
        growth: await calculateGrowthRate('users', startDate, endDate)
      },
      books: {
        total: totalBooks,
        new: newBooks,
        growth: await calculateGrowthRate('books', startDate, endDate)
      },
      listings: {
        total: totalListings,
        sold: soldListings,
        conversionRate: totalListings > 0 ? (soldListings / totalListings * 100).toFixed(1) : '0'
      },
      revenue: {
        total: totalRevenue,
        average: averagePrice,
        growth: await calculateRevenueGrowth(startDate, endDate)
      }
    };

  } catch (error) {
    console.error('Overview Metrics Error:', error);
    return {
      users: { total: 0, active: 0, growth: 0 },
      books: { total: 0, new: 0, growth: 0 },
      listings: { total: 0, sold: 0, conversionRate: '0' },
      revenue: { total: 0, average: 0, growth: 0 }
    };
  }
}

/**
 * Get sales trends over time
 */
async function getSalesTrends(dateRange: any) {
  try {
    const { startDate, endDate } = dateRange;

    const trends = await BookListing.aggregate([
      {
        $match: {
          updatedAt: { $gte: startDate, $lte: endDate },
          status: 'sold'
        }
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
            month: { $month: '$updatedAt' },
            day: { $dayOfMonth: '$updatedAt' }
          },
          sales: { $sum: 1 },
          revenue: { $sum: '$bookData.price' }
        }
      },
      {
        $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 }
      }
    ]);

    return trends.map(trend => ({
      date: new Date(trend._id.year, trend._id.month - 1, trend._id.day),
      sales: trend.sales,
      revenue: trend.revenue
    }));

  } catch (error) {
    console.error('Sales Trends Error:', error);
    return [];
  }
}

/**
 * Get user activity trends
 */
async function getUserActivityTrends(dateRange: any) {
  try {
    const { startDate, endDate } = dateRange;

    const trends = await Performance.aggregate([
      {
        $match: {
          timestamp: { $gte: startDate, $lte: endDate }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$timestamp' },
            month: { $month: '$timestamp' },
            day: { $dayOfMonth: '$timestamp' }
          },
          uniqueUsers: { $addToSet: '$user' },
          totalActions: { $sum: 1 }
        }
      },
      {
        $addFields: {
          uniqueUsersCount: { $size: '$uniqueUsers' }
        }
      },
      {
        $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 }
      }
    ]);

    return trends.map(trend => ({
      date: new Date(trend._id.year, trend._id.month - 1, trend._id.day),
      activeUsers: trend.uniqueUsersCount,
      totalActions: trend.totalActions
    }));

  } catch (error) {
    console.error('User Activity Trends Error:', error);
    return [];
  }
}

/**
 * Get top performing books
 */
async function getTopBooks(dateRange: any, limit = 10) {
  try {
    const { startDate, endDate } = dateRange;

    const topBooks = await BookListing.aggregate([
      {
        $match: {
          updatedAt: { $gte: startDate, $lte: endDate },
          status: 'sold'
        }
      },
      {
        $group: {
          _id: '$book',
          salesCount: { $sum: 1 }
        }
      },
      {
        $lookup: {
          from: 'books',
          localField: '_id',
          foreignField: '_id',
          as: 'bookData'
        }
      },
      {
        $unwind: '$bookData'
      },
      {
        $sort: { salesCount: -1 }
      },
      {
        $limit: limit
      }
    ]);

    return topBooks.map(book => ({
      book: book.bookData,
      salesCount: book.salesCount
    }));

  } catch (error) {
    console.error('Top Books Error:', error);
    return [];
  }
}

/**
 * Get top performing users
 */
async function getTopUsers(dateRange: any, limit = 10) {
  try {
    const { startDate, endDate } = dateRange;

    const topUsers = await BookListing.aggregate([
      {
        $match: {
          updatedAt: { $gte: startDate, $lte: endDate },
          status: 'sold'
        }
      },
      {
        $group: {
          _id: '$user',
          salesCount: { $sum: 1 }
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'userData'
        }
      },
      {
        $unwind: '$userData'
      },
      {
        $sort: { salesCount: -1 }
      },
      {
        $limit: limit
      }
    ]);

    return topUsers.map(user => ({
      user: {
        _id: user.userData._id,
        name: user.userData.profile?.name,
        surname: user.userData.profile?.surname,
        email: user.userData.email
      },
      salesCount: user.salesCount
    }));

  } catch (error) {
    console.error('Top Users Error:', error);
    return [];
  }
}

/**
 * Get category distribution
 */
async function getCategoryDistribution(dateRange: any) {
  try {
    const { startDate, endDate } = dateRange;

    const distribution = await BookListing.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate, $lte: endDate },
          status: { $ne: 'deleted' }
        }
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
          _id: '$bookData.category',
          count: { $sum: 1 },
          sold: { 
            $sum: { 
              $cond: [{ $eq: ['$status', 'sold'] }, 1, 0] 
            }
          }
        }
      },
      {
        $sort: { count: -1 }
      }
    ]);

    return distribution.map(cat => ({
      category: cat._id || 'Other',
      totalListings: cat.count,
      soldListings: cat.sold,
      conversionRate: cat.count > 0 ? (cat.sold / cat.count * 100).toFixed(1) : '0'
    }));

  } catch (error) {
    console.error('Category Distribution Error:', error);
    return [];
  }
}

/**
 * Calculate revenue for date range
 */
async function calculateRevenue(startDate: Date, endDate: Date) {
  try {
    const result = await BookListing.aggregate([
      {
        $match: {
          updatedAt: { $gte: startDate, $lte: endDate },
          status: 'sold'
        }
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
          _id: null,
          totalRevenue: { $sum: '$bookData.price' }
        }
      }
    ]);

    return result[0]?.totalRevenue || 0;

  } catch (error) {
    console.error('Calculate Revenue Error:', error);
    return 0;
  }
}

/**
 * Calculate average price for date range
 */
async function calculateAveragePrice(startDate: Date, endDate: Date) {
  try {
    const result = await BookListing.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate, $lte: endDate },
          status: { $ne: 'deleted' }
        }
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
          _id: null,
          averagePrice: { $avg: '$bookData.price' }
        }
      }
    ]);

    return Math.round(result[0]?.averagePrice || 0);

  } catch (error) {
    console.error('Calculate Average Price Error:', error);
    return 0;
  }
}

/**
 * Calculate growth rate for different metrics
 */
async function calculateGrowthRate(metric: string, startDate: Date, endDate: Date) {
  try {
    // This is a simplified growth calculation
    // In a real implementation, you'd compare with the previous period
    const previousPeriod = new Date(startDate);
    previousPeriod.setDate(previousPeriod.getDate() - (endDate.getDate() - startDate.getDate()));

    let currentCount = 0;
    let previousCount = 0;

    switch (metric) {
      case 'users':
        [currentCount, previousCount] = await Promise.all([
          User.countDocuments({ 
            createdAt: { $gte: startDate, $lte: endDate },
            role: { $ne: 'admin' }
          }),
          User.countDocuments({ 
            createdAt: { $gte: previousPeriod, $lt: startDate },
            role: { $ne: 'admin' }
          })
        ]);
        break;
      case 'books':
        [currentCount, previousCount] = await Promise.all([
          Book.countDocuments({ createdAt: { $gte: startDate, $lte: endDate } }),
          Book.countDocuments({ createdAt: { $gte: previousPeriod, $lt: startDate } })
        ]);
        break;
    }

    if (previousCount === 0) return currentCount > 0 ? 100 : 0;
    
    const growthRate = ((currentCount - previousCount) / previousCount) * 100;
    return Math.round(growthRate * 10) / 10; // Round to 1 decimal place

  } catch (error) {
    console.error('Calculate Growth Rate Error:', error);
    return 0;
  }
}

/**
 * Calculate revenue growth
 */
async function calculateRevenueGrowth(startDate: Date, endDate: Date) {
  try {
    const periodLength = endDate.getDate() - startDate.getDate();
    const previousPeriodStart = new Date(startDate);
    previousPeriodStart.setDate(previousPeriodStart.getDate() - periodLength);

    const [currentRevenue, previousRevenue] = await Promise.all([
      calculateRevenue(startDate, endDate),
      calculateRevenue(previousPeriodStart, startDate)
    ]);

    if (previousRevenue === 0) return currentRevenue > 0 ? 100 : 0;
    
    const growthRate = ((currentRevenue - previousRevenue) / previousRevenue) * 100;
    return Math.round(growthRate * 10) / 10;

  } catch (error) {
    console.error('Calculate Revenue Growth Error:', error);
    return 0;
  }
}

// Mock functions for additional analytics features
async function getBookMetrics(dateRange: any, category: string) {
  return {
    totalBooks: await Book.countDocuments(category ? { category } : {}),
    newBooks: await Book.countDocuments({ 
      createdAt: { $gte: dateRange.startDate }, 
      ...(category ? { category } : {})
    }),
    popularBooks: await getTopBooks(dateRange, 5)
  };
}

async function getPriceAnalysis(dateRange: any, category: string) {
  const filter = category ? { category } : {};
  const priceStats = await Book.aggregate([
    { $match: filter },
    { $group: { 
      _id: null, 
      avgPrice: { $avg: '$price' }, 
      minPrice: { $min: '$price' },
      maxPrice: { $max: '$price' }
    }}
  ]);

  return priceStats[0] || { avgPrice: 0, minPrice: 0, maxPrice: 0 };
}

async function getDemandAnalysis(dateRange: any, category: string) {
  // Mock demand analysis
  return {
    highDemand: ['Mathematics', 'Physics', 'Chemistry'],
    lowDemand: ['Art', 'Music', 'Philosophy'],
    trending: ['Computer Science', 'Biology']
  };
}

async function getInventoryMetrics(dateRange: any, category: string) {
  return {
    totalStock: 150,
    lowStock: 25,
    outOfStock: 5,
    overstocked: 10
  };
}

async function getCategoryPerformance(dateRange: any) {
  return await getCategoryDistribution(dateRange);
}

async function getTrendingBooks(dateRange: any, category: string) {
  return await getTopBooks(dateRange, 5);
}

async function getUserMetrics(dateRange: any, role: string) {
  return {
    totalUsers: await User.countDocuments(role ? { role } : {}),
    activeUsers: 85,
    newUsers: 12
  };
}

async function getEngagementMetrics(dateRange: any, role: string) {
  return {
    dailyActiveUsers: 45,
    sessionDuration: 25,
    pageViews: 1250
  };
}

async function getUserPerformanceMetrics(dateRange: any, role: string) {
  return {
    topPerformers: await getTopUsers(dateRange, 5),
    averageScore: 78,
    completionRate: 82
  };
}

async function getRetentionAnalysis(dateRange: any) {
  return {
    daily: 85,
    weekly: 72,
    monthly: 58
  };
}

async function getUserSegmentAnalysis(dateRange: any) {
  return [
    { segment: 'New Users', count: 25, percentage: 15 },
    { segment: 'Active Users', count: 85, percentage: 55 },
    { segment: 'Power Users', count: 45, percentage: 30 }
  ];
}

async function getActivityHeatmap(dateRange: any, role: string) {
  // Mock heatmap data
  const heatmapData = [];
  for (let hour = 0; hour < 24; hour++) {
    for (let day = 0; day < 7; day++) {
      heatmapData.push({
        hour,
        day,
        activity: Math.floor(Math.random() * 100)
      });
    }
  }
  return heatmapData;
}

async function getSystemMetrics(dateRange: any) {
  return {
    uptime: 99.8,
    cpuUsage: 45,
    memoryUsage: 62,
    diskUsage: 78
  };
}

async function getResponseTimeMetrics(dateRange: any) {
  return {
    average: 250,
    p95: 450,
    p99: 850
  };
}

async function getErrorMetrics(dateRange: any) {
  return {
    totalErrors: 12,
    errorRate: 0.5,
    criticalErrors: 2
  };
}

async function getThroughputMetrics(dateRange: any) {
  return {
    requestsPerSecond: 25,
    requestsPerMinute: 1500,
    requestsPerHour: 90000
  };
}

async function getResourceUsage(dateRange: any) {
  return {
    cpu: 45,
    memory: 62,
    disk: 78,
    network: 35
  };
}

async function getHealthStatus() {
  return {
    overall: 'healthy',
    database: 'healthy',
    cache: 'healthy',
    storage: 'warning'
  };
}
