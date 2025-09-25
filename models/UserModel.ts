import mongoose, { Document, Schema, Model } from "mongoose";
import bcrypt from "bcrypt";

// User interface
export interface IUser extends Document {
  _id: mongoose.Types.ObjectId;
  email?: string;
  phoneNumber?: string;
  password: string;
  firstName?: string;
  lastName?: string;
  middleInitial?: string;
  suffix?: string;
  birthday?: Date;
  gender?: "male" | "female" | "other" | "prefer-not-to-say";
  address?: string;
  referralCode?: string;
  isVerified: boolean;
  isPhoneVerified: boolean;
  isEmailVerified: boolean;
  otpCode?: string;
  otpExpires?: Date;
  role: "user" | "admin" | "driver";
  profilePicture?: string;
  termsAccepted: boolean;
  termsAcceptedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
  generateOTP(): string;
}

// User Schema
const UserSchema: Schema<IUser> = new Schema(
  {
    email: {
      type: String,
      lowercase: true,
      trim: true,
      match: [
        /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
        "Please enter a valid email address",
      ],
    },
    phoneNumber: {
      type: String,
      trim: true,
      match: [/^\+?[\d\s-()]+$/, "Please enter a valid phone number"],
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [6, "Password must be at least 6 characters long"],
      select: false, // Don't include password in queries by default
    },
    firstName: {
      type: String,
      trim: true,
      maxlength: [50, "First name cannot exceed 50 characters"],
    },
    lastName: {
      type: String,
      trim: true,
      maxlength: [50, "Last name cannot exceed 50 characters"],
    },
    middleInitial: {
      type: String,
      trim: true,
      maxlength: [10, "Middle initial cannot exceed 10 characters"],
    },
    suffix: {
      type: String,
      trim: true,
      maxlength: [20, "Suffix cannot exceed 20 characters"],
    },
    birthday: {
      type: Date,
    },
    gender: {
      type: String,
      enum: ["male", "female", "other", "prefer-not-to-say"],
    },
    address: {
      type: String,
      trim: true,
      maxlength: [200, "Address cannot exceed 200 characters"],
    },
    referralCode: {
      type: String,
      trim: true,
      maxlength: [50, "Referral code cannot exceed 50 characters"],
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    isPhoneVerified: {
      type: Boolean,
      default: false,
    },
    isEmailVerified: {
      type: Boolean,
      default: false,
    },
    otpCode: {
      type: String,
      select: false, // Don't include in queries by default
    },
    otpExpires: {
      type: Date,
      select: false, // Don't include in queries by default
    },
    profilePicture: {
      type: String,
      default: null,
    },
    role: {
      type: String,
      enum: ["user", "admin", "driver"],
      default: "user",
    },
    termsAccepted: {
      type: Boolean,
      required: [true, "Terms and conditions must be accepted"],
      default: false,
    },
    termsAcceptedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

// Validation: Either email or phone number is required
UserSchema.pre<IUser>("validate", function (next) {
  if (!this.email && !this.phoneNumber) {
    this.invalidate("email", "Either email or phone number is required");
    this.invalidate("phoneNumber", "Either email or phone number is required");
  }
  next();
});

// Ensure unique email/phone combination
UserSchema.index(
  { email: 1 },
  {
    unique: true,
    partialFilterExpression: { email: { $exists: true } },
  }
);

UserSchema.index(
  { phoneNumber: 1 },
  {
    unique: true,
    partialFilterExpression: { phoneNumber: { $exists: true } },
  }
);

// Hash password before saving
UserSchema.pre<IUser>("save", async function (next) {
  // Only hash the password if it has been modified (or is new)
  if (!this.isModified("password")) return next();

  try {
    // Hash password with cost of 12
    const hashedPassword = await bcrypt.hash(this.password, 12);
    this.password = hashedPassword;
    next();
  } catch (error) {
    next(error as Error);
  }
});

// Set termsAcceptedAt when termsAccepted is set to true
UserSchema.pre<IUser>("save", function (next) {
  if (
    this.isModified("termsAccepted") &&
    this.termsAccepted &&
    !this.termsAcceptedAt
  ) {
    this.termsAcceptedAt = new Date();
  }
  next();
});

// Instance method to compare password
UserSchema.methods.comparePassword = async function (
  candidatePassword: string
): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password);
};

// Instance method to generate OTP
UserSchema.methods.generateOTP = function (): string {
  const otp = Math.floor(100000 + Math.random() * 900000).toString(); // 6 digit OTP
  this.otpCode = otp;
  this.otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes from now
  return otp;
};

// Create and export the User model
const User: Model<IUser> = mongoose.model<IUser>("User", UserSchema);

export default User;
