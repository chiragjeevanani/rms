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

// ── Login ─────────────────────────────────────────────────────────────────────
exports.superAdminLogin = async (req, res) => {
  const { email, password } = req.body;
  try {
    const superAdmin = await SuperAdmin.findOne({ email });
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
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ── Create Admin Node ─────────────────────────────────────────────────────────
exports.createRestaurant = async (req, res) => {
  try {
    const { name, email, branchLimit, thirdPartyApi, mobileNumber, status } = req.body;

    // Check duplicate
    const existingRestaurant = await Restaurant.findOne({ email });
    const existingAdmin = await Admin.findOne({ email });
    if (existingRestaurant || existingAdmin) {
      return res.status(400).json({ success: false, message: 'Administrator email already exists' });
    }

    // Random 8-char password
    const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%';
    let randomPassword = '';
    for (let i = 0; i < 8; i++) randomPassword += chars.charAt(Math.floor(Math.random() * chars.length));

    const limitValue = branchLimit ? parseInt(branchLimit) : 5;
    const nodeStatus = status ? status.toLowerCase() : 'active';

    // 1. Create local Restaurant
    const restaurant = new Restaurant({
      name, email,
      password: randomPassword,
      branchLimit: limitValue,
      thirdPartyApi,
      mobileNumber: mobileNumber || '',
      status: nodeStatus
    });
    await restaurant.save();

    // 2. Create local Admin
    const localAdmin = new Admin({
      name: `Admin - ${name}`,
      email,
      password: randomPassword,
      restaurantName: name,
      thirdPartyApi,
      mobileNumber: mobileNumber || ''
    });
    await localAdmin.save();

    // 3. Sync to admins collection
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(randomPassword, salt);

    await CentralAdmin.findOneAndUpdate(
      { email },
      {
        $set: {
          name: `Admin - ${name}`,
          password: hashedPassword,
          restaurantName: name,
          localDbName: `rms_${name.toLowerCase().replace(/\s+/g, '_')}`,
          localDbUrl: process.env.MONGODB_URL,
          thirdPartyApi,
          mobileNumber: mobileNumber || '',
          status: nodeStatus,
          branchLimit: limitValue
        },
        $setOnInsert: { createdAt: new Date() }
      },
      { upsert: true, new: true }
    );

    // 4. Send credentials email
    try {
      await sendEmail({
        email,
        subject: 'Your RMS Node Administrator Credentials',
        html: `
          <div style="font-family: Arial, sans-serif; padding: 24px; color: #1e293b; max-width: 600px; border: 1px solid #e2e8f0; border-radius: 16px;">
            <h2 style="color: #ff7a00; margin-top: 0; font-size: 20px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.05em;">Welcome to RMS Portal</h2>
            <p style="font-size: 14px; line-height: 1.6; color: #334155;">Your restaurant administrator account for <strong>${name}</strong> has been successfully provisioned.</p>
            <p style="font-size: 14px; line-height: 1.6; color: #334155;">Below are your secure login credentials:</p>
            <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 16px; margin: 20px 0;">
              <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
                <tr><td style="padding: 6px 0; font-weight: bold; color: #64748b; width: 140px;">Portal URL:</td><td style="padding: 6px 0; color: #0f172a;"><a href="https://rms.cloudedata.in/admin/login" style="color: #ff7a00; font-weight: bold; text-decoration: none;">https://rms.cloudedata.in/admin/login</a></td></tr>
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
      // Rollback
      await Restaurant.deleteOne({ email });
      await Admin.deleteOne({ email });
      await CentralAdmin.deleteOne({ email });
      return res.status(500).json({
        success: false,
        message: `Email delivery failed: ${mailErr.message || 'SMTP Error'}. Provisioning rolled back.`
      });
    }

    res.json({ success: true, message: 'Restaurant created and credentials dispatched successfully', data: restaurant });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── Get All Restaurants ───────────────────────────────────────────────────────
exports.getAllRestaurants = async (req, res) => {
  try {
    const restaurants = await Restaurant.find().sort({ createdAt: -1 });
    res.json({ success: true, data: restaurants });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── Toggle Third-Party API ────────────────────────────────────────────────────
exports.toggleThirdPartyApi = async (req, res) => {
  try {
    const { email } = req.params;

    let node = await Admin.findOne({ email });
    if (!node) node = await Restaurant.findOne({ email });
    if (!node) return res.status(404).json({ success: false, message: 'Node not found' });

    node.thirdPartyApi = !node.thirdPartyApi;
    await node.save();

    // Sync to admins collection
    await CentralAdmin.updateOne({ email }, { $set: { thirdPartyApi: node.thirdPartyApi } });

    res.json({ success: true, message: 'API Protocol updated', data: node });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── Get All Global Admins (for superadmin dashboard) ─────────────────────────
exports.getGlobalAdmins = async (req, res) => {
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

    const totalCount = await CentralAdmin.countDocuments(query);
    const totalPages = Math.ceil(totalCount / limit);

    const centralAdmins = await CentralAdmin.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();

    const enriched = await Promise.all(centralAdmins.map(async (cadmin) => {
      const localAdmin = await Admin.findOne({ email: cadmin.email });
      const localRest = await Restaurant.findOne({ email: cadmin.email });

      const name = (localAdmin?.name) || cadmin.name;
      const profileImg = (localAdmin?.profileImg) || cadmin.profileImg || '';
      const mobileNumber = (localAdmin?.mobileNumber) || cadmin.mobileNumber || '';
      const statusValue = localRest?.status || cadmin.status || 'active';
      const branchLimit = localRest?.branchLimit ?? cadmin.branchLimit ?? 5;
      const branchCount = localRest ? await Branch.countDocuments({ restaurantId: localRest._id }) : 0;

      return { ...cadmin, name, profileImg, mobileNumber, status: statusValue, branchLimit, branchCount };
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
  }
};

// ── Change SuperAdmin Password ────────────────────────────────────────────────
exports.changeSuperAdminPassword = async (req, res) => {
  const { email, currentPassword, newPassword } = req.body;
  try {
    const superAdmin = await SuperAdmin.findOne({ email });
    if (!superAdmin) return res.status(404).json({ success: false, message: 'Admin not found' });

    const isMatch = await bcrypt.compare(currentPassword, superAdmin.password);
    if (!isMatch) return res.status(401).json({ success: false, message: 'Current password incorrect' });

    const salt = await bcrypt.genSalt(10);
    superAdmin.password = await bcrypt.hash(newPassword, salt);
    await superAdmin.save();

    res.json({ success: true, message: 'Password updated successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ── Update System Theme ───────────────────────────────────────────────────────
exports.updateSystemTheme = async (req, res) => {
  const { primaryColor } = req.body;
  try {
    if (!primaryColor) return res.status(400).json({ success: false, message: 'Primary color is required' });
    await Admin.updateMany({}, { $set: { 'theme.primaryColor': primaryColor } });
    res.json({ success: true, message: 'System theme color updated successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── Update Admin Node ─────────────────────────────────────────────────────────
exports.updateRestaurant = async (req, res) => {
  const { email } = req.params;
  const { name, email: newEmail, mobileNumber, branchLimit, status, thirdPartyApi } = req.body;

  try {
    let restaurant = await Restaurant.findOne({ email });
    let adminNode = await Admin.findOne({ email });

    if (!restaurant && !adminNode) {
      return res.status(404).json({ success: false, message: 'Node not found' });
    }

    // Duplicate email check
    if (newEmail && newEmail !== email) {
      const emailExists = await Restaurant.findOne({ email: newEmail });
      const adminExists = await Admin.findOne({ email: newEmail });
      if (emailExists || adminExists) {
        return res.status(400).json({ success: false, message: 'The new email is already taken' });
      }
    }

    // Update / create Restaurant
    if (restaurant) {
      if (name) restaurant.name = name;
      if (newEmail) restaurant.email = newEmail;
      if (mobileNumber !== undefined) restaurant.mobileNumber = mobileNumber;
      if (branchLimit !== undefined) restaurant.branchLimit = parseInt(branchLimit);
      if (status) restaurant.status = status.toLowerCase();
      if (thirdPartyApi !== undefined) restaurant.thirdPartyApi = thirdPartyApi;
      await restaurant.save();
    } else {
      restaurant = new Restaurant({
        name: name || adminNode?.restaurantName || 'Royal Kitchen',
        email: newEmail || email,
        password: '123',
        branchLimit: branchLimit !== undefined ? parseInt(branchLimit) : 5,
        status: status ? status.toLowerCase() : 'active',
        mobileNumber: mobileNumber || '',
        thirdPartyApi: thirdPartyApi ?? false
      });
      await restaurant.save();
    }

    // Update Admin
    if (adminNode) {
      if (name) adminNode.name = `Admin - ${name}`;
      if (newEmail) adminNode.email = newEmail;
      if (mobileNumber !== undefined) adminNode.mobileNumber = mobileNumber;
      if (thirdPartyApi !== undefined) adminNode.thirdPartyApi = thirdPartyApi;
      if (name) adminNode.restaurantName = name;
      await adminNode.save();
    }

    // Sync to admins collection
    const syncData = {};
    if (name) { syncData.name = `Admin - ${name}`; syncData.restaurantName = name; }
    if (newEmail) syncData.email = newEmail;
    if (mobileNumber !== undefined) syncData.mobileNumber = mobileNumber;
    if (thirdPartyApi !== undefined) syncData.thirdPartyApi = thirdPartyApi;
    if (status) syncData.status = status.toLowerCase();
    if (branchLimit !== undefined) syncData.branchLimit = parseInt(branchLimit);

    await CentralAdmin.updateOne({ email }, { $set: syncData });

    res.json({ success: true, message: 'Node updated successfully', data: restaurant });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── Delete Admin Node ─────────────────────────────────────────────────────────
exports.deleteRestaurant = async (req, res) => {
  const { email } = req.params;
  try {
    const restDel = await Restaurant.deleteOne({ email });
    const adminDel = await Admin.deleteOne({ email });

    if (restDel.deletedCount === 0 && adminDel.deletedCount === 0) {
      return res.status(404).json({ success: false, message: 'Node not found' });
    }

    await CentralAdmin.deleteOne({ email });

    res.json({ success: true, message: 'Node terminated and deleted successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── Resend Credentials ────────────────────────────────────────────────────────
exports.resendCredentials = async (req, res) => {
  const { email } = req.params;
  try {
    const restaurant = await Restaurant.findOne({ email });
    const adminNode = await Admin.findOne({ email });

    if (!restaurant && !adminNode) {
      return res.status(404).json({ success: false, message: 'Admin node not found' });
    }

    // Generate a fresh random password
    const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%';
    let newPassword = '';
    for (let i = 0; i < 8; i++) newPassword += chars.charAt(Math.floor(Math.random() * chars.length));

    const displayName = restaurant?.name || adminNode?.restaurantName || 'Your Restaurant';

    // Update plain password in Restaurant (as per schema convention)
    if (restaurant) {
      restaurant.password = newPassword;
      await restaurant.save();
    }

    // Update hashed password in Admin (pre-save hook hashes it)
    if (adminNode) {
      adminNode.password = newPassword;
      await adminNode.save();
    }

    // Update hashed password in CentralAdmin
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);
    await CentralAdmin.updateOne({ email }, { $set: { password: hashedPassword } });

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
    res.json({ success: true, message: `Fresh credentials dispatched to ${email}` });
  } catch (err) {
    console.error('Resend credentials error:', err.message);
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── Super Admin Dashboard Stats ──────────────────────────────────────────────
exports.getDashboardStats = async (req, res) => {
  try {
    // 1. Account Stats
    const totalAdmins = await Restaurant.countDocuments();
    const activeAdmins = await Restaurant.countDocuments({ status: 'active' });
    const inactiveAdmins = totalAdmins - activeAdmins;

    // 2. Branch Allocation Stats
    const branches = await Branch.find().lean();
    const totalBranchesUsed = branches.length;

    // Sum allocated branches
    const allocatedResult = await Restaurant.aggregate([
      { $group: { _id: null, totalAllocated: { $sum: '$branchLimit' } } }
    ]);
    const totalAllocatedBranches = allocatedResult.length > 0 ? allocatedResult[0].totalAllocated : 0;
    const availableBranches = Math.max(0, totalAllocatedBranches - totalBranchesUsed);

    // 3. User & Staff Stats
    const totalStaff = await Staff.countDocuments();

    // 4. Resource Usage & Database Monitor (document counts per restaurant)
    const restaurants = await Restaurant.find().lean();
    const resourceConsumption = await Promise.all(restaurants.map(async (rest) => {
      // Find branches of this restaurant
      const rBranches = await Branch.find({ restaurantId: rest._id }).select('_id');
      const rBranchIds = rBranches.map(b => b._id);

      // Count resources in DB matching branch list
      const ordersCount = await Order.countDocuments({ branchId: { $in: rBranchIds } });
      const staffCount = await Staff.countDocuments({ branchId: { $in: rBranchIds } });
      const tablesCount = await Table.countDocuments({ branchId: { $in: rBranchIds } });
      const totalDocuments = ordersCount + staffCount + tablesCount;

      return {
        restaurantId: rest._id,
        name: rest.name,
        email: rest.email,
        branchesCount: rBranchIds.length,
        branchLimit: rest.branchLimit,
        ordersCount,
        staffCount,
        tablesCount,
        totalDocuments
      };
    }));

    // Sort to identify highest resource users
    resourceConsumption.sort((a, b) => b.totalDocuments - a.totalDocuments);

    // 5. System Health / Performance Metrics
    const databaseLatency = Math.floor(Math.random() * 8) + 2; // Simulated: 2-10ms
    const totalRecords = await Order.countDocuments() + await Staff.countDocuments() + await Table.countDocuments();
    const simulatedStorageMB = (50 + (totalRecords * 0.0005)).toFixed(2);

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
          totalDocuments: totalRecords
        },
        resourceConsumption
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
