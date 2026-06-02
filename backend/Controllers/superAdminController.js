const Restaurant = require('../Models/Restaurant');
const Admin = require('../Models/Admin');
const Branch = require('../Models/Branch');
const SuperAdmin = require('../Models/SuperAdmin');
const CentralAdmin = require('../Models/CentralAdmin');
const bcrypt = require('bcryptjs');
const sendEmail = require('../Utils/sendEmail');
const Order = require('../Models/Order');
const Staff = require('../Models/Staff');
const Table = require('../Models/Table');
const mongoose = require('mongoose');
const { SUPERADMIN_DB_URL } = require('../Config/db');

// ── Target Database Connections Cache (Performance Optimization) ──────────────
const targetConnectionsCache = {};

async function getCachedConnection(dbUrl) {
  if (targetConnectionsCache[dbUrl]) {
    const conn = targetConnectionsCache[dbUrl];
    if (conn.readyState === 1) {
      return conn;
    }
    try { await conn.close(); } catch (e) {}
    delete targetConnectionsCache[dbUrl];
  }
  
  const conn = await mongoose.createConnection(dbUrl, {
    serverSelectionTimeoutMS: 3000,
    connectTimeoutMS: 3000
  }).asPromise();
  
  targetConnectionsCache[dbUrl] = conn;
  return conn;
}

// Helper to synchronize database updates to the client VPS node via API, with fallback to direct DB connection
async function syncToClientNode({ apiUrl, dbUrl, action, payload, fallbackFn }) {
  const secret = process.env.INTERNAL_SYNC_SECRET || 'fallback_sync_secret_token_1234';
  
  if (apiUrl) {
    try {
      console.log(`[Sync] Attempting API sync to ${apiUrl} for action: ${action}`);
      const response = await fetch(`${apiUrl}/api/internal/sync-admin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, payload, secret })
      });
      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          console.log(`[Sync Success] Sync successful for action: ${action} on client API: ${apiUrl}`);
          return true;
        }
      }
      console.warn(`[Sync Warning] API sync to ${apiUrl} returned status: ${response.status}`);
    } catch (err) {
      console.error(`[Sync Error] API sync failed to ${apiUrl}: ${err.message}`);
    }
  }

  // Fallback to direct DB connection
  console.log(`[Sync Fallback] Falling back to direct database connection using dbUrl for action: ${action}`);
  
  if (dbUrl) {
    const isTargetDbLocal = dbUrl.includes('localhost') || dbUrl.includes('127.0.0.1');
    const isSuperDbLocal = SUPERADMIN_DB_URL && (SUPERADMIN_DB_URL.includes('localhost') || SUPERADMIN_DB_URL.includes('127.0.0.1'));
    if (isTargetDbLocal && !isSuperDbLocal) {
      throw new Error('Direct database connection to localhost is not possible from a remote SuperAdmin server. Please configure and run the client API Synchronization.');
    }
  }

  if (fallbackFn) {
    try {
      return await fallbackFn();
    } catch (err) {
      if (err.message.includes('requires authentication') || err.message.includes('auth')) {
        err.message += ' (Note: This might be due to direct localhost MongoDB connection fallback on a remote SuperAdmin server. Please configure and verify your API Synchronization URL.)';
      }
      throw err;
    }
  } else {
    throw new Error('Database Connection URL is not defined and API sync failed/was not provided.');
  }
}


// ── Login ─────────────────────────────────────────────────────────────────────
exports.superAdminLogin = async (req, res) => {
  const { email, password } = req.body;
  let conn;
  try {
    conn = await mongoose.createConnection(SUPERADMIN_DB_URL, {
      serverSelectionTimeoutMS: 5000,
      connectTimeoutMS: 5000
    }).asPromise();
    
    const SuperAdminModel = conn.model('SuperAdmin', SuperAdmin.schema, 'superadmins');
    const superAdmin = await SuperAdminModel.findOne({ email });
    if (!superAdmin) {
      return res.status(401).json({ success: false, message: 'Invalid Credentials' });
    }

    const isMatch = await bcrypt.compare(password, superAdmin.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid Credentials' });
    }

    return res.json({
      success: true,
      token: 'superadmin-secret-token',
      user: { name: superAdmin.name, role: 'superadmin' }
    });
  } catch (error) {
    console.error('SuperAdmin login error:', error.message);
    res.status(500).json({ success: false, message: 'Server error during authentication' });
  } finally {
    if (conn) {
      try { await conn.close(); } catch (err) {}
    }
  }
};

// ── Create Admin Node ─────────────────────────────────────────────────────────
exports.createRestaurant = async (req, res) => {
  try {
    const { name, email, branchLimit, thirdPartyIntegration, mobileNumber, status, dbUrl, apiUrl, appType, adminId } = req.body;

    // Check duplicate in CentralAdmin (default connection and SuperAdmin DB if different)
    const isDefaultSuperAdmin = (process.env.IS_SUPERADMIN === 'true' || !process.env.MONGODB_URL);
    let existingDeployment = await CentralAdmin.findOne({ email });

    if (!existingDeployment && !isDefaultSuperAdmin) {
      let superConn;
      try {
        superConn = await mongoose.createConnection(SUPERADMIN_DB_URL, {
          serverSelectionTimeoutMS: 5000,
          connectTimeoutMS: 5000
        }).asPromise();
        const CentralAdminModel = superConn.model('CentralAdmin', CentralAdmin.schema, 'admins');
        existingDeployment = await CentralAdminModel.findOne({ email });
      } catch (err) {
        console.error('Error checking duplicate in SuperAdmin DB:', err.message);
      } finally {
        if (superConn) {
          try { await superConn.close(); } catch (e) {}
        }
      }
    }

    if (existingDeployment) {
      return res.status(400).json({ success: false, message: 'Administrator email already exists' });
    }

    if (!dbUrl && !apiUrl) {
      return res.status(400).json({ success: false, message: 'MongoDB Connection URL or API Sync URL is required' });
    }

    // Random 8-char password
    const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%';
    let randomPassword = '';
    for (let i = 0; i < 8; i++) randomPassword += chars.charAt(Math.floor(Math.random() * chars.length));

    const limitValue = branchLimit ? parseInt(branchLimit) : 0;
    const nodeStatus = status ? status.toLowerCase() : 'inactive';
    const resolvedAppType = appType || 'Admin';
    const resolvedDeploymentId = adminId || `DEP-${Math.random().toString(36).substring(2, 9).toUpperCase()}`;
    const resolvedDbName = `rms_${name.toLowerCase().replace(/\s+/g, '_')}`;

    // 1. Connect dynamically to target MongoDB or sync via Client API
    const restaurantPayload = {
      name,
      email,
      password: randomPassword,
      branchLimit: limitValue,
      thirdPartyApi: thirdPartyIntegration || false,
      thirdPartyIntegration: thirdPartyIntegration || false,
      mobileNumber: mobileNumber || '',
      status: nodeStatus,
      isActive: nodeStatus === 'active',
      adminId: resolvedDeploymentId
    };

    const adminPayload = {
      name: `Admin - ${name}`,
      email,
      password: randomPassword,
      restaurantName: name,
      thirdPartyApi: thirdPartyIntegration || false,
      thirdPartyIntegration: thirdPartyIntegration || false,
      mobileNumber: mobileNumber || '',
      branchLimit: limitValue,
      isActive: nodeStatus === 'active',
      adminId: resolvedDeploymentId
    };

    try {
      await syncToClientNode({
        apiUrl,
        dbUrl,
        action: 'create',
        payload: { restaurant: restaurantPayload, admin: adminPayload },
        fallbackFn: async () => {
          const targetConn = await mongoose.createConnection(dbUrl, {
            serverSelectionTimeoutMS: 5000,
            connectTimeoutMS: 5000
          }).asPromise();
          const AdminSchema = require('../Models/Admin').schema;
          const RestaurantSchema = require('../Models/Restaurant').schema;
          const TargetAdmin = targetConn.model('Admin', AdminSchema);
          const TargetRestaurant = targetConn.model('Restaurant', RestaurantSchema);
          
          const targetRestaurant = new TargetRestaurant(restaurantPayload);
          await targetRestaurant.save();

          const targetAdmin = new TargetAdmin(adminPayload);
          await targetAdmin.save();
          await targetConn.close();
        }
      });
    } catch (dbErr) {
      return res.status(500).json({
        success: false,
        message: `Error provisioning collections in target database: ${dbErr.message}`
      });
    }

    // 2. Hash password for SuperAdmin DB storage
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(randomPassword, salt);

    // 3. Save in default DB (CentralAdmin / admins collection)
    const centralAdmin = new CentralAdmin({
      adminId: resolvedDeploymentId,
      email: email,
      dbUrl,
      apiUrl,
      dbName: resolvedDbName,
      branchLimit: limitValue,
      thirdPartyIntegration: thirdPartyIntegration || false,
      isActive: nodeStatus === 'active',
      createdAt: new Date(),
      name: `Admin - ${name}`,
      password: hashedPassword,
      restaurantName: name,
      appType: resolvedAppType,
      mobileNumber: mobileNumber || '',
      status: nodeStatus
    });
    await centralAdmin.save();

    // 4. Save in SuperAdmin DB (if different)
    if (!isDefaultSuperAdmin) {
      let superConn;
      try {
        superConn = await mongoose.createConnection(SUPERADMIN_DB_URL, {
          serverSelectionTimeoutMS: 5000,
          connectTimeoutMS: 5000
        }).asPromise();
        const CentralAdminModel = superConn.model('CentralAdmin', CentralAdmin.schema, 'admins');
        const centralAdminSuper = new CentralAdminModel({
          adminId: resolvedDeploymentId,
          email: email,
          dbUrl,
          apiUrl,
          dbName: resolvedDbName,
          branchLimit: limitValue,
          thirdPartyIntegration: thirdPartyIntegration || false,
          isActive: nodeStatus === 'active',
          createdAt: new Date(),
          name: `Admin - ${name}`,
          password: hashedPassword,
          restaurantName: name,
          appType: resolvedAppType,
          mobileNumber: mobileNumber || '',
          status: nodeStatus
        });
        await centralAdminSuper.save();
      } catch (err) {
        console.error('Failed to sync new restaurant to SuperAdmin DB:', err.message);
      } finally {
        if (superConn) {
          try { await superConn.close(); } catch (e) {}
        }
      }
    }

    // 5. Send credentials email
    try {
      await sendEmail({
        email,
        subject: 'Your RMS Node Administrator Credentials',
        html: `
          <div style="font-family: Arial, sans-serif; padding: 24px; color: #1e293b; max-width: 600px; border: 1px solid #e2e8f0; border-radius: 16px;">
            <h2 style="color: #ff7a00; margin-top: 0; font-size: 20px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.05em;">Welcome to RMS Portal</h2>
            <p style="font-size: 14px; line-height: 1.6; color: #334155;">Your administrator account for deployment <strong>${name}</strong> (${resolvedAppType}) has been successfully provisioned.</p>
            <p style="font-size: 14px; line-height: 1.6; color: #334155;">Below are your secure login credentials:</p>
            <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 16px; margin: 20px 0;">
              <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
                <tr><td style="padding: 6px 0; font-weight: bold; color: #64748b; width: 140px;">Deployment ID / Admin ID:</td><td style="padding: 6px 0; color: #0f172a; font-family: monospace; font-size: 14px; font-weight: bold;">${resolvedDeploymentId}</td></tr>
                <tr><td style="padding: 6px 0; font-weight: bold; color: #64748b;">App Type:</td><td style="padding: 6px 0; color: #0f172a;"><span style="background-color: #f1f5f9; padding: 2px 6px; border-radius: 4px; font-weight: bold;">${resolvedAppType}</span></td></tr>
                <tr><td style="padding: 6px 0; font-weight: bold; color: #64748b;">Username/Email:</td><td style="padding: 6px 0; color: #0f172a; font-family: monospace; font-size: 14px; font-weight: bold;">${email}</td></tr>
                <tr><td style="padding: 6px 0; font-weight: bold; color: #64748b;">Temporary Password:</td><td style="padding: 6px 0; color: #0f172a; font-family: monospace; font-size: 14px; font-weight: bold; background-color: #e2e8f0; padding: 4px 8px; border-radius: 4px; display: inline-block;">${randomPassword}</td></tr>
              </table>
            </div>
            <p style="font-size: 12px; line-height: 1.6; color: #64748b; margin-bottom: 0; border-top: 1px solid #f1f5f9; padding-top: 16px;">
              <strong>Security Notice:</strong> Please log in and change your password immediately.
            </p>
          </div>
        `
      });
      console.log(`✉ Email dispatched: ${email}`);
    } catch (mailErr) {
      console.error(`❌ Email failed for ${email}:`, mailErr.message);
      // Rollback target database
      try {
        await syncToClientNode({
          apiUrl,
          dbUrl,
          action: 'delete',
          payload: { email },
          fallbackFn: async () => {
            const cleanupConn = await mongoose.createConnection(dbUrl).asPromise();
            const AdminSchema = require('../Models/Admin').schema;
            const RestaurantSchema = require('../Models/Restaurant').schema;
            const TargetAdmin = cleanupConn.model('Admin', AdminSchema);
            const TargetRestaurant = cleanupConn.model('Restaurant', RestaurantSchema);
            await TargetAdmin.deleteOne({ email });
            await TargetRestaurant.deleteOne({ email });
            await cleanupConn.close();
          }
        });
      } catch (cleanErr) {
        console.error('Cleanup target DB error:', cleanErr.message);
      }
      // Rollback default DB
      await CentralAdmin.deleteOne({ email });
      // Rollback SuperAdmin DB if different
      if (!isDefaultSuperAdmin) {
        let superConn;
        try {
          superConn = await mongoose.createConnection(SUPERADMIN_DB_URL, {
            serverSelectionTimeoutMS: 5000,
            connectTimeoutMS: 5000
          }).asPromise();
          const CentralAdminModel = superConn.model('CentralAdmin', CentralAdmin.schema, 'admins');
          await CentralAdminModel.deleteOne({ email });
        } catch (err) {
          console.error('Failed to rollback SuperAdmin DB:', err.message);
        } finally {
          if (superConn) {
            try { await superConn.close(); } catch (e) {}
          }
        }
      }
      return res.status(500).json({
        success: false,
        message: `Email delivery failed: ${mailErr.message || 'SMTP Error'}. Provisioning rolled back.`
      });
    }

    const io = req.app.get('socketio');
    if (io) {
      io.emit('admin_created', { email, adminId: resolvedDeploymentId });
      io.emit('dashboard_stats_updated');
    }

    res.json({ success: true, message: 'Restaurant created and credentials dispatched successfully', data: centralAdmin });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── Get All Restaurants ───────────────────────────────────────────────────────
exports.getAllRestaurants = async (req, res) => {
  let superConn;
  try {
    const isDefaultSuperAdmin = (process.env.IS_SUPERADMIN === 'true' || !process.env.MONGODB_URL);
    let deployments;
    if (isDefaultSuperAdmin) {
      deployments = await CentralAdmin.find().sort({ createdAt: -1 });
    } else {
      superConn = await mongoose.createConnection(SUPERADMIN_DB_URL, {
        serverSelectionTimeoutMS: 5000,
        connectTimeoutMS: 5000
      }).asPromise();
      const CentralAdminModel = superConn.model('CentralAdmin', CentralAdmin.schema, 'admins');
      deployments = await CentralAdminModel.find().sort({ createdAt: -1 });
    }
    res.json({ success: true, data: deployments });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  } finally {
    if (superConn) {
      try { await superConn.close(); } catch (err) {}
    }
  }
};

// ── Toggle Third-Party API ────────────────────────────────────────────────────
exports.toggleThirdPartyApi = async (req, res) => {
  let superConn;
  try {
    const { email } = req.params;
    const isDefaultSuperAdmin = (process.env.IS_SUPERADMIN === 'true' || !process.env.MONGODB_URL);
    
    let deployment;
    let CentralAdminModel = CentralAdmin;

    if (isDefaultSuperAdmin) {
      deployment = await CentralAdmin.findOne({ email });
    } else {
      superConn = await mongoose.createConnection(SUPERADMIN_DB_URL, {
        serverSelectionTimeoutMS: 5000,
        connectTimeoutMS: 5000
      }).asPromise();
      CentralAdminModel = superConn.model('CentralAdmin', CentralAdmin.schema, 'admins');
      deployment = await CentralAdminModel.findOne({ email });
    }

    if (!deployment) {
      // Try fallback to default local connection just in case
      if (!isDefaultSuperAdmin) {
        deployment = await CentralAdmin.findOne({ email });
      }
      if (!deployment) {
        return res.status(404).json({ success: false, message: 'Deployment not found' });
      }
    }

    const newThirdParty = !deployment.thirdPartyIntegration;

    // Update in CentralAdmin (SuperAdmin DB and/or default DB)
    if (isDefaultSuperAdmin) {
      await CentralAdmin.updateOne({ email }, { $set: { thirdPartyIntegration: newThirdParty } });
    } else {
      await CentralAdminModel.updateOne({ email }, { $set: { thirdPartyIntegration: newThirdParty } });
      await CentralAdmin.updateOne({ email }, { $set: { thirdPartyIntegration: newThirdParty } });
    }

    // Update in target DB
    const dbUrl = deployment.dbUrl;
    const apiUrl = deployment.apiUrl;

    try {
      await syncToClientNode({
        apiUrl,
        dbUrl,
        action: 'toggle-api',
        payload: { email, thirdPartyIntegration: newThirdParty },
        fallbackFn: async () => {
          if (!dbUrl) return;
          const targetConn = await mongoose.createConnection(dbUrl, {
            serverSelectionTimeoutMS: 3000,
            connectTimeoutMS: 3000
          }).asPromise();
          
          const AdminSchema = require('../Models/Admin').schema;
          const RestaurantSchema = require('../Models/Restaurant').schema;
          const TargetAdmin = targetConn.model('Admin', AdminSchema);
          const TargetRestaurant = targetConn.model('Restaurant', RestaurantSchema);

          await TargetAdmin.updateMany({ email }, { $set: { thirdPartyApi: newThirdParty, thirdPartyIntegration: newThirdParty } });
          await TargetRestaurant.updateMany({ email }, { $set: { thirdPartyApi: newThirdParty, thirdPartyIntegration: newThirdParty } });

          await targetConn.close();
        }
      });
    } catch (err) {
      console.error(`Could not toggle API protocol on target DB for ${email}:`, err.message);
    }

    const io = req.app.get('socketio');
    if (io) {
      io.emit('admin_updated', { email, thirdPartyIntegration: newThirdParty });
      io.emit(`admin_status_${email}`, { thirdPartyApi: newThirdParty });
      io.emit('dashboard_stats_updated');
    }

    res.json({ success: true, message: 'API Protocol updated', data: { email, thirdPartyIntegration: newThirdParty } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  } finally {
    if (superConn) {
      try { await superConn.close(); } catch (err) {}
    }
  }
};

// ── Get All Global Admins (for superadmin dashboard) ─────────────────────────
exports.getGlobalAdmins = async (req, res) => {
  let superConn;
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const search = req.query.search || '';
    const status = req.query.status || 'all';

    const query = {};

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { restaurantName: { $regex: search, $options: 'i' } }
      ];
    }

    if (status && status !== 'all') {
      query.status = status.toLowerCase();
    }

    const isDefaultSuperAdmin = (process.env.IS_SUPERADMIN === 'true' || !process.env.MONGODB_URL);
    let CentralAdminModel = CentralAdmin;

    if (!isDefaultSuperAdmin) {
      superConn = await mongoose.createConnection(SUPERADMIN_DB_URL, {
        serverSelectionTimeoutMS: 5000,
        connectTimeoutMS: 5000
      }).asPromise();
      CentralAdminModel = superConn.model('CentralAdmin', CentralAdmin.schema, 'admins');
    }

    const totalCount = await CentralAdminModel.countDocuments(query);
    const totalPages = Math.ceil(totalCount / limit);

    const centralAdmins = await CentralAdminModel.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();

    const enriched = await Promise.all(centralAdmins.map(async (cadmin) => {
      let branchCount = 0;
      let name = cadmin.name || 'Admin';
      let mobileNumber = cadmin.mobileNumber || '';
      let statusValue = cadmin.status || 'active';
      let branchLimit = cadmin.branchLimit ?? 5;
      let appType = cadmin.appType || 'Admin';
      let adminId = cadmin.adminId || 'N/A';
      let dbUrl = cadmin.dbUrl || '';

      // Try connecting to the deployment's DB to fetch actual branch count
      if (dbUrl) {
        try {
          const targetConn = await getCachedConnection(dbUrl);
          
          const BranchSchema = require('../Models/Branch').schema;
          const TargetBranch = targetConn.model('Branch', BranchSchema);
          branchCount = await TargetBranch.countDocuments();
          
          const RestaurantSchema = require('../Models/Restaurant').schema;
          const TargetRestaurant = targetConn.model('Restaurant', RestaurantSchema);
          const restDoc = await TargetRestaurant.findOne({ email: cadmin.email });
          if (restDoc) {
            statusValue = restDoc.status || statusValue;
            branchLimit = restDoc.branchLimit ?? branchLimit;
          }
        } catch (dbErr) {
          console.log(`Could not query target DB for ${cadmin.email}:`, dbErr.message);
        }
      }

      return {
        ...cadmin,
        name,
        mobileNumber,
        status: statusValue,
        branchLimit,
        branchCount,
        appType,
        adminId,
        dbUrl
      };
    }));

    res.json({ 
      success: true, 
      data: enriched,
      pagination: {
        totalCount,
        totalPages,
        currentPage: page,
        limit
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  } finally {
    if (superConn) {
      try { await superConn.close(); } catch (err) {}
    }
  }
};

// ── Change SuperAdmin Password ────────────────────────────────────────────────
exports.changeSuperAdminPassword = async (req, res) => {
  const { email, currentPassword, newPassword } = req.body;
  let conn;
  try {
    conn = await mongoose.createConnection(SUPERADMIN_DB_URL, {
      serverSelectionTimeoutMS: 5000,
      connectTimeoutMS: 5000
    }).asPromise();                        

    const SuperAdminModel = conn.model('SuperAdmin', SuperAdmin.schema, 'superadmins');
    const superAdmin = await SuperAdminModel.findOne({ email });
    if (!superAdmin) return res.status(404).json({ success: false, message: 'Admin not found' });

    const isMatch = await bcrypt.compare(currentPassword, superAdmin.password);
    if (!isMatch) return res.status(401).json({ success: false, message: 'Current password incorrect' });

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);
    await SuperAdminModel.updateOne({ email }, { $set: { password: hashedPassword } });

    res.json({ success: true, message: 'Password updated successfully' });
  } catch (error) {
    console.error('SuperAdmin password change error:', error.message);
    res.status(500).json({ success: false, message: 'Server error' });
  } finally {
    if (conn) {
      try { await conn.close(); } catch (err) {}
    }
  }
};

// ── Update System Theme ───────────────────────────────────────────────────────
exports.updateSystemTheme = async (req, res) => {
  const { primaryColor } = req.body;
  let superConn;
  try {
    if (!primaryColor) return res.status(400).json({ success: false, message: 'Primary color is required' });
    
    // Fetch all deployments from SuperAdmin DB
    const isDefaultSuperAdmin = (process.env.IS_SUPERADMIN === 'true' || !process.env.MONGODB_URL);
    let deployments;

    if (isDefaultSuperAdmin) {
      deployments = await CentralAdmin.find({ isSuperAdminDefault: { $ne: true } }).lean();
    } else {
      superConn = await mongoose.createConnection(SUPERADMIN_DB_URL, {
        serverSelectionTimeoutMS: 5000,
        connectTimeoutMS: 5000
      }).asPromise();
      const CentralAdminModel = superConn.model('CentralAdmin', CentralAdmin.schema, 'admins');
      deployments = await CentralAdminModel.find({ isSuperAdminDefault: { $ne: true } }).lean();
    }

    // Update theme color in parallel
    await Promise.all(deployments.map(async (dep) => {
      const dbUrl = dep.dbUrl;
      const apiUrl = dep.apiUrl;
      
      try {
        await syncToClientNode({
          apiUrl,
          dbUrl,
          action: 'update-theme',
          payload: { primaryColor },
          fallbackFn: async () => {
            if (!dbUrl) return;
            const targetConn = await mongoose.createConnection(dbUrl, {
              serverSelectionTimeoutMS: 3000,
              connectTimeoutMS: 3000
            }).asPromise();
            const AdminSchema = require('../Models/Admin').schema;
            const TargetAdmin = targetConn.model('Admin', AdminSchema);
            
            await TargetAdmin.updateMany({}, { $set: { 'theme.primaryColor': primaryColor } });
            await targetConn.close();
          }
        });
      } catch (err) {
        console.error(`Could not update theme color for ${dep.email}:`, err.message);
      }
    }));

    res.json({ success: true, message: 'System theme color updated successfully across all deployments' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  } finally {
    if (superConn) {
      try { await superConn.close(); } catch (err) {}
    }
  }
};

// ── Update Admin Node ─────────────────────────────────────────────────────────
exports.updateRestaurant = async (req, res) => {
  const { email } = req.params;
  const { name, email: newEmail, mobileNumber, branchLimit, status, thirdPartyIntegration, dbUrl, apiUrl, appType, adminId } = req.body;
  let superConn;

  try {
    const isDefaultSuperAdmin = (process.env.IS_SUPERADMIN === 'true' || !process.env.MONGODB_URL);
    let CentralAdminModel = CentralAdmin;

    if (!isDefaultSuperAdmin) {
      superConn = await mongoose.createConnection(SUPERADMIN_DB_URL, {
        serverSelectionTimeoutMS: 5000,
        connectTimeoutMS: 5000
      }).asPromise();
      CentralAdminModel = superConn.model('CentralAdmin', CentralAdmin.schema, 'admins');
    }

    const deployment = await CentralAdminModel.findOne({ email });
    if (!deployment) {
      return res.status(404).json({ success: false, message: 'Node not found' });
    }

    // Duplicate email check
    if (newEmail && newEmail !== email) {
      const emailExists = await CentralAdminModel.findOne({ email: newEmail });
      if (emailExists) {
        return res.status(400).json({ success: false, message: 'The new email is already taken' });
      }
    }

    // Update CentralAdmin fields
    const syncData = {};
    if (name) {
      syncData.name = `Admin - ${name}`;
      syncData.restaurantName = name;
      syncData.dbName = `rms_${name.toLowerCase().replace(/\s+/g, '_')}`;
    }
    if (newEmail) {
      syncData.email = newEmail;
    }
    if (mobileNumber !== undefined) syncData.mobileNumber = mobileNumber;
    if (branchLimit !== undefined) syncData.branchLimit = parseInt(branchLimit);
    if (status) {
      syncData.status = status.toLowerCase();
      syncData.isActive = status.toLowerCase() === 'active';
    }
    if (thirdPartyIntegration !== undefined) {
      syncData.thirdPartyIntegration = thirdPartyIntegration;
    }
    if (dbUrl) {
      syncData.dbUrl = dbUrl;
    }
    if (apiUrl !== undefined) {
      syncData.apiUrl = apiUrl;
    }
    if (appType) syncData.appType = appType;
    if (adminId) {
      syncData.adminId = adminId;
    }

    // Apply updates to SuperAdmin DB
    await CentralAdminModel.updateOne({ email }, { $set: syncData });

    // Apply updates locally to default DB (if different)
    if (!isDefaultSuperAdmin) {
      await CentralAdmin.updateOne({ email }, { $set: syncData });
    }

    // Connect to the target DB to sync changes there
    const targetDbUrl = dbUrl || deployment.dbUrl;
    const targetApiUrl = apiUrl !== undefined ? apiUrl : deployment.apiUrl;

    let syncSuccess = true;
    let syncErrorMsg = '';

    try {
      await syncToClientNode({
        apiUrl: targetApiUrl,
        dbUrl: targetDbUrl,
        action: 'update',
        payload: { email, syncData },
        fallbackFn: async () => {
          if (!targetDbUrl) return;
          const targetConn = await mongoose.createConnection(targetDbUrl, {
            serverSelectionTimeoutMS: 5000,
            connectTimeoutMS: 5000
          }).asPromise();
          
          const AdminSchema = require('../Models/Admin').schema;
          const RestaurantSchema = require('../Models/Restaurant').schema;
          const TargetAdmin = targetConn.model('Admin', AdminSchema);
          const TargetRestaurant = targetConn.model('Restaurant', RestaurantSchema);

          // Update target Restaurant
          const restDoc = await TargetRestaurant.findOne({ email });
          if (restDoc) {
            if (name) restDoc.name = name;
            if (newEmail) restDoc.email = newEmail;
            if (mobileNumber !== undefined) restDoc.mobileNumber = mobileNumber;
            if (branchLimit !== undefined) restDoc.branchLimit = parseInt(branchLimit);
            if (status) {
              restDoc.status = status.toLowerCase();
              restDoc.isActive = status.toLowerCase() === 'active';
            }
            if (thirdPartyIntegration !== undefined) {
              restDoc.thirdPartyApi = thirdPartyIntegration;
              restDoc.thirdPartyIntegration = thirdPartyIntegration;
            }
            if (adminId) restDoc.adminId = adminId;
            await restDoc.save();
          } else {
            console.warn(`[Sync Warning] Restaurant not found in target DB for email ${email}`);
          }

          // Update target Admin
          const adminDoc = await TargetAdmin.findOne({ email });
          if (adminDoc) {
            if (name) adminDoc.name = `Admin - ${name}`;
            if (newEmail) adminDoc.email = newEmail;
            if (mobileNumber !== undefined) adminDoc.mobileNumber = mobileNumber;
            if (branchLimit !== undefined) adminDoc.branchLimit = parseInt(branchLimit);
            if (thirdPartyIntegration !== undefined) {
              adminDoc.thirdPartyApi = thirdPartyIntegration;
              adminDoc.thirdPartyIntegration = thirdPartyIntegration;
            }
            if (name) adminDoc.restaurantName = name;
            if (status) adminDoc.isActive = status.toLowerCase() === 'active';
            if (adminId) adminDoc.adminId = adminId;
            await adminDoc.save();
          } else {
            console.warn(`[Sync Warning] Admin not found in target DB for email ${email}`);
          }

          await targetConn.close();
        }
      });
    } catch (err) {
      console.error(`Could not sync updates to target DB for ${email}:`, err.message);
      syncSuccess = false;
      syncErrorMsg = err.message;
    }

    const io = req.app.get('socketio');
    if (io) {
      io.emit('admin_updated', { email, ...syncData });
      io.emit(`admin_status_${email}`, { 
        isActive: syncData.isActive,
        status: syncData.status,
        thirdPartyApi: syncData.thirdPartyIntegration
      });
      io.emit('dashboard_stats_updated');
    }

    if (!syncSuccess) {
      return res.json({
        success: true,
        message: `Node updated locally, but failed to sync to client node: ${syncErrorMsg}`,
        syncWarning: true,
        data: syncData
      });
    }

    res.json({ success: true, message: 'Node updated successfully', data: syncData });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  } finally {
    if (superConn) {
      try { await superConn.close(); } catch (err) {}
    }
  }
};

// ── Delete Admin Node ─────────────────────────────────────────────────────────
exports.deleteRestaurant = async (req, res) => {
  const { email } = req.params;
  let superConn;
  try {
    const isDefaultSuperAdmin = (process.env.IS_SUPERADMIN === 'true' || !process.env.MONGODB_URL);
    let CentralAdminModel = CentralAdmin;

    if (!isDefaultSuperAdmin) {
      superConn = await mongoose.createConnection(SUPERADMIN_DB_URL, {
        serverSelectionTimeoutMS: 5000,
        connectTimeoutMS: 5000
      }).asPromise();
      CentralAdminModel = superConn.model('CentralAdmin', CentralAdmin.schema, 'admins');
    }

    const deployment = await CentralAdminModel.findOne({ email });
    if (!deployment) {
      return res.status(404).json({ success: false, message: 'Node not found' });
    }

    const targetDbUrl = deployment.dbUrl;
    const targetApiUrl = deployment.apiUrl;

    try {
      await syncToClientNode({
        apiUrl: targetApiUrl,
        dbUrl: targetDbUrl,
        action: 'delete',
        payload: { email },
        fallbackFn: async () => {
          if (!targetDbUrl) return;
          const targetConn = await mongoose.createConnection(targetDbUrl, {
            serverSelectionTimeoutMS: 5000,
            connectTimeoutMS: 5000
          }).asPromise();
          
          const AdminSchema = require('../Models/Admin').schema;
          const RestaurantSchema = require('../Models/Restaurant').schema;
          const TargetAdmin = targetConn.model('Admin', AdminSchema);
          const TargetRestaurant = targetConn.model('Restaurant', RestaurantSchema);

          // Delete Admin and Restaurant in target DB
          await TargetAdmin.deleteOne({ email });
          await TargetRestaurant.deleteOne({ email });
          await targetConn.close();
        }
      });
    } catch (err) {
      console.error(`Could not delete Admin/Restaurant from target DB for ${email}:`, err.message);
    }

    // Delete central record from SuperAdmin DB
    await CentralAdminModel.deleteOne({ email });

    // Delete central record from default connection (if different)
    if (!isDefaultSuperAdmin) {
      await CentralAdmin.deleteOne({ email });
    }

    const io = req.app.get('socketio');
    if (io) {
      io.emit('admin_deleted', { email });
      io.emit(`admin_status_${email}`, { deleted: true });
      io.emit('dashboard_stats_updated');
    }

    res.json({ success: true, message: 'Node terminated and deleted successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  } finally {
    if (superConn) {
      try { await superConn.close(); } catch (err) {}
    }
  }
};

// ── Resend Credentials ────────────────────────────────────────────────────────
exports.resendCredentials = async (req, res) => {
  const { email } = req.params;
  let superConn;
  try {
    const isDefaultSuperAdmin = (process.env.IS_SUPERADMIN === 'true' || !process.env.MONGODB_URL);
    let CentralAdminModel = CentralAdmin;

    if (!isDefaultSuperAdmin) {
      superConn = await mongoose.createConnection(SUPERADMIN_DB_URL, {
        serverSelectionTimeoutMS: 5000,
        connectTimeoutMS: 5000
      }).asPromise();
      CentralAdminModel = superConn.model('CentralAdmin', CentralAdmin.schema, 'admins');
    }

    const deployment = await CentralAdminModel.findOne({ email });
    if (!deployment) {
      return res.status(404).json({ success: false, message: 'Admin node not found' });
    }

    // Generate a fresh random password
    const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%';
    let newPassword = '';
    for (let i = 0; i < 8; i++) newPassword += chars.charAt(Math.floor(Math.random() * chars.length));

    const displayName = deployment.restaurantName || deployment.name || 'Your Restaurant';
    const targetDbUrl = deployment.dbUrl;
    const targetApiUrl = deployment.apiUrl;

    try {
      await syncToClientNode({
        apiUrl: targetApiUrl,
        dbUrl: targetDbUrl,
        action: 'resend-credentials',
        payload: { email, newPassword },
        fallbackFn: async () => {
          if (!targetDbUrl) return;
          const targetConn = await mongoose.createConnection(targetDbUrl, {
            serverSelectionTimeoutMS: 5000,
            connectTimeoutMS: 5000
          }).asPromise();
          
          const AdminSchema = require('../Models/Admin').schema;
          const RestaurantSchema = require('../Models/Restaurant').schema;
          const TargetAdmin = targetConn.model('Admin', AdminSchema);
          const TargetRestaurant = targetConn.model('Restaurant', RestaurantSchema);

          // Update plain password in Restaurant
          const restDoc = await TargetRestaurant.findOne({ email });
          if (restDoc) {
            restDoc.password = newPassword;
            await restDoc.save();
          }

          // Update hashed password in Admin (pre-save hook hashes it)
          const adminDoc = await TargetAdmin.findOne({ email });
          if (adminDoc) {
            adminDoc.password = newPassword;
            await adminDoc.save();
          }

          await targetConn.close();
        }
      });
    } catch (err) {
      console.error(`Could not update new password in target DB for ${email}:`, err.message);
      return res.status(500).json({ success: false, message: `Failed to update credentials in deployment database: ${err.message}` });
    }

    // Update hashed password in CentralAdmin (SuperAdmin DB)
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);
    await CentralAdminModel.updateOne(
      { email },
      { $set: { password: hashedPassword } }
    );

    // Update hashed password in CentralAdmin (default connection if different)
    if (!isDefaultSuperAdmin) {
      await CentralAdmin.updateOne(
        { email },
        { $set: { password: hashedPassword } }
      );
    }

    // Send fresh credentials email
    await sendEmail({
      email,
      subject: 'Your RMS Login Credentials (Resent)',
      html: `
        <div style="font-family: Arial, sans-serif; padding: 24px; color: #1e293b; max-width: 600px; border: 1px solid #e2e8f0; border-radius: 16px;">
          <h2 style="color: #ff7a00; margin-top: 0; font-size: 20px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.05em;">RMS Portal — Credentials Reset</h2>
          <p style="font-size: 14px; line-height: 1.6; color: #334155;">Your login credentials for <strong>${displayName}</strong> have been reset by the system administrator.</p>
          <p style="font-size: 14px; line-height: 1.6; color: #334155;">Use the details below to log in:</p>
          <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 16px; margin: 20px 0;">
            <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
              <tr><td style="padding: 6px 0; font-weight: bold; color: #64748b; width: 140px;">Portal URL:</td><td style="padding: 6px 0; color: #0f172a;"><a href="https://rms.cloudedata.in/admin/login" style="color: #ff7a00; font-weight: bold; text-decoration: none;">https://rms.cloudedata.in/admin/login</a></td></tr>
              <tr><td style="padding: 6px 0; font-weight: bold; color: #64748b;">Email:</td><td style="padding: 6px 0; color: #0f172a; font-family: monospace; font-size: 14px; font-weight: bold;">${email}</td></tr>
              <tr><td style="padding: 6px 0; font-weight: bold; color: #64748b;">New Password:</td><td style="padding: 6px 0; color: #0f172a; font-family: monospace; font-size: 14px; font-weight: bold; background-color: #e2e8f0; padding: 4px 8px; border-radius: 4px; display: inline-block;">${newPassword}</td></tr>
            </table>
          </div>
          <p style="font-size: 12px; line-height: 1.6; color: #64748b; margin-bottom: 0; border-top: 1px solid #f1f5f9; padding-top: 16px;">
            <strong>Security Notice:</strong> Please change your password immediately after logging in.
          </p>
        </div>
      `
    });

    console.log(`✉ Credentials resent to: ${email}`);
    const io = req.app.get('socketio');
    if (io) {
      io.emit('admin_updated', { email });
      io.emit('dashboard_stats_updated');
    }

    res.json({ success: true, message: `Fresh credentials dispatched to ${email}` });
  } catch (err) {
    console.error('Resend credentials error:', err.message);
    res.status(500).json({ success: false, message: err.message });
  } finally {
    if (superConn) {
      try { await superConn.close(); } catch (err) {}
    }
  }
};

// ── Super Admin Dashboard Stats ──────────────────────────────────────────────
exports.getDashboardStats = async (req, res) => {
  let superConn;
  try {
    // 1. Fetch all deployments from SuperAdmin DB (CentralAdmin)
    const isDefaultSuperAdmin = (process.env.IS_SUPERADMIN === 'true' || !process.env.MONGODB_URL);
    let deployments;

    if (isDefaultSuperAdmin) {
      deployments = await CentralAdmin.find({ isSuperAdminDefault: { $ne: true } }).lean();
    } else {
      superConn = await mongoose.createConnection(SUPERADMIN_DB_URL, {
        serverSelectionTimeoutMS: 5000,
        connectTimeoutMS: 5000
      }).asPromise();
      const CentralAdminModel = superConn.model('CentralAdmin', CentralAdmin.schema, 'admins');
      deployments = await CentralAdminModel.find({ isSuperAdminDefault: { $ne: true } }).lean();
    }
    
    const totalAdmins = deployments.length;
    const activeAdmins = deployments.filter(d => d.isActive).length;
    const inactiveAdmins = totalAdmins - activeAdmins;

    let totalBranchesUsed = 0;
    let totalAllocatedBranches = 0;
    let totalStaff = 0;
    let totalDocuments = 0;
    const resourceConsumption = [];

    // Query each deployment's DB in parallel (with timeout)
    await Promise.all(deployments.map(async (dep) => {
      let depBranchCount = 0;
      let depStaffCount = 0;
      let depOrderCount = 0;
      let depTableCount = 0;
      
      const dbUrl = dep.dbUrl;
      if (dbUrl) {
        try {
          const targetConn = await getCachedConnection(dbUrl);

          const BranchSchema = require('../Models/Branch').schema;
          const TargetBranch = targetConn.model('Branch', BranchSchema);
          depBranchCount = await TargetBranch.countDocuments();

          const StaffSchema = require('../Models/Staff').schema;
          const TargetStaff = targetConn.model('Staff', StaffSchema);
          depStaffCount = await TargetStaff.countDocuments();

          const OrderSchema = require('../Models/Order').schema;
          const TargetOrder = targetConn.model('Order', OrderSchema);
          depOrderCount = await TargetOrder.countDocuments();

          const TableSchema = require('../Models/Table').schema;
          const TargetTable = targetConn.model('Table', TableSchema);
          depTableCount = await TargetTable.countDocuments();
        } catch (err) {
          console.error(`Error querying stats for ${dep.email}:`, err.message);
        }
      }

      totalBranchesUsed += depBranchCount;
      totalAllocatedBranches += dep.branchLimit || 5;
      totalStaff += depStaffCount;
      const depDocs = depOrderCount + depStaffCount + depTableCount;
      totalDocuments += depDocs;

      resourceConsumption.push({
        restaurantId: dep._id,
        name: dep.name || dep.restaurantName || 'Deployment',
        email: dep.email,
        branchesCount: depBranchCount,
        branchLimit: dep.branchLimit || 5,
        ordersCount: depOrderCount,
        staffCount: depStaffCount,
        tablesCount: depTableCount,
        totalDocuments: depDocs
      });
    }));

    // Sort resource users
    resourceConsumption.sort((a, b) => b.totalDocuments - a.totalDocuments);

    const availableBranches = Math.max(0, totalAllocatedBranches - totalBranchesUsed);
    const databaseLatency = Math.floor(Math.random() * 8) + 2; // Simulated latency
    const simulatedStorageMB = (50 + (totalDocuments * 0.0005)).toFixed(2);

    res.json({
      success: true,
      data: {
        accounts: {
          total: totalAdmins,
          active: activeAdmins,
          inactive: inactiveAdmins
        },
        branches: {
          allocated: totalAllocatedBranches,
          used: totalBranchesUsed,
          available: availableBranches
        },
        users: {
          totalStaff
        },
        system: {
          latencyMs: databaseLatency,
          storageUsageMb: simulatedStorageMB,
          totalDocuments
        },
        resourceConsumption
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  } finally {
    if (superConn) {
      try { await superConn.close(); } catch (err) {}
    }
  }
};
