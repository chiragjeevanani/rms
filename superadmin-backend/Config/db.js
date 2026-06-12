const mongoose = require('mongoose');

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