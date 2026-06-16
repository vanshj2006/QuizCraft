import mongoose from 'mongoose';

const MAX_RETRIES = 5;
const RETRY_DELAY_MS = 5000;

export const connectDB = async (attempt = 1) => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(`MongoDB connected: ${conn.connection.host}`);
  } catch (err) {
    console.error(`MongoDB connection error (attempt ${attempt}/${MAX_RETRIES}):`, err.message);
    if (attempt >= MAX_RETRIES) {
      console.error('Max retries reached. Exiting.');
      process.exit(1);
    }
    console.log(`Retrying in ${RETRY_DELAY_MS / 1000}s...`);
    await new Promise((res) => setTimeout(res, RETRY_DELAY_MS));
    return connectDB(attempt + 1);
  }
};