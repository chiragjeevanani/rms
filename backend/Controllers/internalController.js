const Restaurant = require('../Models/Restaurant');
const Admin = require('../Models/Admin');

exports.syncAdmin = async (req, res) => {
  const { action, payload, secret } = req.body;

  // Validation
  const expectedSecret = process.env.INTERNAL_SYNC_SECRET || 'fallback_sync_secret_token_1234';
  if (!secret || secret !== expectedSecret) {
    return res.status(401).json({ success: false, message: 'Unauthorized sync request' });
  }

  if (!action || !payload) {
    return res.status(400).json({ success: false, message: 'Invalid payload: action and payload are required' });
  }

  try {
    console.log(`[Local Sync API] Processing action: ${action} for payload:`, JSON.stringify(payload));
    
    switch (action) {
      case 'create': {
        const { restaurant, admin } = payload;
        if (!restaurant || !admin) {
          return res.status(400).json({ success: false, message: 'Invalid create payload' });
        }
        
        // Remove duplicates if any to prevent duplicate key errors
        await Restaurant.deleteOne({ email: restaurant.email });
        await Admin.deleteOne({ email: admin.email });

        // Save Restaurant
        const newRestaurant = new Restaurant(restaurant);
        await newRestaurant.save();

        // Save Admin (pre-save hook hashes password if unhashed)
        const newAdmin = new Admin(admin);
        await newAdmin.save();
        
        break;
      }
      case 'update': {
        const { email, syncData } = payload;
        if (!email || !syncData) {
          return res.status(400).json({ success: false, message: 'Invalid update payload' });
        }

        const { name, email: newEmail, mobileNumber, branchLimit, status, thirdPartyIntegration, adminId } = syncData;

        // Update target Restaurant
        const restDoc = await Restaurant.findOne({ email });
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
        }

        // Update target Admin
        const adminDoc = await Admin.findOne({ email });
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
        }
        break;
      }
      case 'delete': {
        const { email } = payload;
        if (!email) {
          return res.status(400).json({ success: false, message: 'Invalid delete payload' });
        }
        await Restaurant.deleteOne({ email });
        await Admin.deleteOne({ email });
        break;
      }
      case 'toggle-api': {
        const { email, thirdPartyIntegration } = payload;
        if (!email) {
          return res.status(400).json({ success: false, message: 'Invalid toggle-api payload' });
        }
        await Restaurant.updateMany({ email }, { $set: { thirdPartyApi: thirdPartyIntegration, thirdPartyIntegration } });
        await Admin.updateMany({ email }, { $set: { thirdPartyApi: thirdPartyIntegration, thirdPartyIntegration } });
        break;
      }
      case 'resend-credentials': {
        const { email, newPassword } = payload;
        if (!email || !newPassword) {
          return res.status(400).json({ success: false, message: 'Invalid credentials payload' });
        }

        const restDoc = await Restaurant.findOne({ email });
        if (restDoc) {
          restDoc.password = newPassword;
          await restDoc.save();
        }

        const adminDoc = await Admin.findOne({ email });
        if (adminDoc) {
          adminDoc.password = newPassword;
          await adminDoc.save();
        }
        break;
      }
      case 'update-theme': {
        const { primaryColor } = payload;
        if (!primaryColor) {
          return res.status(400).json({ success: false, message: 'Invalid update-theme payload' });
        }
        await Admin.updateMany({}, { $set: { 'theme.primaryColor': primaryColor } });
        break;
      }
      default: {
        return res.status(400).json({ success: false, message: `Unsupported action: ${action}` });
      }
    }

    res.json({ success: true, message: `Action ${action} executed successfully` });
  } catch (error) {
    console.error(`[Local Sync API Error] Failed to process action ${action}:`, error);
    res.status(500).json({ success: false, message: error.message });
  }
};
