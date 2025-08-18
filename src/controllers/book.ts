import { fetchBook } from "../util/findBook";
import { Request, Response } from "express";
import { Book, BookDocument } from "../models/Book";
import { Error, FilterQuery } from "mongoose";
import { check, validationResult } from "express-validator";
import { Buyer } from "../models/Buyer";
import { BuyerDocument } from "../models/Buyer";
import { BookListing, BookListingDocument, Label } from "../models/BookListing";
import { UserDocument } from "../models/User";
import { generateBarcode } from "../util/barcode";
import { calculateComission, fetchAnonTopBooks, fetchTopBooks } from "../util/book";
import { School, SchoolDocument } from "../models/School";
import { shortenString } from "../utils";

export async function getFillBookData(
  req: Request,
  res: Response,
): Promise<Response<never>> {
  await check("isbn", req.language.errors.validate.isbnInvalid)
    .isLength({ min: 13 })
    .isEAN()
    .run(req);
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  const isbn = Number(req.query.isbn);
  Book.findOne({ isbn: isbn }, async (err: Error, book: BookDocument) => {
    if (err) return res.status(500).json({errors: [err]});
    if (book) {
      const bookData = book;
      res.json(bookData);
    } else {
      const bookData = await fetchBook(isbn);
      let book: BookDocument;
      if (bookData) {
        book = new Book({
          title: bookData.title,
          publisher: bookData.publisher,
          authors: bookData.authors,
          pubDate: bookData.pubDate,
          isbn: bookData.isbn,
          image: bookData.image,
          msrp: bookData.msrp,
        });
      } else {
        book = new Book({
          isbn: isbn,
        });
      }
      book.save((err) => {
        console.log(err);
      });
      if (!bookData) {
        return res.status(404).end();
      }
      res.json(bookData);
    }
  });
}
export async function getSellBook(req: Request, res: Response): Promise<void> {
  res.render("book/sell", {
    title: req.language.titles.sellBook,
  });
}
export async function getBooks(req: Request, res: Response): Promise<void> {
  const bookListings = await BookListing.find({}, "-__v -createdAt -updatedAt")
    .populate("bookOwner", "-_id -__v -createdAt -updatedAt")
    .populate("book", "-_id -__v -createdAt -updatedAt")
    .populate("putOnSaleBy", "name email")
    .populate("soldBy", "name email");
  res.json(bookListings);
}

export async function postSellBook(
  req: Request,
  res: Response,
): Promise<unknown> {
  
  if(!req.user) return req.flashError(null, req.language.errors.notLoggedIn);
  await check("isbn", req.language.errors.validate.isbnInvalid)
    .isLength({ min: 13, max: 13 })
    .isEAN()
    .run(req);
  await check("title", req.language.errors.validate.bookTitleBlank).exists().isString().isLength({min:1, max:999}).run(req);
  await check("publisher", req.language.errors.validate.bookPublisherBlank).exists().isLength({max:999}).run(req);
  await check("pubDate", req.language.errors.validate.bookPublicationDateBlank).isNumeric().isInt({max:9999, min:0}).run(req);
  await check("cost", req.language.errors.validate.noPriceProvided)
    .exists()
    .isNumeric()
    .isFloat({min:1, max: 9999})
    .run(req);
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) return req.flashError(null, errors.array());

  const sellingData = req.body;

  const [findErr, book] = await Book.findOneAndUpdate(
    { isbn: sellingData.isbn },
    {
      title: shortenString(sellingData.title, 99),
      publisher: shortenString(sellingData.publisher, 99) || "",
      authors: sellingData.authors.split(",") || [""],
      pubDate: sellingData.pubDate || "",
    },
    {upsert: true}
  ).then(a=>[null, a]).catch(a=>[a, null]);

  if (findErr) return req.flashError(findErr, req.language.errors.internal);

  const [schoolFindErr, school] = await School.findOne({_id: req.user.school}).then(a=>[null, a]).catch(a=>[a, null]);

  if (schoolFindErr) return req.flashError(schoolFindErr, req.language.errors.internal);

  // console.log(school);
  
  const listing = new BookListing({
    commission: calculateComission(sellingData.cost, 2, (school as SchoolDocument).markup || 0.07),
    school: school,
    cost: sellingData.cost,
    bookOwner: req.user,
    book: book,
    status: "registered",
  });
  
  const label = new Label({
    barcode: generateBarcode(listing._id),
    sold: false,
  });

  {
    const err = await label.save().then(a=>null).catch(a=>a);
    if (err) return req.flashError(err, req.language.errors.internal);
  }
  
  listing.label = label;
  
  {
    const err = await listing.save().then(a=>null).catch(a=>a);
    if (err) return req.flashError(err, req.language.errors.internal);
  }

  req.flash("success", { msg: req.language.success.listingCreated });
  res.redirect("/label?selectedLabel=" + listing._id);
 
}
// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export const getManageBook = (
  req: Request & { user: UserDocument },
  res: Response,
) => {
  check("id", req.language.errors.validate.listingIdBlank).exists().isNumeric().run(req);
  const errors = validationResult(req);
  if (!errors.isEmpty()) return req.flashError(null, errors.array());

  BookListing.findOne({ _id: req.params.id })
    .populate("book")
    .populate("bookOwner")
    .populate("school")
    .exec((err: Error, listing: BookListingDocument) => {
      if (err) return req.flashError(err, req.language.errors.internal);
      if (!listing) return req.flashError(null, req.language.errors.listingDoesntExist);
      // console.log(req.user.isHeadAdmin());
      return res.render( res.locals.device.mobile() ? "book/editBookMobile" : "book/editBook", {
        item: listing,
        edit: (req.user.isSeller() && req.user.school == listing.school.id) || req.user.isHeadAdmin(),
        outsideView: !(req.user.isHeadAdmin() || req.user.school == listing.school.id),
        acceptString: `${"/book/" + listing._id + "/accept"}`,
        sellString: `${"/book/" + listing._id + "/sell"}`,
      });
      
    });
};
export async function listingJSON(req: Request, res: Response) {
  await check("itemID", "Nie podano identyfikatora książki")
    .exists()
    .isNumeric()
    .isLength({ min: 13, max: 13 })
    .run(req);
    const errors = validationResult(req);
if (!errors.isEmpty()) {
    return res.status(400).end();
  }
  const listing = await BookListing.findOne({_id: req.query.itemID}, "book cost commission id status").populate("book", "title publisher");
  return res.json(listing);
}
export const getPrintSetup = (req: Request, res: Response): void => {
  BookListing.find(
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    //@ts-ignore
    {...(req.user.isSeller() ? {} : { bookOwner: req.user }), status: {$nin: ["canceled", "deleted"]}},
  )
    .populate("book")
    .populate({ path: "label" })
    .exec((err: Error, listings: BookListingDocument[]) => {
      if (err) {
        req.flashError(err, req.language.errors.internal);
      }
      listings.sort(function (a, b) {
        return (a.label.print ? 1 : 0) - (b.label.print ? 1 : 0);
      });

      res.render("label/manage", {
        title: req.language.titles.printLabel,
        listings: listings,
        selectedLabel: req.query.selectedLabel,
      });
    });
};

export const redirectPrintSuccess = (req: Request, res: Response): void => {
  req.flash("success", {
    msg: req.language.success.listingCreated,
  });
  res.redirect("/");
};
export const getPrintLabel = (req: Request, res: Response): void => {
  for (const id in Object.keys(req.query)) {
    check(id).exists().isNumeric().isLength({ min: 13 }).run(req);
  }
  const errors = validationResult(req);
  if (!errors.isEmpty()) return req.flashError(null, errors.array());

  BookListing.find(
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    //@ts-ignore
    req.user.isSeller() ? {} : { bookOwner: req.user },
  )
    .where({ _id: Object.keys(req.query) })
    .populate("label")
    .populate("book")
    .populate("bookOwner")
    .exec((err: Error, listings) => {
      res.render("label/bookIdentifier", {
        listings: listings,
      });
    });
};

export const redirectPrint = (req: Request, res: Response): void => {
  check("id", req.language.errors.validate.listingIdBlank)
    .exists()
    .isNumeric()
    .isLength({ min: 13 })
    .run(req);
  const errors = validationResult(req);
  if (!errors.isEmpty()) return req.flashError(null, errors.array());

  res.redirect("/label?selectedLabel=" + req.params.id);
};
export const getRegisterPrint = async (
  req: Request,
  res: Response,
): Promise<void> => {
  for (const id in Object.keys(req.query)) {
    check(id).exists().isNumeric().isLength({ min: 13 }).run(req);
  }
  const errors = validationResult(req);
  if (!errors.isEmpty()) return req.flashError(null, errors.array());

  BookListing.find({ bookOwner: req.user })
    .where({ _id: Object.keys(req.query) })
    .populate("label")
    .exec((err, listings) => {
      if (err) return req.flashError(err, req.language.errors.internal);
      listings.forEach((listing, i) => {
        if (listing.status != "registered") {
        } else {
          listing.status = "printed_label";
          listing.whenPrinted = new Date();
          listing.label.print = true;
          listing.label.save((err: Error) => {
            if (err) {
              req.flashError(err, req.language.errors.internal, false);
              return res.status(500);
            }
          });
          listing.save((err: Error) => {
            if (err) {
              req.flashError(err, req.language.errors.internal, false);
              return res.status(500);
            }
            if (i + 1 == listings.length) return res.status(200);
          });
        }
      });
      res.end();
    });
};

export async function getFindListing(
  req: Request,
  res: Response,
): Promise<void> {
  await check("itemID",req.language.errors.validate.listingIdBlank)
    .exists()
    .isNumeric()
    .isLength({ min: 13, max: 13 })
    .run(req);
  const errors = validationResult(req);
  if (!errors.isEmpty()) return req.flashError(null, errors.array());

  const itemId = req.query.itemID;
  res.redirect(`/book/${itemId}/manage`);
}
export async function getFindListingApp(
  req: Request,
  res: Response,
): Promise<void> {
  await check("itemID", req.language.errors.validate.listingIdBlank).exists().isLength({min:13}).run(req);
  const errors = validationResult(req);
  if (!errors.isEmpty()) return req.flashError(null, errors.array());

  const bookListings = await BookListing.find(
    { _id: req.query.itemID },
    "-__v -createdAt -updatedAt",
  )
    .populate("bookOwner", "-_id -__v -createdAt -updatedAt")
    .populate("book", "-_id -__v -createdAt -updatedAt");
  res.json(bookListings);
}
export async function getBookRegistry(
  req: Request,
  res: Response,
): Promise<void> {
  await check("page", req.language.errors.validate.pageNotProvided)
    .exists()
    .isNumeric()
    .isInt()
    .run(req);
  const errors = validationResult(req);
  if (!errors.isEmpty()) return req.flashError(null, errors.array());

  const page = req.query.page;
  const options = {
    page: Number(page),
    populate: "book bookOwner",
    limit: 10,
  };
  const query: FilterQuery<BookListingDocument> = {};
  
  if (!req.user.isHeadAdmin()){
    query.school = req.user.school._id;
  }

  if (req.user.isAdmin()) {
    query.status = { $nin: ["canceled", "deleted"] };
  }
  const bookListings = await BookListing.paginate(query, options);

  res.render("book/showBooks", {
    bookListings: bookListings.docs,
    paging: bookListings,
  });
}
// export async function postBook
export async function editBook(req: Request, res: Response): Promise<void> {
  await check("itemID", req.language.errors.validate.listingIdBlank)
    .isLength({ min: 12 })
    .isNumeric()
    .run(req);
  const errors = validationResult(req);
  if (!errors.isEmpty()) return req.flashError(null, errors.array());

  const bookListings = await BookListing.findOne(
    { _id: req.params.itemID },
    "-__v -createdAt -updatedAt",
  )
    .populate("bookOwner", "-_id -__v -createdAt -updatedAt")
    .populate("book", "-_id -__v -createdAt -updatedAt")
    .populate("putOnSaleBy")
    .populate("soldBy");
  res.render("book/editBook", { item: bookListings, edit: true });
}

export async function sellBook(req: Request, res: Response): Promise<void> {
  await check("id", req.language.errors.validate.listingIdBlank)
    .isLength({ min: 13, max: 13 })
    .isNumeric()
    .run(req);
  await check("name", req.language.errors.validate.nameNotProvided).exists().isLength({min:1, max:99}).run(req);
  await check("surname", req.language.errors.validate.surnameNotProvided).exists().isLength({min:1, max:99}).run(req);
  await check("email", req.language.errors.validate.emailInvalid).isEmail().run(req);
  await check("phone", req.language.errors.validate.phoneInvalid)
    .isMobilePhone("pl-PL")
    .run(req);

  const errors = validationResult(req);
  if (!errors.isEmpty()) return req.flashError(null, errors.array());

  const bookListings = await BookListing.findOne(
    { _id: req.params.id },
    "-__v -createdAt -updatedAt",
  )
    .populate("bookOwner", "-_id -__v -createdAt -updatedAt")
    .populate("book", "-_id -__v -createdAt -updatedAt");
  bookListings.status = "sold";
  bookListings.soldBy = req.user as UserDocument;
  bookListings.whenSold = new Date();
  bookListings.boughtBy = await Buyer.findOneAndUpdate(
    {
      name: req.body.name,
      surname: req.body.surname,
      phone: req.body.phone,
      email: req.body.email,
    },
    {},
    { new: true, upsert: true },
  );
  bookListings.save((err) => {
    if (err) {
      req.flashError(err, req.language.errors.internal, false);
      return res.redirect("/book/" + req.params.id + "/manage");
    } else {
      req.flash("success", { msg: req.language.success.listingSold });
      return res.redirect("/book/" + req.params.id + "/manage");
    }
  });
}

export const acceptBook = async (req: Request, res: Response): Promise<void> => {
  check("id", req.language.errors.validate.listingIdBlank).exists().isLength({min:13, max:13}).run(req);
  const errors = validationResult(req);
  if (!errors.isEmpty()) return req.flashError(null, errors.array());

  BookListing.updateOne(
    { _id: req.params.id, ...(!req.user.isHeadAdmin() && {school: req.user.school}) },
    { status: "accepted", verifiedBy: req.user, whenVerified: new Date()},
  ).exec((err: Error, result) => {
    if (err) return req.flashError(err, req.language.errors.internal);
    if(result.matchedCount == 0) return req.flashError(null, req.language.errors.permissionDenied);
    req.flash("success", { msg: req.language.success.listingAccepted });
    return res.redirect("manage");
  });
};

export const cancelBook = (req: Request, res: Response): void => {
  check("id", req.language.errors.validate.listingIdBlank).exists().isLength({min:13, max:13}).run(req);
  const errors = validationResult(req);
  if (!errors.isEmpty()) return req.flashError(null, errors.array());

  BookListing.findOne(    { _id: req.params.id, ...(!req.user.isHeadAdmin() && {school: req.user.school}) },  ).exec(
    (err: Error, listing: BookListingDocument) => {
      if (err) return req.flashError(err, req.language.errors.internal);
      if (!listing) return req.flashError(null, req.language.errors.permissionDenied);
      if (listing.status == "printed_label" || listing.status == "registered") {
        listing.whenCanceled = new Date();
        listing.status = "canceled";
        listing.save();
        req.flash("success", { msg: req.language.success.listingCancelled });
        return res.redirect("manage");
      } else {
        req.flash("errors", { msg: req.language.errors.listingCancelForbidden });
        return res.redirect("manage");
      }
    },
  );
};

export const getLibrary = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const data = await fetchAnonTopBooks();
  
  // Check for modern UI preference or default to modern
  const useModern = req.query.modern !== 'false';
  
  return res.render(useModern ? "library/books-modern" : "library/books", {
    title: req.language.titles.library,
    data: data,
    isLandingPage: useModern
  });
};

export const deleteBook = (req: Request, res: Response): void => {
  check("id", req.language.errors.validate.listingIdBlank).exists().isLength({min:13, max:13}).run(req);
  const errors = validationResult(req);
  if (!errors.isEmpty()) return req.flashError(null, errors.array());

  BookListing.updateOne(
    { _id: req.params.id, ...(!req.user.isHeadAdmin() && {school: req.user.school}) },
    {
      status: "deleted",
      deletedBy: req.user,
      whenDeleted: new Date(),
    },
  ).exec((err: Error, result) => {
    if (err) return req.flashError(err, req.language.errors.internal);
    if(result.matchedCount == 0) return req.flashError(null, "permission denied");
    req.flash("success", { msg: req.language.success.listingDeleted });
    return res.redirect("manage");
  });
};

export function getBulkSell(req: Request, res: Response) {
  res.render("book/bulk", { disableSearch: true, title: "Kasa" });
}

export async function postBulkSell(req: Request, res: Response) {
  await check("name", req.language.errors.validate.nameNotProvided).exists().isLength({min:1, max:99}).run(req);
  await check("surname", req.language.errors.validate.surnameNotProvided).exists().isLength({min:1, max:99}).run(req);
  await check("email", req.language.errors.validate.emailInvalid).isEmail().run(req);
  await check("phone", req.language.errors.validate.phoneInvalid)
    .isMobilePhone("pl-PL")
    .run(req);
  await check("bookIDS", req.language.errors.validate.listingIdBlank)
    .exists()
    .isJSON()
    .run(req);
  const bookIDS = JSON.parse(req.body.bookIDS);

  const errors = validationResult(req);
  if (!errors.isEmpty()) return req.flashError(null, errors.array());

  const buyer = await Buyer.findOneAndUpdate(
    {
      name: req.body.name,
      surname: req.body.surname,
      phone: req.body.phone,
      email: req.body.email,
    },
    {},
    { new: true, upsert: true },
  );
  const findA = await Promise.all(
    bookIDS.map(async (book: string) => {
      const [err, find] = await BookListing.findOneAndUpdate(
        { _id: book, status: "accepted" , ...(!req.user.isHeadAdmin() && {school: req.user.school}) },
        {
          status: "sold",
          boughtBy: buyer,
          soldBy: req.user as UserDocument,
          whenSold: new Date(),
        },
      ).then(a=>[null, a]).catch((err) =>[err, null]);
      
      // console.log(find);

      if (err) return req.flashError(err, req.language.errors.internal);

      if (find == null) {
        req.flash("errors", {
          // TODO: add templated language support
          msg: `książka ${book} nie jest wystawiona do sprzedaży, nie istnieje lub nie masz uprawnień do owej transakcji`,
        });
      }
      return find;
    }),
  );
  if (!findA.includes(null)) {
    req.flash("success", { msg: req.language.success.listingsSold });
  }
  res.redirect("/bulk");
}
