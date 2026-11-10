const { body } = require('express-validator');
const { MEAL_TYPES } = require('../config/constants');

const createPlanValidator = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Plan name is required')
    .isLength({ min: 2, max: 100 })
    .withMessage('Plan name must be between 2 and 100 characters'),

  body('description')
    .optional()
    .trim(),

  body('duration')
    .notEmpty()
    .withMessage('Duration is required')
    .isInt({ min: 1 })
    .withMessage('Duration must be a positive integer representing days'),

  body('price')
    .notEmpty()
    .withMessage('Price is required')
    .isFloat({ min: 0 })
    .withMessage('Price must be a positive number'),

  body('mealTypes')
    .isArray({ min: 1 })
    .withMessage('At least one meal type must be selected')
    .custom((types) => {
      const valid = types.every((t) => MEAL_TYPES.includes(t));
      if (!valid) {
        throw new Error(`Meal types must be one of: ${MEAL_TYPES.join(', ')}`);
      }
      return true;
    }),

  body('features')
    .optional()
    .isArray()
    .withMessage('Features must be an array of strings')
];

const updatePlanValidator = [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Plan name must be between 2 and 100 characters'),

  body('description')
    .optional()
    .trim(),

  body('duration')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Duration must be a positive integer'),

  body('price')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Price must be a positive number'),

  body('mealTypes')
    .optional()
    .isArray({ min: 1 })
    .withMessage('At least one meal type must be selected')
    .custom((types) => {
      const valid = types.every((t) => MEAL_TYPES.includes(t));
      if (!valid) {
        throw new Error(`Meal types must be one of: ${MEAL_TYPES.join(', ')}`);
      }
      return true;
    }),

  body('features')
    .optional()
    .isArray()
    .withMessage('Features must be an array of strings'),

  body('isActive')
    .optional()
    .isBoolean()
    .withMessage('isActive must be a boolean')
];

module.exports = {
  createPlanValidator,
  updatePlanValidator
};
