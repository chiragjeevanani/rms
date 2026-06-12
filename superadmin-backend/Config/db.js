const mongoose = require('mongoose');

const SUPERADMIN_DB_URL = "mongodb://superadmin123!%23:superadmin%40123@127.0.0.1:27017/RMS-Superadmin?authSource=admin";

const connectDB = async () => {
  try {
    const dbUrl = process.env.MONGODB_URL;

    if (!dbUrl) {
      throw new Error("MongoDB URL is missing in environment variables");
    }

    console.log(`🔐 MODE: SUPERADMIN`);
    console.log(`Connecting to database...`);

    const conn = await mongoose.connect(dbUrl);

    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`❌ DB Error: ${error.message}`);
    console.error(error);
    process.exit(1);
  }
};

module.exports = connectDB;
connectDB.SUPERADMIN_DB_URL = SUPERADMIN_DB_URL;