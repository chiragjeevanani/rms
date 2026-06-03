const mongoose = require('mongoose');

const SUPERADMIN_DB_URL =
  "mongodb://superadmin123%21%23:superadmin%40123@210.56.147.234:27017/RMS-Superadmin?authSource=admin";

const connectDB = async () => {
  try {
    const isSuperAdmin = process.env.IS_SUPERADMIN === 'true';

    const dbUrl = isSuperAdmin
      ? SUPERADMIN_DB_URL
      : process.env.MONGODB_URL;

    if (!dbUrl) {
      throw new Error("MongoDB URL is missing in environment variables");
    }

    console.log(`🔐 MODE: ${isSuperAdmin ? 'SUPERADMIN' : 'ADMIN'}`);
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