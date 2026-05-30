const jwt = require('jsonwebtoken');
const Restaurant = require('../Models/Restaurant');

const protectAdmin = async (req, res, next) => {
  const token = req.header('Authorization')?.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'No token, authorization denied' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret');
    if (decoded.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized as admin' });
    }

    if (decoded.restaurantId) {
      const restaurant = await Restaurant.findById(decoded.restaurantId);
      if (restaurant && restaurant.status === 'inactive') {
        return res.status(403).json({ 
          success: false, 
          message: 'Your account has been deactivated. Please contact Super Admin.', 
          code: 'ACCOUNT_INACTIVE' 
        });
      }
    }

    req.admin = decoded;
    next();
  } catch (err) {
    res.status(401).json({ message: 'Token is not valid' });
  }
};

const protectStaff = (req, res, next) => {
  const token = req.header('Authorization')?.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'Authorization required' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret');
    req.staff = decoded;
    next();
  } catch (err) {
    res.status(401).json({ message: 'Token invalid' });
  }
};

module.exports = { protectAdmin, protectStaff };
