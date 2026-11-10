const express = require('express');
const router = express.Router();
const studentController = require('../controllers/student.controller');
const { verifyToken } = require('../middleware/auth');
const { requireRole } = require('../middleware/authorize');
const validate = require('../middleware/validate');
const upload = require('../middleware/upload');
const { changePasswordValidator } = require('../validators/auth.validators');

// Student profile routes
router.get('/profile', verifyToken, studentController.getProfile);
router.put('/profile', verifyToken, studentController.updateProfile);
router.put('/profile/password', verifyToken, changePasswordValidator, validate, studentController.changePassword);
router.post('/profile/photo', verifyToken, upload.single('photo'), studentController.uploadProfilePhoto);

// Admin student management routes
router.get('/', verifyToken, requireRole('admin'), studentController.getAllStudents);
router.post('/', verifyToken, requireRole('admin'), studentController.addStudentManually);
router.get('/:id', verifyToken, requireRole('admin'), studentController.getStudentById);
router.put('/:id', verifyToken, requireRole('admin'), studentController.updateStudentAdmin);
router.patch('/:id/status', verifyToken, requireRole('admin'), studentController.updateStudentStatus);

module.exports = router;
