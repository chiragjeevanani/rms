const mongoose = require('mongoose');

const SUPERADMIN_DB_URL = "mongodb://superadmin:SuperAdmin123@210.56.147.234:27017/RMS-Superadmin?authSource=admin";

const connectDB = async () => {
  try {
    const isSuperAdmin = process.env.IS_SUPERADMIN === 'true' || !process.env.MONGODB_URL;
    const dbUrl = isSuperAdmin ? SUPERADMIN_DB_URL : process.env.MONGODB_URL;

    console.log(`Connecting to database as ${isSuperAdmin ? 'SuperAdmin' : 'Admin'}...`);
    const conn = await mongoose.connect(dbUrl);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
connectDB.SUPERADMIN_DB_URL = SUPERADMIN_DB_URL;

