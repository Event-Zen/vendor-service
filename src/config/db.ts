import mongoose from "mongoose";

export async function connectDB() {
  const uri = process.env.MONGO_URI || process.env.MONGODB_URI;
  if (!uri) {
    throw new Error("MONGO_URI is missing");
  }

  mongoose.set("strictQuery", true);
  await mongoose.connect(uri);

  // eslint-disable-next-line no-console
  console.log("VendorDB connected ✅");
}
