const mongoose = require('mongoose');
const Admin = require('../Models/Admin');
const Restaurant = require('../Models/Restaurant');
const CentralAdmin = require('../Models/CentralAdmin');
const { SUPERADMIN_DB_URL } = require('../Config/db');
const bcrypt = require('bcryptjs');

/**
 * Checks if the currently connected local deployment database contains an Admin.
 * If not, auto-provisions a default Admin and Restaurant with dynamic credentials fetched/resolved from the central database.
 */
const checkAndProvisionLocalAdmin = async () => {
  console.log('🔍 Checking local deployment database for default Admin...');
  try {
    const adminExists = await Admin.findOne();
    const restaurantExists = await Restaurant.findOne();
    if (adminExists && restaurantExists) {
      console.log('✅ Local Admin & Restaurant verification passed. Users already exist.');
      return;
    }

    console.log('👉 Admin or Restaurant missing in connected database. Resolving dynamic provisioning/healing...');

    const currentDbUrl = process.env.MONGODB_URL;
    if (!currentDbUrl) {
      console.error('❌ MONGODB_URL environment variable is missing.');
      return;
    }

    // Connect to SuperAdmin database to query registry
    let superadminConn;
    try {
      superadminConn = await mongoose.createConnection(SUPERADMIN_DB_URL, {
        serverSelectionTimeoutMS: 5000,
        connectTimeoutMS: 5000
      }).asPromise();
    } catch (connErr) {
      console.error(`❌ Could not connect to SuperAdmin database for registry lookup: ${connErr.message}`);
      // Fallback: if we cannot connect to SuperAdmin, use default email 'admin1@gmail.com' to avoid complete failure
      await provisionLocalAdmin('admin1@gmail.com', '123', {
        name: 'Admin - admin1',
        restaurantName: 'Royal Kitchen',
        branchLimit: 0,
        thirdPartyIntegration: false,
        isActive: false,
        adminId: `DEP-${Math.random().toString(36).substring(2, 9).toUpperCase()}`
      });
      return;
    }

    try {
      const CentralAdminModel = superadminConn.model('CentralAdmin', CentralAdmin.schema, 'admins');

      // Look up registry for matching MongoDB URL
      const registryEntry = await CentralAdminModel.findOne({ dbUrl: currentDbUrl });

      let resolvedEmail;
      let passwordToSet;
      let resolvedFields = {};

      if (registryEntry) {
        resolvedEmail = registryEntry.email;
        passwordToSet = registryEntry.password || '123';
        resolvedFields = {
          name: registryEntry.name || `Admin - ${resolvedEmail.split('@')[0]}`,
          restaurantName: registryEntry.restaurantName || 'Royal Kitchen',
          branchLimit: registryEntry.branchLimit ?? 0,
          thirdPartyIntegration: registryEntry.thirdPartyIntegration ?? false,
          isActive: registryEntry.isActive ?? false,
          adminId: registryEntry.adminId || `DEP-${Math.random().toString(36).substring(2, 9).toUpperCase()}`
        };
        console.log(`ℹ Found registered node in SuperAdmin registry: ${resolvedEmail}`);
      } else {
        console.log('ℹ Node not found in SuperAdmin registry. Determining next available email...');
        
        // Scan registry to find if base admin@gmail.com exists, and determine next email
        const allCentralAdmins = await CentralAdminModel.find({}).lean();
        const hasBaseAdmin = allCentralAdmins.some(item => (item.email || '').toLowerCase() === 'admin@gmail.com');

        if (!hasBaseAdmin) {
          resolvedEmail = 'admin@gmail.com';
        } else {
          let maxNum = 0;
          allCentralAdmins.forEach(item => {
            const email = item.email || '';
            const match = email.match(/^admin(\d+)@gmail\.com$/i);
            if (match) {
              const num = parseInt(match[1], 10);
              if (num > maxNum) {
                maxNum = num;
              }
            }
          });
          resolvedEmail = `admin${maxNum + 1}@gmail.com`;
        }

        passwordToSet = '123'; // Default password for new auto-created admin
        
        const newDeploymentId = `DEP-${Math.random().toString(36).substring(2, 9).toUpperCase()}`;
        const newDbName = `rms_${resolvedEmail.split('@')[0]}`;
        
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(passwordToSet, salt);

        resolvedFields = {
          name: `Admin - ${resolvedEmail.split('@')[0]}`,
          restaurantName: 'Royal Kitchen',
          branchLimit: 0,
          thirdPartyIntegration: false,
          isActive: false,
          adminId: newDeploymentId
        };

        console.log(`ℹ Registering new node centrally: ${resolvedEmail} with DB URL ${currentDbUrl}`);

        // Register in SuperAdmin DB
        const newRegistryEntry = new CentralAdminModel({
          adminId: newDeploymentId,
          email: resolvedEmail,
          dbUrl: currentDbUrl,
          dbName: newDbName,
          branchLimit: 0,
          thirdPartyIntegration: false,
          isActive: false,
          createdAt: new Date(),
          name: resolvedFields.name,
          password: hashedPassword,
          restaurantName: resolvedFields.restaurantName,
          appType: 'Admin',
          status: 'inactive'
        });
        await newRegistryEntry.save();
      }

      // Provision local collections with resolved properties
      await provisionLocalAdmin(resolvedEmail, passwordToSet, resolvedFields);

    } finally {
      try {
        await superadminConn.close();
      } catch (err) {}
    }

  } catch (err) {
    console.error('❌ Error during local admin verification check:', err.message);
  }
};

/**
 * Helper function to create local Admin and Restaurant documents
 */
const provisionLocalAdmin = async (email, password, fields) => {
  // Find or create local Admin document
  let localAdmin = await Admin.findOne({ email });
  if (!localAdmin) {
    localAdmin = new Admin({ email });
  }
  localAdmin.name = fields.name;
  localAdmin.password = password;
  localAdmin.restaurantName = fields.restaurantName;
  localAdmin.thirdPartyApi = fields.thirdPartyIntegration;
  localAdmin.thirdPartyIntegration = fields.thirdPartyIntegration;
  localAdmin.isActive = fields.isActive;
  localAdmin.branchLimit = fields.branchLimit;
  localAdmin.adminId = fields.adminId;
  await localAdmin.save();

  // Find or create local Restaurant document
  let localRestaurant = await Restaurant.findOne({ email });
  if (!localRestaurant) {
    localRestaurant = new Restaurant({ email });
  }
  localRestaurant.name = fields.restaurantName;
  localRestaurant.password = password;
  localRestaurant.branchLimit = fields.branchLimit;
  localRestaurant.thirdPartyApi = fields.thirdPartyIntegration;
  localRestaurant.thirdPartyIntegration = fields.thirdPartyIntegration;
  localRestaurant.status = fields.isActive ? 'active' : 'inactive';
  localRestaurant.isActive = fields.isActive;
  localRestaurant.adminId = fields.adminId;
  await localRestaurant.save();

  console.log(`✅ Default local Admin & Restaurant verified/provisioned successfully: ${email} (status: ${fields.isActive ? 'active' : 'inactive'})`);
};

module.exports = checkAndProvisionLocalAdmin;
