const Staff = require('../Models/Staff');
const sendEmail = require('../Utils/sendEmail');
const jwt = require('jsonwebtoken');

const getAllStaff = async (req, res) => {
  try {
    const staff = await Staff.find().populate('role');
    res.json(staff);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

const createStaff = async (req, res) => {
  try {
    const { name, email, role, status, pin } = req.body;
    const password = '123456';
    
    // Check if staff already exists
    const existing = await Staff.findOne({ email });
    if (existing) return res.status(400).json({ message: 'Staff with this email already exists' });

    const staff = new Staff({ 
      name, 
      email, 
      role, 
      status, 
      pin: pin || '1234',
      password
    });

    await staff.save();
    const populated = await staff.populate('role');

    // Send Welcome Email
    try {
      await sendEmail({
        email: staff.email,
        subject: 'Welcome to RMS - Your Staff Account Details',
        html: `
          <div style="font-family: sans-serif; padding: 20px; border: 1px solid #eee; border-radius: 10px; max-width: 600px;">
            <h2 style="color: #2C2C2C; border-bottom: 2px solid #FACC15; padding-bottom: 10px; display: inline-block;">Welcome to the Team, ${name}!</h2>
            <div style="background: #f9f9f9; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <strong>User Email:</strong> ${email}<br/>
              <strong>Temporary Password:</strong> ${password}
            </div>
            <p style="color: #666; font-size: 12px;">Login at the staff portal and reset your password for security.</p>
          </div>
        `
      });
    } catch (e) {}

    res.status(201).json(populated);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Staff Login
// @route   POST /api/staff/login
const staffLogin = async (req, res) => {
  const { email, password } = req.body;
  try {
    const staff = await Staff.findOne({ email }).populate('role');
    if (staff && (await staff.matchPassword(password))) {
      const token = jwt.sign(
        { id: staff._id, role: staff.role.name },
        process.env.JWT_SECRET,
        { expiresIn: '30d' }
      );
      res.json({
        _id: staff._id,
        name: staff.name,
        email: staff.email,
        role: staff.role.name,
        token
      });
    } else {
      res.status(401).json({ message: 'Invalid email or password' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const pinLogin = async (req, res) => {
  const { pin } = req.body;
  try {
    const staff = await Staff.findOne({ pin }).populate('role');
    if (staff) {
      const token = jwt.sign(
        { id: staff._id, role: staff.role.name },
        process.env.JWT_SECRET,
        { expiresIn: '30d' }
      );
      res.json({
        _id: staff._id,
        name: staff.name,
        email: staff.email,
        role: staff.role.name,
        token
      });
    } else {
      res.status(401).json({ message: 'Invalid Terminal PIN' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Forgot Password - Send OTP
// @route   POST /api/staff/forgot-password
const forgotPassword = async (req, res) => {
  const { email } = req.body;
  try {
    const staff = await Staff.findOne({ email });
    if (!staff) return res.status(404).json({ message: 'Staff not found with this email' });

    // Generate 6 Digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    staff.resetOTP = otp;
    staff.resetOTPExpire = Date.now() + 10 * 60 * 1000; // 10 Minutes
    await staff.save();

    await sendEmail({
      email: staff.email,
      subject: 'RMS - Staff Password Reset OTP',
      html: `
        <div style="font-family: sans-serif; padding: 20px; border: 1px solid #eee; border-radius: 10px; max-width: 600px;">
          <h2 style="color: #2C2C2C;">Password Reset Request</h2>
          <p>Your 6-digit OTP for password reset is:</p>
          <div style="background: #FACC15 text-align: center; padding: 15px; font-size: 24px; font-weight: bold; border-radius: 8px;">
            ${otp}
          </div>
          <p style="color: #999; font-size: 11px; margin-top: 20px;">This OTP will expire in 10 minutes.</p>
        </div>
      `
    });

    res.json({ message: 'OTP sent to your registered email' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Verify OTP for Password Reset
// @route   POST /api/staff/verify-otp
const verifyOTP = async (req, res) => {
  const { email, otp } = req.body;
  try {
    const staff = await Staff.findOne({ email });
    if (!staff) return res.status(404).json({ message: 'Staff user not found' });

    if (staff.resetOTP !== otp || staff.resetOTPExpire < Date.now()) {
      return res.status(400).json({ message: 'Invalid or expired OTP' });
    }

    res.json({ message: 'OTP verified successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Reset Password using OTP
// @route   POST /api/staff/reset-password
const resetPassword = async (req, res) => {
  const { email, otp, newPassword } = req.body;
  try {
    const staff = await Staff.findOne({ email });
    if (!staff) return res.status(404).json({ message: 'Staff user not found' });

    if (staff.resetOTP !== otp || staff.resetOTPExpire < Date.now()) {
      return res.status(400).json({ message: 'Invalid or expired OTP' });
    }

    // Set new password
    staff.password = newPassword;
    staff.resetOTP = undefined;
    staff.resetOTPExpire = undefined;
    await staff.save();

    res.json({ message: 'Password reset successful. Please login with your new password.' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const updateStaff = async (req, res) => {
  try {
    const staff = await Staff.findByIdAndUpdate(
      req.params.id,
      req.body,
      { returnDocument: 'after' }
    ).populate('role');
    if (!staff) return res.status(404).json({ message: 'Staff not found' });
    res.json(staff);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const deleteStaff = async (req, res) => {
  try {
    const staff = await Staff.findByIdAndDelete(req.params.id);
    if (!staff) return res.status(404).json({ message: 'Staff not found' });
    res.json({ message: 'Staff deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

const changePassword = async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  try {
    const staff = await Staff.findById(req.params.id);
    if (!staff) return res.status(404).json({ message: 'Staff not found' });

    const isMatch = await staff.matchPassword(currentPassword);
    if (!isMatch) return res.status(400).json({ message: 'Identity mismatch: Current password incorrect' });

    staff.password = newPassword;
    await staff.save();
    res.json({ message: 'Credential shift successful: Password recalibrated' });
  } catch (error) {
    res.status(500).json({ message: 'Security sync error' });
  }
};

const deleteProfile = async (req, res) => {
  try {
    const staff = await Staff.findByIdAndDelete(req.params.id);
    if (!staff) return res.status(404).json({ message: 'Staff identity not found' });
    res.json({ message: 'Identity termination sequence complete' });
  } catch (error) {
    res.status(500).json({ message: 'Termination reach error' });
  }
};

const getProfile = async (req, res) => {
  try {
    const staff = await Staff.findById(req.params.id).populate('role');
    if (!staff) return res.status(404).json({ message: 'Staff not found' });
    res.json(staff);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  getAllStaff,
  getProfile,
  createStaff,
  updateStaff,
  deleteStaff,
  staffLogin,
  pinLogin,
  forgotPassword,
  verifyOTP,
  resetPassword,
  changePassword,
  deleteProfile
};
