import { Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import User from "../models/UserModel.js";
import { AuthenticatedRequest, JwtPayload } from "../types/index.js";

export const authMiddleware = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Get token from header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      res.status(401).json({
        status: "error",
        message: "Access denied. No valid token provided.",
      });
      return;
    }

    const token = authHeader.substring(7); // Remove "Bearer " prefix

    // Verify token
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      res.status(500).json({
        status: "error",
        message: "JWT secret not configured",
      });
      return;
    }

    const decoded = jwt.verify(token, secret) as JwtPayload;

    // Find user by ID
    const user = await User.findById(decoded.userId);
    
    if (!user) {
      res.status(401).json({
        status: "error",
        message: "Access denied. User not found.",
      });
      return;
    }

    // Attach user to request object
    req.user = user;
    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      res.status(401).json({
        status: "error",
        message: "Access denied. Invalid token.",
      });
      return;
    }

    if (error instanceof jwt.TokenExpiredError) {
      res.status(401).json({
        status: "error",
        message: "Access denied. Token expired.",
      });
      return;
    }

    res.status(500).json({
      status: "error",
      message: "Internal server error during authentication.",
    });
  }
};
