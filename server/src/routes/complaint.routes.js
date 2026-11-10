const express = require('express');
const router = express.Router();
const complaintController = require('../controllers/complaint.controller');
const { verifyToken } = require('../middleware/auth');
const { requireRole } = require('../middleware/authorize');
const validate = require('../middleware/validate');
const upload = require('../middleware/upload');
const {
  createComplaintValidator,
  respondComplaintValidator,
  adminNoteValidator
} = require('../validators/complaint.validators');

// Student complaint routes
router.post(
  '/',
  verifyToken,
  upload.array('images', 5),
  createComplaintValidator,
  validate,
  complaintController.submitComplaint
);
router.get('/my', verifyToken, complaintController.getMyComplaints);

// Shared / Admin complaint routes
router.get('/', verifyToken, requireRole('admin'), complaintController.getAllComplaints);
router.get('/:id', verifyToken, complaintController.getComplaintById);

router.put(
  '/:id/respond',
  verifyToken,
  requireRole('admin'),
  respondComplaintValidator,
  validate,
  complaintController.respondToComplaint
);

router.patch(
  '/:id/note',
  verifyToken,
  requireRole('admin'),
  adminNoteValidator,
  validate,
  complaintController.addAdminNote
);

module.exports = router;
