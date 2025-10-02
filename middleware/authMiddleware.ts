import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import UserModel from "../models/UserModel.js";
import { IUserDocument } from "../types/index.js";

/**
 * Extended Request interface with authenticated user
 */
export interface AuthenticatedRequest extends Request {
  user?: IUserDocument;
}

/**
 * JWT Authentication Middleware
 *
 * Verifies JWT token from Authorization header and attaches user to request
 *
 * @route Protected routes
 * @access Private
 * @throws 401 - If token is missing, invalid, or expired
 * @throws 500 - If server error occurs during authentication
 */
export const authenticateToken = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Extract token from Authorization header (Bearer token)
    const authHeader = req.headers.authorization;
    const token = authHeader?.startsWith("Bearer ")
      ? authHeader.slice(7)
      : null;

    if (!token) {
      res.status(401).json({ message: "Access denied. No token provided." });
      return;
    }

    // Verify JWT token and decode payload
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET!
    ) as { id: string };

    // Fetch user from database (exclude password field)
    const user = await UserModel.findById(decoded.id).select("-password");

    if (!user) {
      res.status(401).json({ message: "Invalid token. User not found." });
      return;
    }

    // Attach user to request object for downstream handlers
    req.user = user as IUserDocument;
    next();
  } catch (error) {
    console.error("Authentication error:", error);

    // Handle specific JWT errors
    if (error instanceof jwt.JsonWebTokenError) {
      res.status(401).json({ message: "Invalid token." });
      return;
    }

    if (error instanceof jwt.TokenExpiredError) {
      res.status(401).json({ message: "Token expired." });
      return;
    }

    // Generic server error
    res.status(500).json({ message: "Server error during authentication." });
  }
};