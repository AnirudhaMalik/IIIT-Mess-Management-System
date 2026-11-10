const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/payment.controller');
const { verifyToken } = require('../middleware/auth');
const { requireRole } = require('../middleware/authorize');

// Student payment actions
router.post('/initiate', verifyToken, paymentController.initiatePayment);
router.post('/confirm', verifyToken, paymentController.confirmPayment);
router.get('/my', verifyToken, paymentController.getMyTransactions);
router.get('/my/:id', verifyToken, paymentController.getTransactionById);

// Admin payment routes
router.get('/stats', verifyToken, requireRole('admin'), paymentController.getPaymentStats);
router.get('/', verifyToken, requireRole('admin'), paymentController.getAllTransactions);
router.get('/:id', verifyToken, paymentController.getTransactionById);

module.exports = router;
