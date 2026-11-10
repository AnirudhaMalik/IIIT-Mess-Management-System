const Transaction = require('../models/Transaction');
const User = require('../models/User');
const Subscription = require('../models/Subscription');
const MessPlan = require('../models/MessPlan');
const paymentService = require('../services/payment.service');
const notificationService = require('../services/notification.service');
const { successResponse, errorResponse } = require('../utils/apiResponse');
const { getPaginationParams, buildPaginationData } = require('../utils/pagination');
const { logAuditEvent } = require('../utils/auditLog');
const { TRANSACTION_STATUS, SUBSCRIPTION_STATUS } = require('../config/constants');

/**
 * Initiate a payment
 * POST /api/v1/payments/initiate
 * Body: { planId, paymentMethod, subscriptionId? }
 */
const initiatePayment = async (req, res, next) => {
  try {
    const { planId, paymentMethod = 'upi', subscriptionId } = req.body;

    const plan = await MessPlan.findById(planId);
    if (!plan) {
      return errorResponse(res, 404, 'Mess plan not found');
    }

    let subscription = null;
    if (subscriptionId) {
      subscription = await Subscription.findById(subscriptionId);
    } else {
      subscription = new Subscription({
        student: req.user._id,
        plan: plan._id,
        status: SUBSCRIPTION_STATUS.PENDING
      });
      await subscription.save();
    }

    const transactionId = paymentService.generateTransactionId();
    const transaction = new Transaction({
      student: req.user._id,
      subscription: subscription._id,
      plan: plan._id,
      amount: plan.price,
      paymentMethod,
      status: TRANSACTION_STATUS.PENDING,
      transactionId,
      notes: `Payment initiated for ${plan.name}`,
      isDemo: true
    });
    await transaction.save();

    subscription.paymentRef = transaction._id;
    await subscription.save();

    return successResponse(res, 201, 'Payment initiated successfully', {
      transactionId: transaction.transactionId,
      amount: transaction.amount,
      planName: plan.name,
      subscriptionId: subscription._id
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Confirm payment (simulation endpoint)
 * POST /api/v1/payments/confirm
 * Body: { transactionId, status?, paymentMethod? }
 */
const confirmPayment = async (req, res, next) => {
  try {
    const { transactionId, status: explicitStatus, action, paymentMethod } = req.body;
    let status = explicitStatus;
    if (!status && action) {
      status = action === 'confirm' ? TRANSACTION_STATUS.SUCCESS : TRANSACTION_STATUS.FAILED;
    }

    if (!transactionId) {
      return errorResponse(res, 400, 'Transaction ID is required');
    }

    const transaction = await Transaction.findOne({ transactionId });
    if (!transaction) {
      return errorResponse(res, 404, 'Transaction not found');
    }

    if (transaction.status === TRANSACTION_STATUS.SUCCESS) {
      return errorResponse(res, 400, 'This transaction has already been completed successfully');
    }

    if (paymentMethod) {
      transaction.paymentMethod = paymentMethod;
    }

    // Simulate payment through payment gateway service
    const simulation = await paymentService.simulatePayment(
      transaction.paymentMethod,
      transaction.amount,
      status // Allows UI to pass explicit status
    );

    if (simulation.success) {
      const result = await paymentService.processSuccessfulPayment(
        transactionId,
        simulation.gatewayRef
      );

      await logAuditEvent({
        actor: req.user._id,
        action: 'PAYMENT_SUCCESS',
        entityType: 'Transaction',
        entityId: transaction._id,
        newValue: { amount: transaction.amount, status: 'success' },
        req
      });

      return successResponse(res, 200, 'Payment completed and subscription activated successfully', {
        transaction: result.transaction,
        subscription: result.subscription
      });
    } else {
      transaction.status = TRANSACTION_STATUS.FAILED;
      transaction.notes = simulation.notes;
      await transaction.save();

      await notificationService.notifyPaymentFailed(
        transaction.student,
        transaction.amount,
        transaction._id
      );

      await logAuditEvent({
        actor: req.user._id,
        action: 'PAYMENT_FAILED',
        entityType: 'Transaction',
        entityId: transaction._id,
        newValue: { amount: transaction.amount, status: 'failed' },
        req
      });

      return errorResponse(
        res,
        400,
        'Payment processing failed. Please try again.',
        {
          transactionId: transaction.transactionId,
          status: transaction.status,
          notes: simulation.notes
        }
      );
    }
  } catch (error) {
    next(error);
  }
};

/**
 * Get student's transaction history
 * GET /api/v1/payments/my
 */
const getMyTransactions = async (req, res, next) => {
  try {
    const { page, limit, skip } = getPaginationParams(req.query);

    const [totalCount, transactions] = await Promise.all([
      Transaction.countDocuments({ student: req.user._id }),
      Transaction.find({ student: req.user._id })
        .populate('plan')
        .populate('subscription')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
    ]);

    const pagination = buildPaginationData(totalCount, page, limit);

    return successResponse(res, 200, 'Transactions retrieved successfully', transactions, pagination);
  } catch (error) {
    next(error);
  }
};

/**
 * Get transaction by ID
 * GET /api/v1/payments/my/:id or /api/v1/payments/:id
 */
const getTransactionById = async (req, res, next) => {
  try {
    const transaction = await Transaction.findById(req.params.id)
      .populate('student', 'name email studentId')
      .populate('plan')
      .populate('subscription');

    if (!transaction) {
      return errorResponse(res, 404, 'Transaction not found');
    }

    if (req.user.role !== 'admin' && String(transaction.student._id) !== String(req.user._id)) {
      return errorResponse(res, 403, 'Unauthorized access to transaction');
    }

    return successResponse(res, 200, 'Transaction retrieved successfully', transaction);
  } catch (error) {
    next(error);
  }
};

/**
 * Get all transactions (Admin only)
 * GET /api/v1/payments
 */
const getAllTransactions = async (req, res, next) => {
  try {
    const { page, limit, skip } = getPaginationParams(req.query);
    const { status, paymentMethod, studentId, startDate, endDate, search } = req.query;

    const filter = {};
    if (status) filter.status = status;
    if (paymentMethod) filter.paymentMethod = paymentMethod;
    if (studentId) filter.student = studentId;

    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate);
      if (endDate) filter.createdAt.$lte = new Date(endDate);
    }

    if (search && search.trim()) {
      const searchRegex = new RegExp(search.trim(), 'i');
      const matchingStudents = await User.find({
        role: 'student',
        $or: [{ name: searchRegex }, { studentId: searchRegex }, { email: searchRegex }]
      }).select('_id');
      filter.$or = [
        { transactionId: searchRegex },
        { student: { $in: matchingStudents.map(s => s._id) } }
      ];
    }

    const [totalCount, transactions] = await Promise.all([
      Transaction.countDocuments(filter),
      Transaction.find(filter)
        .populate('student', 'name email studentId hostel roomNumber')
        .populate('plan')
        .populate('subscription')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
    ]);

    const pagination = buildPaginationData(totalCount, page, limit);

    return successResponse(res, 200, 'All transactions retrieved', transactions, pagination);
  } catch (error) {
    next(error);
  }
};

/**
 * Get payment statistics (Admin only)
 * GET /api/v1/payments/stats
 */
const getPaymentStats = async (req, res, next) => {
  try {
    const [statusStats, methodStats, revenueResult] = await Promise.all([
      Transaction.aggregate([
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 },
            totalAmount: { $sum: '$amount' }
          }
        }
      ]),
      Transaction.aggregate([
        {
          $group: {
            _id: '$paymentMethod',
            count: { $sum: 1 },
            totalAmount: { $sum: '$amount' }
          }
        }
      ]),
      Transaction.aggregate([
        { $match: { status: TRANSACTION_STATUS.SUCCESS } },
        {
          $group: {
            _id: null,
            totalRevenue: { $sum: '$amount' },
            count: { $sum: 1 }
          }
        }
      ])
    ]);

    const totalRevenue = revenueResult[0]?.totalRevenue || 0;
    const successfulTransactionsCount = revenueResult[0]?.count || 0;

    return successResponse(res, 200, 'Payment statistics retrieved', {
      totalRevenue,
      successfulTransactionsCount,
      byStatus: statusStats,
      byMethod: methodStats
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  initiatePayment,
  confirmPayment,
  getMyTransactions,
  getTransactionById,
  getAllTransactions,
  getPaymentStats
};
