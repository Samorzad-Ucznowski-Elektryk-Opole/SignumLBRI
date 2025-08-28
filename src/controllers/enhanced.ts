/**
 * Enhanced Controller
 * Kontroler dla zaawansowanych funkcji UI
 */

import { Request, Response } from 'express';

/**
 * Enhanced dashboard
 */
export const dashboard = async (req: Request, res: Response): Promise<void> => {
  try {
    res.render('enhanced/dashboard', {
      title: 'Enhanced Dashboard',
      user: req.user,
      lang: (req as any).language || 'pl'
    });
  } catch (error) {
    console.error('Enhanced dashboard error:', error);
    res.status(500).render('enhanced/error', {
      title: 'Error',
      error: { message: 'Internal server error' },
      user: req.user,
      lang: (req as any).language || 'pl'
    });
  }
};

/**
 * Enhanced books view
 */
export const books = async (req: Request, res: Response): Promise<void> => {
  try {
    res.render('enhanced/books', {
      title: 'Books - Enhanced View',
      user: req.user,
      lang: (req as any).language || 'pl'
    });
  } catch (error) {
    console.error('Enhanced books error:', error);
    res.status(500).render('enhanced/error', {
      title: 'Error',
      error: { message: 'Internal server error' },
      user: req.user,
      lang: (req as any).language || 'pl'
    });
  }
};
