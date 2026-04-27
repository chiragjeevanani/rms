const Restaurant = require('../Models/Restaurant');
const Admin = require('../Models/Admin');
const connectSuperAdminDB = require('../Config/superAdminDb');
const bcrypt = require('bcryptjs');

exports.superAdminLogin = async (req, res) => {
  const { email, password } = req.body;
  // Hardcoded SuperAdmin for simplicity
  if (email === 'superadmin@rms.com' && password === 'superadmin123') {
    return res.json({ 
      success: true, 
      token: 'superadmin-secret-token', // In production, use JWT
      user: { name: 'Super Admin', role: 'superadmin' } 
    });
  }
  res.status(401).json({ success: false, message: 'Invalid Credentials' });
};

exports.createRestaurant = async (req, res) => {
  try {
    const { name, email, password, thirdPartyApi } = req.body;
    const existing = await Restaurant.findOne({ email });
    if (existing) return res.status(400).json({ success: false, message: 'Restaurant email already exists' });

    const restaurant = new Restaurant({ name, email, password, thirdPartyApi });
    await restaurant.save();

    // Sync to Central SuperAdmin DB
    const centralConn = await connectSuperAdminDB();
    if (centralConn) {
      const CentralAdmin = centralConn.collection('admins');
      
      // Hash password for Central DB
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);

      const dbName = `rms_${name.toLowerCase().replace(/\s+/g, '_')}`;
      const localDbUrl = process.env.MONGO_URI || 'mongodb://localhost:27017/rms';

      await CentralAdmin.insertOne({
        name: `Admin - ${name}`,
        email,
        password: hashedPassword, // Hashed Password
        restaurantName: name,
        localDbName: dbName, // Database in use
        localDbUrl: localDbUrl, // Full DB URL Sync
        createdAt: new Date(),
        thirdPartyApi
      });
      await centralConn.close();
      console.log(`🌐 Synced node [${name}] to Central SuperAdmin DB (Hashed + URL)`);
    }

    res.json({ success: true, message: 'Restaurant created successfully', data: restaurant });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getAllRestaurants = async (req, res) => {
  try {
    const restaurants = await Restaurant.find().sort({ createdAt: -1 });
    res.json({ success: true, data: restaurants });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.toggleThirdPartyApi = async (req, res) => {
  try {
    const { email } = req.params;
    
    // 1. Search in Admin first, then Restaurant
    let node = await Admin.findOne({ email });
    let isMainAdmin = true;

    if (!node) {
      node = await Restaurant.findOne({ email });
      isMainAdmin = false;
    }

    if (!node) return res.status(404).json({ success: false, message: 'Node identity not found in local system' });

    // 2. Toggle locally
    node.thirdPartyApi = !node.thirdPartyApi;
    await node.save();

    // 3. Sync to Central SuperAdmin DB
    const centralConn = await connectSuperAdminDB();
    if (centralConn) {
      const CentralAdmin = centralConn.collection('admins');
      await CentralAdmin.updateOne(
        { email: node.email },
        { $set: { thirdPartyApi: node.thirdPartyApi } }
      );
      await centralConn.close();
      console.log(`🌐 Centrally synced API toggle for [${isMainAdmin ? 'Main Admin' : 'Node'}]: ${node.email} -> ${node.thirdPartyApi}`);
    }

    res.json({ success: true, message: 'API Protocol Synced Successfully', data: node });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getGlobalAdmins = async (req, res) => {
  try {
    const centralConn = await connectSuperAdminDB();
    if (!centralConn) return res.status(500).json({ success: false, message: 'Central DB Connection Failed' });

    const admins = await centralConn.collection('admins').find().sort({ createdAt: -1 }).toArray();
    await centralConn.close();

    res.json({ success: true, data: admins });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
