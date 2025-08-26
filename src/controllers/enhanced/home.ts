/**
 * 🏠 Enhanced Home Controller - Modern Dashboard & Landing Pages
 * 
 * Features:
 * - Interactive dashboard with real-time statistics
 * - Modern glassmorphism design
 * - Responsive animations
 * - Multi-language support
 * - PWA capabilities
 */

import { Request, Response } from "express";
import { User } from "../../models/User";
import { Book } from "../../models/Book";
import { BookListing } from "../../models/BookListing";
import { Performance } from "../../models/Performance";

/**
 * GET /enhanced
 * Enhanced Dashboard - Main landing page for authenticated users
 */
export const getDashboard = async (req: Request, res: Response) => {
  try {
    // Gather enhanced statistics
    const [
      totalBooks,
      totalUsers,
      recentBooks,
      topPerformers,
      monthlyStats,
      userActivity
    ] = await Promise.all([
      BookListing.countDocuments({ status: { $ne: 'deleted' } }),
      User.countDocuments({ role: { $ne: 'admin' } }),
      BookListing.find({ status: 'registered' })
        .sort({ createdAt: -1 })
        .limit(5)
        .populate('book')
        .populate('user'),
      User.find({ role: 'student' })
        .sort({ 'statistics.earnings': -1 })
        .limit(5)
        .select('profile.name profile.surname statistics'),
      getMonthlyStatistics(),
      getRecentActivity()
    ]);

    const dashboardData = {
      stats: {
        totalBooks: totalBooks || 0,
        totalUsers: totalUsers || 0,
        totalEarnings: await calculateTotalEarnings(),
        activeListings: await BookListing.countDocuments({ status: 'registered' }),
        soldBooks: await BookListing.countDocuments({ status: 'sold' }),
        averagePrice: await calculateAveragePrice()
      },
      recentBooks: recentBooks || [],
      topPerformers: topPerformers || [],
      monthlyStats: monthlyStats || [],
      userActivity: userActivity || [],
      trends: await calculateTrends()
    };

    res.render('enhanced/dashboard', {
      title: 'Enhanced Dashboard - SignumLBRI',
      user: req.user,
      data: dashboardData,
      animations: true,
      modernUI: true
    });

  } catch (error) {
    console.error('Enhanced Dashboard Error:', error);
    res.status(500).render('enhanced/error', {
      title: 'Dashboard Error',
      error: 'Unable to load dashboard data',
      user: req.user
    });
  }
};

/**
 * GET /enhanced/welcome
 * Enhanced Welcome Page - For new users and feature showcase
 */
export const getWelcome = async (req: Request, res: Response) => {
  try {
    const welcomeData = {
      features: [
        {
          icon: 'fa-solid fa-wand-magic-sparkles',
          title: 'Modern Interface',
          description: 'Beautiful glassmorphism design with smooth animations',
          color: 'from-blue-500 to-purple-600'
        },
        {
          icon: 'fa-solid fa-chart-line',
          title: 'Advanced Analytics',
          description: 'Real-time insights and performance tracking',
          color: 'from-green-500 to-blue-600'
        },
        {
          icon: 'fa-solid fa-mobile-alt',
          title: 'Mobile First',
          description: 'Optimized for all devices with PWA support',
          color: 'from-purple-500 to-pink-600'
        },
        {
          icon: 'fa-solid fa-search',
          title: 'Smart Search',
          description: 'AI-powered search with advanced filtering',
          color: 'from-orange-500 to-red-600'
        },
        {
          icon: 'fa-solid fa-users',
          title: 'User Management',
          description: 'Comprehensive user profiles and role management',
          color: 'from-teal-500 to-green-600'
        },
        {
          icon: 'fa-solid fa-shield-alt',
          title: 'Secure & Fast',
          description: 'Enterprise-grade security with optimal performance',
          color: 'from-indigo-500 to-blue-600'
        }
      ],
      statistics: await getWelcomeStatistics()
    };

    res.render('enhanced/welcome', {
      title: 'Welcome to Enhanced SignumLBRI',
      user: req.user,
      data: welcomeData,
      animations: true,
      hero: true
    });

  } catch (error) {
    console.error('Enhanced Welcome Error:', error);
    res.status(500).render('enhanced/error', {
      title: 'Welcome Error',
      error: 'Unable to load welcome page',
      user: req.user
    });
  }
};

/**
 * GET /enhanced/features
 * Enhanced Features Showcase
 */
export const getFeatures = async (req: Request, res: Response) => {
  try {
    const featuresData = {
      categories: [
        {
          name: 'User Interface',
          icon: 'fa-solid fa-paint-brush',
          features: [
            'Glassmorphism Design System',
            'Dark/Light Theme Support',
            'Responsive Layout',
            'Micro-interactions',
            'Advanced Animations'
          ]
        },
        {
          name: 'Book Management',
          icon: 'fa-solid fa-books',
          features: [
            'Smart Book Catalog',
            'Advanced Search & Filters',
            'Bulk Operations',
            'Price Analytics',
            'Inventory Tracking'
          ]
        },
        {
          name: 'Analytics & Reporting',
          icon: 'fa-solid fa-chart-bar',
          features: [
            'Real-time Dashboards',
            'Performance Metrics',
            'User Analytics',
            'Sales Reports',
            'Trend Analysis'
          ]
        },
        {
          name: 'User Experience',
          icon: 'fa-solid fa-user-friends',
          features: [
            'Role-based Access',
            'Profile Management',
            'Activity Tracking',
            'Notification System',
            'Multi-language Support'
          ]
        }
      ],
      roadmap: [
        {
          quarter: 'Q1 2025',
          features: ['AI-powered Recommendations', 'Advanced Search', 'PWA Support']
        },
        {
          quarter: 'Q2 2025',
          features: ['Real-time Collaboration', 'Advanced Analytics', 'Mobile App']
        },
        {
          quarter: 'Q3 2025',
          features: ['AI Chatbot', 'Advanced Automation', 'Third-party Integrations']
        }
      ]
    };

    res.render('enhanced/features', {
      title: 'Features - Enhanced SignumLBRI',
      user: req.user,
      data: featuresData,
      animations: true
    });

  } catch (error) {
    console.error('Enhanced Features Error:', error);
    res.status(500).render('enhanced/error', {
      title: 'Features Error',
      error: 'Unable to load features page',
      user: req.user
    });
  }
};

// === HELPER FUNCTIONS ===

/**
 * Calculate monthly statistics for dashboard
 */
async function getMonthlyStatistics() {
  try {
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const monthlyData = await BookListing.aggregate([
      {
        $match: {
          createdAt: { $gte: sixMonthsAgo },
          status: { $ne: 'deleted' }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          count: { $sum: 1 },
          earnings: { 
            $sum: { 
              $cond: [
                { $eq: ['$status', 'sold'] },
                '$book.price',
                0
              ]
            }
          }
        }
      },
      {
        $sort: { '_id.year': 1, '_id.month': 1 }
      }
    ]);

    return monthlyData.map(item => ({
      month: `${item._id.year}-${item._id.month.toString().padStart(2, '0')}`,
      books: item.count,
      earnings: item.earnings || 0
    }));

  } catch (error) {
    console.error('Monthly Statistics Error:', error);
    return [];
  }
}

/**
 * Get recent user activity
 */
async function getRecentActivity() {
  try {
    const recentActivity = await Performance.find()
      .sort({ timestamp: -1 })
      .limit(10)
      .populate('user', 'profile.name profile.surname')
      .select('action timestamp user duration');

    return recentActivity.map(activity => ({
      user: activity.user,
      action: activity.action,
      timestamp: activity.timestamp,
      duration: activity.duration
    }));

  } catch (error) {
    console.error('Recent Activity Error:', error);
    return [];
  }
}

/**
 * Calculate total earnings
 */
async function calculateTotalEarnings() {
  try {
    const result = await BookListing.aggregate([
      {
        $match: { status: 'sold' }
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
          total: { $sum: '$bookData.price' }
        }
      }
    ]);

    return result[0]?.total || 0;

  } catch (error) {
    console.error('Calculate Earnings Error:', error);
    return 0;
  }
}

/**
 * Calculate average book price
 */
async function calculateAveragePrice() {
  try {
    const result = await Book.aggregate([
      {
        $group: {
          _id: null,
          averagePrice: { $avg: '$price' }
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
 * Calculate trends for dashboard
 */
async function calculateTrends() {
  try {
    const now = new Date();
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [thisMonthData, lastMonthData] = await Promise.all([
      BookListing.countDocuments({ 
        createdAt: { $gte: thisMonth },
        status: { $ne: 'deleted' }
      }),
      BookListing.countDocuments({ 
        createdAt: { $gte: lastMonth, $lt: thisMonth },
        status: { $ne: 'deleted' }
      })
    ]);

    const booksTrend = lastMonthData > 0 
      ? ((thisMonthData - lastMonthData) / lastMonthData * 100).toFixed(1)
      : '0';

    return {
      books: {
        current: thisMonthData,
        previous: lastMonthData,
        trend: parseFloat(booksTrend),
        direction: parseFloat(booksTrend) >= 0 ? 'up' : 'down'
      }
    };

  } catch (error) {
    console.error('Calculate Trends Error:', error);
    return { books: { current: 0, previous: 0, trend: 0, direction: 'up' } };
  }
}

/**
 * Get statistics for welcome page
 */
async function getWelcomeStatistics() {
  try {
    const [totalBooks, totalUsers, totalSchools] = await Promise.all([
      Book.countDocuments(),
      User.countDocuments(),
      User.distinct('school').then(schools => schools.length)
    ]);

    return {
      totalBooks: totalBooks || 0,
      totalUsers: totalUsers || 0,
      totalSchools: totalSchools || 0,
      satisfaction: 98.5 // Mock data for demo
    };

  } catch (error) {
    console.error('Welcome Statistics Error:', error);
    return {
      totalBooks: 0,
      totalUsers: 0,
      totalSchools: 0,
      satisfaction: 98.5
    };
  }
}
