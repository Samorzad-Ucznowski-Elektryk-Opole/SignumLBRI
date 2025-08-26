import { ObjectId } from "bson";
import { Book, BookDocument } from "../models/Book";
import { SchoolDocument } from "../models/School";
import { BookListing } from "../models/BookListing";

export function calculateComission(price: number, divisibleBy: number, comissionMultiplier: number): number {
  price = Number(price);
  const comission = price * comissionMultiplier;
  return price + (comission % Math.round(divisibleBy)) == 0
    ? price + comission
    : 2 - ((price + comission) % 2) + comission;
}

export async function fetchTopBooks(): Promise<
  (BookDocument & { available: number; sold: number })[]
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
      $lookup: {
        from: "booklistings",
        localField: "_id",
        foreignField: "book",
        as: "listings",
      },
    },
    {
      $addFields: {
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
}


export async function fetchAnonTopBooks(): Promise<
  {
    _id: ObjectId,
    school: SchoolDocument,
    book: {
      book: BookDocument,
      available: number,
      sold: number
    }[]
  }[]
> {
  const result = await BookListing.aggregate([
    {
      $group: {
        _id: { school: "$school", book: "$book" },
        listings: { $addToSet: "$$ROOT" }
      }
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
                $eq: [
                  "$$available.status",
                  "accepted"
                ]
              }
            }
          }
        },
        sold: {
          $size: {
            $filter: {
              input: "$listings",
              as: "available",
              cond: {
                $eq: [
                  "$$available.status",
                  "sold"
                ]
              }
            }
          }
        }
      }
    },
    {
      $lookup: {
        from: "books",
        localField: "_id.book",
        foreignField: "_id",
        as: "book"
      }
    },
    {
      $lookup: {
        from: "schools",
        localField: "_id.school",
        foreignField: "_id",
        as: "schools"
      }
    },
    {
      $group: {
        _id: "$_id.school",
        school: {
          $first: { $first: "$schools" }
        },
        book: {
          $addToSet: {
            book: { $first: "$book" },
            available: "$available",
            sold: "$sold"
          }
        }
      }
    },
    { $sort: { "book.available": -1 } }
  ]);
  return result;
  // documents.forEach(item => {(item as (BookDocument & { count: number })).count = 1;});
  // return documents as (BookDocument & { count: number })[];
}
