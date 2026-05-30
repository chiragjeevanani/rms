const Admin = require('../Models/Admin');
const Restaurant = require('../Models/Restaurant');
const CentralAdmin = require('../Models/CentralAdmin');
const bcrypt = require('bcryptjs');

const initAdmin = async () => {
  try {
    const adminCount = await Admin.countDocuments();

    if (adminCount === 0) {
      console.log('🚀 No Admin found. Initializing default system admin...');

      const defaultAdminData = {
        name: 'Main Admin',
        email: 'admin@gmail.com',
        password: '123',
        restaurantName: 'Royal Kitchen',
        theme: {
          mode: 'light',
          primaryColor: '#ff7a00',
          borderRadius: '2rem',
          sidebarStyle: 'solid',
          fontFamily: 'Outfit'
        }
      };

      // 1. Save local Admin
      const defaultAdmin = new Admin(defaultAdminData);
      await defaultAdmin.save();
      console.log('✅ Local Admin created: admin@gmail.com');

      // 2. Save local Restaurant
      const defaultRestaurant = new Restaurant({
        name: defaultAdminData.restaurantName,
        email: defaultAdminData.email,
        password: defaultAdminData.password,
        thirdPartyApi: false,
        status: 'active',
        mobileNumber: '',
        branchLimit: 5
      });
      await defaultRestaurant.save();
      console.log('✅ Local Restaurant created: admin@gmail.com');

      // 3. Sync to admins collection (via Mongoose model)
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(defaultAdminData.password, salt);

      await CentralAdmin.findOneAndUpdate(
        { email: defaultAdminData.email },
        {
          name: defaultAdminData.name,
          email: defaultAdminData.email,
          password: hashedPassword,
          restaurantName: defaultAdminData.restaurantName,
          localDbUrl: process.env.MONGODB_URL,
          isSuperAdminDefault: true
        },
        { upsert: true, new: true }
      );
      console.log('✅ CentralAdmin sync complete: admin@gmail.com');
    } else {
      console.log('✔ System Admin check passed.');
    }
  } catch (err) {
    console.error('❌ Admin Initialization Error:', err);
  }
};

module.exports = initAdmin;
