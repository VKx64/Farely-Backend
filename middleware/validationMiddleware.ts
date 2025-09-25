import { Request, Response, NextFunction } from "express";
import { body, validationResult, ValidationError } from "express-validator";

// Validation rules for user registration (step 1)
export const validateRegister = [
  body("emailOrPhone")
    .notEmpty()
    .withMessage("Email or phone number is required")
    .custom((value) => {
      const emailRegex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/;
      const phoneRegex = /^\+?[\d\s-()]+$/;
      if (!emailRegex.test(value) && !phoneRegex.test(value)) {
        throw new Error("Please provide a valid email address or phone number");
      }
      return true;
    }),

  body("password")
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters long")
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage("Password must contain at least one lowercase letter, one uppercase letter, and one number"),

  body("confirmPassword")
    .notEmpty()
    .withMessage("Password confirmation is required")
    .custom((value, { req }) => {
      if (value !== req.body.password) {
        throw new Error("Passwords do not match");
      }
      return true;
    }),

  body("referralCode")
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage("Referral code cannot exceed 50 characters"),

  handleValidationErrors,
];

// Validation rules for OTP verification (step 2)
export const validateOTP = [
  body("emailOrPhone")
    .notEmpty()
    .withMessage("Email or phone number is required"),

  body("otpCode")
    .isLength({ min: 6, max: 6 })
    .withMessage("OTP must be exactly 6 digits")
    .isNumeric()
    .withMessage("OTP must contain only numbers"),

  handleValidationErrors,
];

// Validation rules for resend OTP
export const validateResendOTP = [
  body("emailOrPhone")
    .notEmpty()
    .withMessage("Email or phone number is required"),

  handleValidationErrors,
];

// Validation rules for completing profile (step 3)
export const validateCompleteProfile = [
  body("userId")
    .notEmpty()
    .withMessage("User ID is required")
    .isMongoId()
    .withMessage("Invalid user ID"),

  body("firstName")
    .trim()
    .notEmpty()
    .withMessage("First name is required")
    .isLength({ max: 50 })
    .withMessage("First name cannot exceed 50 characters"),

  body("lastName")
    .trim()
    .notEmpty()
    .withMessage("Last name is required")
    .isLength({ max: 50 })
    .withMessage("Last name cannot exceed 50 characters"),

  body("middleInitial")
    .optional()
    .trim()
    .isLength({ max: 10 })
    .withMessage("Middle initial cannot exceed 10 characters"),

  body("suffix")
    .optional()
    .trim()
    .isLength({ max: 20 })
    .withMessage("Suffix cannot exceed 20 characters"),

  body("birthday")
    .isISO8601()
    .withMessage("Please provide a valid date in YYYY-MM-DD format")
    .custom((value) => {
      const birthday = new Date(value);
      const today = new Date();
      const age = today.getFullYear() - birthday.getFullYear();
      if (age < 13) {
        throw new Error("You must be at least 13 years old");
      }
      if (age > 120) {
        throw new Error("Please provide a valid birth date");
      }
      return true;
    }),

  body("gender")
    .isIn(["male", "female", "other", "prefer-not-to-say"])
    .withMessage("Please select a valid gender option"),

  body("address")
    .trim()
    .notEmpty()
    .withMessage("Address is required")
    .isLength({ max: 200 })
    .withMessage("Address cannot exceed 200 characters"),

  body("termsAccepted")
    .isBoolean()
    .withMessage("Terms acceptance must be a boolean")
    .custom((value) => {
      if (!value) {
        throw new Error("Terms and conditions must be accepted");
      }
      return true;
    }),

  handleValidationErrors,
];

// Validation rules for user login
export const validateLogin = [
  body("emailOrPhone")
    .notEmpty()
    .withMessage("Email or phone number is required"),

  body("password")
    .notEmpty()
    .withMessage("Password is required"),

  handleValidationErrors,
];

// Validation rules for profile update
export const validateProfileUpdate = [
  body("username")
    .optional()
    .trim()
    .isLength({ min: 3, max: 30 })
    .withMessage("Username must be between 3 and 30 characters")
    .matches(/^[a-zA-Z0-9_-]+$/)
    .withMessage("Username can only contain letters, numbers, hyphens, and underscores"),

  body("firstName")
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage("First name cannot exceed 50 characters"),

  body("lastName")
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage("Last name cannot exceed 50 characters"),

  body("phoneNumber")
    .optional()
    .matches(/^\+?[\d\s-()]+$/)
    .withMessage("Please provide a valid phone number"),

  handleValidationErrors,
];

// Middleware to handle validation errors
function handleValidationErrors(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    res.status(400).json({
      status: "error",
      message: "Validation failed",
      errors: errors.array().map((error: ValidationError) => ({
        field: error.type === 'field' ? error.path : 'unknown',
        message: error.msg,
      })),
    });
    return;
  }
  
  next();
}
