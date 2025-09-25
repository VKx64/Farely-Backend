import express from "express";
import {
  registerUser,
  verifyOTP,
  resendOTP,
  completeProfile,
  loginUser,
  getUserProfile,
  updateUserProfile,
  getAllUsers,
  deleteUser,
} from "../controllers/UserController.js";
import { authMiddleware } from "../middleware/authMiddleware.js";
import {
  validateRegister,
  validateLogin,
  validateOTP,
  validateCompleteProfile,
  validateResendOTP,
} from "../middleware/validationMiddleware.js";
import { otpRateLimit, generalRateLimit } from "../middleware/rateLimitMiddleware.js";

const router = express.Router();

// Apply general rate limiting to all routes
router.use(generalRateLimit);

// Public routes - Registration flow
router.post("/register", otpRateLimit, validateRegister, registerUser);
router.post("/verify-otp", validateOTP, verifyOTP);
router.post("/resend-otp", otpRateLimit, validateResendOTP, resendOTP);
router.post("/complete-profile", validateCompleteProfile, completeProfile);

// Public routes - Authentication
router.post("/login", validateLogin, loginUser);

// Protected routes (require authentication)
router.use(authMiddleware); // Apply auth middleware to all routes below

router.get("/profile", getUserProfile);
router.put("/profile", updateUserProfile);

// Admin only routes
router.get("/", getAllUsers); // GET /api/users (admin only)
router.delete("/:userId", deleteUser); // DELETE /api/users/:userId (admin only)

export default router;
