import { NextFunction, Request, Response } from "express";
import { User, UserDocument } from "../models/User";
import { BookListing, BookListingDocument } from "../models/BookListing";
import { body, check, validationResult } from "express-validator";
import moment from "moment";
import durationFormat from "moment-duration-format";
import { Book } from "../models/Book";
import { median } from "../util/math";
import { Buyer } from "../models/Buyer";
import { UserPerformance } from "../models/Performance";
import mongoose, { CallbackError } from "mongoose";
import crypto from "crypto";
import { WriteError } from "mongodb";
import { School, SchoolDocument } from "../models/School";
import { getBookGraph, getBookStats, getBuyerStats, getGlobalStats, getRoleTime, getStaffStatistics, getStatsPerUser, getUser, getUserGraph } from "../util/admin";
import { error } from "console";
import { ObjectID, ObjectId } from "bson";
import { BookFair } from "../models/BookFair";
import { Exhibitor } from "../models/Exhibitor";
import { BookFairExhibitor } from "../models/BookFairExhibitor";
import fs from 'fs';
import path from 'path';
import { parse } from 'csv-parse';

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
//@ts-ignore
durationFormat(moment);


export async function adminDataProvider(req: Request, res: Response, next: NextFunction) {
  res.locals.requestData = { params: {}, query: {} };
  if (req.user.isHeadAdmin()) {
    res.locals.availableSchools = await School.find({});
  } else {
    res.locals.availableSchools = await School.find({ _id: req.user.school });
  }

  next();
}

export async function checkSchoolPermissions(req: Request, res: Response, next: NextFunction) {
  if (req.params.schoolID && (res.locals.availableSchools as SchoolDocument[]).every((a) => a._id.toString() != req.params.schoolID.toString())) {
    return res.redirect("/");
  }
  next();
}


export async function main(req: Request, res: Response): Promise<void> {
  req.params = res.locals.requestData.params;
  const data = await getRoleTime(req.params.schoolID ? new ObjectId(req.params.schoolID) : undefined);
  data.forEach((role: { formattedAvg: string, formattedSum: string, avg: number, sum: number, _id: string }) => {
    role.formattedAvg = moment
      .duration(role.avg, "milliseconds")
      .format("w[w] d[d] h[h] m[m] s[s]");
    role.formattedSum = moment
      .duration(role.sum, "milliseconds")
      .format("w[w] d[d] h[h] m[m] s[s]");
  });
  res.render("admin/page/dashboard", { title: req.language.titles.adminDashboard, data: data });
}
export async function users(req: Request, res: Response): Promise<void> {
  req.params = res.locals.requestData.params;
  const stats = await getGlobalStats(["registered", "printed_label", "given_money", "canceled", "deleted", "returned"], req.params.schoolID ? new ObjectId(req.params.schoolID) : undefined);
  const statsBought = await getGlobalStats(["registered", "printed_label", "accepted","returned", "canceled", "deleted"], req.params.schoolID ? new ObjectId(req.params.schoolID) : undefined);
  const statsTotal = await getGlobalStats(undefined, req.params.schoolID ? new ObjectId(req.params.schoolID) : undefined);
  const userData = await getStatsPerUser(Object.keys(req.query).length > 0 ? [...Object.keys(req.query)] : undefined as any, req.params.schoolID ? new ObjectId(req.params.schoolID) : undefined);
  const staff = await getStaffStatistics(Boolean(req.params.schoolID), req.params.schoolID ? new ObjectId(req.params.schoolID) : undefined);
  // console.log(stats);
  res.render("admin/page/users", {
    title: "Users",
    stats: stats[0],
    statsTotal: statsTotal[0],
    statsBought: statsBought[0],
    userData: userData,
    staff: staff,
  });
}

// [2, 3, 4, ...(false ? [2,3,4] : []), 8, 7]

export async function buyers(req: Request, res: Response): Promise<void> {
  req.params = res.locals.requestData.params;
  const data = await getBuyerStats(req.params.schoolID ? new ObjectId(req.params.schoolID) : undefined);
  let sum;
  try {
    sum = data
      .map((value) => {
        return value.moneySpent;
      })
      .reduce((partialSum, a) => partialSum + a, 0);
  } catch (_) { }
  res.render("admin/page/buyers", {
    title: "Buyers",
    buyers: data,
    buyerSum: sum,
  });
}

export async function getBuyerDetails(req: Request, res: Response) {
  await check("buyerID").exists().isMongoId().run(req);
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    req.flash("errors", errors.array());
    return res.redirect("back");
  }

  const buyer = await Buyer.findById(new ObjectID(req.params.buyerID));
  const books = await BookListing.find({ boughtBy: buyer._id , school: res.locals.availableSchools}).populate("book school bookOwner");

  return res.render("admin/page/buyer", { title: "Buyer", buyerInfo: buyer, books });
}

export async function books(req: Request, res: Response): Promise<void> {
  req.params = res.locals.requestData.params;

  const result = await getBookStats(undefined, req.params.schoolID ? new ObjectId(req.params.schoolID) : undefined);
  res.render("admin/page/books", { title: "Books", data: result });
}

export async function earnings(req: Request, res: Response) {

  const listingsSold = await BookListing.find({...(req.user.school ? {school: req.user.school._id} : {}), status: {$in: ["sold"]}}, "commission cost");
  const listingsGivenMoney = await BookListing.find({...(req.user.school ? {school: req.user.school._id} : {}), status: {$in: ["given_money"]}}, "commission cost");
  
  const moneyFlow = listingsSold.reduce((prevVal, currVal, currIdx, arr)=>prevVal+currVal.commission+currVal.cost, 0)+listingsGivenMoney.reduce((prevVal, currVal, currIdx, arr)=>prevVal+currVal.commission+currVal.cost, 0);
  const returnMoney = listingsSold.reduce((prevVal, currVal, currIdx, arr)=>prevVal+currVal.cost, 0);
  const earned = listingsSold.reduce((prevVal, currVal, currIdx, arr)=>prevVal+currVal.commission, 0)+listingsGivenMoney.reduce((prevVal, currVal, currIdx, arr)=>prevVal+currVal.commission, 0);
  const returnToCreator = earned*0.20;
  const earnedForSchool = earned-returnToCreator;
  return res.render("admin/page/earnings", { title: "Earnings",  moneyFlow, returnMoney, earned, returnToCreator, earnedForSchool});

}

interface Dataset {
  label: string;
  data: { x: string; y: number }[];
  fill: boolean;
  borderColor: string;
}
export async function apiBooks(req: Request, res: Response) {
  await check("from", "no from date provided").exists().run(req);
  await check("to", "no to date provided").exists().run(req);
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res.status(400).end();
  }

  const { from, to, exact } = req.query as unknown as {
    from: string;
    to: string;
    exact: boolean;
  };

  const [err, bookStatistics] = await getBookGraph(from, to, exact, req.user.isHeadAdmin() ? undefined : new ObjectID(req.user.school._id));

  if (err) {
    return res.status(500).end();
  }

  const dataset: Dataset[] = [];
  dataset.push({
    label: "Books Created",
    data: bookStatistics.map((val) => {
      if (val.date) {
        return {
          x: moment(new Date(val.date)).format("DD/MM/YYYY/HH:mm:ss"),
          y: val.created,
        };
      }
    }),
    borderColor: "green",
    fill: true,
  });
  dataset.push({
    label: "Labels Printed",
    data: bookStatistics.map((val) => {
      return val.date
        ? {
          x: moment(new Date(val.date)).format("DD/MM/YYYY/HH:mm:ss"),
          y: val.printed_label,
        }
        : undefined;
    }),
    borderColor: "blue",
    fill: true,
  });
  dataset.push({
    label: "Books Accepted",
    data: bookStatistics.map((val) => {
      return val.date
        ? {
          x: moment(new Date(val.date)).format("DD/MM/YYYY/HH:mm:ss"),
          y: val.accepted,
        }
        : undefined;
    }),
    borderColor: "yellow",
    fill: true,
  });
  dataset.push({
    label: "Books Sold",
    data: bookStatistics.map((val) => {
      return val.date
        ? {
          x: moment(new Date(val.date)).format("DD/MM/YYYY/HH:mm:ss"),
          y: val.sold,
        }
        : undefined;
    }),
    borderColor: "white",
    fill: true,
  });
  dataset.push({
    label: "Money Given",
    data: bookStatistics.map((val) => {
      return val.date
        ? {
          x: moment(new Date(val.date)).format("DD/MM/YYYY/HH:mm:ss"),
          y: val.given_money,
        }
        : undefined;
    }),
    borderColor: "orange",
    fill: true,
  });
  dataset.push({
    label: "Books Canceled",
    data: bookStatistics.map((val) => {
      return val.date
        ? {
          x: moment(new Date(val.date)).format("DD/MM/YYYY/HH:mm:ss"),
          y: val.canceled,
        }
        : undefined;
    }),
    borderColor: "red",
    fill: true,
  });
  dataset.push({
    label: "Books Deleted",
    data: bookStatistics.map((val) => {
      return val.date
        ? {
          x: moment(new Date(val.date)).format("DD/MM/YYYY/HH:mm:ss"),
          y: val.deleted,
        }
        : undefined;
    }),
    borderColor: "purple",
    fill: true,
  });
  dataset.forEach((data) => {

    data.data.sort(
      (a, b) =>
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        //@ts-ignore
        new Date(moment(a.x, "DD/MM/YYYY/HH:mm:ss")) -
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        //@ts-ignore
        new Date(moment(b.x, "DD/MM/YYYY/HH:mm:ss")),
    );
  });
  return res.json(dataset).end();

}
export async function apiUsers(req: Request, res: Response) {
  await check("from", "no from date provided").exists().run(req);
  await check("to", "no to date provided").exists().run(req);

  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res.status(400).end();
  }
  const { from, to, exact } = req.query as unknown as {
    from: string;
    to: string;
    exact: boolean;
  };


  const [err, userStatistics] = await getUserGraph(from, to, exact, req.user.isHeadAdmin() ? undefined : new ObjectID(req.user.school._id));
  if (err) {
    return res.status(500).end();
  }
  userStatistics.sort(function (a, b) {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    //@ts-ignore
    return new Date(b.date) - new Date(a.date);
  });
  const dataset: Dataset[] = [];
  dataset.push({
    label: "Registered Users",
    data: userStatistics.map((val) => {
      return {
        x: moment(new Date(val.date)).format("DD/MM/YYYY/HH:mm:ss"),
        y: val.count,
      };
    }),
    borderColor: "green",
    fill: false,
  });
  return res.json(dataset).end();
}

export const getEditUser = async (req: Request, res: Response) => {
  await check("userID").exists().run(req);
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    req.flash("errors", errors.array());
    return res.redirect("back");
  }
  const user = await (getUser(new ObjectID(req.params.userID)));

  if (!req.user.isHeadAdmin() && req.user.school.toString() != user[0].school.toString()) {
    req.flashError(null, "You dont have permission to view that profile");
    return res.redirect("/");
  }

  // console.log(JSON.stringify(user));
  user[0].gravatar = function (size: number = 200) {
    if (!this.email) {
      return `https://gravatar.com/avatar/?s=${size}&d=retro`;
    }
    const md5 = crypto.createHash("md5").update(this.email).digest("hex");
    return `https://gravatar.com/avatar/${md5}?s=${size}&d=retro`;
  };
  res.render("admin/page/account", {
    title: "Edit",
    euser: user[0],
    accountEdit: true,
  });
};

export const postEditUser = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  await check("userID").exists().run(req);

  await check("email", req.language.errors.validate.emailInvalid)
    .isEmail()
    .run(req);
  await body("email").normalizeEmail({ gmail_remove_dots: false }).run(req);

  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    req.flash("errors", errors.array());
    return res.redirect("/admin");
  }

  User.findById(req.params.userID, (err: NativeError, user: UserDocument) => {
    if (err) {
      return next(err);
    }
    user.email = req.body.email || "";
    user.profile.name = req.body.name || "";
    user.profile.surname = req.body.surname || "";
    user.profile.gender = req.body.gender || "";
    user.profile.location = req.body.location || "";
    user.profile.website = req.body.website || "";
    user.save((err: WriteError & CallbackError) => {
      if (err) {
        if (err.code === 11000) {
          req.flashError(null, req.language.errors.accountAlreadyExists);
          return res.redirect("/admin");
        }
        return next(err);
      }
      req.flash("success", { msg: req.language.success.accountInfoUpdated });
      res.redirect("/admin");
    });
  });
};

export const postGiveMoneyUser = async (req: Request, res: Response) => {
  await check("userID").exists().run(req);
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    req.flash("errors", errors.array());
    return res.redirect("back");
  }

  const [err, listings] = await BookListing.find({
    bookOwner: req.params.userID,
    status: { $in: ["sold", "accepted"] },
  }).then(a => [null, a]).catch(a => [a, null]);

  if (err) {
    req.flashError(err, req.language.errors.internal, false);
    return res.redirect("back");
  }

  listings.forEach((listing: BookListingDocument) => {
    if (listing.status == "accepted"){
      listing.status = "returned";
    }
    
    if (listing.status == "sold"){
      listing.status = "given_money";
    }

    listing.whenGivenMoney = new Date();
    listing.givenMoneyBy = req.user as UserDocument;
    listing.save((err) => {
      req.flashError(err, req.language.errors.internal, false);
    });
  });

  req.flash("success", { msg: req.language.success.moneyGiven });
  return res.redirect("back");
};

// === BOOK FAIR MANAGEMENT ===

export const getBookFairList = async (req: Request, res: Response) => {
  try {
    const bookFairs = await BookFair.find({}).populate('exhibitors').sort({ startDate: -1 });
    res.render('admin/page/bookfair-list', {
      title: 'Targi książki - Lista',
      bookFairs
    });
  } catch (error) {
    req.flashError(error, 'Błąd podczas pobierania listy targów książki', false);
    res.redirect('/admin');
  }
};

// === CSV IMPORT FUNCTIONS ===

export const getImportBooks = (req: Request, res: Response) => {
  res.render('admin/page/import-books', {
    title: 'Import książek z pliku CSV'
  });
};

export const postImportBooks = async (req: Request, res: Response) => {
  try {
    const csvFilePath = path.join(process.cwd(), 'public/uploads/podręczniki_szkolne_2025.csv');
    
    if (!fs.existsSync(csvFilePath)) {
      req.flash('error', { msg: 'Plik CSV nie został znaleziony!' });
      return res.redirect('/admin/import-books');
    }

    let importedCount = 0;
    let skippedCount = 0;
    let errorCount = 0;

    const results: any[] = [];

    fs.createReadStream(csvFilePath)
      .pipe(parse({ 
        columns: true,
        skip_empty_lines: true,
        delimiter: ','
      }))
      .on('data', (data) => results.push(data))
      .on('end', async () => {
        console.log(`Rozpoczęto import ${results.length} książek z pliku CSV`);
        
        for (const row of results) {
          try {
            // Check if book already exists by ISBN
            const existingBook = await Book.findOne({ ISBN: row.ISBN });
            
            if (existingBook) {
              skippedCount++;
              continue;
            }

            // Create new book
            const newBook = new Book({
              ISBN: row.ISBN,
              title: row['Tytuł'],
              authors: row['Autorzy'].split(', ').map((author: string) => author.trim()),
              publisher: row['Wydawca'],
              publishYear: parseInt(row['Rok Wydania']),
              subject: determineSubject(row['Tytuł']),
              class: determineClass(row['Tytuł']),
              level: determineLevelFromTitle(row['Tytuł']),
              newPrice: parseFloat(row['Cena Nowej (PLN)']),
              usedPrice: parseFloat(row['Cena Używanej (szacunkowa, PLN)']),
              importedAt: new Date(),
              isActive: true
            });

            await newBook.save();
            importedCount++;

          } catch (bookError) {
            console.error(`Błąd podczas importu książki ${row.ISBN}:`, bookError);
            errorCount++;
          }
        }

        req.flash('success', { 
          msg: `Import zakończony! Zaimportowano: ${importedCount}, Pominięto: ${skippedCount}, Błędów: ${errorCount}` 
        });
        res.redirect('/admin/books');
      })
      .on('error', (error: any) => {
        console.error('Błąd podczas czytania pliku CSV:', error);
        req.flash('error', { msg: 'Błąd podczas czytania pliku CSV!' });
        res.redirect('/admin/import-books');
      });

  } catch (error) {
    req.flashError(error, 'Błąd podczas importu książek', false);
    res.redirect('/admin/import-books');
  }
};

// Helper functions for CSV import
function determineSubject(title: string): string {
  const titleLower = title.toLowerCase();
  
  if (titleLower.includes('matematik') || titleLower.includes('matemat')) return 'Matematyka';
  if (titleLower.includes('język pol') || titleLower.includes('ponad słowami') || titleLower.includes('oblicza epok')) return 'Język polski';
  if (titleLower.includes('histori')) return 'Historia';
  if (titleLower.includes('biologi')) return 'Biologia';
  if (titleLower.includes('chemi')) return 'Chemia';
  if (titleLower.includes('fizyk')) return 'Fizyka';
  if (titleLower.includes('geograf')) return 'Geografia';
  if (titleLower.includes('english') || titleLower.includes('focus') || titleLower.includes('perspective')) return 'Język angielski';
  if (titleLower.includes('deutsch') || titleLower.includes('welttour')) return 'Język niemiecki';
  if (titleLower.includes('informatyk')) return 'Informatyka';
  if (titleLower.includes('przedsiębior') || titleLower.includes('ekonom')) return 'Podstawy przedsiębiorczości';
  if (titleLower.includes('społeczeń')) return 'Wiedza o społeczeństwie';
  
  return 'Inne';
}

function determineClass(title: string): number {
  if (title.includes(' 2 ') || title.includes(' 2.')) return 2;
  if (title.includes(' 3 ') || title.includes(' 3.')) return 3;
  if (title.includes(' 4 ') || title.includes(' 4.')) return 4;
  if (title.includes(' 5 ') || title.includes(' 5.')) return 5;
  
  return 1; // default
}

function determineLevelFromTitle(title: string): string {
  if (title.includes('rozszerzony') || title.includes('rozszerzon')) return 'rozszerzony';
  if (title.includes('podstawow')) return 'podstawowy';
  
  return 'podstawowy'; // default
}

// === BOOK FAIR MANAGEMENT FUNCTIONS ===

/**
 * GET /admin/book-fairs
 * Book fairs list page
 */
export const getBookFairs = async (req: Request, res: Response) => {
  try {
    const bookFairs = await BookFair.find({})
      .populate('createdBy', 'email profile.name')
      .sort({ startDate: -1 });
    
    res.render('admin/bookFairs/list', {
      title: 'Zarządzanie Targami Książek',
      bookFairs
    });
  } catch (error) {
    console.error('Book fairs list error:', error);
    req.flash('errors', { msg: 'Błąd podczas ładowania targów książek.' });
    res.redirect('/admin');
  }
};

/**
 * GET /admin/book-fairs/create
 * Create book fair form
 */
export const getCreateBookFair = async (req: Request, res: Response) => {
  res.render('admin/bookFairs/create', {
    title: 'Utwórz Nowe Targi Książek'
  });
};

/**
 * POST /admin/book-fairs/create
 * Create new book fair
 */
export const postCreateBookFair = async (req: Request, res: Response) => {
  try {
    const bookFair = new BookFair({
      name: req.body.name,
      description: req.body.description,
      startDate: new Date(req.body.startDate),
      endDate: new Date(req.body.endDate),
      registrationDeadline: new Date(req.body.registrationDeadline),
      location: req.body.location,
      maxExhibitors: parseInt(req.body.maxExhibitors) || 50,
      registrationFee: parseFloat(req.body.registrationFee) || 0,
      createdBy: req.user.id,
      isActive: true
    });
    
    await bookFair.save();
    req.flash('success', { msg: 'Targi książek zostały utworzone pomyślnie!' });
    res.redirect('/admin/book-fairs');
  } catch (error) {
    console.error('Create book fair error:', error);
    req.flash('errors', { msg: 'Błąd podczas tworzenia targów książek.' });
    res.redirect('/admin/book-fairs/create');
  }
};

/**
 * GET /admin/book-fairs/:id
 * Book fair details
 */
export const getBookFair = async (req: Request, res: Response) => {
  try {
    const bookFair = await BookFair.findById(req.params.id)
      .populate('createdBy', 'email profile.name')
      .populate('exhibitors');
    
    if (!bookFair) {
      req.flash('errors', { msg: 'Targi książek nie zostały znalezione.' });
      return res.redirect('/admin/book-fairs');
    }
    
    res.render('admin/bookFairs/detail', {
      title: `Targi: ${bookFair.name}`,
      bookFair
    });
  } catch (error) {
    console.error('Book fair detail error:', error);
    req.flash('errors', { msg: 'Błąd podczas ładowania szczegółów targów.' });
    res.redirect('/admin/book-fairs');
  }
};

/**
 * GET /admin/book-fairs/:id/edit
 * Edit book fair form
 */
export const getEditBookFair = async (req: Request, res: Response) => {
  try {
    const bookFair = await BookFair.findById(req.params.id);
    
    if (!bookFair) {
      req.flash('errors', { msg: 'Targi książek nie zostały znalezione.' });
      return res.redirect('/admin/book-fairs');
    }
    
    res.render('admin/bookFairs/edit', {
      title: `Edytuj Targi: ${bookFair.name}`,
      bookFair
    });
  } catch (error) {
    console.error('Edit book fair error:', error);
    req.flash('errors', { msg: 'Błąd podczas ładowania formularza edycji.' });
    res.redirect('/admin/book-fairs');
  }
};

/**
 * POST /admin/book-fairs/:id/edit
 * Update book fair
 */
export const postEditBookFair = async (req: Request, res: Response) => {
  try {
    const bookFair = await BookFair.findById(req.params.id);
    
    if (!bookFair) {
      req.flash('errors', { msg: 'Targi książek nie zostały znalezione.' });
      return res.redirect('/admin/book-fairs');
    }
    
    bookFair.name = req.body.name;
    bookFair.description = req.body.description;
    bookFair.startDate = new Date(req.body.startDate);
    bookFair.endDate = new Date(req.body.endDate);
    bookFair.registrationDeadline = new Date(req.body.registrationDeadline);
    bookFair.location = req.body.location;
    bookFair.maxExhibitors = parseInt(req.body.maxExhibitors);
    bookFair.registrationFee = parseFloat(req.body.registrationFee);
    bookFair.isActive = req.body.isActive === 'true';
    
    await bookFair.save();
    req.flash('success', { msg: 'Targi książek zostały zaktualizowane!' });
    res.redirect(`/admin/book-fairs/${bookFair._id}`);
  } catch (error) {
    console.error('Update book fair error:', error);
    req.flash('errors', { msg: 'Błąd podczas aktualizacji targów książek.' });
    res.redirect(`/admin/book-fairs/${req.params.id}/edit`);
  }
};

/**
 * POST /admin/book-fairs/:id/delete
 * Delete book fair
 */
export const postDeleteBookFair = async (req: Request, res: Response) => {
  try {
    await BookFair.findByIdAndDelete(req.params.id);
    req.flash('success', { msg: 'Targi książek zostały usunięte.' });
    res.redirect('/admin/book-fairs');
  } catch (error) {
    console.error('Delete book fair error:', error);
    req.flash('errors', { msg: 'Błąd podczas usuwania targów książek.' });
    res.redirect('/admin/book-fairs');
  }
};

/**
 * GET /admin/book-fairs/:id/exhibitors
 * Exhibitors management for book fair
 */
export const getBookFairExhibitors = async (req: Request, res: Response) => {
  try {
    const bookFair = await BookFair.findById(req.params.id);
    if (!bookFair) {
      req.flash('errors', { msg: 'Targi książek nie zostały znalezione.' });
      return res.redirect('/admin/book-fairs');
    }
    
    const exhibitors = await Exhibitor.find({ bookFairId: req.params.id })
      .populate('userId', 'email profile.name')
      .sort({ registrationDate: -1 });
    
    res.render('admin/bookFairs/exhibitors', {
      title: `Wystawcy - ${bookFair.name}`,
      bookFair,
      exhibitors
    });
  } catch (error) {
    console.error('Book fair exhibitors error:', error);
    req.flash('errors', { msg: 'Błąd podczas ładowania wystawców.' });
    res.redirect('/admin/book-fairs');
  }
};

/**
 * POST /admin/book-fairs/:id/exhibitors/:exhibitorId/approve
 * Approve exhibitor for book fair
 */
export const postApproveExhibitor = async (req: Request, res: Response) => {
  try {
    const exhibitor = await Exhibitor.findById(req.params.exhibitorId);
    if (!exhibitor) {
      req.flash('errors', { msg: 'Wystawca nie został znaleziony.' });
      return res.redirect(`/admin/book-fairs/${req.params.id}/exhibitors`);
    }
    
    exhibitor.approvalStatus = 'approved';
    exhibitor.approvedBy = req.user.id;
    exhibitor.approvalDate = new Date();
    exhibitor.tableNumber = req.body.tableNumber;
    exhibitor.notes = req.body.notes;
    
    await exhibitor.save();
    req.flash('success', { msg: 'Wystawca został zatwierdzony!' });
    res.redirect(`/admin/book-fairs/${req.params.id}/exhibitors`);
  } catch (error) {
    console.error('Approve exhibitor error:', error);
    req.flash('errors', { msg: 'Błąd podczas zatwierdzania wystawcy.' });
    res.redirect(`/admin/book-fairs/${req.params.id}/exhibitors`);
  }
};

/**
 * POST /admin/book-fairs/:id/exhibitors/:exhibitorId/reject
 * Reject exhibitor for book fair
 */
export const postRejectExhibitor = async (req: Request, res: Response) => {
  try {
    const exhibitor = await Exhibitor.findById(req.params.exhibitorId);
    if (!exhibitor) {
      req.flash('errors', { msg: 'Wystawca nie został znaleziony.' });
      return res.redirect(`/admin/book-fairs/${req.params.id}/exhibitors`);
    }
    
    exhibitor.approvalStatus = 'rejected';
    exhibitor.approvedBy = req.user.id;
    exhibitor.approvalDate = new Date();
    exhibitor.notes = req.body.reason;
    
    await exhibitor.save();
    req.flash('success', { msg: 'Wystawca został odrzucony.' });
    res.redirect(`/admin/book-fairs/${req.params.id}/exhibitors`);
  } catch (error) {
    console.error('Reject exhibitor error:', error);
    req.flash('errors', { msg: 'Błąd podczas odrzucania wystawcy.' });
    res.redirect(`/admin/book-fairs/${req.params.id}/exhibitors`);
  }
};

// === PUBLIC BOOK FAIR FUNCTIONS ===

/**
 * GET /book-fairs
 * Public book fairs list
 */
export const getPublicBookFairs = async (req: Request, res: Response) => {
  try {
    const now = new Date();
    const bookFairs = await BookFair.find({
      isActive: true,
      registrationDeadline: { $gte: now }
    }).sort({ startDate: 1 });
    
    res.render('public/bookFairs/list', {
      title: 'Targi Książek - Rejestracja',
      bookFairs
    });
  } catch (error) {
    console.error('Public book fairs error:', error);
    req.flash('errors', { msg: 'Błąd podczas ładowania targów książek.' });
    res.redirect('/');
  }
};

/**
 * GET /book-fairs/:id/register
 * Registration form for book fair
 */
export const getRegisterForBookFair = async (req: Request, res: Response) => {
  try {
    const bookFair = await BookFair.findById(req.params.id);
    if (!bookFair || !bookFair.isActive) {
      req.flash('errors', { msg: 'Targi książek nie są dostępne.' });
      return res.redirect('/book-fairs');
    }
    
    const now = new Date();
    if (now > bookFair.registrationDeadline) {
      req.flash('errors', { msg: 'Termin rejestracji na te targi już minął.' });
      return res.redirect('/book-fairs');
    }
    
    // Check if user already registered
    const existingRegistration = await Exhibitor.findOne({
      bookFairId: req.params.id,
      userId: req.user.id
    });
    
    if (existingRegistration) {
      req.flash('info', { msg: 'Jesteś już zarejestrowany na te targi.' });
      return res.redirect('/book-fairs');
    }
    
    res.render('public/bookFairs/register', {
      title: `Rejestracja - ${bookFair.name}`,
      bookFair
    });
  } catch (error) {
    console.error('Book fair registration form error:', error);
    req.flash('errors', { msg: 'Błąd podczas ładowania formularza rejestracji.' });
    res.redirect('/book-fairs');
  }
};

/**
 * POST /book-fairs/:id/register
 * Submit registration for book fair
 */
export const postRegisterForBookFair = async (req: Request, res: Response) => {
  try {
    const bookFair = await BookFair.findById(req.params.id);
    if (!bookFair || !bookFair.isActive) {
      req.flash('errors', { msg: 'Targi książek nie są dostępne.' });
      return res.redirect('/book-fairs');
    }
    
    const now = new Date();
    if (now > bookFair.registrationDeadline) {
      req.flash('errors', { msg: 'Termin rejestracji na te targi już minął.' });
      return res.redirect('/book-fairs');
    }
    
    // Check if user already registered
    const existingRegistration = await Exhibitor.findOne({
      bookFairId: req.params.id,
      userId: req.user.id
    });
    
    if (existingRegistration) {
      req.flash('errors', { msg: 'Jesteś już zarejestrowany na te targi.' });
      return res.redirect('/book-fairs');
    }
    
    // Check if fair is full
    const currentExhibitors = await Exhibitor.countDocuments({
      bookFairId: req.params.id,
      approvalStatus: { $in: ['approved', 'pending'] }
    });
    
    if (currentExhibitors >= bookFair.maxExhibitors) {
      req.flash('errors', { msg: 'Targi osiągnęły maksymalną liczbę wystawców.' });
      return res.redirect('/book-fairs');
    }
    
    const exhibitor = new Exhibitor({
      bookFairId: req.params.id,
      userId: req.user.id,
      companyName: req.body.companyName,
      contactPerson: req.body.contactPerson,
      email: req.body.email,
      phone: req.body.phone,
      website: req.body.website,
      description: req.body.description,
      specialOffers: req.body.specialOffers,
      approvalStatus: 'pending'
    });
    
    await exhibitor.save();
    
    req.flash('success', { msg: 'Rejestracja została wysłana! Otrzymasz potwierdzenie po weryfikacji.' });
    res.redirect('/book-fairs');
  } catch (error) {
    console.error('Book fair registration error:', error);
    req.flash('errors', { msg: 'Błąd podczas rejestracji na targi książek.' });
    res.redirect(`/book-fairs/${req.params.id}/register`);
  }
};
