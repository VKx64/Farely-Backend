import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import UserModel from "../models/UserModel.js";
import { AuthenticatedRequest } from "../middleware/authMiddleware.js";

// Constants
const SALT_ROUNDS = 10;
const TOKEN_EXPIRY = "30d";

/**
 * Generate JWT token for user authentication
 *
 * @param userId - User's MongoDB ObjectId
 * @returns JWT token string
 */
const generateToken = (userId: string): string => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET!, {
    expiresIn: TOKEN_EXPIRY,
  });
};

/**
 * Register a new user
 *
 * @route POST /api/users/register
 * @access Public
 * @returns 201 - User created successfully with token
 * @returns 400 - User already exists or invalid data
 * @returns 500 - Server error
 */
export const registerUser = async (
  req: Request,
  res: Response
): Promise<Response> => {
  try {
    const { name, email, password } = req.body;

    // Validate required fields
    if (!name || !email || !password) {
      return res.status(400).json({
        message: "Name, email, and password are required",
      });
    }

    // Check if user already exists
    const userExists = await UserModel.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: "User already exists" });
    }

    // Hash password for secure storage
    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

    // Create new user in database
    const user = await UserModel.create({
      name,
      email,
      password: hashedPassword,
    });

    // Generate authentication token
    const token = generateToken(user._id.toString());

    return res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      token,
    });
  } catch (error) {
    console.error("Registration error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

/**
 * Authenticate and login user
 *
 * @route POST /api/users/login
 * @access Public
 * @returns 200 - Login successful with token
 * @returns 400 - Missing credentials
 * @returns 401 - Invalid credentials
 * @returns 500 - Server error
 */
export const loginUser = async (
  req: Request,
  res: Response
): Promise<Response> => {
  try {
    const { email, password } = req.body;

    // Validate required fields
    if (!email || !password) {
      return res.status(400).json({
        message: "Email and password are required",
      });
    }

    // Find user by email
    const user = await UserModel.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    // Generate authentication token
    const token = generateToken(user._id.toString());

    return res.status(200).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      token,
    });
  } catch (error) {
    console.error("Login error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

/**
 * Get authenticated user's profile
 *
 * @route GET /api/users/profile
 * @access Private (requires authentication)
 * @returns 200 - User profile data
 * @returns 500 - Server error
 */
export const getUserProfile = async (
  req: Request,
  res: Response
): Promise<Response> => {
  try {
    // User is attached to request by authentication middleware
    const user = (req as AuthenticatedRequest).user;

    if (!user) {
      return res.status(401).json({ message: "User not authenticated" });
    }

    return res.status(200).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    });
  } catch (error) {
    console.error("Profile retrieval error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};
