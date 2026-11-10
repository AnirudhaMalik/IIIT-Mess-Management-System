const express = require('express');
const router = express.Router();
const planController = require('../controllers/plan.controller');
const { verifyToken } = require('../middleware/auth');
const { requireRole } = require('../middleware/authorize');
const validate = require('../middleware/validate');
const {
  createPlanValidator,
  updatePlanValidator
} = require('../validators/plan.validators');

// Public or student-accessible routes
router.get('/', planController.getPlans);
router.get('/:id', planController.getPlanById);

// Admin-only management routes
router.post(
  '/',
  verifyToken,
  requireRole('admin'),
  createPlanValidator,
  validate,
  planController.createPlan
);

router.put(
  '/:id',
  verifyToken,
  requireRole('admin'),
  updatePlanValidator,
  validate,
  planController.updatePlan
);

router.delete(
  '/:id',
  verifyToken,
  requireRole('admin'),
  planController.deletePlan
);

module.exports = router;
