/**
 * Base user interface for API responses
 * Password is optional for security (excluded from responses)
 */
export interface IUser {
  name: string;
  email: string;
  password?: string;
}

/**
 * User document interface for database operations
 * Extends IUser with required database fields
 */
export interface IUserDocument extends IUser {
  _id: string;
  password: string;
  createdAt: Date;
  updatedAt: Date;
}
