import mongoose from "mongoose";

(async () => {
  try {
    await mongoose.connect("mongodb://farely:Naruto2133@15.235.163.184:27272/farely?authSource=admin");
    console.log("✅ Connected to MongoDB");
    process.exit(0);
  } catch (err) {
    console.error("❌ Connection failed:", err.message);
    process.exit(1);
  }
})();
