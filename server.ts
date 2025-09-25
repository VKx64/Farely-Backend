import "dotenv/config";
import express, { Request, Response, NextFunction } from "express";
import mongoose from "mongoose";
import cors from "cors";
import chalk from "chalk";
import morgan from "morgan";
import helmet from "helmet";

// Route import
import userRoutes from "./routes/UserRoutes.js";

// Middleware import

interface CustomError extends Error {
  statusCode?: number;
}

const app = express();
const PORT: number = parseInt(process.env.PORT || "5000", 10);
const MONGODB_URI: string | undefined = process.env.MONGODB_URI;

// --- Environment Variable Check ---
const requiredEnvVars = ['MONGODB_URI', 'JWT_SECRET'];
const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);

if (missingEnvVars.length > 0) {
  console.error(
    chalk.red.bold(
      `[✗] Missing required environment variables: ${missingEnvVars.join(', ')}`
    )
  );
  console.error(
    chalk.yellow.bold(
      "[!] Please create a .env file with the required variables."
    )
  );
  process.exit(1);
}

// --- Middleware ---
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan("dev"));
app.use(helmet());

// --- MongoDB Connection ---
mongoose
  .connect(MONGODB_URI!)
  .then(async () => {
    console.log(chalk.green.bold("[✓] MongoDB connected successfully"));
    // Log collections and document counts
    if (mongoose.connection.db) {
      const collections = await mongoose.connection.db
        .listCollections()
        .toArray();
      console.log(
        chalk.blueBright("Available Collections:"),
        collections.map((col) => col.name)
      );
      for (const col of collections) {
        const count = await mongoose.connection.db
          .collection(col.name)
          .countDocuments();
        console.log(
          chalk.magentaBright(`Documents in collection "${col.name}":`),
          count > 0 ? `Found ${count} documents` : "No documents found"
        );
      }
    }
  })
  .catch((err: Error) => {
    console.error(chalk.red.bold("[✗] MongoDB connection error:"), err.message);
    process.exit(1);
  });

// --- Routes ---
app.get("/", (req: Request, res: Response) => {
  res.send("✅ Backend API is running");
});

// API Routes
app.use("/api/users", userRoutes);

// --- Error Handling ---
app.use((err: CustomError, req: Request, res: Response, next: NextFunction) => {
  console.error(chalk.red.bold("[✗] Unhandled Error:"), err.stack);
  res.status(err.statusCode || 500).json({
    status: "error",
    message: err.message || "An unexpected error occurred",
  });
});

// --- Server Startup ---
app.listen(PORT, "0.0.0.0", () => {
  console.log(
    chalk.cyanBright(`🚀 Server is running on http://localhost:${PORT}`)
  );
  console.log(
    chalk.yellowBright(`Environment: ${process.env.NODE_ENV || "development"}`)
  );
});

// --- Graceful Shutdown ---
process.on("SIGINT", async () => {
  try {
    await mongoose.connection.close();
    console.log(
      chalk.magenta("MongoDB connection disconnected through app termination")
    );
    process.exit(0);
  } catch (error) {
    console.error(chalk.red.bold("[✗] Error during shutdown:"), error);
    process.exit(1);
  }
});
