const Admin = require('../Models/Admin');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const loginAdmin = async (req, res) => {
  const { email, password } = req.body;

  try {
    // Check if admin exists
    const admin = await Admin.findOne({ email });
    if (!admin) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // Verify password
    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // Generate token
    const token = jwt.sign(
      { id: admin._id, email: admin.email, role: 'admin' },
      process.env.JWT_SECRET || 'fallback_secret',
      { expiresIn: '1d' }
    );

    res.json({
      message: 'Login successful',
      token,
      admin: {
        id: admin._id,
        name: admin.name,
        email: admin.email
      }
    });

  } catch (error) {
    console.error('Admin Login Error:', error);
    res.status(500).json({ message: 'Server error during login' });
  }
};

const getProfile = async (req, res) => {
  try {
    const admin = await Admin.findById(req.admin.id).select('-password');
    res.json(admin);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

const getPublicRestaurantInfo = async (req, res) => {
  try {
    const admin = await Admin.findOne().select('restaurantName mobileNumber address profileImg');
    if (!admin) return res.status(404).json({ message: 'Store info not found' });
    res.json(admin);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

const updateProfile = async (req, res) => {
  const { name, profileImg, restaurantName, mobileNumber, address } = req.body;
  try {
    const admin = await Admin.findById(req.admin.id);
    if (!admin) return res.status(404).json({ message: 'Admin not found' });

    if (name) admin.name = name;
    if (profileImg) admin.profileImg = profileImg;
    if (restaurantName) admin.restaurantName = restaurantName;
    if (mobileNumber) admin.mobileNumber = mobileNumber;
    if (address) admin.address = address;

    await admin.save();
    res.json({ 
      message: 'Profile updated successfully', 
      admin: { 
        name: admin.name, 
        email: admin.email, 
        profileImg: admin.profileImg,
        restaurantName: admin.restaurantName,
        mobileNumber: admin.mobileNumber,
        address: admin.address
      } 
    });
  } catch (error) {
    console.error('Update Profile Error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const changePassword = async (req, res) => {
  const { oldPassword, newPassword } = req.body;
  try {
    const admin = await Admin.findById(req.admin.id);
    if (!admin) return res.status(404).json({ message: 'Admin not found' });

    const isMatch = await bcrypt.compare(oldPassword, admin.password);
    if (!isMatch) return res.status(400).json({ message: 'Incorrect old password' });

    admin.password = newPassword;

    await admin.save();
    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    console.error('Change Password Error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const Order = require('../Models/Order');
const Staff = require('../Models/Staff');
const Stock = require('../Models/Stock');
const Category = require('../Models/Category');
const Item = require('../Models/Item');
const Combo = require('../Models/Combo');

const getDashboardStats = async (req, res) => {
  try {
    const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date(); todayEnd.setHours(23, 59, 59, 999);

    // 1. Order Metrics Row
    const orderStats = {
      total: await Order.countDocuments(),
      pending: await Order.countDocuments({ status: 'Pending' }),
      preparing: await Order.countDocuments({ status: 'Preparing' }),
      completed: await Order.countDocuments({ status: { $in: ['Ready', 'Served', 'Paid', 'Completed'] } })
    };

    // 2. Content Inventory Row
    const contentStats = {
      categories: {
        total: await Category.countDocuments(),
        active: await Category.countDocuments({ status: 'Published' }),
        inactive: await Category.countDocuments({ status: 'Draft' })
      },
      items: {
        total: await Item.countDocuments(),
        active: await Item.countDocuments({ status: 'Published' }),
        inactive: await Item.countDocuments({ status: 'Draft' })
      },
      combos: {
        total: await Combo.countDocuments(),
        active: await Combo.countDocuments({ status: 'Published' }),
        inactive: await Combo.countDocuments({ status: 'Draft' })
      }
    };

    // 3. Revenue Trend Logic
    // Daily (Last 30 Days)
    const dailyHistory = [];
    for (let i = 29; i >= 0; i--) {
       const d = new Date(); d.setDate(d.getDate() - i);
       const start = new Date(d); start.setHours(0,0,0,0);
       const end = new Date(d); end.setHours(23,59,59,999);

       const rev = await Order.aggregate([
         { $match: { createdAt: { $gte: start, $lte: end }, status: { $ne: 'Cancelled' } } },
         { $group: { _id: null, total: { $sum: '$grandTotal' } } }
       ]);
       dailyHistory.push({
         date: d.toLocaleDateString(),
         revenue: rev.length > 0 ? rev[0].total : 0,
         day: d.toLocaleDateString('en-US', { weekday: 'short' }),
         fullDate: d
       });
    }

    // Monthly (Last 6 Months)
    const monthlyHistory = [];
    for (let i = 5; i >= 0; i--) {
       const d = new Date(); d.setMonth(d.getMonth() - i);
       const startMonth = new Date(d.getFullYear(), d.getMonth(), 1);
       const endMonth = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999);

       const rev = await Order.aggregate([
         { $match: { createdAt: { $gte: startMonth, $lte: endMonth }, status: { $ne: 'Cancelled' } } },
         { $group: { _id: null, total: { $sum: '$grandTotal' } } }
       ]);
       monthlyHistory.push({
          name: d.toLocaleString('default', { month: 'short' }),
          revenue: rev.length > 0 ? rev[0].total : 0
       });
    }

    // 4. Recent Activity
    const recentOrders = await Order.find()
      .sort({ createdAt: -1 })
      .limit(8)
      .select('orderNumber tableName grandTotal status createdAt');

    res.json({
      success: true,
      data: {
        orders: orderStats,
        content: contentStats,
        trends: {
           daily: dailyHistory,
           monthly: monthlyHistory
        },
        recentOrders,
        metrics: {
           todayRevenue: dailyHistory[dailyHistory.length - 1].revenue,
           todayOrders: await Order.countDocuments({ createdAt: { $gte: todayStart, $lte: todayEnd } })
        }
      }
    });
  } catch (error) {
    console.error('Advanced Dashboard Error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  loginAdmin,
  getProfile,
  getPublicRestaurantInfo,
  updateProfile,
  changePassword,
  getDashboardStats
};
