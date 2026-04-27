const mongoose = require('mongoose');

const connectSuperAdminDB = async () => {
  try {
    const conn = await mongoose.createConnection("mongodb://mohammadrehan00121_db_user:L4SOVC0ipr5Ez0y3@ac-pxrc1fm-shard-00-00.vydv7ur.mongodb.net:27017,ac-pxrc1fm-shard-00-01.vydv7ur.mongodb.net:27017,ac-pxrc1fm-shard-00-02.vydv7ur.mongodb.net:27017/RMS-Superadmin?ssl=true&replicaSet=atlas-112ag1-shard-0&authSource=admin&appName=Cluster0").asPromise();
    console.log(`🌐 Central SuperAdmin DB Connected: ${conn.host}`);
    return conn;
  } catch (err) {
    console.error(`❌ Central DB Connection Failed: ${err.message}`);
    return null;
  }
};

module.exports = connectSuperAdminDB;
