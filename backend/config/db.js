// config/db.js
import mongoose from 'mongoose';

// ── Database Connection ──────────────────────────────────────────────
const connectDB = async () => {
  if (!process.env.MONGODB_URI) {
    console.error('Error: MONGODB_URI environment variable is not defined.');
    console.error('Please make sure you have a .env file containing MONGODB_URI in the backend directory.');
    process.exit(1);
  }
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI);
    console.log(`🟢 MongoDB connected: ${conn.connection.host}`);
  } catch (err) {
    console.error('MongoDB connection failed:', err.message);
    process.exit(1);
  }
};

export default connectDB;
