import { Request } from "express";
import { IUser } from "../models/UserModel.js";

// Shared AuthenticatedRequest interface
export interface AuthenticatedRequest extends Request {
  user?: IUser;
}

// JWT Payload interface
export interface JwtPayload {
  userId: string;
  iat: number;
  exp: number;
}