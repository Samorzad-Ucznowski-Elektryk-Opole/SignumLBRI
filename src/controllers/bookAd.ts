import { Request, Response } from "express";
import { check, validationResult } from "express-validator";
import { BookAd, BookAdDocument } from "../models/BookAd";
import { Book } from "../models/Book";
import { PublicUser } from "../models/PublicUser";
import multer from "multer";
import path from "path";
import fs from "fs";
import sharp from "sharp";
import { cache, CacheKeys, invalidateCache } from "../util/cache";

/**
 * Performance-optimized BookAd controller with advanced caching
 */

/**
 * Configure multer for image uploads
 */
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, '../public/uploads/book-ads');
    fs.mkdirSync(uploadPath, { recursive: true });
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, `bookad-${uniqueSuffix}${path.extname(file.originalname)}`);
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
    files: 3 // Maximum 3 images per ad
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Tylko pliki obrazów (JPEG, PNG, WebP) są dozwolone'));
    }
  }
});

/**
 * Get form to create new book ad
 */
export const getCreateBookAd = async (req: Request, res: Response) => {
  try {
    // Get recent books for suggestions
    const recentBooks = await Book.find({}, 'title authors isbn publisher')
      .sort({ createdAt: -1 })
      .limit(10);

    res.render("public/ads/create", {
      title: "Dodaj Ogłoszenie - Targi Książkowe",
      layout: "public/layout", 
      user: req.publicUser,
      recentBooks
    });

  } catch (error) {
    console.error("Error loading create ad form:", error);
    req.flash("errors", { msg: "Wystąpił błąd podczas ładowania formularza." });
    res.redirect("/public/dashboard");
  }
};

/**
 * Process new book ad creation
 */
export const postCreateBookAd = [
  upload.array('images', 3),
  async (req: Request, res: Response) => {
    // Validation
    await check("bookTitle", "Tytuł książki jest wymagany").isLength({ min: 2, max: 200 }).run(req);
    await check("originalPrice", "Cena musi być liczbą między 1 a 500").isFloat({ min: 1, max: 500 }).run(req);
    await check("condition", "Wybierz stan książki").isIn(['excellent', 'good', 'acceptable', 'poor']).run(req);
    await check("description", "Opis jest zbyt długi").optional().isLength({ max: 1000 }).run(req);

    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      req.flash("errors", errors.array());
      return res.redirect("/public/ads/create");
    }

    try {
      const user = req.publicUser!;

      // Check user limits
      const userAdsCount = await BookAd.countDocuments({ owner: user._id });
      if (userAdsCount >= 50) { // Business rule: max 50 ads per user
        req.flash("errors", { msg: "Osiągnąłeś limit 50 ogłoszeń." });
        return res.redirect("/public/dashboard");
      }

      // Find or create book
      let book = await Book.findOne({
        title: req.body.bookTitle,
        authors: req.body.authors ? req.body.authors.split(',').map((a: string) => a.trim()) : []
      });

      if (!book) {
        book = new Book({
          title: req.body.bookTitle,
          authors: req.body.authors ? req.body.authors.split(',').map((a: string) => a.trim()) : [],
          publisher: req.body.publisher || "",
          isbn: req.body.isbn ? parseInt(req.body.isbn) : 0,
          pubDate: req.body.pubDate ? parseInt(req.body.pubDate) : new Date().getFullYear()
        });
        await book.save();
      }

      // Process uploaded images
      const imageFilenames: string[] = [];
      if (req.files && Array.isArray(req.files)) {
        for (const file of req.files) {
          try {
            // Resize and optimize image
            const optimizedPath = path.join(path.dirname(file.path), `opt-${file.filename}`);
            await sharp(file.path)
              .resize(800, 800, { fit: 'inside', withoutEnlargement: true })
              .jpeg({ quality: 80 })
              .toFile(optimizedPath);

            // Remove original and use optimized
            fs.unlinkSync(file.path);
            fs.renameSync(optimizedPath, file.path);
            
            imageFilenames.push(file.filename);
          } catch (error) {
            console.error("Image processing error:", error);
          }
        }
      }

      // Create book ad
      const bookAd = new BookAd({
        owner: user._id,
        book: book._id,
        originalPrice: parseFloat(req.body.originalPrice),
        margin: 5.00, // Fixed 5 PLN margin
        condition: req.body.condition,
        description: req.body.description || "",
        images: imageFilenames,
        school: user.school,
        subject: req.body.subject || "",
        class: req.body.class || "",
        status: 'pending_verification'
      });

      await bookAd.save();

      // Update user statistics
      user.totalAdsPosted += 1;
      await user.save();

      // Invalidate relevant caches
      await invalidateCache.user(user._id.toString());
      await invalidateCache.school(user.school.toString());

      req.flash("success", { 
        msg: "Ogłoszenie zostało dodane i oczekuje weryfikacji przez administratora." 
      });
      
      res.redirect("/public/ads/my");

    } catch (error) {
      console.error("Create ad error:", error);
      req.flash("errors", { msg: "Wystąpił błąd podczas tworzenia ogłoszenia." });
      res.redirect("/public/ads/create");
    }
  }
];

/**
 * Get user's ads
 */
export const getMyAds = async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = 12;
    const skip = (page - 1) * limit;

    const [ads, totalCount] = await Promise.all([
      BookAd.find({ owner: req.publicUser!._id })
        .populate('book')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      BookAd.countDocuments({ owner: req.publicUser!._id })
    ]);

    const totalPages = Math.ceil(totalCount / limit);

    res.render("public/ads/my-ads", {
      title: "Moje Ogłoszenia - Targi Książkowe",
      layout: "public/layout",
      user: req.publicUser,
      ads,
      currentPage: page,
      totalPages,
      totalCount
    });

  } catch (error) {
    console.error("Error loading user ads:", error);
    req.flash("errors", { msg: "Wystąpił błąd podczas ładowania ogłoszeń." });
    res.redirect("/public/dashboard");
  }
};

/**
 * Get public ads browser for school with advanced caching
 */
export const getBrowseAds = async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = 20;
    const skip = (page - 1) * limit;

    // Build filter query
    const filter: any = {
      school: req.publicUser!.school,
      status: 'published',
      deliveredToPoint: true
    };

    // Add search filters
    if (req.query.search) {
      filter.$text = { $search: req.query.search as string };
    }

    if (req.query.subject) {
      filter.subject = new RegExp(req.query.subject as string, 'i');
    }

    if (req.query.class) {
      filter.class = new RegExp(req.query.class as string, 'i');
    }

    if (req.query.condition) {
      filter.condition = req.query.condition;
    }

    if (req.query.maxPrice) {
      filter.sellPrice = { $lte: parseFloat(req.query.maxPrice as string) };
    }

    // Sort options
    let sort: any = { createdAt: -1 };
    if (req.query.sort === 'price-asc') sort = { sellPrice: 1 };
    if (req.query.sort === 'price-desc') sort = { sellPrice: -1 };
    if (req.query.sort === 'title') sort = { 'book.title': 1 };

    // Create cache key for this specific query
    const cacheKey = `browse:${req.publicUser!.school}:${page}:${JSON.stringify(req.query)}`;

    // Try cache first
    const cachedData = await cache.getOrSet(cacheKey, async () => {
      const [ads, totalCount, subjects, classes] = await Promise.all([
        BookAd.find(filter)
          .populate('book owner', 'title authors publisher isbn profile.name profile.surname') // Selective population
          .sort(sort)
          .skip(skip)
          .limit(limit)
          .lean(), // Use lean for performance
        BookAd.countDocuments(filter),
        BookAd.distinct('subject', { school: req.publicUser!.school, status: 'published' }),
        BookAd.distinct('class', { school: req.publicUser!.school, status: 'published' })
      ]);

      const totalPages = Math.ceil(totalCount / limit);

      return {
        ads,
        currentPage: page,
        totalPages,
        totalCount,
        subjects: subjects.filter(s => s),
        classes: classes.filter(c => c),
        filters: req.query
      };
    }, 300); // Cache for 5 minutes

    res.render("public/ads/browse", {
      title: "Przeglądaj Książki - Targi Książkowe",
      layout: "public/layout",
      user: req.publicUser,
      ...cachedData
    });

  } catch (error) {
    console.error("Error browsing ads:", error);
    req.flash("errors", { msg: "Wystąpił błąd podczas przeglądania ogłoszeń." });
    res.redirect("/public/dashboard");
  }
};

/**
 * Get single book ad details
 */
export const getBookAdDetails = async (req: Request, res: Response) => {
  try {
    const ad = await BookAd.findById(req.params.id)
      .populate('book owner school');

    if (!ad) {
      req.flash("errors", { msg: "Nie znaleziono ogłoszenia." });
      return res.redirect("/public/ads/browse");
    }

    // Check if user can view this ad
    if (ad.status !== 'published' && ad.owner._id.toString() !== req.publicUser!._id.toString()) {
      req.flash("errors", { msg: "Nie masz uprawnień do wyświetlenia tego ogłoszenia." });
      return res.redirect("/public/ads/browse");
    }

    // Get related ads (same subject/class)
    const relatedAds = await BookAd.find({
      _id: { $ne: ad._id },
      school: ad.school,
      status: 'published',
      $or: [
        { subject: ad.subject },
        { class: ad.class }
      ]
    })
    .populate('book')
    .limit(4);

    res.render("public/ads/details", {
      title: `${ad.book.title} - Targi Książkowe`,
      layout: "public/layout",
      user: req.publicUser,
      ad,
      relatedAds
    });

  } catch (error) {
    console.error("Error loading ad details:", error);
    req.flash("errors", { msg: "Wystąpił błąd podczas ładowania szczegółów ogłoszenia." });
    res.redirect("/public/ads/browse");
  }
};

/**
 * Edit book ad (owner only)
 */
export const getEditBookAd = async (req: Request, res: Response) => {
  try {
    const ad = await BookAd.findOne({
      _id: req.params.id,
      owner: req.publicUser!._id
    }).populate('book');

    if (!ad) {
      req.flash("errors", { msg: "Nie znaleziono ogłoszenia lub nie masz uprawnień do jego edycji." });
      return res.redirect("/public/ads/my");
    }

    // Can only edit drafts and rejected ads
    if (!['draft', 'rejected'].includes(ad.status)) {
      req.flash("errors", { msg: "Możesz edytować tylko szkice i odrzucone ogłoszenia." });
      return res.redirect("/public/ads/my");
    }

    res.render("public/ads/edit", {
      title: "Edytuj Ogłoszenie - Targi Książkowe",
      layout: "public/layout",
      user: req.publicUser,
      ad
    });

  } catch (error) {
    console.error("Error loading edit form:", error);
    req.flash("errors", { msg: "Wystąpił błąd podczas ładowania formularza edycji." });
    res.redirect("/public/ads/my");
  }
};

/**
 * Update book ad
 */
export const postEditBookAd = [
  upload.array('images', 3),
  async (req: Request, res: Response) => {
    await check("originalPrice", "Cena musi być liczbą między 1 a 500").isFloat({ min: 1, max: 500 }).run(req);
    await check("condition", "Wybierz stan książki").isIn(['excellent', 'good', 'acceptable', 'poor']).run(req);
    await check("description", "Opis jest zbyt długi").optional().isLength({ max: 1000 }).run(req);

    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      req.flash("errors", errors.array());
      return res.redirect(`/public/ads/${req.params.id}/edit`);
    }

    try {
      const ad = await BookAd.findOne({
        _id: req.params.id,
        owner: req.publicUser!._id
      });

      if (!ad || !['draft', 'rejected'].includes(ad.status)) {
        req.flash("errors", { msg: "Nie można edytować tego ogłoszenia." });
        return res.redirect("/public/ads/my");
      }

      // Update ad fields
      ad.originalPrice = parseFloat(req.body.originalPrice);
      ad.condition = req.body.condition;
      ad.description = req.body.description || "";
      ad.subject = req.body.subject || "";
      ad.class = req.body.class || "";

      // Process new images if uploaded
      if (req.files && Array.isArray(req.files) && req.files.length > 0) {
        // Remove old images
        for (const oldImage of ad.images) {
          const oldPath = path.join(__dirname, '../public/uploads/book-ads', oldImage);
          if (fs.existsSync(oldPath)) {
            fs.unlinkSync(oldPath);
          }
        }

        // Process new images
        const newImages: string[] = [];
        for (const file of req.files) {
          try {
            const optimizedPath = path.join(path.dirname(file.path), `opt-${file.filename}`);
            await sharp(file.path)
              .resize(800, 800, { fit: 'inside', withoutEnlargement: true })
              .jpeg({ quality: 80 })
              .toFile(optimizedPath);

            fs.unlinkSync(file.path);
            fs.renameSync(optimizedPath, file.path);
            
            newImages.push(file.filename);
          } catch (error) {
            console.error("Image processing error:", error);
          }
        }
        ad.images = newImages;
      }

      // Reset status to pending verification
      ad.status = 'pending_verification';
      ad.rejectionReason = undefined;

      await ad.save();

      req.flash("success", { msg: "Ogłoszenie zostało zaktualizowane i oczekuje ponownej weryfikacji." });
      res.redirect("/public/ads/my");

    } catch (error) {
      console.error("Edit ad error:", error);
      req.flash("errors", { msg: "Wystąpił błąd podczas aktualizacji ogłoszenia." });
      res.redirect(`/public/ads/${req.params.id}/edit`);
    }
  }
];

/**
 * Delete book ad
 */
export const postDeleteBookAd = async (req: Request, res: Response) => {
  try {
    const ad = await BookAd.findOne({
      _id: req.params.id,
      owner: req.publicUser!._id
    });

    if (!ad) {
      req.flash("errors", { msg: "Nie znaleziono ogłoszenia." });
      return res.redirect("/public/ads/my");
    }

    // Can't delete sold or reserved ads
    if (['sold', 'reserved'].includes(ad.status)) {
      req.flash("errors", { msg: "Nie można usunąć sprzedanych lub zarezerwowanych ogłoszeń." });
      return res.redirect("/public/ads/my");
    }

    // Remove images
    for (const image of ad.images) {
      const imagePath = path.join(__dirname, '../public/uploads/book-ads', image);
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
      }
    }

    await BookAd.deleteOne({ _id: ad._id });

    // Update user statistics
    const user = req.publicUser!;
    user.totalAdsPosted = Math.max(0, user.totalAdsPosted - 1);
    await user.save();

    req.flash("success", { msg: "Ogłoszenie zostało usunięte." });
    res.redirect("/public/ads/my");

  } catch (error) {
    console.error("Delete ad error:", error);
    req.flash("errors", { msg: "Wystąpił błąd podczas usuwania ogłoszenia." });
    res.redirect("/public/ads/my");
  }
};

/**
 * Serve book ad images
 */
export const getBookAdImage = (req: Request, res: Response) => {
  try {
    const imagePath = path.join(__dirname, '../public/uploads/book-ads', req.params.filename);
    
    if (!fs.existsSync(imagePath)) {
      return res.status(404).send('Image not found');
    }

    // Set appropriate headers
    res.setHeader('Cache-Control', 'public, max-age=31557600'); // 1 year
    res.sendFile(imagePath);

  } catch (error) {
    console.error("Image serve error:", error);
    res.status(500).send('Error serving image');
  }
};

/**
 * Search book ads with advanced filters
 */
export const getSearchAds = async (req: Request, res: Response) => {
  try {
    const query = req.query.q as string || '';
    const page = parseInt(req.query.page as string) || 1;
    const limit = 20;
    const skip = (page - 1) * limit;

    if (!query.trim()) {
      return res.redirect("/public/browse");
    }

    // Build search filter
    const filter: any = {
      school: req.publicUser!.school,
      status: 'published',
      deliveredToPoint: true,
      $text: { $search: query }
    };

    // Additional filters
    if (req.query.subject) {
      filter.subject = new RegExp(req.query.subject as string, 'i');
    }

    if (req.query.class) {
      filter.class = new RegExp(req.query.class as string, 'i');
    }

    if (req.query.condition) {
      filter.condition = req.query.condition;
    }

    if (req.query.maxPrice) {
      filter.sellPrice = { $lte: parseFloat(req.query.maxPrice as string) };
    }

    const [ads, totalCount] = await Promise.all([
      BookAd.find(filter)
        .populate('book owner')
        .sort({ score: { $meta: 'textScore' } })
        .skip(skip)
        .limit(limit),
      BookAd.countDocuments(filter)
    ]);

    const totalPages = Math.ceil(totalCount / limit);

    res.render("public/ads/search-results", {
      title: `Wyniki wyszukiwania: "${query}" - Targi Książkowe`,
      layout: "public/layout",
      user: req.publicUser,
      ads,
      query,
      currentPage: page,
      totalPages,
      totalCount,
      filters: req.query
    });

  } catch (error) {
    console.error("Search ads error:", error);
    req.flash("errors", { msg: "Wystąpił błąd podczas wyszukiwania." });
    res.redirect("/public/browse");
  }
};
