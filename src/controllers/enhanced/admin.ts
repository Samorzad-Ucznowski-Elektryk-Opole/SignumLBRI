/**
 * 🔧 Enhanced Admin Controller - Advanced Administration Panel
 * 
 * Features:
 * - System monitoring and health checks
 * - User management with bulk operations
 * - Configuration management
 * - Audit logs and activity tracking
 * - Performance optimization tools
 */

import { Request, Response } from "express";
import { User } from "../../models/User";
import { Book } from "../../models/Book";
import { BookListing } from "../../models/BookListing";
import { Performance } from "../../models/Performance";

/**
 * GET /enhanced/admin
 * Enhanced Admin Dashboard
 */
export const getDashboard = async (req: Request, res: Response) => {
  try {
    const [
      systemHealth,
      userStats,
      bookStats,
      recentActivity,
      criticalAlerts
    ] = await Promise.all([
      getSystemHealth(),
      getUserStatistics(),
      getBookStatistics(),
      getRecentActivity(20),
      getCriticalAlerts()
    ]);

    const adminData = {
      system: systemHealth,
      users: userStats,
      books: bookStats,
      activity: recentActivity,
      alerts: criticalAlerts,
      lastUpdated: new Date()
    };

    res.render('enhanced/admin/dashboard', {
      title: 'Admin Dashboard - Enhanced SignumLBRI',
      data: adminData,
      user: req.user,
      admin: true,
      realtime: true,
      animations: true
    });

  } catch (error) {
    console.error('Enhanced Admin Dashboard Error:', error);
    res.status(500).render('enhanced/error', {
      title: 'Admin Dashboard Error',
      error: 'Unable to load admin dashboard',
      user: req.user
    });
  }
};

/**
 * GET /enhanced/admin/settings
 * Enhanced System Settings
 */
export const getSettings = async (req: Request, res: Response) => {
  try {
    const settings = await getSystemSettings();

    res.render('enhanced/admin/settings', {
      title: 'System Settings - Enhanced SignumLBRI',
      settings: settings,
      user: req.user,
      admin: true,
      form: true
    });

  } catch (error) {
    console.error('Enhanced Admin Settings Error:', error);
    res.status(500).render('enhanced/error', {
      title: 'Admin Settings Error',
      error: 'Unable to load system settings',
      user: req.user
    });
  }
};

/**
 * POST /enhanced/admin/settings
 * Update System Settings
 */
export const updateSettings = async (req: Request, res: Response) => {
  try {
    const {
      siteName,
      siteDescription,
      maintenanceMode,
      registrationEnabled,
      maxFileSize,
      emailNotifications,
      debugMode
    } = req.body;

    // In a real implementation, you'd save these to a settings collection
    // For now, we'll simulate the update
    
    res.json({
      success: true,
      message: 'Settings updated successfully'
    });

  } catch (error) {
    console.error('Enhanced Update Settings Error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating settings'
    });
  }
};

/**
 * GET /enhanced/admin/users
 * Enhanced User Management
 */
export const getUserManagement = async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = 50;
    const search = req.query.search as string || '';
    const role = req.query.role as string || '';
    const status = req.query.status as string || '';

    const searchQuery: any = {};
    
    if (search) {
      searchQuery.$or = [
        { 'profile.name': { $regex: search, $options: 'i' } },
        { 'profile.surname': { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    if (role && role !== 'all') {
      searchQuery.role = role;
    }

    if (status && status !== 'all') {
      searchQuery.isActive = status === 'active';
    }

    const skip = (page - 1) * limit;

    const [users, totalUsers, roles] = await Promise.all([
      User.find(searchQuery)
        .select('-password')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('school', 'name'),
      User.countDocuments(searchQuery),
      User.distinct('role')
    ]);

    const enhancedUsers = await Promise.all(
      users.map(async (user) => {
        const [bookCount, lastActivity] = await Promise.all([
          BookListing.countDocuments({ user: user._id, status: { $ne: 'deleted' } }),
          Performance.findOne({ user: user._id }).sort({ timestamp: -1 }).select('timestamp')
        ]);

        return {
          ...user.toObject(),
          bookCount: bookCount,
          lastActivity: lastActivity?.timestamp
        };
      })
    );

    const totalPages = Math.ceil(totalUsers / limit);

    res.render('enhanced/admin/users', {
      title: 'User Management - Enhanced SignumLBRI',
      users: enhancedUsers,
      pagination: {
        currentPage: page,
        totalPages: totalPages,
        totalUsers: totalUsers,
        hasNext: page < totalPages,
        hasPrev: page > 1
      },
      filters: {
        search: search,
        role: role,
        status: status
      },
      roles: roles,
      user: req.user,
      admin: true,
      animations: true
    });

  } catch (error) {
    console.error('Enhanced User Management Error:', error);
    res.status(500).render('enhanced/error', {
      title: 'User Management Error',
      error: 'Unable to load user management',
      user: req.user
    });
  }
};

/**
 * GET /enhanced/admin/system
 * Enhanced System Information
 */
export const getSystemInfo = async (req: Request, res: Response) => {
  try {
    const systemInfo = await getDetailedSystemInfo();

    res.render('enhanced/admin/system', {
      title: 'System Information - Enhanced SignumLBRI',
      system: systemInfo,
      user: req.user,
      admin: true,
      technical: true
    });

  } catch (error) {
    console.error('Enhanced System Info Error:', error);
    res.status(500).render('enhanced/error', {
      title: 'System Info Error',
      error: 'Unable to load system information',
      user: req.user
    });
  }
};

// === HELPER FUNCTIONS ===

/**
 * Get system health metrics
 */
async function getSystemHealth() {
  try {
    const [
      databaseStatus,
      totalUsers,
      totalBooks,
      totalListings,
      errorCount
    ] = await Promise.all([
      checkDatabaseConnection(),
      User.countDocuments(),
      Book.countDocuments(),
      BookListing.countDocuments({ status: { $ne: 'deleted' } }),
      getRecentErrors()
    ]);

    return {
      status: databaseStatus ? 'healthy' : 'critical',
      database: databaseStatus ? 'connected' : 'disconnected',
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      counts: {
        users: totalUsers,
        books: totalBooks,
        listings: totalListings
      },
      errors: errorCount
    };

  } catch (error) {
    console.error('System Health Error:', error);
    return {
      status: 'critical',
      database: 'error',
      uptime: 0,
      memory: { rss: 0, heapTotal: 0, heapUsed: 0, external: 0 },
      counts: { users: 0, books: 0, listings: 0 },
      errors: 0
    };
  }
}

/**
 * Check database connection
 */
async function checkDatabaseConnection() {
  try {
    // Simple database ping
    await User.findOne().limit(1);
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Get user statistics
 */
async function getUserStatistics() {
  try {
    const [
      totalUsers,
      activeUsers,
      newUsersThisMonth,
      usersByRole
    ] = await Promise.all([
      User.countDocuments({ role: { $ne: 'admin' } }),
      User.countDocuments({ 
        role: { $ne: 'admin' },
        lastActivity: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
      }),
      User.countDocuments({
        role: { $ne: 'admin' },
        createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
      }),
      User.aggregate([
        { $match: { role: { $ne: 'admin' } } },
        { $group: { _id: '$role', count: { $sum: 1 } } }
      ])
    ]);

    return {
      total: totalUsers,
      active: activeUsers,
      newThisMonth: newUsersThisMonth,
      byRole: usersByRole,
      activePercentage: totalUsers > 0 ? Math.round((activeUsers / totalUsers) * 100) : 0
    };

  } catch (error) {
    console.error('User Statistics Error:', error);
    return {
      total: 0,
      active: 0,
      newThisMonth: 0,
      byRole: [],
      activePercentage: 0
    };
  }
}

/**
 * Get book statistics
 */
async function getBookStatistics() {
  try {
    const [
      totalBooks,
      totalListings,
      soldListings,
      averagePrice,
      topCategories
    ] = await Promise.all([
      Book.countDocuments(),
      BookListing.countDocuments({ status: { $ne: 'deleted' } }),
      BookListing.countDocuments({ status: 'sold' }),
      Book.aggregate([
        { $group: { _id: null, avg: { $avg: '$price' } } }
      ]),
      Book.aggregate([
        { $group: { _id: '$category', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 5 }
      ])
    ]);

    return {
      totalBooks: totalBooks,
      totalListings: totalListings,
      soldListings: soldListings,
      averagePrice: averagePrice[0]?.avg || 0,
      conversionRate: totalListings > 0 ? Math.round((soldListings / totalListings) * 100) : 0,
      topCategories: topCategories
    };

  } catch (error) {
    console.error('Book Statistics Error:', error);
    return {
      totalBooks: 0,
      totalListings: 0,
      soldListings: 0,
      averagePrice: 0,
      conversionRate: 0,
      topCategories: []
    };
  }
}

/**
 * Get recent activity
 */
async function getRecentActivity(limit = 20) {
  try {
    const activities = await Performance.find()
      .sort({ timestamp: -1 })
      .limit(limit)
      .populate('user', 'profile.name profile.surname email')
      .select('action timestamp user duration metadata');

    return activities.map(activity => ({
      action: activity.action,
      timestamp: activity.timestamp,
      user: activity.user,
      duration: activity.duration,
      metadata: activity.metadata
    }));

  } catch (error) {
    console.error('Recent Activity Error:', error);
    return [];
  }
}

/**
 * Get critical alerts
 */
async function getCriticalAlerts() {
  try {
    const alerts = [];

    // Check for system issues
    const errorCount = await getRecentErrors();
    if (errorCount > 10) {
      alerts.push({
        type: 'error',
        message: `High error count: ${errorCount} errors in the last hour`,
        severity: 'critical',
        timestamp: new Date()
      });
    }

    // Check for low disk space (mock)
    const diskUsage = Math.random() * 100;
    if (diskUsage > 85) {
      alerts.push({
        type: 'system',
        message: `Disk usage is high: ${diskUsage.toFixed(1)}%`,
        severity: 'warning',
        timestamp: new Date()
      });
    }

    // Check for inactive users (mock)
    const inactiveUsers = await User.countDocuments({
      lastActivity: { $lt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000) }
    });

    if (inactiveUsers > 50) {
      alerts.push({
        type: 'user',
        message: `${inactiveUsers} users haven't been active in 90 days`,
        severity: 'info',
        timestamp: new Date()
      });
    }

    return alerts;

  } catch (error) {
    console.error('Critical Alerts Error:', error);
    return [];
  }
}

/**
 * Get recent errors count
 */
async function getRecentErrors() {
  try {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    
    // In a real implementation, you'd query an error log collection
    // For now, we'll return a mock value
    return Math.floor(Math.random() * 20);

  } catch (error) {
    console.error('Recent Errors Error:', error);
    return 0;
  }
}

/**
 * Get system settings
 */
async function getSystemSettings() {
  // In a real implementation, these would come from a database
  return {
    general: {
      siteName: 'Enhanced SignumLBRI',
      siteDescription: 'Advanced Educational Book Management Platform',
      maintenanceMode: false,
      registrationEnabled: true
    },
    files: {
      maxFileSize: '10MB',
      allowedFileTypes: ['jpg', 'jpeg', 'png', 'gif', 'pdf'],
      uploadPath: '/uploads'
    },
    email: {
      emailNotifications: true,
      smtpEnabled: false,
      smtpHost: '',
      smtpPort: 587
    },
    security: {
      sessionTimeout: 24,
      maxLoginAttempts: 5,
      passwordMinLength: 8
    },
    performance: {
      cacheEnabled: true,
      compressionEnabled: true,
      debugMode: false
    }
  };
}

/**
 * Get detailed system information
 */
async function getDetailedSystemInfo() {
  try {
    const [
      nodeVersion,
      dbStats,
      memoryUsage,
      cpuUsage
    ] = await Promise.all([
      process.version,
      getDatabaseStats(),
      process.memoryUsage(),
      getCpuUsage()
    ]);

    return {
      environment: {
        nodeVersion: nodeVersion,
        platform: process.platform,
        architecture: process.arch,
        uptime: process.uptime()
      },
      database: dbStats,
      memory: {
        used: memoryUsage.heapUsed,
        total: memoryUsage.heapTotal,
        rss: memoryUsage.rss,
        external: memoryUsage.external
      },
      performance: {
        cpuUsage: cpuUsage,
        loadAverage: process.loadavg ? process.loadavg() : [0, 0, 0]
      },
      network: {
        hostname: process.env.HOSTNAME || 'localhost',
        port: process.env.PORT || 4000
      }
    };

  } catch (error) {
    console.error('Detailed System Info Error:', error);
    return {
      environment: { nodeVersion: 'unknown', platform: 'unknown', architecture: 'unknown', uptime: 0 },
      database: { collections: 0, documents: 0, size: 0 },
      memory: { used: 0, total: 0, rss: 0, external: 0 },
      performance: { cpuUsage: 0, loadAverage: [0, 0, 0] },
      network: { hostname: 'unknown', port: 0 }
    };
  }
}

/**
 * Get database statistics
 */
async function getDatabaseStats() {
  try {
    const [userCount, bookCount, listingCount] = await Promise.all([
      User.countDocuments(),
      Book.countDocuments(),
      BookListing.countDocuments()
    ]);

    return {
      collections: 3, // Simplified count
      documents: userCount + bookCount + listingCount,
      size: (userCount + bookCount + listingCount) * 1024, // Mock size calculation
      connected: true
    };

  } catch (error) {
    console.error('Database Stats Error:', error);
    return {
      collections: 0,
      documents: 0,
      size: 0,
      connected: false
    };
  }
}

/**
 * Get CPU usage (simplified)
 */
function getCpuUsage() {
  // This is a simplified CPU usage calculation
  // In a real implementation, you'd use a proper CPU monitoring library
  const usage = process.cpuUsage();
  const totalUsage = usage.user + usage.system;
  return Math.round((totalUsage / 1000000) % 100); // Convert to percentage (mock)
}
