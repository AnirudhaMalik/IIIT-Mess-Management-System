const { body, query } = require('express-validator');
const { MEAL_TYPES } = require('../config/constants');

const createMenuValidator = [
  body('date')
    .notEmpty()
    .withMessage('Date is required')
    .isISO8601()
    .withMessage('Date must be a valid ISO8601 date (YYYY-MM-DD)'),

  body('mealType')
    .notEmpty()
    .withMessage('Meal type is required')
    .isIn(MEAL_TYPES)
    .withMessage(`Meal type must be one of: ${MEAL_TYPES.join(', ')}`),

  body('items')
    .isArray({ min: 1 })
    .withMessage('Items must be an array with at least one item'),

  body('items.*.name')
    .trim()
    .notEmpty()
    .withMessage('Item name is required'),

  body('items.*.description')
    .optional()
    .trim(),

  body('items.*.isVeg')
    .optional()
    .isBoolean()
    .withMessage('isVeg must be a boolean'),

  body('timing')
    .optional()
    .trim(),

  body('isSpecial')
    .optional()
    .isBoolean()
    .withMessage('isSpecial must be a boolean'),

  body('specialNote')
    .optional()
    .trim()
];

const updateMenuValidator = [
  body('date')
    .optional()
    .isISO8601()
    .withMessage('Date must be a valid ISO8601 date (YYYY-MM-DD)'),

  body('mealType')
    .optional()
    .isIn(MEAL_TYPES)
    .withMessage(`Meal type must be one of: ${MEAL_TYPES.join(', ')}`),

  body('items')
    .optional()
    .isArray({ min: 1 })
    .withMessage('Items must be an array with at least one item'),

  body('items.*.name')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Item name cannot be empty'),

  body('items.*.description')
    .optional()
    .trim(),

  body('items.*.isVeg')
    .optional()
    .isBoolean()
    .withMessage('isVeg must be a boolean'),

  body('timing')
    .optional()
    .trim(),

  body('isSpecial')
    .optional()
    .isBoolean()
    .withMessage('isSpecial must be a boolean'),

  body('specialNote')
    .optional()
    .trim()
];

const menuQueryValidator = [
  query('date')
    .optional()
    .isISO8601()
    .withMessage('Date query parameter must be a valid ISO8601 date'),

  query('startDate')
    .optional()
    .isISO8601()
    .withMessage('startDate query parameter must be a valid ISO8601 date')
];

module.exports = {
  createMenuValidator,
  updateMenuValidator,
  menuQueryValidator
};
