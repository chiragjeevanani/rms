const Admin = require('../Models/Admin');


/**
 * Middleware to verify SYNC_TOKEN
 */
const verifySyncToken = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'Missing Authorization Token' });
  }

  const token = authHeader.split(' ')[1];
  const expectedToken = process.env.SYNC_TOKEN;

  if (!expectedToken || token !== expectedToken) {
    return res.status(401).json({ success: false, message: 'Invalid Sync Token' });
  }

  next();
};

/**
 * Handle new admin creation event from SuperAdmin
 */
const handleAdminCreated = async (req, res) => {
  try {
    const { adminId, name, email, status, plan, expiryDate } = req.body.data || {};
    
    // Update local Admin replica
    await Admin.findOneAndUpdate(
      { adminId: adminId || email }, // Fallback to email if adminId missing
      {
        $set: {
          name: `Admin - ${name}`,
          email,
          isActive: status === 'active',
          plan,
          expiryDate: expiryDate ? new Date(expiryDate) : null,
          thirdPartyApi: false, // Default
        }
      },
      { upsert: true, new: true }
    );

    res.json({ success: true, message: 'Admin synced successfully' });
  } catch (error) {
    console.error('[TenantSync] Error handling admin created:', error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Handle admin status change event
 */
const handleAdminStatus = async (req, res) => {
  try {
    const { adminId, status } = req.body.data || {};
    
    await Admin.findOneAndUpdate(
      { adminId },
      { $set: { isActive: status === 'active' } }
    );

    res.json({ success: true, message: 'Status synced successfully' });
  } catch (error) {
    console.error('[TenantSync] Error handling status change:', error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Handle admin plan change event
 */
const handleAdminPlan = async (req, res) => {
  try {
    const { adminId, plan } = req.body.data || {};
    
    await Admin.findOneAndUpdate(
      { adminId },
      { $set: { plan } }
    );

    res.json({ success: true, message: 'Plan synced successfully' });
  } catch (error) {
    console.error('[TenantSync] Error handling plan change:', error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Handle admin expiry change event
 */
const handleAdminExpiry = async (req, res) => {
  try {
    const { adminId, expiryDate } = req.body.data || {};
    
    await Admin.findOneAndUpdate(
      { adminId },
      { $set: { expiryDate: new Date(expiryDate) } }
    );

    res.json({ success: true, message: 'Expiry synced successfully' });
  } catch (error) {
    console.error('[TenantSync] Error handling expiry change:', error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};



module.exports = {
  verifySyncToken,
  handleAdminCreated,
  handleAdminStatus,
  handleAdminPlan,
  handleAdminExpiry
};
