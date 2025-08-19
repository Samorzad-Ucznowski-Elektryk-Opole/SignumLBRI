import express, { RequestHandler, Response, Request } from "express";
import compression from "compression";
import session from "express-session";
import bodyParser from "body-parser";
import lusca from "lusca";
import MongoStore from "connect-mongo";
import flash from "express-flash";
import path from "path";
import mongoose from "mongoose";
import passport from "passport";
import bluebird from "bluebird";
import { MONGODB_URI, SESSION_SECRET, version } from "./util/secrets";
import MobileDetect from "mobile-detect";

// Import configuration for modern setup
import { getConfig } from "./config/app.config";

// Enhanced performance and security
import { setupSecurityStack } from "./validators/securityIntegration";

// Controllers (route handlers) - organized and consolidated
import * as performanceController from "./controllers/performance";
import * as homeController from "./controllers/home";
import * as userController from "./controllers/user";
import * as adminController from "./controllers/admin";
import * as adminPublicManagementController from "./controllers/adminPublicManagement";
import * as bookDictionaryController from "./controllers/bookDictionary";
import * as schoolController from "./controllers/school";
import * as errorController from "./controllers/errors";
import * as bookController from "./controllers/book";
import * as bookAdController from "./controllers/bookAd";
import * as publicUserController from "./controllers/publicUser";
import * as shoppingCartController from "./controllers/shoppingCart";
import * as imageController from "./controllers/image";

// API keys and Passport configuration
import * as passportConfig from "./config/passport";
import { languageMiddleware, changeLanguage } from "./controllers/language";

// Create Express server with enhanced configuration
const app = express();
const config = getConfig();

// Connect to MongoDB
const mongoUrl = MONGODB_URI;
mongoose.Promise = bluebird;

mongoose
  .connect(mongoUrl, {})
  .then(() => {
    /** ready to use. The `mongoose.connect()` promise resolves to undefined. */
  })
  .catch((err) => {
    console.log(
      `MongoDB connection error. Please make sure MongoDB is running. ${err}`,
    );
    // process.exit();
  });

// Express configuration with optimized settings
app.set("port", process.env.PORT || config.server.port);
app.set("views", path.join(__dirname, "../views"));
app.set("view engine", "pug");

// Enhanced middleware stack for better performance
app.use(compression({ level: 6, threshold: 1024 }));
app.use(bodyParser.json({ limit: '10mb' }) as RequestHandler);
app.use(bodyParser.urlencoded({ extended: true, limit: '10mb' }) as RequestHandler);

// Optimized session configuration
app.use(
  session({
    resave: true,
    saveUninitialized: false,
    secret: SESSION_SECRET,
    store: new MongoStore({
      mongoUrl,
    }),
    cookie: {
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
      secure: process.env.NODE_ENV === 'production',
      httpOnly: true,
      sameSite: 'strict'
    }
  }),
);

// Enhanced security middleware
app.use(passport.initialize());
app.use(passport.session());
app.use(flash());
app.use(lusca.xframe("SAMEORIGIN"));
app.use(lusca.xssProtection(true));

// Apply security stack (if available)
if (typeof setupSecurityStack === 'function') {
  setupSecurityStack(app);
}

// Enhanced request context middleware
app.use((req: Request, res: Response, next: any) => {
  res.locals.user = req.user;
  res.locals.config = config;
  next();
});

app.use((req: Request, res: Response, next: any) => {
  res.locals.device = new MobileDetect(req.headers["user-agent"]);
  res.locals.version = version.build || version.version;
  res.locals.isProduction = process.env.NODE_ENV === 'production';
  next();
});
app.use((req, res, next) => {
  req.flashError = (err, msg, redirect = true) => {
    if (err) console.error(err);

    if (Array.isArray(msg)) {
      req.flash("errors", msg);
    } else {
      req.flash("errors", { msg });
    }

    if (redirect) res.redirect("/");
  };
  next();
});
app.use(languageMiddleware);
app.use((req, res, next) => {
  // After successful login, redirect back to the intended page
  if (
    !req.user &&
    req.path !== "/login" &&
    req.path !== "/adduser" &&
    !req.path.match(/^\/auth/) &&
    !req.path.match(/\./)
  ) {
    req.session.returnTo = req.path;
  } else if (req.user && req.path == "/account") {
    req.session.returnTo = req.path;
  }
  next();
});

app.use(
  express.static(path.join(__dirname, "public"), { maxAge: 31557600000 }),
);
app.use(performanceController.registerPerformance);
/**
 * ========================================
 * MODERN ROUTE ORGANIZATION - 2025 Edition
 * Consolidated and optimized route structure
 * ========================================
 */

// Public routes (no authentication required)
app.get("/", passportConfig.isAnonymous, homeController.index);
app.get("/library", bookController.getLibrary);
app.get("/privacy", homeController.policy);
app.get("/tos", homeController.tos);

// Error reporting
app.post("/error/send", errorController.postError);

// Language support
app.post("/language", changeLanguage);

// Authentication routes - optimized flow
app.get("/login", userController.getLogin);
app.post("/login", userController.postLogin);
app.get("/logout", passportConfig.isAuthenticated, userController.logout);

// Password recovery flow
app.get("/forgot", userController.getForgot);
app.post("/forgot", userController.postForgot);
app.get("/reset/:token", userController.getReset);
app.post("/reset/:token", userController.postReset);

// User registration and verification
app.get("/verify/:token", userController.getVerify);
app.get("/resendverify", userController.getResendVerify);
app.get("/setup", userController.getSetUp);
app.post("/setup", userController.postSignup);
app.get("/signup", userController.getSignup);
app.post("/signup", userController.postSignup);

// Account management
app.get("/account", passportConfig.isAuthenticated, userController.getAccount);
app.post("/account/profile", passportConfig.isAuthenticated, userController.postUpdateProfile);
app.post("/account/password", passportConfig.isAuthenticated, userController.postUpdatePassword);
app.post("/account/delete", passportConfig.isAuthenticated, userController.postDeleteAccount);

/**
 * API examples routes.
 */
// app.get("/api", apiController.getApi);
// app.get("/api/facebook", passportConfig.isAuthenticated, passportConfig.isAuthorized, apiController.getFacebook);

/**
 * OAuth authentication routes. (Sign in)
 */
// app.get("/auth/facebook", passport.authenticate("facebook", { scope: ["email", "public_profile"] }));
// app.get("/auth/facebook/callback", passport.authenticate("facebook", { failureRedirect: "/login" }), (req, res) => {
//     res.redirect(req.session.returnTo || "/");
// });

// app.get("/book/registry", passportConfig.isAuthenticated, bookController.getBookRegistry);
// app.get("/book/list", passportConfig.isAuthenticated, bookController.getBooks);
// app.get("/book/sell", passportConfig.isAuthenticated, bookController.getSellBook);
// app.post("/book/sell", passportConfig.isAuthenticated, passportConfig.isSeller, bookController.postSellBook);
// app.get("/book/:itemID", passportConfig.isAuthenticated, bookController.editBook);
// app.post("/book/:itemID/sell", passportConfig.isAuthenticated, passportConfig.isSeller, bookController.sellBook);
app.get(
  "/find",
  passportConfig.isAuthenticated,
  passportConfig.isSeller,
  bookController.getFindListing,
);

app.get(
  "/book/add",
  passportConfig.isAuthenticated,
  bookController.getSellBook,
);
app.post(
  "/book/add",
  passportConfig.isAuthenticated,
  bookController.postSellBook,
);

app.get(
  "/book/fromisbn",
  passportConfig.isAuthenticated,
  bookController.getFillBookData,
);

app.get("/book/:id/image", imageController.getBookCover);

app.get(
  "/book/registry",
  passportConfig.isAuthenticated,
  passportConfig.isSeller,
  bookController.getBookRegistry,
);
app.get(
  "/book/:id/manage",
  passportConfig.isAuthenticated,
  bookController.getManageBook,
);
app.post(
  "/book/:id/accept",
  passportConfig.isAuthenticated,
  passportConfig.isSeller,
  bookController.acceptBook,
);
app.post(
  "/book/:id/sell",
  passportConfig.isAuthenticated,
  passportConfig.isSeller,
  bookController.sellBook,
);
app.post(
  "/book/:id/cancel",
  passportConfig.isAuthenticated,
  bookController.cancelBook,
);
app.post(
  "/book/:id/delete",
  passportConfig.isAuthenticated,
  passportConfig.isAdmin,
  bookController.deleteBook,
);
app.get("/label", passportConfig.isAuthenticated, bookController.getPrintSetup);
app.get(
  "/label/print",
  passportConfig.isAuthenticated,
  bookController.getPrintLabel,
);
app.get(
  "/label/print/success",
  passportConfig.isAuthenticated,
  bookController.redirectPrintSuccess,
);
app.get(
  "/label/registerprints",
  passportConfig.isAuthenticated,
  bookController.getRegisterPrint,
);
app.get(
  "/label/:id",
  passportConfig.isAuthenticated,
  bookController.redirectPrint,
);
app.get(
  "/bulk",
  passportConfig.isAuthenticated,
  passportConfig.isSeller,
  bookController.getBulkSell,
);
app.post(
  "/bulk",
  passportConfig.isAuthenticated,
  passportConfig.isSeller,
  bookController.postBulkSell,
);
app.get(
  "/listingJSON",
  passportConfig.isAuthenticated,
  passportConfig.isSeller,
  bookController.listingJSON,
);

app.get(
  "/school/add",
  passportConfig.isAuthenticated,
  passportConfig.isAdmin,
  schoolController.getRegisterSchool,
);

app.post(
  "/school/add",
  passportConfig.isAuthenticated,
  passportConfig.isAdmin,
  schoolController.postRegisterSchool,
);

app.get("/school/:schoolID/logo", imageController.getSchoolLogo);

const adminApiRoutes = express.Router();

adminApiRoutes.get("/users", adminController.apiUsers);
adminApiRoutes.get("/books", adminController.apiBooks);

const adminRoutes = express.Router();

adminRoutes.use(
  passportConfig.isAuthenticated,
  passportConfig.isAdmin,
  adminController.adminDataProvider
);

const adminSchoolRoutes = express.Router();

adminSchoolRoutes.get(
  "/",
  adminController.main,
);

adminSchoolRoutes.get(
  "/users",
  adminController.users,
);

adminSchoolRoutes.get(
  "/buyers",
  adminController.buyers,
);

adminSchoolRoutes.get(
  "/books",
  adminController.books,
);

adminSchoolRoutes.get(
  "/earnings",
  adminController.earnings,
);

// adminRoutes.use("/:schoolID", (req, res, next) => {res.locals.requestData = {query: req.query, params: req.params}; next();},  adminController.checkSchoolPermissions, adminSchoolRoutes);

adminRoutes.get("/", (req, res) => res.redirect("/admin/school"));
adminRoutes.use("/school/:schoolID?/",
  (req, res, next) => { res.locals.requestData = { query: req.query, params: req.params, page: req.path }; next(); },
  // (req, res, next) => {console.log(req.path); next()},
  (req, res, next) => { if (req.user.isHeadAdmin() || req.params.schoolID) return next(); else return res.redirect(`/admin/school/${res.locals.availableSchools[0]._id}`); },
  adminController.checkSchoolPermissions,
  adminSchoolRoutes);
adminRoutes.use("/api/", adminApiRoutes);

adminRoutes.get(
  "/user/:userID/",
  (req: Request, res: Response) => {
    res.redirect(`/admin/user/${req.params.userID}/manage`);
  },
);


adminRoutes.get(
  "/user/:userID/manage",
  adminController.getEditUser,
);
adminRoutes.post(
  "/user/:userID/update",
  adminController.postEditUser,
);
adminRoutes.post(
  "/user/:userID/giveMoney",
  adminController.postGiveMoneyUser,
);
adminRoutes.get(
  "/buyer/:buyerID",
  adminController.getBuyerDetails,
);

// Book Fair Routes
adminRoutes.get("/bookfair", adminController.getBookFairList);
adminRoutes.get("/bookfair/create", adminController.getCreateBookFair);
adminRoutes.post("/bookfair/create", adminController.postCreateBookFair);

// CSV Import Routes
adminRoutes.get("/import-books", adminController.getImportBooks);
adminRoutes.post("/import-books", adminController.postImportBooks);

// adminRoutes.post(
//   "/:userID/delete",
//   passportConfig.isAuthenticated,
//   passportConfig.isAdmin,
//   adminController.postRemoveUser
// );
// applicationRoutes.post("/login", userController.postLoginApp)
// applicationRoutes.get("/ping", userController.getPing);
// applicationRoutes.get("/fromisbn", passportConfig.isAuthenticated, bookController.getFillBookData)
// applicationRoutes.get("/list", passportConfig.isAuthenticatedApp, bookController.getBooks)
// applicationRoutes.post("/sell", passportConfig.isAuthenticatedApp, passportConfig.isSeller, bookController.postSellBookApp)
// applicationRoutes.get("/find", passportConfig.isAuthenticatedApp, passportConfig.isSeller, bookController.getFindListingApp)
// applicationRoutes.post("/:itemID/sell", passportConfig.isAuthenticatedApp, passportConfig.isSeller, bookController.sellBookApp);

// Import public routes
import publicRoutes from "./routes/public";

/**
 * ========================================
 * NEW E-COMMERCE ROUTES - 2025 Book Marketplace
 * Modern public user system and shopping cart
 * ========================================
 */

// Public User Registration & Authentication
app.get("/public/register", publicUserController.getPublicRegister);
app.post("/public/register", publicUserController.postPublicRegister);
app.get("/public/login", publicUserController.getPublicLogin);
app.post("/public/login", publicUserController.postPublicLogin);
app.get("/public/logout", publicUserController.getPublicLogout);

// Public User Dashboard & Profile
app.get("/public/dashboard", publicUserController.isPublicAuthenticated, publicUserController.getPublicUserDashboard);
app.get("/public/profile", publicUserController.isPublicAuthenticated, publicUserController.getPublicProfile);
app.post("/public/profile", publicUserController.isPublicAuthenticated, publicUserController.postUpdatePublicProfile);

// Book Ads Management
app.get("/public/ads/create", publicUserController.isPublicAuthenticated, bookAdController.getCreateBookAd);
app.post("/public/ads/create", publicUserController.isPublicAuthenticated, bookAdController.postCreateBookAd);
app.get("/public/ads/my", publicUserController.isPublicAuthenticated, bookAdController.getMyAds);
app.get("/public/ads/:id", publicUserController.isPublicAuthenticated, bookAdController.getBookAdDetails);
app.get("/public/ads/:id/edit", publicUserController.isPublicAuthenticated, bookAdController.getEditBookAd);
app.post("/public/ads/:id/edit", publicUserController.isPublicAuthenticated, bookAdController.postEditBookAd);
app.post("/public/ads/:id/delete", publicUserController.isPublicAuthenticated, bookAdController.postDeleteBookAd);

// Browse Available Books (public access)
app.get("/public/browse", bookAdController.getBrowseAds);
app.get("/public/search", bookAdController.getSearchAds);

// Shopping Cart System
app.get("/public/cart", publicUserController.isPublicAuthenticated, shoppingCartController.getShoppingCart);
app.post("/public/cart/add", publicUserController.isPublicAuthenticated, shoppingCartController.postAddToCart);
app.post("/public/cart/remove", publicUserController.isPublicAuthenticated, shoppingCartController.postRemoveFromCart);
app.post("/public/cart/reserve", publicUserController.isPublicAuthenticated, shoppingCartController.postReserveCart);
app.get("/public/cart/reserved", publicUserController.isPublicAuthenticated, shoppingCartController.getReservedCarts);
app.get("/public/cart/history", publicUserController.isPublicAuthenticated, shoppingCartController.getReservationHistory);
app.post("/public/cart/:cartId/cancel", publicUserController.isPublicAuthenticated, shoppingCartController.postCancelReservation);

// API endpoints for book ad images
app.get("/api/bookads/:id/images/:filename", bookAdController.getBookAdImage);

// Admin management for public users and book ads
app.use("/admin/public-management", passportConfig.isAuthenticated, passportConfig.isAdmin, adminPublicManagementController.getAdminDashboard);

// Book Dictionary Management Routes
app.get("/admin/book-dictionary", passportConfig.isAuthenticated, passportConfig.isAdmin, bookDictionaryController.getCsvImport);
app.get("/admin/book-dictionary/import", passportConfig.isAuthenticated, passportConfig.isAdmin, bookDictionaryController.getCsvImport);
app.post("/admin/book-dictionary/import", passportConfig.isAuthenticated, passportConfig.isAdmin, bookDictionaryController.uploadCsvFile, bookDictionaryController.postCsvImport);
app.get("/admin/book-dictionary/pending", passportConfig.isAuthenticated, passportConfig.isAdmin, bookDictionaryController.getPendingEntries);
app.post("/admin/book-dictionary/approve", passportConfig.isAuthenticated, passportConfig.isAdmin, bookDictionaryController.postApproveEntry);
app.post("/admin/book-dictionary/reject", passportConfig.isAuthenticated, passportConfig.isAdmin, bookDictionaryController.postRejectEntry);
app.get("/admin/book-dictionary/approved", passportConfig.isAuthenticated, passportConfig.isAdmin, bookDictionaryController.getApprovedEntries);

// Book Fair Management Routes
app.get("/admin/book-fairs", passportConfig.isAuthenticated, passportConfig.isAdmin, adminController.getBookFairs);
app.get("/admin/book-fairs/create", passportConfig.isAuthenticated, passportConfig.isAdmin, adminController.getCreateBookFair);
app.post("/admin/book-fairs/create", passportConfig.isAuthenticated, passportConfig.isAdmin, adminController.postCreateBookFair);
app.get("/admin/book-fairs/:id", passportConfig.isAuthenticated, passportConfig.isAdmin, adminController.getBookFair);
app.get("/admin/book-fairs/:id/edit", passportConfig.isAuthenticated, passportConfig.isAdmin, adminController.getEditBookFair);
app.post("/admin/book-fairs/:id/edit", passportConfig.isAuthenticated, passportConfig.isAdmin, adminController.postEditBookFair);
app.post("/admin/book-fairs/:id/delete", passportConfig.isAuthenticated, passportConfig.isAdmin, adminController.postDeleteBookFair);

// Book Fair Exhibitor Management
app.get("/admin/book-fairs/:id/exhibitors", passportConfig.isAuthenticated, passportConfig.isAdmin, adminController.getBookFairExhibitors);
app.post("/admin/book-fairs/:id/exhibitors/:exhibitorId/approve", passportConfig.isAuthenticated, passportConfig.isAdmin, adminController.postApproveExhibitor);
app.post("/admin/book-fairs/:id/exhibitors/:exhibitorId/reject", passportConfig.isAuthenticated, passportConfig.isAdmin, adminController.postRejectExhibitor);

// Public Book Fair Routes (for exhibitor registration)
app.get("/book-fairs", adminController.getPublicBookFairs);
app.get("/book-fairs/:id/register", passportConfig.isAuthenticated, adminController.getRegisterForBookFair);
app.post("/book-fairs/:id/register", passportConfig.isAuthenticated, adminController.postRegisterForBookFair);

// Book Dictionary API
app.get("/admin/book-dictionary/api/pending-count", passportConfig.isAuthenticated, passportConfig.isAdmin, bookDictionaryController.getPendingCount);
app.get("/api/book-dictionary/search", bookDictionaryController.apiSearchDictionary);

app.use("/admin", adminRoutes);
app.use("/public", publicRoutes);

// app.get("/print", showPDF);
// app.get("/print/fetch", showPDF);

export default app;
