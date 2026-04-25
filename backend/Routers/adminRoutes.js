const express = require('express');
const router = express.Router();
const { 
  loginAdmin, 
  getProfile,
  getPublicRestaurantInfo,
  updateProfile, 
  changePassword,
  getDashboardStats 
} = require('../Controllers/adminController');
const { protectAdmin } = require('../Middleware/authMiddleware');
const { upload, processImage } = require('../Config/uploadConfig');

router.post('/login', loginAdmin);
router.get('/public-info', getPublicRestaurantInfo);
router.get('/profile', protectAdmin, getProfile);
router.get('/dashboard-stats', protectAdmin, getDashboardStats);
router.put('/profile', protectAdmin, updateProfile);
router.put('/change-password', protectAdmin, changePassword);
router.post('/upload', protectAdmin, upload.single('profileImg'), processImage, (req, res) => {
  if (req.file && req.file.path) {
    // Generate full URL
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    res.json({ imageUrl: `${baseUrl}${req.file.path}` });
  } else {
    res.status(400).json({ message: 'Upload failed' });
  }
});

module.exports = router;
