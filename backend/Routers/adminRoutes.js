const express = require('express');
const router = express.Router();
const { 
  loginAdmin, 
  getProfile, 
  updateProfile, 
  changePassword,
  getDashboardStats 
} = require('../Controllers/adminController');
const { protectAdmin } = require('../Middleware/authMiddleware');
const { upload } = require('../Config/cloudinary');

router.post('/login', loginAdmin);
router.get('/profile', protectAdmin, getProfile);
router.get('/dashboard-stats', protectAdmin, getDashboardStats);
router.put('/profile', protectAdmin, updateProfile);
router.put('/change-password', protectAdmin, changePassword);
router.post('/upload', protectAdmin, upload.single('profileImg'), (req, res) => {
  if (req.file && req.file.path) {
    res.json({ imageUrl: req.file.path });
  } else {
    res.status(400).json({ message: 'Upload failed' });
  }
});

module.exports = router;
