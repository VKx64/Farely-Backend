import { Request, Response, NextFunction } from "express";

interface RateLimitStore {
  [key: string]: {
    count: number;
    resetTime: number;
  };
}

const store: RateLimitStore = {};

// Clean up expired entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  Object.keys(store).forEach(key => {
    if (store[key].resetTime < now) {
      delete store[key];
    }
  });
}, 5 * 60 * 1000);

export const createRateLimit = (options: {
  windowMs: number;
  max: number;
  message?: string;
  keyGenerator?: (req: Request) => string;
}) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const key = options.keyGenerator ? options.keyGenerator(req) : req.ip || 'unknown';
    const now = Date.now();
    
    if (!store[key] || store[key].resetTime < now) {
      store[key] = {
        count: 1,
        resetTime: now + options.windowMs
      };
    } else {
      store[key].count++;
    }

    if (store[key].count > options.max) {
      res.status(429).json({
        status: "error",
        message: options.message || "Too many requests, please try again later.",
        retryAfter: Math.ceil((store[key].resetTime - now) / 1000)
      });
      return;
    }

    next();
  };
};

// Specific rate limiter for OTP requests
export const otpRateLimit = createRateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 3, // 3 OTP requests per 15 minutes
  message: "Too many OTP requests. Please wait before requesting another.",
  keyGenerator: (req: Request) => {
    const { emailOrPhone } = req.body;
    return `otp:${emailOrPhone}`;
  }
});

// General API rate limiter
export const generalRateLimit = createRateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per 15 minutes per IP
  message: "Too many requests from this IP, please try again later."
});