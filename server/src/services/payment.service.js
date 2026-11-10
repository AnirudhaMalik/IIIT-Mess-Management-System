const Transaction = require('../models/Transaction');
const Subscription = require('../models/Subscription');
const MessPlan = require('../models/MessPlan');
const notificationService = require('./notification.service');
const { TRANSACTION_STATUS, SUBSCRIPTION_STATUS } = require('../config/constants');

/**
 * Generate a unique transaction reference ID
 */
const generateTransactionId = () => {
  const timestamp = Date.now();
  const randomSuffix = Math.floor(1000 + Math.random() * 9000);
  return `TXN${timestamp}${randomSuffix}`;
};

/**
 * Simulate payment gateway processing
 * @param {string} method - 'upi' | 'card' | 'netbanking'
 * @param {number} amount
 * @param {string} [requestedStatus] - Optional override ('success', 'failed', 'cancelled')
 */
const simulatePayment = async (method, amount, requestedStatus = null) => {
  // Simulate 1.2s gateway processing delay
  await new Promise((resolve) => setTimeout(resolve, 1200));

  let success = false;
  if (requestedStatus) {
    success = requestedStatus === TRANSACTION_STATUS.SUCCESS;
  } else {
    // 90% chance of success for demo simulation
    success = Math.random() < 0.9;
  }

  const gatewayRef = success ? `GW_${method.toUpperCase()}_${Date.now()}` : null;
  const notes = success
    ? `Simulated payment successful via ${method.toUpperCase()}`
    : `Payment was rejected or cancelled during simulation`;

  return {
    success,
    gatewayRef,
    notes,
    status: success ? TRANSACTION_STATUS.SUCCESS : TRANSACTION_STATUS.FAILED
  };
};

/**
 * Activate linked subscription upon successful payment confirmation
 */
const processSuccessfulPayment = async (transactionId, gatewayRef = null) => {
  const transaction = await Transaction.findOne({ transactionId })
    .populate('subscription')
    .populate('plan');

  if (!transaction) {
    throw new Error(`Transaction ${transactionId} not found`);
  }

  // Update transaction status
  transaction.status = TRANSACTION_STATUS.SUCCESS;
  if (gatewayRef) {
    transaction.gatewayRef = gatewayRef;
  }
  await transaction.save();

  // If there is an associated subscription, activate it
  if (transaction.subscription) {
    const sub = await Subscription.findById(transaction.subscription._id || transaction.subscription);
    const plan = await MessPlan.findById(transaction.plan || sub.plan);

    if (sub && plan) {
      const startDate = new Date();
      const endDate = new Date(startDate.getTime() + plan.duration * 24 * 60 * 60 * 1000);

      sub.status = SUBSCRIPTION_STATUS.ACTIVE;
      sub.startDate = startDate;
      sub.endDate = endDate;
      sub.paymentRef = transaction._id;
      await sub.save();

      // Send notifications
      await notificationService.notifyPaymentSuccess(
        transaction.student,
        transaction.amount,
        transaction.transactionId,
        transaction._id
      );

      await notificationService.notifySubscriptionActivated(
        transaction.student,
        plan.name,
        sub._id
      );

      return {
        transaction,
        subscription: sub
      };
    }
  }

  // Notification for payment without subscription
  await notificationService.notifyPaymentSuccess(
    transaction.student,
    transaction.amount,
    transaction.transactionId,
    transaction._id
  );

  return { transaction };
};

module.exports = {
  generateTransactionId,
  simulatePayment,
  processSuccessfulPayment
};
