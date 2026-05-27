const express = require('express');
const router = express.Router();
const { 
  getAllAttendance, 
  getAttendanceByDate,
  getStaffHistory,
  createAttendance, 
  markAttendance,
  updateAttendance, 
  deleteAttendance,
  punchAttendance,
  getAttendanceReport
} = require('../Controllers/attendanceController');
const { protectAdmin, protectStaff } = require('../Middleware/authMiddleware');

router.get('/', getAllAttendance);
router.get('/report', protectAdmin, getAttendanceReport);
router.get('/date/:date', getAttendanceByDate);
router.get('/staff/:staffId', getStaffHistory);
router.post('/', protectAdmin, createAttendance);
router.post('/mark', protectAdmin, markAttendance);
router.post('/punch', protectStaff, punchAttendance);
router.put('/:id', protectAdmin, updateAttendance);
router.delete('/:id', protectAdmin, deleteAttendance);

module.exports = router;
