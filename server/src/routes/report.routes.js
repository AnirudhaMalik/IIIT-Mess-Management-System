const express = require('express');
const router = express.Router();
const reportController = require('../controllers/report.controller');
const { verifyToken } = require('../middleware/auth');
const { requireRole } = require('../middleware/authorize');

router.use(verifyToken, requireRole('admin'));

router.get('/dashboard-stats', reportController.getDashboardStats);
router.get('/meal-consumption', reportController.getMealConsumptionReport);
router.get('/consumption', reportController.getMealConsumptionReport); // alias used by frontend
router.get('/subscriptions', reportController.getSubscriptionReport);
router.get('/payments', reportController.getPaymentReport);
router.get('/revenue', reportController.getPaymentReport); // alias used by frontend
router.get('/complaints', reportController.getComplaintReport);
router.get('/export', reportController.exportCSV);

module.exports = router;
