import { Request, Response } from "express";
import { check, validationResult } from "express-validator";
import { PublicUser } from "../models/PublicUser";
import { BookAd } from "../models/BookAd";
import { ShoppingCart } from "../models/ShoppingCart";
import { User } from "../models/User";
import mongoose from "mongoose";

/**
 * Admin dashboard for public user and book ad management
 */
export const getAdminDashboard = async (req: Request, res: Response) => {
  try {
    const user = req.user as any;
    const isHeadAdmin = user.role === 'headadmin';
    
    // Filter by school for non-head admins
    const schoolFilter = isHeadAdmin ? {} : { school: user.school };

    const [
      pendingUsers,
      pendingAds, 
      activeReservations,
      recentStats
    ] = await Promise.all([
      PublicUser.find({ ...schoolFilter, status: 'pending' }).populate('school'),
      BookAd.find({ ...schoolFilter, status: 'pending_verification' }).populate('owner book'),
      ShoppingCart.find({ 
        ...schoolFilter, 
        status: 'reserved',
        reservationExpires: { $gt: new Date() }
      }).populate('user items.bookAd'),
      getAdminStats(schoolFilter)
    ]);

    res.render("admin/publicManagement/dashboard", {
      title: "Zarządzanie Publicznym Systemem - Panel Administracyjny",
      user: req.user,
      pendingUsers,
      pendingAds,
      activeReservations,
      stats: recentStats,
      isHeadAdmin
    });

  } catch (error) {
    console.error("Admin public dashboard error:", error);
    req.flash("errors", { msg: "Wystąpił błąd podczas ładowania panelu administracyjnego." });
    res.redirect("/admin");
  }
};

/**
 * Manage public users (approve/reject/suspend)
 */
export const getManageUsers = async (req: Request, res: Response) => {
  try {
    const user = req.user as any;
    const isHeadAdmin = user.role === 'headadmin';
    
    const page = parseInt(req.query.page as string) || 1;
    const limit = 20;
    const skip = (page - 1) * limit;
    const status = req.query.status as string || '';
    const search = req.query.search as string || '';

    // Filter conditions
    const filters: any = isHeadAdmin ? {} : { school: user.school };
    
    if (status) {
      filters.status = status;
    }
    
    if (search) {
      filters.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    const [users, totalCount] = await Promise.all([
      PublicUser.find(filters)
        .populate('school')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      PublicUser.countDocuments(filters)
    ]);

    const totalPages = Math.ceil(totalCount / limit);

    res.render("admin/publicManagement/users", {
      title: "Zarządzanie Użytkownikami Publicznymi",
      user: req.user,
      users,
      currentPage: page,
      totalPages,
      totalCount,
      filters: { status, search },
      isHeadAdmin
    });

  } catch (error) {
    console.error("Manage users error:", error);
    req.flash("errors", { msg: "Wystąpił błąd podczas ładowania użytkowników." });
    res.redirect("/admin/public-management");
  }
};

/**
 * Approve public user
 */
export const postApproveUser = async (req: Request, res: Response) => {
  await check("userId", "Nieprawidłowy ID użytkownika").isMongoId().run(req);

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    req.flash("errors", errors.array());
    return res.redirect("back");
  }

  try {
    const userId = req.body.userId;
    const adminUser = req.user as any;

    const publicUser = await PublicUser.findById(userId);
    
    if (!publicUser) {
      req.flash("errors", { msg: "Nie znaleziono użytkownika." });
      return res.redirect("back");
    }

    // Check school permissions for non-head admins
    if (adminUser.role !== 'headadmin' && 
        publicUser.school.toString() !== adminUser.school.toString()) {
      req.flash("errors", { msg: "Brak uprawnień do zarządzania tym użytkownikiem." });
      return res.redirect("back");
    }

    publicUser.status = 'active';
    publicUser.approvedBy = adminUser._id;
    publicUser.approvedAt = new Date();
    await publicUser.save();

    // TODO: Send approval email notification
    // await sendUserApprovedEmail(publicUser);

    req.flash("success", { 
      msg: `Użytkownik ${publicUser.firstName} ${publicUser.lastName} został zatwierdzony.` 
    });
    res.redirect("back");

  } catch (error) {
    console.error("Approve user error:", error);
    req.flash("errors", { msg: "Wystąpił błąd podczas zatwierdzania użytkownika." });
    res.redirect("back");
  }
};

/**
 * Reject public user
 */
export const postRejectUser = async (req: Request, res: Response) => {
  await check("userId", "Nieprawidłowy ID użytkownika").isMongoId().run(req);
  await check("reason", "Podaj powód odrzucenia").notEmpty().trim().run(req);

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    req.flash("errors", errors.array());
    return res.redirect("back");
  }

  try {
    const { userId, reason } = req.body;
    const adminUser = req.user as any;

    const publicUser = await PublicUser.findById(userId);
    
    if (!publicUser) {
      req.flash("errors", { msg: "Nie znaleziono użytkownika." });
      return res.redirect("back");
    }

    // Check school permissions for non-head admins
    if (adminUser.role !== 'headadmin' && 
        publicUser.school.toString() !== adminUser.school.toString()) {
      req.flash("errors", { msg: "Brak uprawnień do zarządzania tym użytkownikiem." });
      return res.redirect("back");
    }

    publicUser.status = 'rejected';
    publicUser.rejectionReason = reason;
    publicUser.rejectedBy = adminUser._id;
    publicUser.rejectedAt = new Date();
    await publicUser.save();

    // TODO: Send rejection email notification
    // await sendUserRejectedEmail(publicUser, reason);

    req.flash("success", { 
      msg: `Użytkownik ${publicUser.firstName} ${publicUser.lastName} został odrzucony.` 
    });
    res.redirect("back");

  } catch (error) {
    console.error("Reject user error:", error);
    req.flash("errors", { msg: "Wystąpił błąd podczas odrzucania użytkownika." });
    res.redirect("back");
  }
};

/**
 * Manage book advertisements
 */
export const getManageBookAds = async (req: Request, res: Response) => {
  try {
    const user = req.user as any;
    const isHeadAdmin = user.role === 'headadmin';
    
    const page = parseInt(req.query.page as string) || 1;
    const limit = 20;
    const skip = (page - 1) * limit;
    const status = req.query.status as string || '';
    const search = req.query.search as string || '';

    // Filter conditions
    const filters: any = isHeadAdmin ? {} : { school: user.school };
    
    if (status) {
      filters.status = status;
    }
    
    if (search) {
      filters.$or = [
        { 'book.title': { $regex: search, $options: 'i' } },
        { 'book.authors': { $regex: search, $options: 'i' } }
      ];
    }

    const [bookAds, totalCount] = await Promise.all([
      BookAd.find(filters)
        .populate('owner book school')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      BookAd.countDocuments(filters)
    ]);

    const totalPages = Math.ceil(totalCount / limit);

    res.render("admin/publicManagement/bookAds", {
      title: "Zarządzanie Ogłoszeniami Książek",
      user: req.user,
      bookAds,
      currentPage: page,
      totalPages,
      totalCount,
      filters: { status, search },
      isHeadAdmin
    });

  } catch (error) {
    console.error("Manage book ads error:", error);
    req.flash("errors", { msg: "Wystąpił błąd podczas ładowania ogłoszeń." });
    res.redirect("/admin/public-management");
  }
};

/**
 * Approve book advertisement
 */
export const postApproveBookAd = async (req: Request, res: Response) => {
  await check("bookAdId", "Nieprawidłowy ID ogłoszenia").isMongoId().run(req);

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    req.flash("errors", errors.array());
    return res.redirect("back");
  }

  try {
    const bookAdId = req.body.bookAdId;
    const adminUser = req.user as any;

    const bookAd = await BookAd.findById(bookAdId).populate('owner');
    
    if (!bookAd) {
      req.flash("errors", { msg: "Nie znaleziono ogłoszenia." });
      return res.redirect("back");
    }

    // Check school permissions for non-head admins
    if (adminUser.role !== 'headadmin' && 
        bookAd.school.toString() !== adminUser.school.toString()) {
      req.flash("errors", { msg: "Brak uprawnień do zarządzania tym ogłoszeniem." });
      return res.redirect("back");
    }

    bookAd.status = 'published';
    bookAd.publishedAt = new Date();
    bookAd.approvedBy = adminUser._id;
    await bookAd.save();

    // Update owner statistics
    const owner = bookAd.owner;
    owner.totalBooksPublished = (owner.totalBooksPublished || 0) + 1;
    await owner.save();

    // TODO: Send approval notification
    // await sendBookAdApprovedEmail(bookAd);

    req.flash("success", { 
      msg: `Ogłoszenie książki "${bookAd.book.title}" zostało zatwierdzone i opublikowane.` 
    });
    res.redirect("back");

  } catch (error) {
    console.error("Approve book ad error:", error);
    req.flash("errors", { msg: "Wystąpił błąd podczas zatwierdzania ogłoszenia." });
    res.redirect("back");
  }
};

/**
 * Reject book advertisement
 */
export const postRejectBookAd = async (req: Request, res: Response) => {
  await check("bookAdId", "Nieprawidłowy ID ogłoszenia").isMongoId().run(req);
  await check("reason", "Podaj powód odrzucenia").notEmpty().trim().run(req);

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    req.flash("errors", errors.array());
    return res.redirect("back");
  }

  try {
    const { bookAdId, reason } = req.body;
    const adminUser = req.user as any;

    const bookAd = await BookAd.findById(bookAdId).populate('owner');
    
    if (!bookAd) {
      req.flash("errors", { msg: "Nie znaleziono ogłoszenia." });
      return res.redirect("back");
    }

    // Check school permissions for non-head admins  
    if (adminUser.role !== 'headadmin' && 
        bookAd.school.toString() !== adminUser.school.toString()) {
      req.flash("errors", { msg: "Brak uprawnień do zarządzania tym ogłoszeniem." });
      return res.redirect("back");
    }

    bookAd.status = 'rejected';
    bookAd.rejectionReason = reason;
    bookAd.rejectedBy = adminUser._id;
    bookAd.rejectedAt = new Date();
    await bookAd.save();

    // TODO: Send rejection notification
    // await sendBookAdRejectedEmail(bookAd, reason);

    req.flash("success", { 
      msg: `Ogłoszenie książki "${bookAd.book.title}" zostało odrzucone.` 
    });
    res.redirect("back");

  } catch (error) {
    console.error("Reject book ad error:", error);
    req.flash("errors", { msg: "Wystąpił błąd podczas odrzucania ogłoszenia." });
    res.redirect("back");
  }
};

/**
 * Sales Terminal - Process physical sales
 */
export const getSalesTerminal = async (req: Request, res: Response) => {
  try {
    res.render("admin/publicManagement/salesTerminal", {
      title: "Terminal Sprzedaży - Realizacja Rezerwacji",
      user: req.user
    });

  } catch (error) {
    console.error("Sales terminal error:", error);
    req.flash("errors", { msg: "Wystąpił błąd podczas ładowania terminala sprzedaży." });
    res.redirect("/admin/public-management");
  }
};

/**
 * Process QR code sale
 */
export const postProcessSale = async (req: Request, res: Response) => {
  await check("qrData", "Nieprawidłowe dane QR").notEmpty().run(req);

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.json({ 
      success: false, 
      message: "Nieprawidłowe dane wejściowe." 
    });
  }

  try {
    const qrData = JSON.parse(req.body.qrData);
    const { reservationCode, cartId, userId } = qrData;
    const adminUser = req.user as any;

    // Find the reservation
    const cart = await ShoppingCart.findOne({
      _id: cartId,
      reservationCode: reservationCode,
      user: userId,
      status: 'reserved'
    }).populate({
      path: 'items.bookAd',
      populate: {
        path: 'book owner'
      }
    }).populate('user');

    if (!cart) {
      return res.json({ 
        success: false, 
        message: "Nie znaleziono aktywnej rezerwacji." 
      });
    }

    // Check if reservation is still valid
    if (cart.reservationExpires && cart.reservationExpires < new Date()) {
      return res.json({ 
        success: false, 
        message: "Rezerwacja wygasła." 
      });
    }

    // Check school permissions
    if (adminUser.role !== 'headadmin' && 
        cart.school.toString() !== adminUser.school.toString()) {
      return res.json({ 
        success: false, 
        message: "Brak uprawnień do realizacji tej rezerwacji." 
      });
    }

    // Process the sale
    await processSaleTransaction(cart, adminUser);

    return res.json({ 
      success: true, 
      message: "Sprzedaż została pomyślnie zrealizowana!",
      cart: {
        id: cart._id,
        reservationCode: cart.reservationCode,
        buyer: `${cart.user.firstName} ${cart.user.lastName}`,
        itemCount: cart.items.length,
        totalAmount: cart.totalAmount,
        items: cart.items.map((item: any) => ({
          title: item.bookAd.book.title,
          seller: `${item.bookAd.owner.firstName} ${item.bookAd.owner.lastName}`,
          price: item.bookAd.sellingPrice
        }))
      }
    });

  } catch (error) {
    console.error("Process sale error:", error);
    return res.json({ 
      success: false, 
      message: "Wystąpił błąd podczas realizacji sprzedaży." 
    });
  }
};

/**
 * Helper function to process sale transaction
 */
async function processSaleTransaction(cart: any, adminUser: any) {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // Update cart status
    cart.status = 'completed';
    cart.completedAt = new Date();
    cart.completedBy = adminUser._id;
    await cart.save({ session });

    // Update book ads to sold status
    const bookAdIds = cart.items.map((item: any) => item.bookAd._id);
    await BookAd.updateMany(
      { _id: { $in: bookAdIds } },
      { 
        status: 'sold',
        soldAt: new Date(),
        soldBy: adminUser._id
      },
      { session }
    );

    // Update buyer statistics
    const buyer = cart.user;
    buyer.totalBooksPurchased = (buyer.totalBooksPurchased || 0) + cart.items.length;
    buyer.totalMoneySpent = (buyer.totalMoneySpent || 0) + cart.totalAmount;
    await buyer.save({ session });

    // Update sellers statistics
    for (const item of cart.items) {
      const seller = item.bookAd.owner;
      seller.totalBooksSold = (seller.totalBooksSold || 0) + 1;
      seller.totalMoneyEarned = (seller.totalMoneyEarned || 0) + item.bookAd.sellingPrice;
      await seller.save({ session });
    }

    await session.commitTransaction();
    
    // TODO: Send sale confirmation emails
    // await sendSaleConfirmationEmails(cart);

  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
}

/**
 * Get admin statistics for dashboard
 */
async function getAdminStats(schoolFilter: any) {
  const today = new Date();
  const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
  const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

  const [
    totalUsers,
    pendingUsers,
    totalAds,
    pendingAds,
    totalSales,
    weeklySales,
    totalRevenue
  ] = await Promise.all([
    PublicUser.countDocuments({ ...schoolFilter, status: 'active' }),
    PublicUser.countDocuments({ ...schoolFilter, status: 'pending' }),
    BookAd.countDocuments({ ...schoolFilter, status: { $in: ['published', 'reserved', 'sold'] } }),
    BookAd.countDocuments({ ...schoolFilter, status: 'pending_verification' }),
    ShoppingCart.countDocuments({ ...schoolFilter, status: 'completed' }),
    ShoppingCart.countDocuments({ ...schoolFilter, status: 'completed', completedAt: { $gte: weekAgo } }),
    ShoppingCart.aggregate([
      { $match: { ...schoolFilter, status: 'completed' } },
      { $group: { _id: null, total: { $sum: '$totalAmount' } } }
    ])
  ]);

  return {
    totalUsers,
    pendingUsers,
    totalAds,
    pendingAds,
    totalSales,
    weeklySales,
    totalRevenue: totalRevenue[0]?.total || 0
  };
}

export default {
  getAdminDashboard,
  getManageUsers,
  postApproveUser,
  postRejectUser,
  getManageBookAds,
  postApproveBookAd,
  postRejectBookAd,
  getSalesTerminal,
  postProcessSale
};
