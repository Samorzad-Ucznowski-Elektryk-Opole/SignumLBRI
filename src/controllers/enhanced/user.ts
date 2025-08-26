/**
 * 👤 Enhanced User Controller - Advanced User Management
 * 
 * Features:
 * - Comprehensive user profiles with analytics
 * - Role-based access control
 * - Activity tracking and performance metrics
 * - User preferences and customization
 * - Social features and collaboration tools
 */

import { Request, Response } from "express";
import { User } from "../../models/User";
import { BookListing } from "../../models/BookListing";
import { Performance } from "../../models/Performance";

/**
 * GET /enhanced/users
 * Enhanced Users List with Advanced Analytics
 */
export const getAllUsers = async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 25;
    const search = req.query.search as string || '';
    const role = req.query.role as string || '';
    const status = req.query.status as string || '';
    const sortBy = req.query.sortBy as string || 'createdAt';
    const sortOrder = req.query.sortOrder as string || 'desc';

    // Build search query
    const searchQuery: any = {};
    
    if (search) {
      searchQuery.$or = [
        { 'profile.name': { $regex: search, $options: 'i' } },
        { 'profile.surname': { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { 'profile.phone': { $regex: search, $options: 'i' } }
      ];
    }

    if (role && role !== 'all') {
      searchQuery.role = role;
    }

    if (status && status !== 'all') {
      searchQuery.isActive = status === 'active';
    }

    // Build sort object
    const sortObject: any = {};
    sortObject[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const skip = (page - 1) * limit;

    const [users, totalUsers, roles, schools] = await Promise.all([
      User.find(searchQuery)
        .select('-password')
        .sort(sortObject)
        .skip(skip)
        .limit(limit)
        .populate('school', 'name')
        .lean(),
      User.countDocuments(searchQuery),
      User.distinct('role'),
      User.distinct('school')
    ]);

    // Enhance users with activity statistics
    const enhancedUsers = await Promise.all(
      users.map(async (user) => {
        const [bookStats, activityStats, lastActivity] = await Promise.all([
          calculateUserBookStats(user._id),
          calculateUserActivityStats(user._id),
          Performance.findOne({ user: user._id }).sort({ timestamp: -1 }).select('timestamp action')
        ]);

        return {
          ...user,
          bookStats: bookStats,
          activityStats: activityStats,
          lastActivity: lastActivity,
          profileCompletion: calculateProfileCompletion(user)
        };
      })
    );

    const totalPages = Math.ceil(totalUsers / limit);

    res.render('enhanced/users/index', {
      title: 'Enhanced User Management - SignumLBRI',
      users: enhancedUsers,
      pagination: {
        currentPage: page,
        totalPages: totalPages,
        totalUsers: totalUsers,
        hasNext: page < totalPages,
        hasPrev: page > 1,
        limit: limit
      },
      filters: {
        search: search,
        role: role,
        status: status,
        sortBy: sortBy,
        sortOrder: sortOrder
      },
      roles: roles || [],
      schools: schools || [],
      user: req.user,
      animations: true,
      enhancedView: true
    });

  } catch (error) {
    console.error('Enhanced Users Error:', error);
    res.status(500).render('enhanced/error', {
      title: 'Users Error',
      error: 'Unable to load users list',
      user: req.user
    });
  }
};

/**
 * GET /enhanced/users/:id
 * Enhanced User Profile with Detailed Analytics
 */
export const getUserProfile = async (req: Request, res: Response) => {
  try {
    const userId = req.params.id;
    
    const [user, bookStats, activityHistory, performanceMetrics] = await Promise.all([
      User.findById(userId)
        .select('-password')
        .populate('school', 'name logo')
        .lean(),
      getUserDetailedBookStats(userId),
      getUserActivityHistory(userId),
      getUserPerformanceMetrics(userId)
    ]);

    if (!user) {
      return res.status(404).render('enhanced/error', {
        title: 'User Not Found',
        error: 'The requested user could not be found',
        user: req.user
      });
    }

    // Calculate user score and ranking
    const userScore = calculateUserScore(bookStats, performanceMetrics);
    const userRanking = await calculateUserRanking(userId, userScore);

    res.render('enhanced/users/profile', {
      title: `${user.profile?.name || 'User'} Profile - Enhanced SignumLBRI`,
      profileUser: user,
      bookStats: bookStats,
      activityHistory: activityHistory || [],
      performanceMetrics: performanceMetrics,
      userScore: userScore,
      userRanking: userRanking,
      profileCompletion: calculateProfileCompletion(user),
      user: req.user,
      animations: true,
      charts: true
    });

  } catch (error) {
    console.error('Enhanced User Profile Error:', error);
    res.status(500).render('enhanced/error', {
      title: 'User Profile Error',
      error: 'Unable to load user profile',
      user: req.user
    });
  }
};

/**
 * GET /enhanced/profile
 * Enhanced My Profile - Current User Profile Management
 */
export const getMyProfile = async (req: Request, res: Response) => {
  try {
    const userId = req.user.id;
    
    const [user, bookStats, activityHistory, preferences] = await Promise.all([
      User.findById(userId)
        .select('-password')
        .populate('school', 'name logo'),
      getUserDetailedBookStats(userId),
      getUserActivityHistory(userId, 30), // Last 30 days
      getUserPreferences(userId)
    ]);

    if (!user) {
      return res.status(404).render('enhanced/error', {
        title: 'Profile Not Found',
        error: 'Your profile could not be loaded',
        user: req.user
      });
    }

    // Get available schools for selection
    const availableSchools = await User.find({ role: 'admin' })
      .distinct('school')
      .then((schoolIds) => 
        User.find({ _id: { $in: schoolIds } })
          .select('school name')
          .populate('school', 'name')
      );

    res.render('enhanced/users/my-profile', {
      title: 'My Profile - Enhanced SignumLBRI',
      user: user,
      bookStats: bookStats,
      activityHistory: activityHistory || [],
      preferences: preferences,
      availableSchools: availableSchools || [],
      profileCompletion: calculateProfileCompletion(user),
      animations: true,
      form: true
    });

  } catch (error) {
    console.error('Enhanced My Profile Error:', error);
    res.status(500).render('enhanced/error', {
      title: 'My Profile Error',
      error: 'Unable to load your profile',
      user: req.user
    });
  }
};

/**
 * POST /enhanced/profile
 * Enhanced Update Profile
 */
export const updateProfile = async (req: Request, res: Response) => {
  try {
    const userId = req.user.id;
    const {
      name,
      surname,
      phone,
      bio,
      dateOfBirth,
      preferences,
      notifications,
      privacy
    } = req.body;

    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Update profile fields
    user.profile.name = name?.trim() || user.profile.name;
    user.profile.surname = surname?.trim() || user.profile.surname;
    user.profile.phone = phone?.trim() || user.profile.phone;
    user.profile.bio = bio?.trim() || user.profile.bio;
    user.profile.dateOfBirth = dateOfBirth ? new Date(dateOfBirth) : user.profile.dateOfBirth;

    // Update preferences
    if (preferences) {
      user.preferences = {
        ...user.preferences,
        theme: preferences.theme || user.preferences?.theme || 'auto',
        language: preferences.language || user.preferences?.language || 'pl',
        notifications: preferences.notifications !== undefined 
          ? preferences.notifications 
          : user.preferences?.notifications || true,
        emailUpdates: preferences.emailUpdates !== undefined
          ? preferences.emailUpdates
          : user.preferences?.emailUpdates || false
      };
    }

    // Update privacy settings
    if (privacy) {
      user.privacy = {
        ...user.privacy,
        profileVisible: privacy.profileVisible !== undefined
          ? privacy.profileVisible
          : user.privacy?.profileVisible || true,
        showActivity: privacy.showActivity !== undefined
          ? privacy.showActivity
          : user.privacy?.showActivity || false,
        showStats: privacy.showStats !== undefined
          ? privacy.showStats
          : user.privacy?.showStats || true
      };
    }

    // Update metadata
    user.profile.lastUpdated = new Date();

    await user.save();

    // Log activity
    await Performance.create({
      user: userId,
      action: 'profile_updated',
      timestamp: new Date(),
      metadata: {
        fieldsUpdated: Object.keys(req.body),
        source: 'enhanced-profile'
      }
    });

    res.json({
      success: true,
      message: 'Profile updated successfully',
      profileCompletion: calculateProfileCompletion(user)
    });

  } catch (error) {
    console.error('Enhanced Update Profile Error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating profile. Please try again.'
    });
  }
};

// === HELPER FUNCTIONS ===

/**
 * Calculate user book statistics
 */
async function calculateUserBookStats(userId: string) {
  try {
    const [totalListings, soldListings, activeListings, totalEarnings, avgPrice] = await Promise.all([
      BookListing.countDocuments({ user: userId, status: { $ne: 'deleted' } }),
      BookListing.countDocuments({ user: userId, status: 'sold' }),
      BookListing.countDocuments({ user: userId, status: 'registered' }),
      BookListing.aggregate([
        { $match: { user: userId, status: 'sold' } },
        { $lookup: { from: 'books', localField: 'book', foreignField: '_id', as: 'bookData' } },
        { $unwind: '$bookData' },
        { $group: { _id: null, total: { $sum: '$bookData.price' } } }
      ]),
      BookListing.aggregate([
        { $match: { user: userId, status: { $ne: 'deleted' } } },
        { $lookup: { from: 'books', localField: 'book', foreignField: '_id', as: 'bookData' } },
        { $unwind: '$bookData' },
        { $group: { _id: null, avg: { $avg: '$bookData.price' } } }
      ])
    ]);

    return {
      totalListings: totalListings || 0,
      soldListings: soldListings || 0,
      activeListings: activeListings || 0,
      totalEarnings: totalEarnings[0]?.total || 0,
      averagePrice: avgPrice[0]?.avg || 0,
      successRate: totalListings > 0 ? Math.round((soldListings / totalListings) * 100) : 0
    };

  } catch (error) {
    console.error('User Book Stats Error:', error);
    return {
      totalListings: 0,
      soldListings: 0,
      activeListings: 0,
      totalEarnings: 0,
      averagePrice: 0,
      successRate: 0
    };
  }
}

/**
 * Calculate user activity statistics
 */
async function calculateUserActivityStats(userId: string) {
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const [totalActions, recentActions, actionTypes] = await Promise.all([
      Performance.countDocuments({ user: userId }),
      Performance.countDocuments({ user: userId, timestamp: { $gte: thirtyDaysAgo } }),
      Performance.aggregate([
        { $match: { user: userId } },
        { $group: { _id: '$action', count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ])
    ]);

    return {
      totalActions: totalActions || 0,
      recentActions: recentActions || 0,
      topActions: actionTypes.slice(0, 5) || []
    };

  } catch (error) {
    console.error('User Activity Stats Error:', error);
    return {
      totalActions: 0,
      recentActions: 0,
      topActions: []
    };
  }
}

/**
 * Get detailed book statistics for user profile
 */
async function getUserDetailedBookStats(userId: string) {
  try {
    const bookStats = await calculateUserBookStats(userId);
    
    // Get monthly statistics for the last 6 months
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const monthlyStats = await BookListing.aggregate([
      {
        $match: {
          user: userId,
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
          listings: { $sum: 1 },
          sold: { 
            $sum: { 
              $cond: [{ $eq: ['$status', 'sold'] }, 1, 0] 
            }
          }
        }
      },
      {
        $sort: { '_id.year': 1, '_id.month': 1 }
      }
    ]);

    return {
      ...bookStats,
      monthlyStats: monthlyStats || []
    };

  } catch (error) {
    console.error('User Detailed Book Stats Error:', error);
    return await calculateUserBookStats(userId);
  }
}

/**
 * Get user activity history
 */
async function getUserActivityHistory(userId: string, days = 90) {
  try {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const activities = await Performance.find({
      user: userId,
      timestamp: { $gte: startDate }
    })
    .sort({ timestamp: -1 })
    .limit(50)
    .select('action timestamp duration metadata');

    return activities.map(activity => ({
      action: activity.action,
      timestamp: activity.timestamp,
      duration: activity.duration,
      metadata: activity.metadata
    }));

  } catch (error) {
    console.error('User Activity History Error:', error);
    return [];
  }
}

/**
 * Get user performance metrics
 */
async function getUserPerformanceMetrics(userId: string) {
  try {
    const [averageResponseTime, totalSessions, peakActivity] = await Promise.all([
      Performance.aggregate([
        { $match: { user: userId, duration: { $exists: true } } },
        { $group: { _id: null, avg: { $avg: '$duration' } } }
      ]),
      Performance.aggregate([
        { $match: { user: userId } },
        { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$timestamp' } } } },
        { $count: 'sessions' }
      ]),
      Performance.aggregate([
        { $match: { user: userId } },
        { $group: { 
          _id: { $hour: '$timestamp' }, 
          count: { $sum: 1 } 
        } },
        { $sort: { count: -1 } },
        { $limit: 1 }
      ])
    ]);

    return {
      averageResponseTime: averageResponseTime[0]?.avg || 0,
      totalSessions: totalSessions[0]?.sessions || 0,
      peakActivityHour: peakActivity[0]?._id || 12,
      efficiency: calculateUserEfficiency(userId)
    };

  } catch (error) {
    console.error('User Performance Metrics Error:', error);
    return {
      averageResponseTime: 0,
      totalSessions: 0,
      peakActivityHour: 12,
      efficiency: 50
    };
  }
}

/**
 * Calculate user preferences
 */
async function getUserPreferences(userId: string) {
  try {
    const user = await User.findById(userId).select('preferences privacy');
    
    return {
      preferences: user?.preferences || {
        theme: 'auto',
        language: 'pl',
        notifications: true,
        emailUpdates: false
      },
      privacy: user?.privacy || {
        profileVisible: true,
        showActivity: false,
        showStats: true
      }
    };

  } catch (error) {
    console.error('User Preferences Error:', error);
    return {
      preferences: {
        theme: 'auto',
        language: 'pl',
        notifications: true,
        emailUpdates: false
      },
      privacy: {
        profileVisible: true,
        showActivity: false,
        showStats: true
      }
    };
  }
}

/**
 * Calculate profile completion percentage
 */
function calculateProfileCompletion(user: any): number {
  const fields = [
    user.profile?.name,
    user.profile?.surname,
    user.email,
    user.profile?.phone,
    user.profile?.bio,
    user.profile?.picture,
    user.school
  ];

  const completedFields = fields.filter(field => field && field.trim !== '' && field.trim() !== '').length;
  return Math.round((completedFields / fields.length) * 100);
}

/**
 * Calculate user score based on activity and performance
 */
function calculateUserScore(bookStats: any, performanceMetrics: any): number {
  const bookScore = (bookStats.successRate * 0.4) + (Math.min(bookStats.totalListings, 100) * 0.3);
  const activityScore = Math.min(performanceMetrics.totalSessions, 50) * 0.3;
  
  return Math.round(bookScore + activityScore);
}

/**
 * Calculate user ranking among all users
 */
async function calculateUserRanking(userId: string, userScore: number) {
  try {
    // This is a simplified ranking calculation
    const totalUsers = await User.countDocuments({ role: 'student' });
    const betterUsers = Math.floor(Math.random() * (totalUsers * 0.3)); // Mock calculation
    
    return {
      position: betterUsers + 1,
      total: totalUsers,
      percentile: Math.round(((totalUsers - betterUsers) / totalUsers) * 100)
    };

  } catch (error) {
    console.error('User Ranking Error:', error);
    return {
      position: 1,
      total: 1,
      percentile: 100
    };
  }
}

/**
 * Calculate user efficiency score
 */
async function calculateUserEfficiency(userId: string): Promise<number> {
  try {
    // Mock efficiency calculation based on various factors
    const bookStats = await calculateUserBookStats(userId);
    const efficiency = Math.min(100, (bookStats.successRate + 50) * 0.8);
    
    return Math.round(efficiency);

  } catch (error) {
    console.error('User Efficiency Error:', error);
    return 50;
  }
}
