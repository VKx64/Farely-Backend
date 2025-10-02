import express from "express";
import {
  registerUser,
  loginUser,
  getUserProfile,
} from "../controllers/UserController.js";
import { authenticateToken } from "../middleware/authMiddleware.js";

const router = express.Router();

/**
 * User Routes
 * Handles user authentication and profile management
 */

/**
 * POST /api/users/register
 * Register a new user account
 * @access Public
 */
router.post("/register", registerUser);

/**
 * POST /api/users/login
 * Authenticate user and receive JWT token
 * @access Public
 */
router.post("/login", loginUser);

/**
 * GET /api/users/profile
 * Get authenticated user's profile information
 * @access Private - Requires valid JWT token
 */
router.get("/profile", authenticateToken, getUserProfile);

export default router;
