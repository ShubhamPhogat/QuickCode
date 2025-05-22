import mongoose from "mongoose";

if (!global.mongoose) {
  global.mongoose = { conn: null, promise: null };
}

async function connectDb() {
  if (global.mongoose.conn) {
    console.log("connection exists");
    return global.mongoose.conn;
  }

  try {
    if (!global.mongoose.promise) {
      global.mongoose.promise = mongoose.connect(process.env.MONGODB_URL, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      });
    }

    global.mongoose.conn = await global.mongoose.promise;
    console.log("coneection made");
    return global.mongoose.conn;
  } catch (error) {
    console.error("❌ Failed to connect to MongoDB:", error);
    throw new Error("MongoDB connection error");
  }
}

export default connectDb;
