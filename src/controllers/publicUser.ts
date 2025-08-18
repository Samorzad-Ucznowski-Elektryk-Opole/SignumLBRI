import { Request, Response, NextFunction } from "express";
import { check, validationResult } from "express-validator";
import { PublicUser, PublicUserDocument } from "../models/PublicUser";
import { School } from "../models/School";
import { BookAd } from "../models/BookAd";
import { ShoppingCart } from "../models/ShoppingCart";
import crypto from "crypto";
import nodemailer from "nodemailer";
import passport from "passport";
import { MAIL_HOST, MAIL_USER, MAIL_PASSWORD } from "../util/secrets";

/**
 * Extend Request interface to include publicUser
 */
declare global {
  namespace Express {
    interface Request {
      publicUser?: PublicUserDocument;
    }
  }
}

/**
 * Public registration page
 */
export const getPublicRegister = async (req: Request, res: Response) => {
  const schools = await School.find({}, '_id name longName').sort({ name: 1 });
  
  res.render("public/auth/register", {
    title: "Rejestracja - Targi Książkowe",
    layout: "public/layout",
    schools
  });
};

/**
 * Process public user registration
 */
export const postPublicRegister = async (req: Request, res: Response) => {
  // Validation
  await check("email", "Nieprawidłowy email").isEmail().run(req);
  await check("name", "Imię jest wymagane").isLength({ min: 2, max: 50 }).run(req);
  await check("surname", "Nazwisko jest wymagane").isLength({ min: 2, max: 50 }).run(req);
  await check("password", "Hasło musi mieć co najmniej 6 znaków").isLength({ min: 6 }).run(req);
  await check("confirmPassword", "Hasła nie pasują do siebie").equals(req.body.password).run(req);
  await check("school", "Wybierz szkołę").isMongoId().run(req);
  await check("phone", "Nieprawidłowy numer telefonu").optional().isMobilePhone("pl-PL").run(req);

  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    req.flash("errors", errors.array());
    return res.redirect("/public/register");
  }

  try {
    // Check if user already exists
    const existingUser = await PublicUser.findOne({ email: req.body.email.toLowerCase() });
    if (existingUser) {
      req.flash("errors", { msg: "Użytkownik z tym adresem email już istnieje." });
      return res.redirect("/public/register");
    }

    // Create new public user
    const user = new PublicUser({
      email: req.body.email.toLowerCase(),
      password: req.body.password,
      profile: {
        name: req.body.name,
        surname: req.body.surname,
        phone: req.body.phone || "",
        city: req.body.city || ""
      },
      school: req.body.school,
      emailVerifyToken: crypto.randomBytes(16).toString("hex")
    });

    await user.save();

    // Send verification email
    const transporter = nodemailer.createTransporter({
      host: MAIL_HOST,
      port: 465,
      secure: true,
      auth: {
        user: MAIL_USER,
        pass: MAIL_PASSWORD,
      },
    });

    const mailOptions = {
      to: user.email,
      from: MAIL_USER,
      subject: "Potwierdzenie rejestracji - Targi Książkowe",
      html: `
        <h2>Witaj w systemie Targów Książkowych!</h2>
        <p>Dziękujemy za rejestrację. Aby aktywować konto, kliknij poniższy link:</p>
        <p><a href="http://${req.headers.host}/public/verify/${user.emailVerifyToken}">Potwierdź email</a></p>
        <p>Po potwierdzeniu emaila, Twoje konto będzie oczekiwać aktywacji przez administratora szkoły.</p>
        <p>Pozdrawiamy,<br>Zespół Targów Książkowych</p>
      `,
    };

    await transporter.sendMail(mailOptions);

    req.flash("success", { 
      msg: "Rejestracja przebiegła pomyślnie! Sprawdź email i kliknij link aktywacyjny. Po potwierdzeniu emaila Twoje konto będzie oczekiwać aktywacji przez administratora." 
    });
    
    res.redirect("/public/login");

  } catch (error) {
    console.error("Registration error:", error);
    req.flash("errors", { msg: "Wystąpił błąd podczas rejestracji. Spróbuj ponownie." });
    res.redirect("/public/register");
  }
};

/**
 * Email verification
 */
export const getVerifyEmail = async (req: Request, res: Response) => {
  try {
    const user = await PublicUser.findOne({ emailVerifyToken: req.params.token });
    
    if (!user) {
      req.flash("errors", { msg: "Nieprawidłowy token weryfikacyjny." });
      return res.redirect("/public/login");
    }

    user.emailVerified = true;
    user.emailVerifyToken = undefined;
    await user.save();

    req.flash("success", { 
      msg: "Email został potwierdzony! Twoje konto oczekuje teraz aktywacji przez administratora szkoły." 
    });
    
    res.redirect("/public/login");

  } catch (error) {
    console.error("Email verification error:", error);
    req.flash("errors", { msg: "Wystąpił błąd podczas weryfikacji emaila." });
    res.redirect("/public/login");
  }
};

/**
 * Public login page
 */
export const getPublicLogin = (req: Request, res: Response) => {
  res.render("public/auth/login", {
    title: "Logowanie - Targi Książkowe",
    layout: "public/layout"
  });
};

/**
 * Process public user login
 */
export const postPublicLogin = async (req: Request, res: Response, next: NextFunction) => {
  await check("email", "Email nie jest poprawny").isEmail().run(req);
  await check("password", "Hasło nie może być puste").isLength({ min: 1 }).run(req);

  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    req.flash("errors", errors.array());
    return res.redirect("/public/login");
  }

  try {
    const user = await PublicUser.findOne({ email: req.body.email.toLowerCase() }).populate('school');
    
    if (!user) {
      req.flash("errors", { msg: "Nieprawidłowy email lub hasło." });
      return res.redirect("/public/login");
    }

    if (!user.emailVerified) {
      req.flash("errors", { msg: "Potwierdź najpierw swój adres email." });
      return res.redirect("/public/login");
    }

    if (user.status !== 'active') {
      const statusMessages = {
        'pending': 'Twoje konto oczekuje aktywacji przez administratora szkoły.',
        'suspended': 'Twoje konto zostało zawieszone. Skontaktuj się z administratorem.',
        'banned': 'Twoje konto zostało zablokowane.'
      };
      req.flash("errors", { msg: statusMessages[user.status] || 'Konto nieaktywne.' });
      return res.redirect("/public/login");
    }

    user.comparePassword(req.body.password, async (err, isMatch) => {
      if (err) {
        return next(err);
      }
      
      if (isMatch) {
        // Update last login
        user.lastLoginAt = new Date();
        await user.save();

        // Set session
        req.session.publicUserId = user._id;
        req.publicUser = user;

        req.flash("success", { msg: `Witaj, ${user.getFullName()}!` });
        return res.redirect("/public/dashboard");
      } else {
        req.flash("errors", { msg: "Nieprawidłowy email lub hasło." });
        return res.redirect("/public/login");
      }
    });

  } catch (error) {
    console.error("Login error:", error);
    req.flash("errors", { msg: "Wystąpił błąd podczas logowania." });
    res.redirect("/public/login");
  }
};

/**
 * Public user logout
 */
export const getPublicLogout = (req: Request, res: Response) => {
  req.session.destroy((err) => {
    if (err) console.log("Error destroying session:", err);
    res.redirect("/public");
  });
};

/**
 * Public user dashboard
 */
export const getPublicUserDashboard = async (req: Request, res: Response) => {
  try {
    const userId = req.publicUser!._id;
    
    // Get user's statistics
    const [myAds, myCart, totalSold] = await Promise.all([
      BookAd.find({ owner: userId }).populate('book').sort({ createdAt: -1 }).limit(5),
      ShoppingCart.findOne({ user: userId, status: 'active' }).populate({
        path: 'items.bookAd',
        populate: { path: 'book' }
      }),
      BookAd.countDocuments({ owner: userId, status: 'sold' })
    ]);

    // Get school statistics for context
    const schoolStats = await BookAd.aggregate([
      { $match: { school: req.publicUser!.school._id } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    const statsMap = schoolStats.reduce((acc, stat) => {
      acc[stat._id] = stat.count;
      return acc;
    }, {} as any);

    res.render("public/dashboard", {
      title: "Mój Panel - Targi Książkowe",
      layout: "public/layout",
      user: req.publicUser,
      myAds,
      myCart,
      totalSold,
      schoolStats: statsMap
    });

  } catch (error) {
    console.error("Dashboard error:", error);
    req.flash("errors", { msg: "Wystąpił błąd podczas ładowania dashboardu." });
    res.redirect("/public/login");
  }
};

/**
 * Middleware to ensure public user is authenticated
 */
export const isPublicAuthenticated = async (req: Request, res: Response, next: NextFunction) => {
  if (req.session.publicUserId) {
    try {
      const user = await PublicUser.findById(req.session.publicUserId).populate('school');
      if (user && user.status === 'active') {
        req.publicUser = user;
        return next();
      }
    } catch (error) {
      console.error("Authentication check error:", error);
    }
  }
  
  req.flash("errors", { msg: "Musisz być zalogowany jako użytkownik publiczny." });
  res.redirect("/public/login");
};

/**
 * Get user profile page
 */
export const getPublicProfile = (req: Request, res: Response) => {
  res.render("public/profile", {
    title: "Mój Profil - Targi Książkowe",
    layout: "public/layout",
    user: req.publicUser
  });
};

/**
 * Update public user profile
 */
export const postUpdatePublicProfile = async (req: Request, res: Response) => {
  await check("name", "Imię jest wymagane").isLength({ min: 2, max: 50 }).run(req);
  await check("surname", "Nazwisko jest wymagane").isLength({ min: 2, max: 50 }).run(req);
  await check("phone", "Nieprawidłowy numer telefonu").optional().isMobilePhone("pl-PL").run(req);

  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    req.flash("errors", errors.array());
    return res.redirect("/public/profile");
  }

  try {
    const user = req.publicUser!;
    
    user.profile.name = req.body.name;
    user.profile.surname = req.body.surname;
    user.profile.phone = req.body.phone || "";
    user.profile.city = req.body.city || "";

    await user.save();

    req.flash("success", { msg: "Profil został zaktualizowany." });
    res.redirect("/public/profile");

  } catch (error) {
    console.error("Profile update error:", error);
    req.flash("errors", { msg: "Wystąpił błąd podczas aktualizacji profilu." });
    res.redirect("/public/profile");
  }
};
