const mongoose = require('mongoose');
const { SUPERADMIN_DB_URL } = require('../Config/db');

const migrateRegistry = async () => {
  console.log('🔄 Running SuperAdmin Central Registry Schema Migration...');
  let conn;
  try {
    conn = await mongoose.createConnection(SUPERADMIN_DB_URL, {
      serverSelectionTimeoutMS: 5000,
      connectTimeoutMS: 5000
    }).asPromise();

    const db = conn.db;
    const collection = db.collection('admins');
    const admins = await collection.find({}).toArray();
    console.log(`Found ${admins.length} central registry documents in 'admins' collection.`);

    let migrationCount = 0;
    for (const doc of admins) {
      const updateData = {};
      const unsetFields = {};

      // 1. Check if we need to migrate any fields
      if (doc.deployment_id && !doc.adminId) updateData.adminId = doc.deployment_id;
      if (doc.admin_email && !doc.email) updateData.email = doc.admin_email;
      if ((doc.mongodb_url || doc.localDbUrl) && !doc.dbUrl) updateData.dbUrl = doc.mongodb_url || doc.localDbUrl;
      if (doc.localDbName && !doc.dbName) updateData.dbName = doc.localDbName;
      if (doc.password_hash && !doc.password) updateData.password = doc.password_hash;
      if (doc.app_type && !doc.appType) updateData.appType = doc.app_type;
      if (doc.thirdPartyApi !== undefined && doc.thirdPartyIntegration === undefined) {
        updateData.thirdPartyIntegration = doc.thirdPartyApi;
      }
      if (doc.status && doc.isActive === undefined) {
        updateData.isActive = doc.status === 'active';
      }

      // 2. Identify fields to unset (clean up legacy fields)
      const legacyFields = ['admin_email', 'password_hash', 'mongodb_url', 'localDbUrl', 'localDbName', 'deployment_id', 'thirdPartyApi', 'app_type'];
      legacyFields.forEach(field => {
        if (doc[field] !== undefined) {
          unsetFields[field] = "";
        }
      });

      if (Object.keys(updateData).length > 0 || Object.keys(unsetFields).length > 0) {
        const updateOp = {};
        if (Object.keys(updateData).length > 0) updateOp.$set = updateData;
        if (Object.keys(unsetFields).length > 0) updateOp.$unset = unsetFields;

        await collection.updateOne({ _id: doc._id }, updateOp);
        migrationCount++;
      }
    }

    console.log(`✅ Schema migration complete. Updated ${migrationCount} registry document(s).`);
  } catch (error) {
    console.error('❌ Schema migration failed:', error.message);
  } finally {
    if (conn) {
      try {
        await conn.close();
      } catch (err) {}
    }
  }
};

module.exports = migrateRegistry;
if (require.main === module) {
  migrateRegistry().then(() => process.exit(0));
}
