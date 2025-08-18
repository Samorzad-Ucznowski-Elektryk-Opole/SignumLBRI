import mongoose from "mongoose";
import bcrypt from "bcrypt-nodejs";
import crypto from "crypto";
import { SchoolDocument } from "./School";
import { UserDocument } from "./User";

export type PublicUserDocument = mongoose.Document & {
  email: string;
  password: string;
  passwordResetToken?: string;
  passwordResetExpires?: Date;
  emailVerifyToken?: string;
  emailVerified: boolean;
  
  profile: {
    name: string;
    surname: string;
    phone: string;
    city: string;
  };
  
  school: SchoolDocument;
  status: 'pending' | 'active' | 'suspended' | 'banned';
  
  // Statystyki
  totalAdsPosted: number;
  totalBooksSold: number;
  totalBooksReserved: number;
  
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
  verifiedAt?: Date;
  verifiedBy?: UserDocument;
  lastLoginAt?: Date;
  
  // Metody
  comparePassword: (candidatePassword: string, cb: (err: Error, isMatch: boolean) => void) => void;
  gravatar: (size?: number) => string;
  getFullName: () => string;
};

const publicUserSchema = new mongoose.Schema<PublicUserDocument>(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true
    },
    password: {
      type: String,
      required: true,
      minlength: 6
    },
    passwordResetToken: String,
    passwordResetExpires: Date,
    emailVerifyToken: String,
    emailVerified: {
      type: Boolean,
      default: false
    },
    
    profile: {
      name: {
        type: String,
        required: true,
        trim: true,
        maxlength: 50
      },
      surname: {
        type: String,
        required: true,
        trim: true,
        maxlength: 50
      },
      phone: {
        type: String,
        trim: true,
        maxlength: 20
      },
      city: {
        type: String,
        trim: true,
        maxlength: 50
      }
    },
    
    school: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "School",
      required: true
    },
    
    status: {
      type: String,
      enum: ['pending', 'active', 'suspended', 'banned'],
      default: 'pending'
    },
    
    // Statystyki
    totalAdsPosted: {
      type: Number,
      default: 0
    },
    totalBooksSold: {
      type: Number,
      default: 0
    },
    totalBooksReserved: {
      type: Number,
      default: 0
    },
    
    verifiedAt: Date,
    verifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    },
    lastLoginAt: Date
  },
  {
    timestamps: true
  }
);

/**
 * Password hash middleware
 */
publicUserSchema.pre("save", function save(next) {
  const user = this as PublicUserDocument;
  if (!user.isModified("password")) {
    return next();
  }
  
  bcrypt.genSalt(10, (err, salt) => {
    if (err) {
      return next(err);
    }
    bcrypt.hash(user.password, salt, undefined, (err: mongoose.Error, hash) => {
      if (err) {
        return next(err);
      }
      user.password = hash;
      next();
    });
  });
});

/**
 * Password comparison method
 */
const comparePassword = function (candidatePassword: string, cb: (err: Error, isMatch: boolean) => void) {
  bcrypt.compare(candidatePassword, this.password, (err: mongoose.Error, isMatch: boolean) => {
    cb(err, isMatch);
  });
};

publicUserSchema.methods.comparePassword = comparePassword;

/**
 * Helper method for getting user's gravatar
 */
publicUserSchema.methods.gravatar = function (size: number = 200) {
  if (!this.email) {
    return `https://gravatar.com/avatar/?s=${size}&d=identicon`;
  }
  const md5 = crypto.createHash("md5").update(this.email).digest("hex");
  return `https://gravatar.com/avatar/${md5}?s=${size}&d=identicon`;
};

/**
 * Get full name
 */
publicUserSchema.methods.getFullName = function () {
  return `${this.profile.name} ${this.profile.surname}`;
};

/**
 * Indexes for performance
 */
publicUserSchema.index({ email: 1 });
publicUserSchema.index({ school: 1, status: 1 });
publicUserSchema.index({ emailVerifyToken: 1 });
publicUserSchema.index({ passwordResetToken: 1 });

export const PublicUser = mongoose.model<PublicUserDocument>("PublicUser", publicUserSchema);
