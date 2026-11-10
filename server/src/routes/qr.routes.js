const express = require('express');
const router = express.Router();
const qrController = require('../controllers/qr.controller');
const { verifyToken } = require('../middleware/auth');
const { requireRole } = require('../middleware/authorize');

// Student QR code routes
router.get('/my-token', verifyToken, qrController.getMyQRToken);
router.post('/regenerate', verifyToken, qrController.regenerateQR);

// Admin QR scanning and lookup routes
router.post('/verify', verifyToken, requireRole('admin'), qrController.verifyQR);
router.get('/lookup/:studentId', verifyToken, requireRole('admin'), qrController.manualLookup);

module.exports = router;
