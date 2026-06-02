const mongoose = require('mongoose');

const SUPERADMIN_DB_URL = "mongodb://mohammadrehan00121_db_user:BFZebo6PR8Ripzzq@ac-pxrc1fm-shard-00-00.vydv7ur.mongodb.net:27017,ac-pxrc1fm-shard-00-01.vydv7ur.mongodb.net:27017,ac-pxrc1fm-shard-00-02.vydv7ur.mongodb.net:27017/RMS-Superadmin?ssl=true&replicaSet=atlas-112ag1-shard-0&authSource=admin&appName=Cluster0";

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

