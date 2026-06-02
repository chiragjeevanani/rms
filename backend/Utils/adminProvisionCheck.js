const mongoose = require('mongoose');
const CentralAdmin = require('../Models/CentralAdmin');
const AdminSchema = require('../Models/Admin').schema;
const RestaurantSchema = require('../Models/Restaurant').schema;

/**
 * Iterates through all registered database URLs, verifies that an Admin user
 * exists in each deployment database, and auto-provisions one with default
 * credentials/fields if missing.
 */
const checkAndProvisionAdmins = async () => {
  console.log('🔍 Starting dynamic admin provisioning checks across all registered database deployments...');
  try {
    // Find all deployments in the central registry (excluding default superadmin settings)
    const deployments = await CentralAdmin.find({ isSuperAdminDefault: { $ne: true } }).lean();
    console.log(`Found ${deployments.length} registered deployment(s) in CentralAdmin.`);

    for (const dep of deployments) {
      const targetDbUrl = dep.dbUrl;
      const email = dep.email;

      if (!targetDbUrl) {
        console.warn(`⚠️ Deployment [${email}] is missing a MongoDB database URL. Skipping.`);
        continue;
      }

      console.log(`Checking target database connection for deployment [${email}]...`);
      let targetConn;
      try {
        targetConn = await mongoose.createConnection(targetDbUrl, {
          serverSelectionTimeoutMS: 5000,
          connectTimeoutMS: 5000
        }).asPromise();
      } catch (connErr) {
        console.error(`❌ Could not connect to target DB for ${email}: ${connErr.message}`);
        continue;
      }

      try {
        const TargetAdmin = targetConn.model('Admin', AdminSchema);
        const TargetRestaurant = targetConn.model('Restaurant', RestaurantSchema);

        // Check if Admin exists in target DB
        const adminExists = await TargetAdmin.findOne({ email });
        if (!adminExists) {
          console.log(`👉 Default Admin not found in target DB for [${email}]. Auto-creating...`);

          // 1. Create target Admin document
          // Password will be bcrypt hashed of "123" (Admin Schema pre-save hook will hash "123" automatically)
          const targetAdmin = new TargetAdmin({
            name: dep.name ? dep.name.replace('Admin - ', '') : `Admin - ${email.split('@')[0]}`,
            email: email,
            password: '123', 
            restaurantName: dep.restaurantName || 'Your Restaurant',
            thirdPartyApi: dep.thirdPartyIntegration || false,
            thirdPartyIntegration: dep.thirdPartyIntegration || false,
            mobileNumber: dep.mobileNumber || '',
            isActive: dep.isActive || false,
            branchLimit: dep.branchLimit || 0,
            adminId: dep.adminId
          });
          await targetAdmin.save();

          // 2. Create target Restaurant document
          const targetRestaurant = new TargetRestaurant({
            name: dep.restaurantName || 'Your Restaurant',
            email: email,
            password: '123',
            branchLimit: dep.branchLimit ?? 0,
            thirdPartyApi: dep.thirdPartyIntegration || false,
            thirdPartyIntegration: dep.thirdPartyIntegration || false,
            mobileNumber: dep.mobileNumber || '',
            status: dep.isActive ? 'active' : 'inactive',
            isActive: dep.isActive || false,
            adminId: dep.adminId
          });
          await targetRestaurant.save();

          console.log(`✅ Default Admin & Restaurant documents auto-created in target DB for [${email}].`);
        } else {
          console.log(`✅ Admin already exists in target DB for [${email}].`);
        }
      } catch (err) {
        console.error(`❌ Error provisioning target DB for ${email}: ${err.message}`);
      } finally {
        try {
          await targetConn.close();
        } catch (closeErr) {}
      }
    }
    console.log('✅ Startup admin provisioning checks completed.');
  } catch (error) {
    console.error(`❌ Error during startup admin verification check: ${error.message}`);
  }
};

module.exports = checkAndProvisionAdmins;
