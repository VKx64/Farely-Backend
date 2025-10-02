import "dotenv/config";
import express, { Request, Response } from "express";
import mongoose from "mongoose";
import cors from "cors";

// Route import
import userRoutes from "./routes/UserRoutes.js";

const app = express();
const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Basic Route
app.get("/", (req: Request, res: Response) => {
  res.send("✅ Backend API is running");
});

// API Routes
app.use("/api/users", userRoutes);

// Connect to MongoDB and start the server
if (!MONGODB_URI || !process.env.JWT_SECRET) {
  console.error("FATAL ERROR: MONGODB_URI or JWT_SECRET is not defined.");
  process.exit(1);
}

mongoose
  .connect(MONGODB_URI)
  .then(() => {
    console.log("MongoDB connected successfully");
    app.listen(PORT, () => {
      console.log(`🚀 Server is running on http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error("MongoDB connection error:", err);
    process.exit(1);
  });

