const mongoose = require('mongoose');

const SUPERADMIN_DB_URL = "mongodb://mohammadrehan00121_db_user:BFZebo6PR8Ripzzq@ac-pxrc1fm-shard-00-00.vydv7ur.mongodb.net:27017,ac-pxrc1fm-shard-00-01.vydv7ur.mongodb.net:27017,ac-pxrc1fm-shard-00-02.vydv7ur.mongodb.net:27017/RMS-Superadmin?ssl=true&replicaSet=atlas-112ag1-shard-0&authSource=admin&appName=Cluster0";

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