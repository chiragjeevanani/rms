const Staff = require('../Models/Staff');
const sendEmail = require('../Utils/sendEmail');
const jwt = require('jsonwebtoken');

const getAllStaff = async (req, res) => {
  try {
    const staff = await Staff.find().populate('role').populate('branchId');
    res.json(staff);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

const createStaff = async (req, res) => {
  try {
    const { name, email, role, status, pin, branchId } = req.body;

    const generateRandomPIN = () => {
      return Math.floor(1000 + Math.random() * 9000).toString();
    };

    const staffPIN = generateRandomPIN();
    // Use PIN as the password for simplicity since user asked for 4-digit password
    const password = staffPIN; 
    
    // Check if staff already exists
    const existing = await Staff.findOne({ email });
    if (existing) return res.status(400).json({ message: 'Staff with this email already exists' });

    const staff = new Staff({ 
      name, 
      email, 
      role, 
      status, 
      pin: staffPIN,
      password: password,
      branchId
    });

    await staff.save();
    const populated = await staff.populate(['role', 'branchId']);

    // Send Welcome Email
    try {
      await sendEmail({
        email: staff.email,
        subject: 'Welcome to RMS - Your Access Credentials',
        html: `
          <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 40px; background-color: #fcfcfc;">
            <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 24px; overflow: hidden; box-shadow: 0 10px 40px rgba(0,0,0,0.05); border: 1px solid #f0f0f0;">
              <div style="padding: 40px;">
                <h1 style="color: #0f172a; font-size: 24px; font-weight: 800; text-transform: uppercase; letter-spacing: -0.5px; margin-bottom: 8px;">Welcome to the Team!</h1>
                <p style="color: #64748b; font-size: 14px; margin-bottom: 32px;">Hello ${name}, your operational identity has been successfully enrolled.</p>
                
                <div style="background-color: #f8fafc; border-radius: 16px; padding: 24px; border: 1px solid #f1f5f9; text-align: center;">
                  <p style="color: #94a3b8; font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: 1px; margin: 0 0 8px 0;">Your 4-Digit Access Code</p>
                  <p style="color: #2563eb; font-size: 32px; font-weight: 800; letter-spacing: 8px; margin: 0;">${staffPIN}</p>
                </div>

                <div style="margin-top: 32px; padding-top: 32px; border-top: 1px solid #f1f5f9;">
                  <p style="color: #94a3b8; font-size: 11px; line-height: 1.6;"><strong>Security Protocol:</strong> Use this 4-digit code to log in to the POS terminal and your portal. Please keep this code confidential.</p>
                </div>
              </div>
              <div style="padding: 20px; background-color: #0f172a; text-align: center;">
                <p style="color: #94a3b8; font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 2px; margin: 0;">RMS OPERATIONAL SIGNAL</p>
              </div>
            </div>
          </div>
        `
      });
    } catch (e) {
      console.error('Email sending failed:', e);
    }

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
    const staff = await Staff.findOne({ email }).populate('role').populate('branchId');
    if (staff && (await staff.matchPassword(password))) {
      const token = jwt.sign(
        { id: staff._id, role: staff.role.name, branchId: staff.branchId?._id || staff.branchId },
        process.env.JWT_SECRET,
        { expiresIn: '30d' }
      );
      res.json({
        _id: staff._id,
        name: staff.name,
        email: staff.email,
        role: staff.role.name,
        branchId: staff.branchId,
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
    const staff = await Staff.findOne({ pin }).populate('role').populate('branchId');
    if (staff) {
      const token = jwt.sign(
        { id: staff._id, role: staff.role.name, branchId: staff.branchId?._id || staff.branchId },
        process.env.JWT_SECRET,
        { expiresIn: '30d' }
      );
      res.json({
        _id: staff._id,
        name: staff.name,
        email: staff.email,
        role: staff.role.name,
        branchId: staff.branchId,
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
    const staff = await Staff.findById(req.params.id).populate('role').populate('branchId');
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
