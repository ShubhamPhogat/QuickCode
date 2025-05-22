import { MongoClient } from "mongodb";
import mongoose from "mongoose";

const uri = process.env.MONGODB_URL;

if (!uri) {
  throw new Error("Please define MONGODB_URL in your .env.local file");
}

const options = {
  useUnifiedTopology: true,
  useNewUrlParser: true,
};

// For NextAuth (native driver)
let client;
let clientPromise;

if (process.env.NODE_ENV === "development") {
  if (!global._mongoClientPromise) {
    client = new MongoClient(uri, options);
    global._mongoClientPromise = client.connect();
  }
  clientPromise = global._mongoClientPromise;
} else {
  client = new MongoClient(uri, options);
  clientPromise = client.connect();
}

// For Mongoose (ensure single connection)
const mongooseOpts = {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  bufferCommands: false, // Disable mongoose buffering
};

let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

async function connectMongoose() {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    cached.promise = mongoose.connect(uri, mongooseOpts).then((mongoose) => {
      return mongoose;
    });
  }
  cached.conn = await cached.promise;
  return cached.conn;
}

export { clientPromise, connectMongoose };
