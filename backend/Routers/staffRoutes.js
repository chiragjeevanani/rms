const express = require('express');
const router = express.Router();
const { 
  getAllStaff, 
  createStaff, 
  updateStaff, 
  deleteStaff, 
  getProfile,
  staffLogin,
  pinLogin,
  forgotPassword,
  verifyOTP,
  resetPassword,
  changePassword,
  deleteProfile
} = require('../Controllers/staffController');
const { protectAdmin, protectStaff } = require('../Middleware/authMiddleware');
const { upload, processImage } = require('../Config/uploadConfig');

router.post('/upload', protectStaff, upload.single('profileImg'), processImage, (req, res) => {
  if (req.file && req.file.path) {
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    res.json({ imageUrl: `${baseUrl}${req.file.path}` });
  } else {
    res.status(400).json({ message: 'No file uploaded or upload rejected' });
  }
});

// Public auth routes
router.post('/login', staffLogin);
router.post('/pin-login', pinLogin);
router.post('/forgot-password', forgotPassword);
router.post('/verify-otp', verifyOTP);
router.post('/reset-password', resetPassword);

// Management routes
router.get('/', protectAdmin, getAllStaff);
router.post('/', protectAdmin, createStaff);
router.get('/:id', protectStaff, getProfile);
router.put('/:id', protectStaff, updateStaff);
router.put('/change-password/:id', protectStaff, changePassword);
router.delete('/profile/:id', protectStaff, deleteProfile);
router.delete('/:id', protectAdmin, deleteStaff);

module.exports = router;
