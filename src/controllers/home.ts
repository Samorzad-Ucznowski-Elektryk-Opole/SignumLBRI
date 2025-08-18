import { Request, Response } from "express";
import { Book } from "../models/Book";
import { BookListing } from "../models/BookListing";
import { UserDocument } from "../models/User";
import { getConfig } from "../config/app.config";

/**
 * Home page with modern UI support.
 * @route GET /
 */

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
        sold: {
          $size: {
            $filter: {
              input: "$listings",
              as: "available",
              cond: {
                $eq: ["$$available.status", "sold"],
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
  // documents.forEach(item => {(item as (BookDocument & { count: number })).count = 1;});
  // return documents as (BookDocument & { count: number })[];
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

/**
 * Modern UI preview page - always shows modern interface
 * @route GET /modern
 */
export const modernPreview = async (req: Request, res: Response): Promise<void> => {
  const config = getConfig();
  
  return res.render("home-modern", {
    title: "SignumLBRI - Modern UI Preview",
    config: config,
    isAuthenticated: req.user ? true : false,
    user: req.user || null
  });
};

export const index = async (req: Request, res: Response): Promise<void> => {
  const config = getConfig();
  
  // Check if user is authenticated
  const user = req.user as UserDocument;
  
  if (!user) {
    // For non-authenticated users, show modern landing page
    return res.render("home-modern", {
      title: "SignumLBRI - Nowoczesna Platforma Edukacyjna",
      config: config,
      isAuthenticated: false,
      user: null
    });
  }

  if (user.role !== "student") {
    // For staff users, show admin dashboard
    return res.render("homeStaff", {
      title: "Dashboard - SignumLBRI",
      availableBooks: await fetchTopBooks(),
      config: config,
      isAuthenticated: true,
      user: user
    });
  } else {
    // For students, show personal book listings
    const bookListings = await BookListing.find({ bookOwner: req.user })
      .populate("book", "-image")
      .catch((err: Error) => {
        req.flash("errors", { msg: JSON.stringify(err) });
        return res.redirect("/");
      });
      
    return res.render("home", {
      title: "Moje Książki - SignumLBRI",
      bookListings: bookListings
        ? bookListings.length > 0
          ? bookListings
          : undefined
        : undefined,
      config: config,
      isAuthenticated: true,
      user: user
    });
  }
};
