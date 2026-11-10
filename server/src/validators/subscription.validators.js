const { body } = require('express-validator');
const { SUBSCRIPTION_STATUS, PAYMENT_METHODS } = require('../config/constants');

const createSubscriptionValidator = [
  body('planId')
    .notEmpty()
    .withMessage('Plan ID is required')
    .isMongoId()
    .withMessage('Invalid Plan ID format'),

  body('paymentMethod')
    .optional()
    .isIn(PAYMENT_METHODS)
    .withMessage(`Payment method must be one of: ${PAYMENT_METHODS.join(', ')}`),

  body('autoRenew')
    .optional()
    .isBoolean()
    .withMessage('autoRenew must be a boolean')
];

const updateSubscriptionValidator = [
  body('status')
    .optional()
    .isIn(Object.values(SUBSCRIPTION_STATUS))
    .withMessage(`Status must be one of: ${Object.values(SUBSCRIPTION_STATUS).join(', ')}`),

  body('startDate')
    .optional()
    .isISO8601()
    .withMessage('startDate must be a valid ISO8601 date'),

  body('endDate')
    .optional()
    .isISO8601()
    .withMessage('endDate must be a valid ISO8601 date'),

  body('autoRenew')
    .optional()
    .isBoolean()
    .withMessage('autoRenew must be a boolean'),

  body('cancelReason')
    .optional()
    .trim()
];

module.exports = {
  createSubscriptionValidator,
  updateSubscriptionValidator
};
