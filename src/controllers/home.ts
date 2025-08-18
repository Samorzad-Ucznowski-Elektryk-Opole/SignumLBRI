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
