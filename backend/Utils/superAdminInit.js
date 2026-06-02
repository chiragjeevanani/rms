const mongoose = require('mongoose');
const SuperAdmin = require('../Models/SuperAdmin');
const CentralAdmin = require('../Models/CentralAdmin');
const { SUPERADMIN_DB_URL } = require('../Config/db');
const bcrypt = require('bcryptjs');

const initSuperAdmin = async () => {
  console.log('🔍 Checking SuperAdmin central database for default credentials...');
  let conn;
  try {
    conn = await mongoose.createConnection(SUPERADMIN_DB_URL, {
      serverSelectionTimeoutMS: 5000,
      connectTimeoutMS: 5000
    }).asPromise();

    const SuperAdminModel = conn.model('SuperAdmin', SuperAdmin.schema, 'superadmins');
    const CentralAdminModel = conn.model('CentralAdmin', CentralAdmin.schema, 'admins');

    let existingSuperAdmin = await SuperAdminModel.findOne({ email: 'superadmin@gmail.com' });
    let hashedPassword;

    if (!existingSuperAdmin) {
      console.log('🚀 Default SuperAdmin not found in central DB. Initializing...');
      const salt = await bcrypt.genSalt(10);
      hashedPassword = await bcrypt.hash('123', salt);

      existingSuperAdmin = await SuperAdminModel.create({
        name: 'Super Admin',
        email: 'superadmin@gmail.com',
        password: hashedPassword
      });
      console.log('✅ Default SuperAdmin created in central database: superadmin@gmail.com / 123');
    } else {
      console.log('✔ SuperAdmin check passed in central database.');
      hashedPassword = existingSuperAdmin.password;
    }



  } catch (err) {
    console.error('❌ SuperAdmin Initialization Error:', err.message);
  } finally {
    if (conn) {
      try {
        await conn.close();
      } catch (closeErr) {}
    }
  }
};

module.exports = initSuperAdmin;
