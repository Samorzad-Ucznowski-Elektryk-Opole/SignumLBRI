import { Request, Response } from "express";
import { check, validationResult } from "express-validator";
import { ShoppingCart, ShoppingCartDocument } from "../models/ShoppingCart";
import { BookAd } from "../models/BookAd";
import { PublicUser } from "../models/PublicUser";
import mongoose from "mongoose";
import QRCode from "qrcode";

/**
 * Get user's shopping cart
 */
export const getShoppingCart = async (req: Request, res: Response) => {
  try {
    let cart = await ShoppingCart.findOne({
      user: req.publicUser!._id,
      status: { $in: ['active', 'reserved'] }
    }).populate({
      path: 'items.bookAd',
      populate: {
        path: 'book owner'
      }
    });

    // Create empty cart if doesn't exist
    if (!cart) {
      cart = new ShoppingCart({
        user: req.publicUser!._id,
        school: req.publicUser!.school,
        items: []
      });
      await cart.save();
    }

    // Calculate total amount with populated data
    if (cart.items.length > 0) {
      cart.calculateTotal();
      await cart.save();
    }

    // Check for expired items
    const now = new Date();
    const expiredItems = cart.items.filter(item => 
      item.reservationExpires && item.reservationExpires < now
    );

    if (expiredItems.length > 0) {
      // Remove expired items
      cart.items = cart.items.filter(item => 
        !item.reservationExpires || item.reservationExpires >= now
      );
      await cart.save();
      
      req.flash("info", { 
        msg: `Usunięto ${expiredItems.length} wygasłych pozycji z koszyka.` 
      });
    }

    res.render("public/cart/view", {
      title: "Mój Koszyk - Targi Książkowe",
      layout: "public/layout",
      user: req.publicUser,
      cart,
      expiredCount: expiredItems.length
    });

  } catch (error) {
    console.error("Cart view error:", error);
    req.flash("errors", { msg: "Wystąpił błąd podczas ładowania koszyka." });
    res.redirect("/public/dashboard");
  }
};

/**
 * Add item to cart
 */
export const postAddToCart = async (req: Request, res: Response) => {
  await check("bookAdId", "Nieprawidłowy ID ogłoszenia").isMongoId().run(req);

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    req.flash("errors", errors.array());
    return res.redirect("back");
  }

  try {
    const bookAdId = new mongoose.Types.ObjectId(req.body.bookAdId);
    const userId = req.publicUser!._id;

    // Check if book ad exists and is available
    const bookAd = await BookAd.findById(bookAdId).populate('owner');
    
    if (!bookAd) {
      req.flash("errors", { msg: "Nie znaleziono ogłoszenia." });
      return res.redirect("back");
    }

    // Can't buy your own books
    if (bookAd.owner._id.toString() === userId.toString()) {
      req.flash("errors", { msg: "Nie możesz kupić własnej książki." });
      return res.redirect("back");
    }

    if (!bookAd.canBeReserved()) {
      req.flash("errors", { msg: "Ta książka nie jest już dostępna." });
      return res.redirect("back");
    }

    // Find or create user's active cart
    let cart = await ShoppingCart.findOne({
      user: userId,
      status: 'active'
    });

    if (!cart) {
      cart = new ShoppingCart({
        user: userId,
        school: req.publicUser!.school,
        items: []
      });
    }

    try {
      await cart.addItem(bookAdId);
      req.flash("success", { msg: "Książka została dodana do koszyka." });
    } catch (error: any) {
      req.flash("errors", { msg: error.message || "Nie można dodać książki do koszyka." });
    }

    // Redirect to cart or back to browse
    const redirectUrl = req.body.redirect || "/public/cart";
    res.redirect(redirectUrl);

  } catch (error) {
    console.error("Add to cart error:", error);
    req.flash("errors", { msg: "Wystąpił błąd podczas dodawania do koszyka." });
    res.redirect("back");
  }
};

/**
 * Remove item from cart
 */
export const postRemoveFromCart = async (req: Request, res: Response) => {
  await check("bookAdId", "Nieprawidłowy ID ogłoszenia").isMongoId().run(req);

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    req.flash("errors", errors.array());
    return res.redirect("/public/cart");
  }

  try {
    const bookAdId = new mongoose.Types.ObjectId(req.body.bookAdId);
    const userId = req.publicUser!._id;

    const cart = await ShoppingCart.findOne({
      user: userId,
      status: 'active'
    });

    if (cart) {
      await cart.removeItem(bookAdId);
      req.flash("success", { msg: "Książka została usunięta z koszyka." });
    }

    res.redirect("/public/cart");

  } catch (error) {
    console.error("Remove from cart error:", error);
    req.flash("errors", { msg: "Wystąpił błąd podczas usuwania z koszyka." });
    res.redirect("/public/cart");
  }
};

/**
 * Reserve cart (final step before physical pickup)
 */
export const postReserveCart = async (req: Request, res: Response) => {
  try {
    const userId = req.publicUser!._id;

    const cart = await ShoppingCart.findOne({
      user: userId,
      status: 'active'
    }).populate({
      path: 'items.bookAd',
      populate: {
        path: 'book owner'
      }
    });

    if (!cart || cart.items.length === 0) {
      req.flash("errors", { msg: "Koszyk jest pusty." });
      return res.redirect("/public/cart");
    }

    // Verify all items are still available
    for (const item of cart.items) {
      const bookAd = item.bookAd as any;
      if (!bookAd.canBeReserved()) {
        req.flash("errors", { 
          msg: `Książka "${bookAd.book.title}" nie jest już dostępna. Odśwież koszyk.` 
        });
        return res.redirect("/public/cart");
      }
    }

    // Reserve the cart
    await cart.reserveCart();

    // Update user statistics
    const user = req.publicUser!;
    user.totalBooksReserved += cart.items.length;
    await user.save();

    req.flash("success", { 
      msg: `Koszyk został zarezerwowany! Kod rezerwacji: ${cart.reservationCode}` 
    });
    
    res.redirect(`/public/cart/reservation/${cart._id}`);

  } catch (error) {
    console.error("Reserve cart error:", error);
    req.flash("errors", { msg: "Wystąpił błąd podczas rezerwacji koszyka." });
    res.redirect("/public/cart");
  }
};

/**
 * Show reservation details
 */
export const getReservationDetails = async (req: Request, res: Response) => {
  try {
    const cartId = req.params.cartId;
    const userId = req.publicUser!._id;

    const cart = await ShoppingCart.findOne({
      _id: cartId,
      user: userId,
      status: 'reserved'
    }).populate({
      path: 'items.bookAd',
      populate: {
        path: 'book owner'
      }
    });

    if (!cart) {
      req.flash("errors", { msg: "Nie znaleziono rezerwacji." });
      return res.redirect("/public/dashboard");
    }

    // Generate QR code for reservation
    const qrData = {
      reservationCode: cart.reservationCode,
      userId: userId.toString(),
      cartId: cartId,
      amount: cart.totalAmount,
      expires: cart.reservationExpires
    };

    const qrCodeUrl = await QRCode.toDataURL(JSON.stringify(qrData));

    res.render("public/cart/reservation", {
      title: "Szczegóły Rezerwacji - Targi Książkowe", 
      layout: "public/layout",
      user: req.publicUser,
      cart,
      qrCodeUrl
    });

  } catch (error) {
    console.error("Reservation details error:", error);
    req.flash("errors", { msg: "Wystąpił błąd podczas ładowania szczegółów rezerwacji." });
    res.redirect("/public/dashboard");
  }
};

/**
 * Get user's reservation history
 */
export const getReservationHistory = async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = 10;
    const skip = (page - 1) * limit;

    const [carts, totalCount] = await Promise.all([
      ShoppingCart.find({
        user: req.publicUser!._id,
        status: { $in: ['reserved', 'completed', 'expired', 'cancelled'] }
      })
      .populate({
        path: 'items.bookAd',
        populate: {
          path: 'book'
        }
      })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
      
      ShoppingCart.countDocuments({
        user: req.publicUser!._id,
        status: { $in: ['reserved', 'completed', 'expired', 'cancelled'] }
      })
    ]);

    const totalPages = Math.ceil(totalCount / limit);

    res.render("public/cart/history", {
      title: "Historia Rezerwacji - Targi Książkowe",
      layout: "public/layout", 
      user: req.publicUser,
      carts,
      currentPage: page,
      totalPages,
      totalCount
    });

  } catch (error) {
    console.error("Reservation history error:", error);
    req.flash("errors", { msg: "Wystąpił błąd podczas ładowania historii." });
    res.redirect("/public/dashboard");
  }
};

/**
 * Cancel reservation (if not yet completed)
 */
export const postCancelReservation = async (req: Request, res: Response) => {
  try {
    const cartId = req.params.cartId;
    const userId = req.publicUser!._id;

    const cart = await ShoppingCart.findOne({
      _id: cartId,
      user: userId,
      status: 'reserved'
    });

    if (!cart) {
      req.flash("errors", { msg: "Nie znaleziono rezerwacji lub nie można jej anulować." });
      return res.redirect("/public/cart/history");
    }

    // Release book ads
    const BookAd = mongoose.model('BookAd');
    const bookAdIds = cart.items.map((item: any) => item.bookAd);

    await BookAd.updateMany(
      { _id: { $in: bookAdIds } },
      { 
        $unset: { 
          reservedBy: 1,
          reservedAt: 1,
          reservationExpires: 1,
          reservationCode: 1
        },
        status: 'published'
      }
    );

    // Update cart status
    cart.status = 'cancelled';
    await cart.save();

    // Update user statistics
    const user = req.publicUser!;
    user.totalBooksReserved = Math.max(0, user.totalBooksReserved - cart.items.length);
    await user.save();

    req.flash("success", { msg: "Rezerwacja została anulowana." });
    res.redirect("/public/cart/history");

  } catch (error) {
    console.error("Cancel reservation error:", error);
    req.flash("errors", { msg: "Wystąpił błąd podczas anulowania rezerwacji." });
    res.redirect("/public/cart/history");
  }
};

/**
 * API endpoint to get cart items count
 */
export const getCartItemsCount = async (req: Request, res: Response) => {
  try {
    if (!req.publicUser) {
      return res.json({ count: 0 });
    }

    const cart = await ShoppingCart.findOne({
      user: req.publicUser._id,
      status: 'active'
    });

    const count = cart ? cart.items.length : 0;
    res.json({ count });

  } catch (error) {
    console.error("Cart count error:", error);
    res.json({ count: 0 });
  }
};

/**
 * Clear expired reservations (scheduled job)
 */
export const clearExpiredReservations = async () => {
  try {
    const expiredCount = await ShoppingCart.cleanExpiredCarts();
    console.log(`Cleared ${expiredCount} expired cart reservations`);
    return expiredCount;
  } catch (error) {
    console.error("Clear expired reservations error:", error);
    return 0;
  }
};
