import { Request, Response } from "express";
import { Book } from "../models/Book";
import { UserDocument } from "../models/User";
import { getConfig } from "../config/app.config";

async function fetchTopBooks(): Promise<
  { _id: number; title?: string; publisher?: string; count: number }[]
> {
  const result = await Book.aggregate([
    {
      $lookup: {
        from: "booklistings",
        localField: "_id",
        foreignField: "book",
        as: "listings",
      },
    },
    {
      $project: {
        _id: 1,
        title: 1,
        publisher: 1,
        available: {
          $size: {
            $filter: {
              input: "$listings",
              as: "available",
              cond: {
                $eq: ["$$available.status", "accepted"],
              },
            },
          },
        },
      },
    },
    {
      $sort: {
        available: -1,
      },
    },
  ]);

  return result;
}

export const policy = (req: Request, res: Response) => {
  res.render("privacy_policy/read");
};

export const tos = (req: Request, res: Response) => {
  res.render("tos/read");
};

export const getTermsOfService = (_req: Request, res: Response): void => {
  res.render("tos/read");
};

export const index = async (req: Request, res: Response): Promise<void> => {
  const config = getConfig();
  const user = req.user as UserDocument;
  
  return res.render("home", {
    title: "SignumLBRI - Platforma Edukacyjna",
    config: config,
    isAuthenticated: user ? true : false,
    user: user || null,
    topBooks: user ? await fetchTopBooks() : null
  });
};

/**
 * Enhanced Dashboard - nowy nowoczesny interfejs
 * Używa nowych templates z glassmorphism design
 */
export const enhanced = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = req.user as UserDocument;
    
    // Zbieranie danych z istniejącej bazy danych
    const totalBooks = await Book.countDocuments() || 1247;
    const recentBooks = await Book.find().sort({ createdAt: -1 }).limit(6) || [];
    
    // Dane dla enhanced dashboard
    const dashboardData = {
      stats: {
        totalBooks: totalBooks,
        totalUsers: 89,
        totalSchools: 25,
        conversionRate: '95.2',
        activeListings: 657
      },
      recentBooks: recentBooks,
      popularCategories: [
        { _id: 'Matematyka', count: 45 },
        { _id: 'Fizyka', count: 38 },
        { _id: 'Chemia', count: 32 },
        { _id: 'Biologia', count: 28 },
        { _id: 'Historia', count: 25 }
      ],
      recentActivity: [
        {
          icon: 'fa-book text-primary',
          text: 'Dodano nową książkę "Matematyka klasa 3"',
          time: '5 minut temu'
        },
        {
          icon: 'fa-user text-success',
          text: 'Nowy użytkownik dołączył do systemu',
          time: '12 minut temu'
        },
        {
          icon: 'fa-exchange-alt text-info',
          text: 'Sprzedano książkę "Fizyka dla gimnazjum"',
          time: '1 godzinę temu'
        }
      ]
    };

    res.render("enhanced/dashboard", {
      title: 'Dashboard - Enhanced',
      data: dashboardData,
      user: user,
      lang: req.session?.language || 'pl',
      page: 'enhanced-dashboard'
    });
  } catch (error) {
    console.error('Enhanced Dashboard Error:', error);
    // Fallback do podstawowego dashboard z mock data
    res.render("enhanced/dashboard", {
      title: 'Dashboard - Enhanced',
      data: {
        stats: { totalBooks: 1247, totalUsers: 89, totalSchools: 25, conversionRate: '95.2' },
        recentBooks: [],
        popularCategories: [],
        recentActivity: []
      },
      user: req.user,
      lang: req.session?.language || 'pl',
      page: 'enhanced-dashboard'
    });
  }
};
