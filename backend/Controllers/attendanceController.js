const Attendance = require('../Models/Attendance');
const Staff = require('../Models/Staff');

const getAllAttendance = async (req, res) => {
  try {
    const records = await Attendance.find().populate({
      path: 'staff',
      populate: { path: 'role' }
    }).sort({ createdAt: -1 });
    res.json(records);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

const createAttendance = async (req, res) => {
  try {
    const { staffId, terminal, checkIn, checkOut, status, date } = req.body;
    
    // Normalize date to YYYY-MM-DD if not provided
    const targetDate = date || new Date().toISOString().split('T')[0];

    const attendance = new Attendance({ 
      staff: staffId, 
      date: targetDate,
      terminal: terminal || 'MANUAL-OVERRIDE',
      checkIn,
      checkOut,
      status: status || 'In'
    });
    
    await attendance.save();
    const populated = await attendance.populate({
      path: 'staff',
      populate: { path: 'role' }
    });
    res.status(201).json(populated);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Mark Daily Attendance (UPSERT)
// @route   POST /api/attendance/mark
const markAttendance = async (req, res) => {
  const { staffId, status, date } = req.body;
  const todayStr = new Date().toISOString().split('T')[0];
  const targetDate = date || todayStr;

  // Security Check: Only allow marking for today
  if (targetDate !== todayStr) {
     return res.status(403).json({ message: 'Attendance modifications are only permitted for the current operational date.' });
  }

  try {
    let attendance = await Attendance.findOne({ staff: staffId, date: targetDate });

    if (attendance) {
      attendance.status = status;
      if (status === 'Present') {
          attendance.checkIn = attendance.checkIn || new Date();
      }
      await attendance.save();
    } else {
      attendance = new Attendance({
        staff: staffId,
        date: targetDate,
        status,
        checkIn: status === 'Present' ? new Date() : undefined,
        terminal: 'ADMIN-PORTAL'
      });
      await attendance.save();
    }

    const populated = await attendance.populate({
      path: 'staff',
      populate: { path: 'role' }
    });
    res.json(populated);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Get Attendance for a specific date
// @route   GET /api/attendance/date/:date
const getAttendanceByDate = async (req, res) => {
  try {
    const records = await Attendance.find({ date: req.params.date }).populate({
      path: 'staff',
      populate: { path: 'role' }
    });
    res.json(records);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

const updateAttendance = async (req, res) => {
  try {
    const attendance = await Attendance.findByIdAndUpdate(
      req.params.id,
      req.body,
      { returnDocument: 'after' }
    ).populate({
      path: 'staff',
      populate: { path: 'role' }
    });
    if (!attendance) return res.status(404).json({ message: 'Record not found' });
    res.json(attendance);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const deleteAttendance = async (req, res) => {
  try {
    const attendance = await Attendance.findByIdAndDelete(req.params.id);
    if (!attendance) return res.status(404).json({ message: 'Record not found' });
    res.json({ message: 'Attendance record deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

const getStaffHistory = async (req, res) => {
  try {
    const historical = await Attendance.find({ staff: req.params.staffId })
      .sort({ date: -1 })
      .limit(30);
    res.json(historical);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Staff Self-Punch (In/Out)
// @route   POST /api/attendance/punch
const punchAttendance = async (req, res) => {
  const staffIdFromToken = req.staff.id; 
  const { status } = req.body;
  const todayStr = new Date().toISOString().split('T')[0];

  try {
    let attendance = await Attendance.findOne({ staff: staffIdFromToken, date: todayStr });

    if (attendance) {
      attendance.status = status;
      if (status === 'In' || status === 'Present') {
          attendance.checkIn = attendance.checkIn || new Date();
      } else if (status === 'Out') {
          attendance.checkOut = new Date();
      }
      await attendance.save();
    } else {
      attendance = new Attendance({
        staff: staffIdFromToken,
        date: todayStr,
        status,
        checkIn: (status === 'In' || status === 'Present') ? new Date() : undefined,
        terminal: 'MOBILE-UI'
      });
      await attendance.save();
    }

    res.json({ success: true, data: attendance });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

module.exports = {
  getAllAttendance,
  getAttendanceByDate,
  getStaffHistory,
  createAttendance,
  markAttendance,
  updateAttendance,
  deleteAttendance,
  punchAttendance
};
