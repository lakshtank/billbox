const mongoose = require('mongoose');

let cached = global.mongoose;
if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

const ATLAS_FALLBACK_URI =
  'mongodb+srv://billbox_admin:1234567890@cluster0.dqtzwto.mongodb.net/billbox?retryWrites=true&w=majority&appName=Cluster0';

const connectDB = async () => {
  const uri =
    process.env.MONGODB_URI ||
    process.env.MONGODB_URL ||
    process.env.MONGO_URI ||
    ATLAS_FALLBACK_URI;

  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    cached.promise = mongoose
      .connect(uri, {
        serverSelectionTimeoutMS: 6000,
      })
      .then((mongooseInstance) => {
        console.log(`MongoDB connected: ${mongooseInstance.connection.host}`);
        return mongooseInstance;
      });
  }

  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    console.error(`MongoDB connection error: ${e.message}`);
    throw e;
  }

  return cached.conn;
};

module.exports = connectDB;
7777777