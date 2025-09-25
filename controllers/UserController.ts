import { Request, Response, NextFunction } from "express";
import * as jwt from "jsonwebtoken";
import User, { IUser } from "../models/UserModel.js";
import mongoose from "mongoose";
import { AuthenticatedRequest } from "../types/index.js";

// Interface for registration data (step 1)
interface RegisterData {
  emailOrPhone: string;
  password: string;
  confirmPassword: string;
  referralCode?: string;
}

// Interface for OTP verification data (step 2)
interface OTPVerificationData {
  emailOrPhone: string;
  otpCode: string;
}

// Interface for personal information data (step 3)
interface PersonalInfoData {
  firstName: string;
  lastName: string;
  middleInitial?: string;
  suffix?: string;
  birthday: string;
  gender: "male" | "female" | "other" | "prefer-not-to-say";
  address: string;
  termsAccepted: boolean;
}

// Interface for login data
interface LoginData {
  emailOrPhone: string;
  password: string;
}

// JWT token generation
const generateToken = (userId: mongoose.Types.ObjectId): string => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("JWT_SECRET is not defined in environment variables");
  }

  return jwt.sign({ userId: userId.toString() }, secret, {
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  } as jwt.SignOptions);
};

// Helper function to determine if input is email or phone
const isEmail = (input: string): boolean => {
  const emailRegex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/;
  return emailRegex.test(input);
};

// Step 1: Initial registration (email/phone + password)
export const registerUser = async (
  req: Request<{}, {}, RegisterData>,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const session = await mongoose.startSession();
  
  try {
    const { emailOrPhone, password, confirmPassword, referralCode } = req.body;

    // Validate password confirmation
    if (password !== confirmPassword) {
      res.status(400).json({
        status: "error",
        message: "Passwords do not match",
      });
      return;
    }

    // Determine if input is email or phone
    const isEmailInput = isEmail(emailOrPhone);

    await session.withTransaction(async () => {
      // Check if user already exists within transaction
      const existingUser = isEmailInput
        ? await User.findOne({ email: emailOrPhone }).session(session)
        : await User.findOne({ phoneNumber: emailOrPhone }).session(session);

      if (existingUser) {
        throw new Error(`User with this ${
          isEmailInput ? "email" : "phone number"
        } already exists`);
      }

      // Create new user (initially unverified)
      const userData: any = {
        password,
        referralCode,
        termsAccepted: false, // Will be set in step 3
      };

      if (isEmailInput) {
        userData.email = emailOrPhone;
      } else {
        userData.phoneNumber = emailOrPhone;
      }

      const newUser = new User(userData);

      // Generate OTP
      const otpCode = newUser.generateOTP();

      const savedUser = await newUser.save({ session });

      // TODO: Send OTP via email or SMS based on input type
      // Note: Remove console.log for production - security risk
      if (process.env.NODE_ENV === 'development') {
        console.log(`OTP for ${emailOrPhone}: ${otpCode}`);
      }

      res.status(201).json({
        status: "success",
        message: `Registration initiated. OTP sent to ${emailOrPhone}`,
        data: {
          userId: savedUser._id,
          otpSent: true,
          contactMethod: isEmailInput ? "email" : "phone",
        },
      });
    });
  } catch (error: any) {
    if (error.message.includes("already exists")) {
      res.status(400).json({
        status: "error",
        message: error.message,
      });
      return;
    }
    next(error);
  } finally {
    await session.endSession();
  }
};

// Step 2: Verify OTP
export const verifyOTP = async (
  req: Request<{}, {}, OTPVerificationData>,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { emailOrPhone, otpCode } = req.body;

    // Determine if input is email or phone
    const isEmailInput = isEmail(emailOrPhone);

    // Find user and include OTP fields
    const user = isEmailInput
      ? await User.findOne({ email: emailOrPhone }).select(
          "+otpCode +otpExpires"
        )
      : await User.findOne({ phoneNumber: emailOrPhone }).select(
          "+otpCode +otpExpires"
        );

    if (!user) {
      res.status(404).json({
        status: "error",
        message: "User not found",
      });
      return;
    }

    // Check if OTP is valid and not expired
    if (!user.otpCode || user.otpCode !== otpCode) {
      res.status(400).json({
        status: "error",
        message: "Invalid OTP code",
      });
      return;
    }

    if (!user.otpExpires || user.otpExpires < new Date()) {
      res.status(400).json({
        status: "error",
        message: "OTP has expired",
      });
      return;
    }

    // Mark user as verified and clear OTP
    if (isEmailInput) {
      user.isEmailVerified = true;
    } else {
      user.isPhoneVerified = true;
    }

    user.otpCode = undefined;
    user.otpExpires = undefined;

    await user.save();

    res.status(200).json({
      status: "success",
      message: "OTP verified successfully",
      data: {
        userId: user._id,
        verified: true,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Step 3: Complete profile with personal information
export const completeProfile = async (
  req: Request<{}, {}, PersonalInfoData & { userId: string }>,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const {
      userId,
      firstName,
      lastName,
      middleInitial,
      suffix,
      birthday,
      gender,
      address,
      termsAccepted,
    } = req.body;

    if (!termsAccepted) {
      res.status(400).json({
        status: "error",
        message: "Terms and conditions must be accepted",
      });
      return;
    }

    const user = await User.findById(userId);

    if (!user) {
      res.status(404).json({
        status: "error",
        message: "User not found",
      });
      return;
    }

    // Check if user has verified their contact method
    if (!user.isEmailVerified && !user.isPhoneVerified) {
      res.status(400).json({
        status: "error",
        message: "Please verify your email or phone number first",
      });
      return;
    }

    // Update user profile
    user.firstName = firstName;
    user.lastName = lastName;
    user.middleInitial = middleInitial;
    user.suffix = suffix;
    user.birthday = new Date(birthday);
    user.gender = gender;
    user.address = address;
    user.termsAccepted = termsAccepted;
    user.isVerified = true; // Mark as fully verified

    await user.save();

    // Generate token for login
    const token = generateToken(user._id);

    // Remove sensitive data from response
    const userResponse = user.toObject() as any;
    delete userResponse.password;
    delete userResponse.otpCode;
    delete userResponse.otpExpires;

    res.status(200).json({
      status: "success",
      message: "Profile completed successfully",
      data: {
        user: userResponse,
        token,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Resend OTP
export const resendOTP = async (
  req: Request<{}, {}, { emailOrPhone: string }>,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { emailOrPhone } = req.body;

    // Determine if input is email or phone
    const isEmailInput = isEmail(emailOrPhone);

    // Find user
    const user = isEmailInput
      ? await User.findOne({ email: emailOrPhone })
      : await User.findOne({ phoneNumber: emailOrPhone });

    if (!user) {
      res.status(404).json({
        status: "error",
        message: "User not found",
      });
      return;
    }

    // Generate new OTP
    const otpCode = user.generateOTP();
    await user.save();

    // TODO: Send OTP via email or SMS based on input type
    // Note: Remove console.log for production - security risk
    if (process.env.NODE_ENV === 'development') {
      console.log(`New OTP for ${emailOrPhone}: ${otpCode}`);
    }

    res.status(200).json({
      status: "success",
      message: `New OTP sent to ${emailOrPhone}`,
      data: {
        otpSent: true,
      },
    });
  } catch (error) {
    next(error);
  }
};

// User login
export const loginUser = async (
  req: Request<{}, {}, LoginData>,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { emailOrPhone, password } = req.body;

    // Determine if input is email or phone
    const isEmailInput = isEmail(emailOrPhone);

    // Find user and include password for comparison
    const user = isEmailInput
      ? await User.findOne({ email: emailOrPhone }).select("+password")
      : await User.findOne({ phoneNumber: emailOrPhone }).select("+password");

    if (!user) {
      res.status(401).json({
        status: "error",
        message: "Invalid credentials",
      });
      return;
    }

    // Check if user is verified
    if (!user.isVerified) {
      res.status(401).json({
        status: "error",
        message: "Please complete your registration first",
      });
      return;
    }

    // Check password
    const isPasswordValid = await user.comparePassword(password);

    if (!isPasswordValid) {
      res.status(401).json({
        status: "error",
        message: "Invalid credentials",
      });
      return;
    }

    // Generate token
    const token = generateToken(user._id);

    // Remove password from response
    const userResponse = user.toObject() as any;
    delete userResponse.password;
    delete userResponse.otpCode;
    delete userResponse.otpExpires;

    res.status(200).json({
      status: "success",
      message: "Login successful",
      data: {
        user: userResponse,
        token,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Get user profile
export const getUserProfile = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const user = req.user;

    if (!user) {
      res.status(401).json({
        status: "error",
        message: "User not authenticated",
      });
      return;
    }

    res.status(200).json({
      status: "success",
      data: {
        user,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Update user profile
export const updateUserProfile = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?._id;
    const updateData = req.body;

    if (!userId) {
      res.status(401).json({
        status: "error",
        message: "User not authenticated",
      });
      return;
    }

    // Remove sensitive fields that shouldn't be updated directly
    delete updateData.password;
    delete updateData._id;
    delete updateData.role;
    delete updateData.isVerified;

    const updatedUser = await User.findByIdAndUpdate(userId, updateData, {
      new: true,
      runValidators: true,
    });

    if (!updatedUser) {
      res.status(404).json({
        status: "error",
        message: "User not found",
      });
      return;
    }

    res.status(200).json({
      status: "success",
      message: "Profile updated successfully",
      data: {
        user: updatedUser,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Get all users (admin only)
export const getAllUsers = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Check if user is admin
    if (req.user?.role !== "admin") {
      res.status(403).json({
        status: "error",
        message: "Access denied. Admin privileges required.",
      });
      return;
    }

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    const users = await User.find()
      .select("-password")
      .limit(limit)
      .skip(skip)
      .sort({ createdAt: -1 });

    const totalUsers = await User.countDocuments();
    const totalPages = Math.ceil(totalUsers / limit);

    res.status(200).json({
      status: "success",
      data: {
        users,
        pagination: {
          currentPage: page,
          totalPages,
          totalUsers,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

// Delete user (admin only)
export const deleteUser = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Check if user is admin
    if (req.user?.role !== "admin") {
      res.status(403).json({
        status: "error",
        message: "Access denied. Admin privileges required.",
      });
      return;
    }

    const { userId } = req.params;

    const deletedUser = await User.findByIdAndDelete(userId);

    if (!deletedUser) {
      res.status(404).json({
        status: "error",
        message: "User not found",
      });
      return;
    }

    res.status(200).json({
      status: "success",
      message: "User deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};
