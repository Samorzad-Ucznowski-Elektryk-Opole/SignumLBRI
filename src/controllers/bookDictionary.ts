import { Request, Response } from "express";
import { check, validationResult } from "express-validator";
import { BookDictionary } from "../models/BookDictionary";
import { Book } from "../models/Book";
import { User } from "../models/User";
import { parse } from 'csv-parse/sync';
import multer from 'multer';
import path from 'path';

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({ 
  storage: storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'text/csv' || file.originalname.endsWith('.csv')) {
      cb(null, true);
    } else {
      cb(new Error('Only CSV files are allowed'), false);
    }
  },
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  }
});

export const uploadCsvFile = upload.single('csvFile');

/**
 * Display CSV import page for book dictionary
 */
export const getCsvImport = async (req: Request, res: Response) => {
  try {
    const user = req.user as any;
    const isHeadAdmin = user.role === 'headadmin';
    
    // Get statistics
    const [pendingCount, approvedCount, rejectedCount] = await Promise.all([
      BookDictionary.countDocuments({ status: 'pending' }),
      BookDictionary.countDocuments({ status: 'approved' }),
      BookDictionary.countDocuments({ status: 'rejected' })
    ]);

    res.render("admin/bookDictionary/csvImport", {
      title: "Import Książek CSV - Słownik",
      user: req.user,
      stats: {
        pending: pendingCount,
        approved: approvedCount,
        rejected: rejectedCount
      },
      isHeadAdmin
    });

  } catch (error) {
    console.error("CSV import page error:", error);
    req.flash("errors", { msg: "Wystąpił błąd podczas ładowania strony importu." });
    res.redirect("/admin");
  }
};

/**
 * Process CSV upload and parse book data
 */
export const postCsvImport = async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      req.flash("errors", { msg: "Nie przesłano pliku CSV." });
      return res.redirect("back");
    }

    const user = req.user as any;
    const csvContent = req.file.buffer.toString('utf-8');
    
    // Parse CSV
    const records = parse(csvContent, {
      columns: true,
      skip_empty_lines: true,
      delimiter: ',',
      quote: '"',
      escape: '"'
    });

    if (!records || records.length === 0) {
      req.flash("errors", { msg: "Plik CSV jest pusty lub nieprawidłowy." });
      return res.redirect("back");
    }

    const importedBooks: any[] = [];
    const errors: string[] = [];
    let successCount = 0;
    let duplicateCount = 0;

    for (let i = 0; i < records.length; i++) {
      const record = records[i];
      
      try {
        // Map CSV columns to our fields (adjust based on your CSV structure)
        const bookData = {
          isbn: record['ISBN'] || record['isbn'] || '',
          title: record['Tytuł'] || record['Title'] || record['title'] || '',
          publisher: record['Wydawca'] || record['Publisher'] || record['publisher'] || '',
          authors: record['Autorzy'] || record['Authors'] || record['authors'] || '',
          year: parseInt(record['Rok Wydania'] || record['Year'] || record['year'] || '0'),
          newPrice: parseFloat(record['Cena Nowej'] || record['New Price'] || record['newPrice'] || '0'),
          usedPrice: parseFloat(record['Cena Używanej'] || record['Used Price'] || record['usedPrice'] || '0'),
          submittedBy: user._id
        };

        // Validate required fields
        if (!bookData.isbn || !bookData.title || !bookData.publisher) {
          errors.push(`Wiersz ${i + 1}: Brak wymaganych pól (ISBN, Tytuł, Wydawca)`);
          continue;
        }

        // Check if already exists in dictionary
        const existingEntry = await BookDictionary.findOne({ 
          isbn: bookData.isbn, 
          status: { $in: ['pending', 'approved'] } 
        });

        if (existingEntry) {
          duplicateCount++;
          continue;
        }

        // Create new dictionary entry
        const dictionaryEntry = new BookDictionary(bookData);
        await dictionaryEntry.save();
        
        importedBooks.push(dictionaryEntry);
        successCount++;

      } catch (recordError: any) {
        errors.push(`Wiersz ${i + 1}: ${recordError.message}`);
      }
    }

    // Summary message
    let message = `Zaimportowano ${successCount} książek do słownika.`;
    if (duplicateCount > 0) {
      message += ` Pominięto ${duplicateCount} duplikatów.`;
    }
    if (errors.length > 0) {
      message += ` ${errors.length} błędów.`;
    }

    if (successCount > 0) {
      req.flash("success", { msg: message });
    } else {
      req.flash("errors", { msg: "Nie zaimportowano żadnych książek. " + message });
    }

    if (errors.length > 0) {
      req.flash("warnings", errors.slice(0, 10).map(err => ({ msg: err })));
    }

    res.redirect("/admin/book-dictionary/pending");

  } catch (error) {
    console.error("CSV import error:", error);
    req.flash("errors", { msg: "Wystąpił błąd podczas importu pliku CSV." });
    res.redirect("back");
  }
};

/**
 * Display pending book dictionary entries for admin approval
 */
export const getPendingEntries = async (req: Request, res: Response) => {
  try {
    const user = req.user as any;
    const isHeadAdmin = user.role === 'headadmin';
    
    const page = parseInt(req.query.page as string) || 1;
    const limit = 20;
    const skip = (page - 1) * limit;
    const search = req.query.search as string || '';

    // Filter conditions
    const filters: any = { status: 'pending' };
    
    if (search) {
      filters.$or = [
        { title: { $regex: search, $options: 'i' } },
        { publisher: { $regex: search, $options: 'i' } },
        { authors: { $regex: search, $options: 'i' } },
        { isbn: { $regex: search, $options: 'i' } }
      ];
    }

    const [entries, totalCount] = await Promise.all([
      BookDictionary.find(filters)
        .populate('submittedBy', 'profile.name profile.surname')
        .sort({ submittedAt: -1 })
        .skip(skip)
        .limit(limit),
      BookDictionary.countDocuments(filters)
    ]);

    const totalPages = Math.ceil(totalCount / limit);

    res.render("admin/bookDictionary/pending", {
      title: "Oczekujące Wpisy Słownika Książek",
      user: req.user,
      entries,
      currentPage: page,
      totalPages,
      totalCount,
      search,
      isHeadAdmin
    });

  } catch (error) {
    console.error("Pending entries error:", error);
    req.flash("errors", { msg: "Wystąpił błąd podczas ładowania oczekujących wpisów." });
    res.redirect("/admin");
  }
};

/**
 * Approve dictionary entry and optionally add to main Book model
 */
export const postApproveEntry = async (req: Request, res: Response) => {
  await check("entryId", "Nieprawidłowy ID wpisu").isMongoId().run(req);
  await check("addToMainBooks", "Nieprawidłowa wartość").optional().isBoolean().run(req);

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    req.flash("errors", errors.array());
    return res.redirect("back");
  }

  try {
    const { entryId, addToMainBooks } = req.body;
    const adminUser = req.user as any;

    const entry = await BookDictionary.findById(entryId);
    
    if (!entry || entry.status !== 'pending') {
      req.flash("errors", { msg: "Nie znaleziono oczekującego wpisu." });
      return res.redirect("back");
    }

    // Update dictionary entry status
    entry.status = 'approved';
    entry.reviewedBy = adminUser._id;
    entry.reviewedAt = new Date();
    await entry.save();

    // Optionally add to main Book model
    if (addToMainBooks === 'true') {
      const existingBook = await Book.findOne({ isbn: parseInt(entry.isbn) });
      
      if (!existingBook) {
        const newBook = new Book({
          title: entry.title,
          publisher: entry.publisher,
          authors: entry.authors.split(',').map((author: string) => author.trim()),
          pubDate: entry.year,
          isbn: parseInt(entry.isbn),
          msrp: entry.newPrice,
          image: ''
        });
        await newBook.save();
      }
    }

    req.flash("success", { 
      msg: `Wpis "${entry.title}" został zatwierdzony w słowniku.${addToMainBooks === 'true' ? ' Dodano również do głównej bazy książek.' : ''}` 
    });
    res.redirect("back");

  } catch (error) {
    console.error("Approve entry error:", error);
    req.flash("errors", { msg: "Wystąpił błąd podczas zatwierdzania wpisu." });
    res.redirect("back");
  }
};

/**
 * Reject dictionary entry
 */
export const postRejectEntry = async (req: Request, res: Response) => {
  await check("entryId", "Nieprawidłowy ID wpisu").isMongoId().run(req);
  await check("reason", "Podaj powód odrzucenia").notEmpty().trim().run(req);

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    req.flash("errors", errors.array());
    return res.redirect("back");
  }

  try {
    const { entryId, reason } = req.body;
    const adminUser = req.user as any;

    const entry = await BookDictionary.findById(entryId);
    
    if (!entry || entry.status !== 'pending') {
      req.flash("errors", { msg: "Nie znaleziono oczekującego wpisu." });
      return res.redirect("back");
    }

    entry.status = 'rejected';
    entry.reviewedBy = adminUser._id;
    entry.reviewedAt = new Date();
    entry.rejectionReason = reason;
    await entry.save();

    req.flash("success", { 
      msg: `Wpis "${entry.title}" został odrzucony.` 
    });
    res.redirect("back");

  } catch (error) {
    console.error("Reject entry error:", error);
    req.flash("errors", { msg: "Wystąpił błąd podczas odrzucania wpisu." });
    res.redirect("back");
  }
};

/**
 * API endpoint for getting count of pending book dictionary entries
 * Used by admin sidebar to show pending items badge
 */
export const getPendingCount = async (req: Request, res: Response): Promise<void> => {
    try {
        // Check if user is head admin
        if (!req.user?.isHeadAdmin()) {
            res.status(403).json({ error: 'Access denied. Head admin required.' });
            return;
        }

        const pendingCount = await BookDictionary.countDocuments({ 
            status: 'pending' 
        });

        res.json({ 
            count: pendingCount,
            lastUpdated: new Date().toISOString()
        });

    } catch (error) {
        console.error('Error fetching pending count:', error);
        res.status(500).json({ 
            error: 'Internal server error',
            count: 0 
        });
    }
};

/**
 * Search approved dictionary entries (API endpoint)
 */
export const apiSearchDictionary = async (req: Request, res: Response) => {
  try {
    const query = req.query.q as string || '';
    const limit = parseInt(req.query.limit as string) || 10;

    if (!query || query.length < 2) {
      return res.json({ results: [] });
    }

    const entries = await BookDictionary.find({
      status: 'approved',
      $or: [
        { title: { $regex: query, $options: 'i' } },
        { publisher: { $regex: query, $options: 'i' } },
        { authors: { $regex: query, $options: 'i' } },
        { isbn: { $regex: query, $options: 'i' } }
      ]
    })
    .select('isbn title publisher authors year newPrice usedPrice')
    .limit(limit)
    .sort({ title: 1 });

    res.json({ 
      results: entries,
      count: entries.length 
    });

  } catch (error) {
    console.error("Dictionary search error:", error);
    res.status(500).json({ error: "Błąd wyszukiwania w słowniku" });
  }
};

/**
 * Display approved dictionary entries
 */
export const getApprovedEntries = async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = 50;
    const skip = (page - 1) * limit;
    const search = req.query.search as string || '';

    const filters: any = { status: 'approved' };
    
    if (search) {
      filters.$or = [
        { title: { $regex: search, $options: 'i' } },
        { publisher: { $regex: search, $options: 'i' } },
        { authors: { $regex: search, $options: 'i' } },
        { isbn: { $regex: search, $options: 'i' } }
      ];
    }

    const [entries, totalCount] = await Promise.all([
      BookDictionary.find(filters)
        .sort({ title: 1 })
        .skip(skip)
        .limit(limit),
      BookDictionary.countDocuments(filters)
    ]);

    const totalPages = Math.ceil(totalCount / limit);

    res.render("admin/bookDictionary/approved", {
      title: "Zatwierdzone Wpisy Słownika Książek",
      user: req.user,
      entries,
      currentPage: page,
      totalPages,
      totalCount,
      search
    });

  } catch (error) {
    console.error("Approved entries error:", error);
    req.flash("errors", { msg: "Wystąpił błąd podczas ładowania zatwierdzonych wpisów." });
    res.redirect("/admin");
  }
};

export default {
  uploadCsvFile,
  getCsvImport,
  postCsvImport,
  getPendingEntries,
  postApproveEntry,
  postRejectEntry,
  apiSearchDictionary,
  getApprovedEntries
};
