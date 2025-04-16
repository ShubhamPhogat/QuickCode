import mongoose from "mongoose";

const ConnectDb = async function () {
  try {
    const db = await mongoose.connect(
      "mongodb+srv://sphogat444:9A2qotG1XTmFlsnl@cluster0.0rtt9rj.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0"
    );
    console.log("Connected to MongoDB");
  } catch (error) {
    console.error("Error connecting to MongoDB");
  }
};

export default ConnectDb;
