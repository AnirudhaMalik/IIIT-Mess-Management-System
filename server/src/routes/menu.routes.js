const express = require('express');
const router = express.Router();
const menuController = require('../controllers/menu.controller');
const { verifyToken } = require('../middleware/auth');
const { requireRole } = require('../middleware/authorize');
const validate = require('../middleware/validate');
const {
  createMenuValidator,
  updateMenuValidator,
  menuQueryValidator
} = require('../validators/menu.validators');

// Public/Student menu routes (specific endpoints before parameterized :id)
router.get('/today', menuController.getTodayMenu);
router.get('/week', menuQueryValidator, validate, menuController.getWeeklyMenu);
router.get('/', menuQueryValidator, validate, menuController.getAllMenus);
router.get('/:id', menuController.getMenuById);

// Admin-only menu operations
router.post(
  '/',
  verifyToken,
  requireRole('admin'),
  createMenuValidator,
  validate,
  menuController.createMenu
);

router.put(
  '/:id',
  verifyToken,
  requireRole('admin'),
  updateMenuValidator,
  validate,
  menuController.updateMenu
);

router.delete(
  '/:id',
  verifyToken,
  requireRole('admin'),
  menuController.deleteMenu
);

module.exports = router;
