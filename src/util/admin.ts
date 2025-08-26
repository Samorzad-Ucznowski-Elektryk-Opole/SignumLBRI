import { ObjectId } from "mongoose";
import { School } from "../models/School";
import { UserPerformance } from "../models/Performance";
import { User } from "../models/User";
import { Buyer } from "../models/Buyer";
import { Book } from "../models/Book";
import { median } from "./math";
import { BookListing } from "../models/BookListing";

export function getUser(userID: ObjectId){
    return User.aggregate([
        {
          $match: {
            _id: userID,
          },
        },
        {
          $lookup: {
            from: "booklistings",
            localField: "_id",
            foreignField: "bookOwner",
            as: "books",
          },
        },
        {
          $unwind: {
            path: "$books",
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $lookup: {
            from: "books",
            localField: "books.book",
            foreignField: "_id",
            as: "books.book",
          },
        },
        // {
        //   $match: {
        //     "books.status": {
        //       $in: ["sold", "accepted"],
        //     },
        //   },
        // },
        {
          $group: {
            _id: "$_id",
            availableBooks: {
              $addToSet: "$books",
            },
            school:{
              $first: "$school"
            },
            email: {
              $first: "$email",
            },
            role: {
              $first: "$role",
            },
            profile: {
              $first: "$profile",
            },
            debt: {
              $sum: {
                $cond: [
                  {
                    $eq: ["$books.status", "sold"],
                  },
                  "$books.cost",
                  0,
                ],
              },
            },
          },
        },
      ]);
}

export async function getUserGraph(from: string, to: string, exact: boolean, schoolID?: ObjectId){
    const res:any = User.aggregate([
          ...(schoolID ? [{
            $match: {
                "school": schoolID
            }
        }] : []),
        {
          $addFields: {
            fromDate: new Date(from),
            toDate: new Date(to),
          },
        },
        {
          $match: {
            $expr: {
              $or: [
                {
                  $and: [
                    { $gt: ["$createdAt", "$fromDate"] },
                    { $lt: ["$createdAt", "$toDate"] },
                  ],
                },
              ],
            },
          },
        },
        exact
          ? {
            $group: {
              _id: {
                hour: {
                  $hour: "$createdAt",
                },
                minute: {
                  $minute: "$createdAt",
                },
                month: {
                  $month: "$createdAt",
                },
                day: {
                  $dayOfMonth: "$createdAt",
                },
                year: {
                  $year: "$createdAt",
                },
              },
              count: {
                $sum: 1,
              },
            },
          }
          : {
            $group: {
              _id: {
                month: {
                  $month: "$createdAt",
                },
                day: {
                  $dayOfMonth: "$createdAt",
                },
                year: {
                  $year: "$createdAt",
                },
              },
              count: {
                $sum: 1,
              },
            },
          },
        {
          $addFields: {
            date: {
              $dateFromParts: exact
                ? {
                  year: "$_id.year",
                  month: "$_id.month",
                  day: "$_id.day",
                  hour: "$_id.hour",
                  minute: "$_id.minute",
                }
                : {
                  year: "$_id.year",
                  month: "$_id.month",
                  day: "$_id.day",
                },
            },
          },
        },
        {
          $match: {
            $expr: {
              $ne: ["$date", null],
            },
          },
        },
        {
          $project: {
            _id: false,
          },
        },
      ]).then(a=>[null, a]).catch(a=>[a, null]);
    
      return (res as [Error|null, { date: Date; count: number }[]|null]);
}

export async function getBookGraph(from: string, to: string, exact: boolean, schoolID?: ObjectId){

    const aggregateRes: any = await BookListing.aggregate([
          ...(schoolID ? [{
            $match: {
                "school": schoolID
            }
        }] : []),
        {
          $addFields: {
            fromDate: new Date(from),
            toDate: new Date(to),
          },
        },
        {
          $match: {
            $expr: {
              $or: [
                {
                  $and: [
                    {
                      $gt: ["$createdAt", "$fromDate"],
                    },
                    {
                      $lt: ["$createdAt", "$toDate"],
                    },
                  ],
                },
                {
                  $and: [
                    {
                      $gt: ["$whenPrinted", "$fromDate"],
                    },
                    {
                      $lt: ["$whenPrinted", "$toDate"],
                    },
                  ],
                },
                {
                  $and: [
                    {
                      $gt: ["$whenVerified", "$fromDate"],
                    },
                    {
                      $lt: ["$whenVerified", "$toDate"],
                    },
                  ],
                },
                {
                  $and: [
                    {
                      $gt: ["$whenSold", "$fromDate"],
                    },
                    {
                      $lt: ["$whenSold", "$toDate"],
                    },
                  ],
                },
                {
                  $and: [
                    {
                      $gt: ["$whenGivenMoney", "$fromDate"],
                    },
                    {
                      $lt: ["$whenGivenMoney", "$toDate"],
                    },
                  ],
                },
                {
                  $and: [
                    {
                      $gt: ["$whenCanceled", "$fromDate"],
                    },
                    {
                      $lt: ["$whenCanceled", "$toDate"],
                    },
                  ],
                },
                {
                  $and: [
                    {
                      $gt: ["$whenDeleted", "$fromDate"],
                    },
                    {
                      $lt: ["$whenDeleted", "$toDate"],
                    },
                  ],
                },
              ],
            },
          },
        },
        {
          $project: {
            dates: [
              {
                type: "created",
                date: "$createdAt",
              },
              {
                type: "printed_label",
                date: "$whenPrinted",
              },
              {
                type: "accepted",
                date: "$whenVerified",
              },
              {
                type: "sold",
                date: "$whenSold",
              },
              {
                type: "given_money",
                date: "$whenGivenMoney",
              },
              {
                type: "canceled",
                date: "$whenCanceled",
              },
              {
                type: "deleted",
                date: "$whenDeleted",
              },
            ],
          },
        },
        {
          $unwind: "$dates",
        },
        {
          $group: {
            _id: exact
              ? {
                year: {
                  $year: "$dates.date",
                },
                month: {
                  $month: "$dates.date",
                },
                day: {
                  $dayOfMonth: "$dates.date",
                },
                hour: {
                  $hour: "$dates.date",
                },
                // minute: {
                //   $minute: "$dates.date",
                // },
              }
              : {
                year: {
                  $year: "$dates.date",
                },
                month: {
                  $month: "$dates.date",
                },
                day: {
                  $dayOfMonth: "$dates.date",
                },
              },
            created: {
              $sum: {
                $cond: {
                  if: {
                    $eq: ["$dates.type", "created"],
                  },
                  then: 1,
                  else: 0,
                },
              },
            },
            printed_label: {
              $sum: {
                $cond: {
                  if: {
                    $eq: ["$dates.type", "printed_label"],
                  },
                  then: 1,
                  else: 0,
                },
              },
            },
            accepted: {
              $sum: {
                $cond: {
                  if: {
                    $eq: ["$dates.type", "accepted"],
                  },
                  then: 1,
                  else: 0,
                },
              },
            },
            sold: {
              $sum: {
                $cond: {
                  if: {
                    $eq: ["$dates.type", "sold"],
                  },
                  then: 1,
                  else: 0,
                },
              },
            },
            given_money: {
              $sum: {
                $cond: {
                  if: {
                    $eq: ["$dates.type", "given_money"],
                  },
                  then: 1,
                  else: 0,
                },
              },
            },
            canceled: {
              $sum: {
                $cond: {
                  if: {
                    $eq: ["$dates.type", "canceled"],
                  },
                  then: 1,
                  else: 0,
                },
              },
            },
            deleted: {
              $sum: {
                $cond: {
                  if: {
                    $eq: ["$dates.type", "deleted"],
                  },
                  then: 1,
                  else: 0,
                },
              },
            },
          },
        },
        {
          $addFields: {
            date: {
              $dateFromParts: exact
                ? {
                  year: "$_id.year",
                  month: "$_id.month",
                  day: "$_id.day",
                  hour: "$_id.hour",
                  // minute: "$_id.minute",
                }
                : {
                  year: "$_id.year",
                  month: "$_id.month",
                  day: "$_id.day",
                },
            },
          },
        },
        {
          $match: {
            $expr: {
              $ne: ["$date", null],
            },
          },
        },
      ]).then(a => [null, a]).catch(a => [a, null]);
    
      return (aggregateRes as [Error | null, {
        date: Date;
        _id: {
          year: number;
          month: number;
          day: number;
          hour?: number;
          minute?: number;
        };
        created: number;
        printed_label: number;
        accepted: number;
        sold: number;
        given_money: number;
        canceled: number;
        deleted: number;
      }[] | null]);
    
}

export async function getBookStats(filter: ("registered"|"printed_label"|"accepted"|"sold"|"given_money"|"canceled"|"deleted")[] = ["canceled", "deleted"], schoolID?: ObjectId){
    const result = await Book.aggregate<{avgCost: number, median: number, sold: number, available: number, title: string, publisher: string, costTable: number[]}>([
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
          $unwind: "$listings",
        },
        ...(schoolID ? [{
            $match: {
                "listings.school": schoolID
            }
        }] : []),
        {
          $match: {
            $nor: filter.map((filter)=>({"listings.status": filter})) 
            // [
            //   {
            //     "listings.status": "canceled",
            //   },
            //   {
            //     "listings.status": "deleted",
            //   },
            // ],
                  
          },
        },
        {
          $group: {
            _id: "$_id",
            avgCost: {
              $avg: "$listings.cost",
            },
            sold: {
              $first: "$sold",
            },
            available: {
              $first: "$available",
            },
            title: {
              $first: "$title",
            },
            publisher: {
              $first: "$publisher",
            },
            costTable: {
              $addToSet: "$listings.cost",
            },
          },
        },
        {
          $sort: {
            sold: -1,
          },
        },
      ]);
      result.forEach((value) => {
        value.median = median(value.costTable);
      });
      return result;
}

export function getBuyerStats(schoolID?:ObjectId){
    return Buyer.aggregate([
        {
          $lookup: {
            from: "booklistings",
            localField: "_id",
            foreignField: "boughtBy",
            as: "books",
          },
        },
        {
          $addFields: {
            bookCount: {
              $size: "$books",
            },
          },
        },
        {
          $unwind: {
            path: "$books",
            preserveNullAndEmptyArrays: true,
          },
        },
        ...(schoolID ? [{
            $match: {
                "books.school": schoolID
            }
        }] : []),
        {
          $group: {
            _id: "$_id",
            name: {
              $first: "$name",
            },
            surname: {
              $first: "$surname",
            },
            email: {
              $first: "$email",
            },
            phone: {
              $first: "$phone",
            },
            books: {
              $first: "$bookCount",
            },
            moneySpent: {
              $sum: {
                $add: ["$books.cost", "$books.commission"],
              },
            },
            profit: {
              $sum: "$books.commission",
            },
          },
        },
        {
          $sort: {
            books: -1,
          },
        },
      ]);
}

export function getStaffStatistics(includeAdmin = false, schoolID?: ObjectId){
    return User.aggregate<{_id: ObjectId, email: string, password: string, role: string, school:ObjectId, profile: {name:string, surname: string, phone: string}, createdAt: Date, updatedAt: Date, verifiedBooks:number, soldBooks: number, deletedBooks: number }>([
        ...(schoolID ? [{
            $match: {
                "school": schoolID
            }
        }] : []),
        {
          $match: {
            role: {
              $in: ["admin", "seller"],
            },
          },
        },
        {
          $lookup: {
            from: "booklistings",
            localField: "_id",
            foreignField: "verifiedBy",
            as: "verified",
          },
        },
        {
          $lookup: {
            from: "booklistings",
            localField: "_id",
            foreignField: "soldBy",
            as: "sold",
          },
        },
        {
          $lookup: {
            from: "booklistings",
            localField: "_id",
            foreignField: "deletedBy",
            as: "deleted",
          },
        },
        {
          $addFields: {
            verifiedBooks: {
              $size: "$verified",
            },
            soldBooks: {
              $size: "$sold",
            },
            deletedBooks: {
              $size: "$deleted",
            },
          },
        },
        {
          $project: {
            sold: 0,
            verified: 0,
            deleted: 0,
          },
        },
      ]);
}

export async function getStatsPerUser(filter: ("registered"|"printed_label"|"accepted"|"sold"|"given_money"|"canceled"|"deleted")[] = ["accepted", "sold"],schoolID?: ObjectId){
    const query = await User.aggregate<{_id: ObjectId, email: string, profile: {name: string, surname: string, phone: string}, mustGive: number, earnings: number, books: number, totalCost: number, query: {[key: string]: boolean}}>([
        ...(schoolID ? [{
            $match: {
                "school": schoolID
            }
        }] : []),
        {
          $lookup: {
            from: "booklistings",
            localField: "_id",
            foreignField: "bookOwner",
            as: "listings",
          },
        },
        {
          $unwind: {
            path: "$listings",
            preserveNullAndEmptyArrays: true,
          },
        },
        {
            $match: {
              $or: filter.map((filter)=>({"listings.status": filter})) 
            },
          },
        // {
        //   $match: {
        //     $nor: [
        //       {
        //         "listings.status": "registered",
        //       },
        //       {
        //         "listings.status": "printed_label",
        //       },
        //       {
        //         "listings.status": "deleted",
        //       },
        //       {
        //         "listings.status": "canceled",
        //       },
        //       {
        //         "listings.status": "given_money",
        //       },
        //     ],
        //   },
        // },
        {
          $group: {
            _id: "$_id",
            listings: {
              $addToSet: "$listings",
            },
            email: {
              $first: "$email",
            },
            profile: {
              $first: "$profile",
            },
            mustGive: {
              $sum: "$listings.cost",
            },
            earnings: {
              $sum: "$listings.commission",
            },
          },
        },
        {
          $addFields: {
            books: {
              $size: "$listings",
            },
            totalCost: {
              $add: ["$mustGive", "$earnings"],
            },
          },
        },
        {
          $project: {
            listings: 0,
          },
        },
        {
          $sort: {
            books: -1,
          },
        },
      ]);
    (query as any).filter = {};
    filter.forEach(a=>{(query as any).filter[a] = true;});
  return query;
}

export function getGlobalStats(filter: ("registered"|"printed_label"|"accepted"|"sold"|"given_money"|"canceled"|"deleted"|"returned")[] = ["canceled", "deleted"],schoolID?: ObjectId){
    return User.aggregate<{bookDebt: number, earnings: number, bookAvg: number}>([
        ...(schoolID ? [{
            $match: {
                "school": schoolID
            }
        }] : []),
        {
          $lookup: {
            from: "booklistings",
            localField: "_id",
            foreignField: "bookOwner",
            as: "listings",
          },
        },
        {
          $unwind: {
            path: "$listings",
          },
        },
        {
          $match: {
            $nor: filter.map((filter)=>({"listings.status": filter})) 
            // [
            //   {
            //     "listings.status": "canceled",
            //   },
            //   {
            //     "listings.status": "deleted",
            //   },
            // ],
          },
        },
        {
          $group: {
            _id: "$_id",
            bookDebt: {
              $sum: "$listings.cost",
            },
            earnings: {
              $sum: "$listings.commission",
            },
            bookCount: {
              $sum: 1,
            },
          },
        },
        {
          $group: {
            _id: null,
            bookDebt: {
              $sum: "$bookDebt",
            },
            earnings: {
              $sum: "$earnings",
            },
            bookAvg: {
              $avg: "$bookCount",
            },
          },
        },  
      ]);
}

export function getRoleTime(schoolID?: ObjectId){
    return UserPerformance.aggregate<{
      _id:string; sum: number, avg:number
}>([
    {
      $group: {
        _id: "$user",
        sum: {
          $sum: "$time",
        },
        avg: {
          $avg: "$time",
        },
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "_id",
        foreignField: "_id",
        as: "user",
      },
    },
    {
      $addFields: {
        role: {
          $first: "$user",
        },
      },
    },
    ...(schoolID ? [{
        $match: {
            "role.school": schoolID
        }
    }] : []),
    {
      $addFields: {
        role: "$role.role",
      },
    },
    {
      $project: {
        user: 0,
      },
    },
    {
      $group: {
        _id: "$role",
        sum: {
          $sum: "$sum",
        },
        avg: {
          $avg: "$avg",
        },
      },
    },
  ]);
}
