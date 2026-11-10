const { body } = require('express-validator');
const { COMPLAINT_CATEGORIES, COMPLAINT_STATUS } = require('../config/constants');

const createComplaintValidator = [
  body('category')
    .notEmpty()
    .withMessage('Complaint category is required')
    .isIn(COMPLAINT_CATEGORIES)
    .withMessage(`Category must be one of: ${COMPLAINT_CATEGORIES.join(', ')}`),

  body('description')
    .trim()
    .notEmpty()
    .withMessage('Description is required')
    .isLength({ min: 10, max: 2000 })
    .withMessage('Description must be between 10 and 2000 characters')
];

const respondComplaintValidator = [
  body('status')
    .notEmpty()
    .withMessage('Status is required')
    .isIn(Object.values(COMPLAINT_STATUS))
    .withMessage(`Status must be one of: ${Object.values(COMPLAINT_STATUS).join(', ')}`),

  body('adminResponse')
    .trim()
    .notEmpty()
    .withMessage('Admin response message is required')
    .isLength({ min: 2, max: 2000 })
    .withMessage('Admin response must be between 2 and 2000 characters')
];

const adminNoteValidator = [
  body('adminNote')
    .trim()
    .notEmpty()
    .withMessage('Admin internal note is required')
    .isLength({ min: 1, max: 1000 })
    .withMessage('Admin note must be between 1 and 1000 characters')
];

module.exports = {
  createComplaintValidator,
  respondComplaintValidator,
  adminNoteValidator
};
