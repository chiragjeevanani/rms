const Admin = require('../Models/Admin');
const connectSuperAdminDB = require('../Config/superAdminDb');
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

      // 1. Save to Local DB
      const defaultAdmin = new Admin(defaultAdminData);
      await defaultAdmin.save();
      console.log('✅ Local Admin created: admin@gmail.com');

      // 2. Sync to Central SuperAdmin DB
      const centralConn = await connectSuperAdminDB();
      if (centralConn) {
        const CentralAdmin = centralConn.collection('admins');
        
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(defaultAdminData.password, salt);

        // Fetching full DB URL from env
        const localDbUrl = process.env.MONGODB_URL;

        await CentralAdmin.insertOne({
          ...defaultAdminData,
          password: hashedPassword,
          localDbUrl: localDbUrl, // Full DB URL Sync
          createdAt: new Date(),
          isSuperAdminDefault: true
        });
        
        console.log('🌐 Central Sync Successful (URL Included): admin@gmail.com');
        await centralConn.close();
      }
    } else {
      console.log('✔ System Admin check passed.');
    }
  } catch (err) {
    console.error('❌ Admin Initialization Error:', err);
  }
};

module.exports = initAdmin;
