const express = require('express');
const router = express.Router();
const attendanceController = require('../controllers/attendance.controller');
const qrController = require('../controllers/qr.controller');
const { verifyToken } = require('../middleware/auth');
const { requireRole } = require('../middleware/authorize');

// Student attendance routes
router.get('/my/summary', verifyToken, attendanceController.getMyAttendanceSummary);
router.get('/my', verifyToken, attendanceController.getMyAttendance);
router.get('/my-attendance', verifyToken, attendanceController.getMyAttendance); // alias used by frontend

// Admin attendance routes
router.post('/scan', verifyToken, requireRole('admin'), qrController.verifyQR); // alias used by scanner page
router.post('/verify', verifyToken, requireRole('admin'), qrController.verifyQR); // alias used by scanner page
router.get('/stats', verifyToken, requireRole('admin'), attendanceController.getAttendanceStats);
router.get('/', verifyToken, requireRole('admin'), attendanceController.getAllAttendance);

module.exports = router;
