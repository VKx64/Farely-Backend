import "dotenv/config";
import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import chalk from "chalk";
import morgan from "morgan";
import helmet from "helmet";

// Route import

// Middleware import

const app = express();
const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI;

// --- Environment Variable Check ---
if (!MONGODB_URI) {
  console.error(
    chalk.red.bold(
      "[✗] MONGODB_URI environment variable is not set. Please create a .env file."
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
  .connect(MONGODB_URI)
  .then(async () => {
    console.log(chalk.green.bold("[✓] MongoDB connected successfully"));
    // Log collections and document counts
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
  })
  .catch((err) => {
    console.error(chalk.red.bold("[✗] MongoDB connection error:"), err.message);
    process.exit(1);
  });

// --- Routes ---
app.get("/", (req, res) => {
  res.send("✅ Backend API is running");
});

// --- Error Handling ---
app.use((err, req, res, next) => {
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
process.on("SIGINT", () => {
  mongoose.connection.close(() => {
    console.log(
      chalk.magenta("MongoDB connection disconnected through app termination")
    );
    process.exit(0);
  });
});
