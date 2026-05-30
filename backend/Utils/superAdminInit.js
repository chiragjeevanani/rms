const SuperAdmin = require('../Models/SuperAdmin');
const bcrypt = require('bcryptjs');

const initSuperAdmin = async () => {
  try {
    const existingSuperAdmin = await SuperAdmin.findOne({ email: 'superadmin@gmail.com' });

    if (!existingSuperAdmin) {
      console.log('🚀 Default SuperAdmin not found. Initializing default superadmin...');
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash('123', salt);

      await SuperAdmin.create({
        name: 'Super Admin',
        email: 'superadmin@gmail.com',
        password: hashedPassword
      });
      console.log('✅ Default SuperAdmin created: superadmin@gmail.com / 123');
    } else {
      console.log('✔ SuperAdmin check passed.');
    }
  } catch (err) {
    console.error('❌ SuperAdmin Initialization Error:', err);
  }
};

module.exports = initSuperAdmin;
