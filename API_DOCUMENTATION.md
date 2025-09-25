# Farely Backend API Documentation

## Overview

The Farely backend now supports a 3-step registration process matching your mobile app UI:

1. **Initial Registration** - Email/Phone + Password
2. **OTP Verification** - Verify contact method
3. **Complete Profile** - Personal information + Terms acceptance

## Base URL

```
http://localhost:5000/api/users
```

## Registration Flow

### Step 1: Initial Registration

**POST** `/register`

**Request Body:**

```json
{
  "emailOrPhone": "user@example.com",
  "password": "SecurePass123",
  "confirmPassword": "SecurePass123",
  "referralCode": "FRIEND123" // optional
}
```

**Response:**

```json
{
  "status": "success",
  "message": "Registration initiated. OTP sent to user@example.com",
  "data": {
    "userId": "60d5ecb74f4b5c1234567890",
    "otpSent": true,
    "contactMethod": "email"
  }
}
```

### Step 2: Verify OTP

**POST** `/verify-otp`

**Request Body:**

```json
{
  "emailOrPhone": "user@example.com",
  "otpCode": "123456"
}
```

**Response:**

```json
{
  "status": "success",
  "message": "OTP verified successfully",
  "data": {
    "userId": "60d5ecb74f4b5c1234567890",
    "verified": true
  }
}
```

### Step 2b: Resend OTP (if needed)

**POST** `/resend-otp`

**Request Body:**

```json
{
  "emailOrPhone": "user@example.com"
}
```

### Step 3: Complete Profile

**POST** `/complete-profile`

**Request Body:**

```json
{
  "userId": "60d5ecb74f4b5c1234567890",
  "firstName": "John",
  "lastName": "Doe",
  "middleInitial": "M", // optional
  "suffix": "Jr", // optional
  "birthday": "1990-01-15",
  "gender": "male", // male, female, other, prefer-not-to-say
  "address": "123 Main St, City, State 12345",
  "termsAccepted": true
}
```

**Response:**

```json
{
  "status": "success",
  "message": "Profile completed successfully",
  "data": {
    "user": {
      "_id": "60d5ecb74f4b5c1234567890",
      "email": "user@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "middleInitial": "M",
      "suffix": "Jr",
      "birthday": "1990-01-15T00:00:00.000Z",
      "gender": "male",
      "address": "123 Main St, City, State 12345",
      "isVerified": true,
      "isEmailVerified": true,
      "role": "user",
      "termsAccepted": true,
      "termsAcceptedAt": "2025-09-08T09:44:00.000Z",
      "createdAt": "2025-09-08T09:40:00.000Z",
      "updatedAt": "2025-09-08T09:44:00.000Z"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

## Authentication

### Login

**POST** `/login`

**Request Body:**

```json
{
  "emailOrPhone": "user@example.com",
  "password": "SecurePass123"
}
```

**Response:**

```json
{
  "status": "success",
  "message": "Login successful",
  "data": {
    "user": {
      "_id": "60d5ecb74f4b5c1234567890",
      "email": "user@example.com",
      "firstName": "John",
      "lastName": "Doe"
      // ... other user fields
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

## Protected Routes

All routes below require the `Authorization: Bearer <token>` header.

### Get User Profile

**GET** `/profile`

### Update User Profile

**PUT** `/profile`

### Admin Routes

**GET** `/` - Get all users (admin only)
**DELETE** `/:userId` - Delete user (admin only)

## Data Structure

### User Model Fields

```typescript
interface IUser {
  email?: string; // Optional - either email or phone required
  phoneNumber?: string; // Optional - either email or phone required
  password: string; // Required
  firstName?: string; // Optional during registration, required for profile completion
  lastName?: string; // Optional during registration, required for profile completion
  middleInitial?: string; // Optional
  suffix?: string; // Optional
  birthday?: Date; // Optional during registration, required for profile completion
  gender?: "male" | "female" | "other" | "prefer-not-to-say";
  address?: string; // Optional during registration, required for profile completion
  referralCode?: string; // Optional
  isVerified: boolean; // Full verification status
  isPhoneVerified: boolean; // Phone verification status
  isEmailVerified: boolean; // Email verification status
  role: "user" | "admin" | "driver";
  profilePicture?: string;
  termsAccepted: boolean; // Required for profile completion
  termsAcceptedAt?: Date; // Automatically set when terms accepted
  createdAt: Date;
  updatedAt: Date;
}
```

## Validation Rules

### Registration (Step 1)

- `emailOrPhone`: Must be valid email OR valid phone number
- `password`: Min 6 chars, must contain lowercase, uppercase, and number
- `confirmPassword`: Must match password
- `referralCode`: Optional, max 50 characters

### OTP Verification (Step 2)

- `emailOrPhone`: Required
- `otpCode`: Exactly 6 numeric digits

### Complete Profile (Step 3)

- `firstName`: Required, max 50 characters
- `lastName`: Required, max 50 characters
- `birthday`: Valid ISO date, user must be 13-120 years old
- `gender`: Must be one of the enum values
- `address`: Required, max 200 characters
- `termsAccepted`: Must be true

### Login

- `emailOrPhone`: Required
- `password`: Required

## Error Responses

All errors follow this format:

```json
{
  "status": "error",
  "message": "Error description",
  "errors": [
    {
      "field": "fieldName",
      "message": "Field-specific error message"
    }
  ]
}
```

## Environment Variables Required

```
MONGODB_URI=your-mongodb-connection-string
JWT_SECRET=your-64-character-hex-secret
JWT_EXPIRES_IN=7d
NODE_ENV=development
PORT=5000
```

## Development Notes

- OTP codes are currently logged to console for development
- In production, implement actual email/SMS sending
- JWT tokens expire in 7 days by default
- Passwords are hashed with bcrypt (cost factor 12)
- MongoDB indexes are created for email and phone (unique, sparse)
