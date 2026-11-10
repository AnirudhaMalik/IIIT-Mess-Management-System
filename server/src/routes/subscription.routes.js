const express = require('express');
const router = express.Router();
const subscriptionController = require('../controllers/subscription.controller');
const { verifyToken } = require('../middleware/auth');
const { requireRole } = require('../middleware/authorize');
const validate = require('../middleware/validate');
const {
  createSubscriptionValidator,
  updateSubscriptionValidator
} = require('../validators/subscription.validators');

// Student subscription routes
router.get('/my', verifyToken, subscriptionController.getMySubscriptions);
router.get('/my/active', verifyToken, subscriptionController.getActiveSubscription);
router.post('/', verifyToken, createSubscriptionValidator, validate, subscriptionController.createSubscription);

// General / Admin routes
router.get('/', verifyToken, requireRole('admin'), subscriptionController.getAllSubscriptions);
router.get('/:id', verifyToken, subscriptionController.getSubscriptionById);
router.put('/:id', verifyToken, requireRole('admin'), updateSubscriptionValidator, validate, subscriptionController.updateSubscription);
router.post('/:id/extend', verifyToken, requireRole('admin'), subscriptionController.extendSubscription);
router.patch('/:id/status', verifyToken, requireRole('admin'), subscriptionController.updateSubscriptionStatus);

module.exports = router;
