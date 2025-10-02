# Farely Backend API Documentation

## 📋 Table of Contents
- [Overview](#overview)
- [Quick Start](#quick-start)
- [API Endpoints](#api-endpoints)
- [Authentication](#authentication)
- [Code Architecture](#code-architecture)
- [Database Schema](#database-schema)
- [Security](#security)
- [Development](#development)

---

## Overview

**Farely Backend** is a RESTful API built with modern technologies for user authentication and management.

### Tech Stack
- **Runtime**: Node.js
- **Framework**: Express.js + TypeScript
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT (JSON Web Tokens)
- **Password Security**: bcryptjs hashing
- **Module System**: ES Modules (ESM)

### Base URL
```
http://localhost:5000
```

---

## Quick Start

### Prerequisites
- Node.js (v16+)
- MongoDB (local or Atlas)
- npm or yarn

### Installation

1. **Clone & Install**
   ```bash
   git clone <repository-url>
   cd farely-backend
   npm install
   ```

2. **Configure Environment**
   ```bash
   # Create .env file
   cp .env.example .env
   ```

   Required environment variables:
   ```env
   MONGODB_URI=mongodb://localhost:27017/farely
   JWT_SECRET=your-super-secret-jwt-key
   PORT=5000
   NODE_ENV=development
   ```

3. **Run Development Server**
   ```bash
   npm run dev
   ```

4. **Test the API**
   ```bash
   curl http://localhost:5000
   # Response: ✅ Backend API is running
   ```

---

## API Endpoints

### 🏥 Health Check

Check if the API is running.

```http
GET /
```

**Response**
```text
✅ Backend API is running
```

---

### 👤 User Endpoints

#### 1. Register New User

Create a new user account with email and password.

```http
POST /api/users/register
```

**Request Body**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "SecurePass123"
}
```

**Success Response** `201 Created`
```json
{
  "_id": "60d5ecb74f4b5c1234567890",
  "name": "John Doe",
  "email": "john@example.com",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Error Responses**

| Status | Message | Description |
|--------|---------|-------------|
| `400` | `Name, email, and password are required` | Missing required fields |
| `400` | `User already exists` | Email already registered |
| `500` | `Server error` | Internal server error |

**Example (cURL)**
```bash
curl -X POST http://localhost:5000/api/users/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "password": "SecurePass123"
  }'
```

---

#### 2. Login User

Authenticate with email and password to receive a JWT token.

```http
POST /api/users/login
```

**Request Body**
```json
{
  "email": "john@example.com",
  "password": "SecurePass123"
}
```

**Success Response** `200 OK`
```json
{
  "_id": "60d5ecb74f4b5c1234567890",
  "name": "John Doe",
  "email": "john@example.com",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Error Responses**

| Status | Message | Description |
|--------|---------|-------------|
| `400` | `Email and password are required` | Missing credentials |
| `401` | `Invalid email or password` | Wrong credentials |
| `500` | `Server error` | Internal server error |

**Example (cURL)**
```bash
curl -X POST http://localhost:5000/api/users/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "SecurePass123"
  }'
```

---

#### 3. Get User Profile

Retrieve authenticated user's profile information.

```http
GET /api/users/profile
```

**Headers**
```http
Authorization: Bearer <your-jwt-token>
```

**Success Response** `200 OK`
```json
{
  "_id": "60d5ecb74f4b5c1234567890",
  "name": "John Doe",
  "email": "john@example.com",
  "createdAt": "2025-10-02T10:30:00.000Z",
  "updatedAt": "2025-10-02T10:30:00.000Z"
}
```

**Error Responses**

| Status | Message | Description |
|--------|---------|-------------|
| `401` | `Access denied. No token provided.` | Missing Authorization header |
| `401` | `Invalid token.` | Malformed or invalid JWT |
| `401` | `Token expired.` | JWT has expired |
| `401` | `Invalid token. User not found.` | User no longer exists |
| `500` | `Server error during authentication.` | Internal server error |

**Example (cURL)**
```bash
curl -X GET http://localhost:5000/api/users/profile \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

---

## Authentication

### How JWT Authentication Works

1. **User registers or logs in** → Server returns JWT token
2. **Client stores token** (localStorage, sessionStorage, or memory)
3. **Client includes token in requests** → `Authorization: Bearer <token>`
4. **Server validates token** → Grants or denies access

### Token Details

- **Format**: Bearer Token
- **Expiration**: 30 days
- **Storage**: JWT includes user ID (payload: `{ id: userId }`)
- **Algorithm**: HS256 (HMAC with SHA-256)

### Using JWT in Requests

Always include the token in the Authorization header:

```http
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### JavaScript Example

```javascript
// Store token after login/register
const response = await fetch('/api/users/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email, password })
});
const data = await response.json();
localStorage.setItem('token', data.token);

// Use token for authenticated requests
const token = localStorage.getItem('token');
const profileResponse = await fetch('/api/users/profile', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});
```

---

## Code Architecture

The application follows **MVC (Model-View-Controller)** pattern with clear separation of concerns.

```
📁 Project Structure
├── 📁 controllers/      # Business logic & request handlers
├── 📁 middleware/       # Authentication & request processing
├── 📁 models/          # Database schemas & models
├── 📁 routes/          # API route definitions
├── 📁 types/           # TypeScript interfaces
└── 📄 server.ts        # Application entry point
```

---

### 📝 Type Definitions (`/types/index.ts`)

TypeScript interfaces for type safety across the application.

#### IUser Interface
Base user structure for API responses (password optional for security).

```typescript
export interface IUser {
  name: string;
  email: string;
  password?: string;  // Optional - excluded from responses
}
```

#### IUserDocument Interface
Extended interface for database operations (includes MongoDB fields).

```typescript
export interface IUserDocument extends IUser {
  _id: string;
  password: string;   // Required in database
  createdAt: Date;
  updatedAt: Date;
}
```

**Why Two Interfaces?**
- `IUser` → Safe for API responses (no password exposure)
- `IUserDocument` → Complete database document with all fields
- Provides type safety for different contexts

---

### 🗄️ User Model (`/models/UserModel.ts`)

Defines the MongoDB schema and validation rules.

```typescript
const UserSchema = new Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      trim: true,
      lowercase: true
    },
    password: {
      type: String,
      required: [true, "Password is required"]
    }
  },
  { timestamps: true }
);
```

#### Schema Features

| Feature | Description |
|---------|-------------|
| **Validation** | All fields are required with custom error messages |
| **Unique Email** | Prevents duplicate email registrations |
| **Data Sanitization** | `trim` removes whitespace, `lowercase` normalizes emails |
| **Auto Timestamps** | MongoDB adds `createdAt` and `updatedAt` automatically |
| **Type Safety** | Integrated with `IUserDocument` interface |

---

### 🎮 User Controller (`/controllers/UserController.ts`)

Contains business logic and request handlers for user operations.

#### registerUser()
Creates a new user account with email and password.

**Flow:**
1. Extract `name`, `email`, `password` from request body
2. Validate all required fields are present
3. Check if email already exists in database
4. Hash password using bcrypt (salt rounds: 10)
5. Create user document in MongoDB
6. Generate JWT token (30-day expiration)
7. Return user data (without password) and token

**Security:**
- Password hashed with bcrypt before storage
- Email uniqueness validation prevents duplicates
- Original password never stored or returned

---

#### loginUser()
Authenticates user with email and password.

**Flow:**
1. Extract `email` and `password` from request body
2. Validate credentials are provided
3. Find user by email in database
4. Compare provided password with stored hash
5. Generate JWT token if credentials valid
6. Return user data and token

**Security:**
- Uses `bcrypt.compare()` for secure password verification
- Same error message for invalid email/password (prevents email enumeration)
- Constant-time comparison prevents timing attacks

---

#### getUserProfile()
Returns authenticated user's profile information.

**Flow:**
1. Extract user from request (added by authentication middleware)
2. Validate user exists in request
3. Return sanitized user data with timestamps

**Security:**
- Requires valid JWT token (enforced by middleware)
- Password excluded from response
- Only authenticated users can access their own profile

---

### 🛣️ User Routes (`/routes/UserRoutes.ts`)

Defines API endpoints and maps them to controller functions.

```typescript
router.post("/register", registerUser);
router.post("/login", loginUser);
router.get("/profile", authenticateToken, getUserProfile);
```

#### Route Configuration

| Method | Endpoint | Access | Middleware | Handler |
|--------|----------|--------|------------|---------|
| `POST` | `/api/users/register` | Public | None | `registerUser` |
| `POST` | `/api/users/login` | Public | None | `loginUser` |
| `GET` | `/api/users/profile` | Private | `authenticateToken` | `getUserProfile` |

**Features:**
- RESTful design pattern
- Modular Express router
- Middleware chaining for protected routes
- Clear separation of public and private endpoints

---

### 🔐 Authentication Middleware (`/middleware/authMiddleware.ts`)

Protects routes by verifying JWT tokens and attaching user data to requests.

#### authenticateToken()

**Flow:**
1. Extract JWT from `Authorization: Bearer <token>` header
2. Check if token exists (reject if missing)
3. Verify token signature and expiration using JWT secret
4. Decode token payload to get user ID
5. Fetch user from database (exclude password field)
6. Validate user still exists
7. Attach user to request object
8. Call `next()` to continue to route handler

**Extended Request Interface:**
```typescript
export interface AuthenticatedRequest extends Request {
  user?: IUserDocument;  // Authenticated user attached here
}
```

#### Error Handling

The middleware handles different authentication failures:

| Error Type | Status | Response Message |
|------------|--------|------------------|
| No token | `401` | `Access denied. No token provided.` |
| Invalid token | `401` | `Invalid token.` |
| Expired token | `401` | `Token expired.` |
| User not found | `401` | `Invalid token. User not found.` |
| Server error | `500` | `Server error during authentication.` |

**Security Features:**
- ✅ Validates token signature with JWT secret
- ✅ Checks token expiration automatically
- ✅ Verifies user still exists in database
- ✅ Excludes password from authenticated user data
- ✅ Type-safe with TypeScript interfaces

---

## Database Schema

### User Collection

MongoDB document structure for users.

```javascript
{
  _id: ObjectId("60d5ecb74f4b5c1234567890"),
  name: "John Doe",
  email: "john@example.com",
  password: "$2a$10$hash...",  // bcrypt hashed
  createdAt: ISODate("2025-10-02T10:30:00.000Z"),
  updatedAt: ISODate("2025-10-02T10:30:00.000Z")
}
```

#### Field Reference

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `_id` | ObjectId | Auto-generated, unique | MongoDB document identifier |
| `name` | String | Required, trimmed | User's full name |
| `email` | String | Required, unique, lowercase, trimmed | User's email address |
| `password` | String | Required | bcrypt hashed password (never plain text) |
| `createdAt` | Date | Auto-generated | Account creation timestamp |
| `updatedAt` | Date | Auto-updated | Last modification timestamp |

#### Indexes

- `email` - Unique index (prevents duplicate emails)
- `_id` - Default primary key index

---

## Security

### 🔒 Security Measures

#### Password Security
- ✅ **Hashing**: bcrypt with 10 salt rounds
- ✅ **Storage**: Only hashed passwords stored in database
- ✅ **Transmission**: Original passwords never logged or returned
- ✅ **Comparison**: Constant-time comparison with `bcrypt.compare()`

#### JWT Token Security
- ✅ **Secret**: Stored in environment variables
- ✅ **Expiration**: 30-day automatic expiration
- ✅ **Algorithm**: HS256 (HMAC with SHA-256)
- ✅ **Payload**: Only user ID included (minimal data exposure)
- ✅ **Validation**: Signature and expiration checked on each request

#### Input Validation
- ✅ **Required Fields**: Server validates all required data
- ✅ **Email Format**: MongoDB schema enforces valid format
- ✅ **Data Sanitization**: Trim whitespace, lowercase emails
- ✅ **Duplicate Prevention**: Unique constraint on email field

#### API Security
- ✅ **Error Messages**: Generic messages prevent information leakage
- ✅ **Email Enumeration**: Same error for invalid email/password
- ✅ **Password Exclusion**: Passwords never included in responses
- ✅ **Token Verification**: User existence checked on each auth request

#### Best Practices
- ✅ **Environment Variables**: Secrets not hardcoded
- ✅ **HTTPS Recommended**: Use HTTPS in production
- ✅ **CORS Configuration**: Configure allowed origins
- ✅ **Error Logging**: Server logs errors for debugging

### 🚨 Security Recommendations

For production deployments, consider adding:

- Rate limiting (prevent brute force attacks)
- Input validation middleware (express-validator)
- Password strength requirements
- Account lockout after failed attempts
- Email verification for new accounts
- Two-factor authentication (2FA)
- Refresh token rotation
- CSRF protection
- Security headers (helmet.js)
- Request logging and monitoring

---

## Environment Variables

Create a `.env` file in the project root:

```env
# Database Configuration
MONGODB_URI=mongodb://localhost:27017/farely

# Authentication
JWT_SECRET=your-super-secret-jwt-key-change-in-production

# Server Configuration
PORT=5000
NODE_ENV=development
```

### Variable Reference

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `MONGODB_URI` | ✅ Yes | - | MongoDB connection string |
| `JWT_SECRET` | ✅ Yes | - | Secret key for JWT signing (use strong random string) |
| `PORT` | ❌ No | `5000` | Server port number |
| `NODE_ENV` | ❌ No | `development` | Environment mode (`development`, `production`) |

**⚠️ Security Warning**: Never commit `.env` file to version control. Use strong, random secrets in production.

---

## Development

### 📦 Dependencies

#### Production Dependencies

| Package | Purpose |
|---------|---------|
| `express` | Web application framework |
| `mongoose` | MongoDB ODM (Object Data Modeling) |
| `bcryptjs` | Password hashing and verification |
| `jsonwebtoken` | JWT creation and verification |
| `cors` | Cross-Origin Resource Sharing |
| `dotenv` | Environment variable management |
| `helmet` | Security headers middleware |
| `morgan` | HTTP request logger |

#### Development Dependencies

| Package | Purpose |
|---------|---------|
| `typescript` | TypeScript language support |
| `nodemon` | Auto-restart server on file changes |
| `tsx` | TypeScript execution engine |
| `@types/*` | TypeScript type definitions |

### 🛠️ Development Commands

```bash
# Install dependencies
npm install

# Run development server (with auto-reload)
npm run dev

# Build TypeScript to JavaScript
npm run build

# Start production server
npm start

# Run tests (if configured)
npm test
```

### 🏗️ Build Process

The application uses **ES Modules (ESM)** with TypeScript:

1. TypeScript files (`.ts`) in source directories
2. Compiled to JavaScript (`.js`) with `tsc`
3. Import statements use `.js` extension (ESM requirement)
4. `tsx` runs TypeScript directly in development
5. `node` runs compiled JavaScript in production

---

## 📚 Usage Examples

### JavaScript / Fetch API

#### 1. Register User

```javascript
const registerUser = async (name, email, password) => {
  const response = await fetch('http://localhost:5000/api/users/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, email, password })
  });

  const data = await response.json();

  if (response.ok) {
    // Store token for future requests
    localStorage.setItem('token', data.token);
    console.log('Registration successful:', data);
  } else {
    console.error('Registration failed:', data.message);
  }

  return data;
};

// Usage
registerUser('John Doe', 'john@example.com', 'SecurePass123');
```

---

#### 2. Login User

```javascript
const loginUser = async (email, password) => {
  const response = await fetch('http://localhost:5000/api/users/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });

  const data = await response.json();

  if (response.ok) {
    localStorage.setItem('token', data.token);
    console.log('Login successful:', data);
  } else {
    console.error('Login failed:', data.message);
  }

  return data;
};

// Usage
loginUser('john@example.com', 'SecurePass123');
```

---

#### 3. Get User Profile (Protected)

```javascript
const getUserProfile = async () => {
  const token = localStorage.getItem('token');

  if (!token) {
    console.error('No token found. Please login first.');
    return;
  }

  const response = await fetch('http://localhost:5000/api/users/profile', {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });

  const data = await response.json();

  if (response.ok) {
    console.log('Profile data:', data);
  } else {
    console.error('Failed to fetch profile:', data.message);

    // Handle expired/invalid token
    if (response.status === 401) {
      localStorage.removeItem('token');
      console.log('Token invalid. Please login again.');
    }
  }

  return data;
};

// Usage
getUserProfile();
```

---

### Axios Examples

```javascript
import axios from 'axios';

const API_URL = 'http://localhost:5000/api/users';

// Set default headers with token
const setAuthToken = (token) => {
  if (token) {
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  } else {
    delete axios.defaults.headers.common['Authorization'];
  }
};

// Register
const register = async (name, email, password) => {
  const { data } = await axios.post(`${API_URL}/register`, {
    name, email, password
  });

  localStorage.setItem('token', data.token);
  setAuthToken(data.token);
  return data;
};

// Login
const login = async (email, password) => {
  const { data } = await axios.post(`${API_URL}/login`, {
    email, password
  });

  localStorage.setItem('token', data.token);
  setAuthToken(data.token);
  return data;
};

// Get Profile
const getProfile = async () => {
  const token = localStorage.getItem('token');
  setAuthToken(token);

  const { data } = await axios.get(`${API_URL}/profile`);
  return data;
};
```

---

### cURL Examples

#### Register User
```bash
curl -X POST http://localhost:5000/api/users/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "password": "SecurePass123"
  }'
```

#### Login User
```bash
curl -X POST http://localhost:5000/api/users/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "SecurePass123"
  }'
```

#### Get Profile
```bash
curl -X GET http://localhost:5000/api/users/profile \
  -H "Authorization: Bearer YOUR_JWT_TOKEN_HERE"
```

---

## HTTP Status Codes

The API uses standard HTTP status codes:

| Code | Meaning | Usage |
|------|---------|-------|
| `200` | OK | Successful request (login, profile retrieval) |
| `201` | Created | Resource created successfully (registration) |
| `400` | Bad Request | Invalid input, validation errors, duplicate data |
| `401` | Unauthorized | Missing, invalid, or expired authentication |
| `500` | Internal Server Error | Unexpected server error |

---

## 🚀 Future Enhancements

### Planned Features

#### Authentication & Security
- [ ] Password reset via email
- [ ] Email verification for new accounts
- [ ] Two-factor authentication (2FA)
- [ ] OAuth integration (Google, GitHub, etc.)
- [ ] Rate limiting for API endpoints
- [ ] Account lockout after failed login attempts
- [ ] Password strength requirements

#### User Management
- [ ] Update user profile (name, email)
- [ ] Change password endpoint
- [ ] Delete user account
- [ ] User roles and permissions (admin, user)
- [ ] Profile picture upload
- [ ] User preferences/settings

#### API Improvements
- [ ] Input validation middleware (express-validator)
- [ ] API versioning (`/api/v1/...`)
- [ ] Pagination for list endpoints
- [ ] Search and filtering capabilities
- [ ] API documentation (Swagger/OpenAPI)
- [ ] GraphQL endpoint option

#### Performance & Monitoring
- [ ] Redis caching layer
- [ ] Database query optimization
- [ ] Request logging with Winston
- [ ] Error monitoring (Sentry)
- [ ] Health check endpoints
- [ ] Performance metrics dashboard
- [ ] Database indexing optimization

#### Testing & Quality
- [ ] Unit tests (Jest)
- [ ] Integration tests
- [ ] API endpoint tests (Supertest)
- [ ] Code coverage reporting
- [ ] CI/CD pipeline (GitHub Actions)
- [ ] Automated deployment

---

## 📝 Notes

- **Module System**: Uses ES Modules (ESM) - `type: "module"` in package.json
- **TypeScript**: Full TypeScript support with strict type checking
- **Architecture**: MVC pattern with clear separation of concerns
- **Database**: MongoDB with Mongoose ODM for schema validation
- **Configuration**: Environment-based configuration with dotenv
- **Development**: Hot-reload with nodemon and tsx
- **Code Quality**: Consistent coding standards and documentation

---

## 📖 Additional Resources

- [Express.js Documentation](https://expressjs.com/)
- [Mongoose Documentation](https://mongoosejs.com/)
- [JWT.io - JWT Debugger](https://jwt.io/)
- [bcrypt - npm](https://www.npmjs.com/package/bcryptjs)
- [MongoDB Atlas](https://www.mongodb.com/atlas)

---

## 📄 License

This project is part of the Farely backend system.

---

**Last Updated**: October 2, 2025

For questions or support, please contact the development team.
