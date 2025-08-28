/**
 * API Controller
 * Kontroler odpowiedzialny za obsługę API endpoints
 */

import { Request, Response } from 'express';
import { Book } from '../models/Book';
import mongoose from 'mongoose';

/**
 * Search books API endpoint
 */
export const searchBooks = async (req: Request, res: Response): Promise<void> => {
  try {
    const { q, limit = 20, page = 1 } = req.query;
    
    if (!q || typeof q !== 'string') {
      res.status(400).json({
        success: false,
        error: 'Search query is required'
      });
      return;
    }

    const searchRegex = new RegExp(q, 'i');
    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

    const books = await Book.find({
      $or: [
        { title: searchRegex },
        { author: searchRegex },
        { publisher: searchRegex },
        { isbn: searchRegex }
      ]
    })
    .limit(parseInt(limit as string))
    .skip(skip)
    .sort({ createdAt: -1 });

    const total = await Book.countDocuments({
      $or: [
        { title: searchRegex },
        { author: searchRegex },
        { publisher: searchRegex },
        { isbn: searchRegex }
      ]
    });

    res.json({
      success: true,
      data: {
        books,
        pagination: {
          page: parseInt(page as string),
          limit: parseInt(limit as string),
          total,
          totalPages: Math.ceil(total / parseInt(limit as string))
        }
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('API searchBooks error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

/**
 * Get single book API endpoint
 */
export const getBook = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({
        success: false,
        error: 'Invalid book ID'
      });
      return;
    }

    const book = await Book.findById(id);

    if (!book) {
      res.status(404).json({
        success: false,
        error: 'Book not found'
      });
      return;
    }

    res.json({
      success: true,
      data: { book },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('API getBook error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

/**
 * Get application statistics
 */
export const getStatistics = async (req: Request, res: Response): Promise<void> => {
  try {
    const [totalBooks, totalUsers, totalListings] = await Promise.all([
      Book.countDocuments(),
      mongoose.model('User').countDocuments ? mongoose.model('User').countDocuments() : 0,
      mongoose.model('BookListing').countDocuments ? mongoose.model('BookListing').countDocuments() : 0
    ]);

    const recentBooks = await Book.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .select('title author publisher createdAt');

    res.json({
      success: true,
      data: {
        statistics: {
          totalBooks,
          totalUsers,
          totalListings
        },
        recentBooks,
        systemInfo: {
          uptime: process.uptime(),
          memory: process.memoryUsage(),
          nodeVersion: process.version,
          environment: process.env.NODE_ENV || 'development'
        }
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('API getStatistics error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};
