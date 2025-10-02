import mongoose, { Schema, Document } from "mongoose";
import { IUserDocument } from "../types/index.js";

/**
 * User Schema Definition
 * Defines the structure of user documents in MongoDB
 */
const UserSchema: Schema = new Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      trim: true,
      lowercase: true,
    },
    password: {
      type: String,
      required: [true, "Password is required"],
    },
  },
  {
    timestamps: true,
  }
);

/**
 * User Model
 * MongoDB model for user operations
 */
const UserModel = mongoose.model<IUserDocument & Document>("User", UserSchema);

export default UserModel;
