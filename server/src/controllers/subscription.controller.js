const Subscription = require('../models/Subscription');
const User = require('../models/User');
const MessPlan = require('../models/MessPlan');
const Transaction = require('../models/Transaction');
const { generateTransactionId } = require('../services/payment.service');
const { successResponse, errorResponse } = require('../utils/apiResponse');
const { getPaginationParams, buildPaginationData } = require('../utils/pagination');
const { logAuditEvent } = require('../utils/auditLog');
const { SUBSCRIPTION_STATUS, TRANSACTION_STATUS } = require('../config/constants');

/**
 * Get logged-in student's subscription history
 * GET /api/v1/subscriptions/my
 */
const getMySubscriptions = async (req, res, next) => {
  try {
    const subscriptions = await Subscription.find({ student: req.user._id })
      .populate('plan')
      .populate('paymentRef')
      .sort({ createdAt: -1 });

    return successResponse(res, 200, 'Subscriptions retrieved successfully', subscriptions);
  } catch (error) {
    next(error);
  }
};

/**
 * Get logged-in student's current active subscription
 * GET /api/v1/subscriptions/my/active
 */
const getActiveSubscription = async (req, res, next) => {
  try {
    const now = new Date();
    const subscription = await Subscription.findOne({
      student: req.user._id,
      status: SUBSCRIPTION_STATUS.ACTIVE,
      endDate: { $gte: now }
    })
      .populate('plan')
      .populate('paymentRef');

    if (!subscription) {
      return successResponse(res, 200, 'No active subscription found', null);
    }

    return successResponse(res, 200, 'Active subscription retrieved', subscription);
  } catch (error) {
    next(error);
  }
};

/**
 * Create a new pending subscription and prepare payment intent
 * POST /api/v1/subscriptions
 */
const createSubscription = async (req, res, next) => {
  try {
    const { planId, paymentMethod = 'upi', autoRenew = false } = req.body;

    const plan = await MessPlan.findById(planId);
    if (!plan || !plan.isActive) {
      return errorResponse(res, 404, 'Active mess plan not found with provided ID');
    }

    // Check if student already has an active subscription
    const existingActive = await Subscription.findOne({
      student: req.user._id,
      status: SUBSCRIPTION_STATUS.ACTIVE,
      endDate: { $gt: new Date() }
    });

    if (existingActive) {
      return errorResponse(
        res,
        400,
        `You already have an active subscription that expires on ${existingActive.endDate.toDateString()}`
      );
    }

    // Create pending subscription
    const subscription = new Subscription({
      student: req.user._id,
      plan: plan._id,
      status: SUBSCRIPTION_STATUS.PENDING,
      autoRenew
    });
    await subscription.save();

    // Create pending transaction
    const transactionId = generateTransactionId();
    const transaction = new Transaction({
      student: req.user._id,
      subscription: subscription._id,
      plan: plan._id,
      amount: plan.price,
      paymentMethod,
      status: TRANSACTION_STATUS.PENDING,
      transactionId,
      notes: `Subscription payment for plan: ${plan.name}`,
      isDemo: true
    });
    await transaction.save();

    // Link transaction back to subscription
    subscription.paymentRef = transaction._id;
    await subscription.save();

    await logAuditEvent({
      actor: req.user._id,
      action: 'CREATE_SUBSCRIPTION_INTENT',
      entityType: 'Subscription',
      entityId: subscription._id,
      newValue: { planId: plan._id, transactionId },
      req
    });

    return successResponse(res, 201, 'Subscription intent created successfully', {
      subscription,
      transaction: {
        transactionId: transaction.transactionId,
        amount: transaction.amount,
        paymentMethod: transaction.paymentMethod,
        status: transaction.status
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get all subscriptions (Admin only)
 * GET /api/v1/subscriptions
 */
const getAllSubscriptions = async (req, res, next) => {
  try {
    const { page, limit, skip } = getPaginationParams(req.query);
    const { status, planId, studentId, search } = req.query;

    const filter = {};
    if (status) filter.status = status;
    if (planId) filter.plan = planId;
    if (studentId) filter.student = studentId;

    if (search && search.trim()) {
      const searchRegex = new RegExp(search.trim(), 'i');
      const matchingStudents = await User.find({
        role: 'student',
        $or: [{ name: searchRegex }, { studentId: searchRegex }, { email: searchRegex }]
      }).select('_id');
      filter.student = { $in: matchingStudents.map(s => s._id) };
    }

    const [totalCount, subscriptions] = await Promise.all([
      Subscription.countDocuments(filter),
      Subscription.find(filter)
        .populate('student', 'name email studentId phone hostel roomNumber')
        .populate('plan')
        .populate('paymentRef')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
    ]);

    const pagination = buildPaginationData(totalCount, page, limit);

    return successResponse(res, 200, 'Subscriptions retrieved successfully', subscriptions, pagination);
  } catch (error) {
    next(error);
  }
};

/**
 * Get subscription by ID (Student owner or Admin)
 * GET /api/v1/subscriptions/:id
 */
const getSubscriptionById = async (req, res, next) => {
  try {
    const subscription = await Subscription.findById(req.params.id)
      .populate('student', 'name email studentId phone hostel roomNumber')
      .populate('plan')
      .populate('paymentRef');

    if (!subscription) {
      return errorResponse(res, 404, 'Subscription not found');
    }

    // Ensure student only accesses own subscription
    if (req.user.role !== 'admin' && String(subscription.student._id) !== String(req.user._id)) {
      return errorResponse(res, 403, 'Unauthorized access to this subscription');
    }

    return successResponse(res, 200, 'Subscription retrieved successfully', subscription);
  } catch (error) {
    next(error);
  }
};

/**
 * Update subscription (Admin only)
 * PUT /api/v1/subscriptions/:id
 */
const updateSubscription = async (req, res, next) => {
  try {
    const subscription = await Subscription.findById(req.params.id);
    if (!subscription) {
      return errorResponse(res, 404, 'Subscription not found');
    }

    const { status, startDate, endDate, autoRenew, cancelReason } = req.body;
    const oldValue = subscription.toObject();

    if (status) {
      subscription.status = status;
      if (status === SUBSCRIPTION_STATUS.CANCELLED) {
        subscription.cancelledAt = new Date();
      }
    }
    if (startDate) subscription.startDate = new Date(startDate);
    if (endDate) subscription.endDate = new Date(endDate);
    if (autoRenew !== undefined) subscription.autoRenew = autoRenew;
    if (cancelReason !== undefined) subscription.cancelReason = cancelReason;

    await subscription.save();

    await logAuditEvent({
      actor: req.user._id,
      action: 'ADMIN_UPDATE_SUBSCRIPTION',
      entityType: 'Subscription',
      entityId: subscription._id,
      oldValue,
      newValue: subscription.toObject(),
      req
    });

    return successResponse(res, 200, 'Subscription updated successfully', subscription);
  } catch (error) {
    next(error);
  }
};

/**
 * Extend subscription end date by N days (Admin only)
 * POST /api/v1/subscriptions/:id/extend
 */
const extendSubscription = async (req, res, next) => {
  try {
    const subscription = await Subscription.findById(req.params.id);
    if (!subscription) {
      return errorResponse(res, 404, 'Subscription not found');
    }

    const days = Number(req.body.days);
    if (!days || days < 1 || days > 365) {
      return errorResponse(res, 400, 'Days to extend must be between 1 and 365');
    }

    const oldEndDate = subscription.endDate ? new Date(subscription.endDate) : new Date();
    // If endDate is in the past, extend from today; otherwise extend from current endDate
    const baseDate = oldEndDate < new Date() ? new Date() : oldEndDate;
    const newEndDate = new Date(baseDate);
    newEndDate.setDate(newEndDate.getDate() + days);

    const oldValue = { endDate: subscription.endDate };
    subscription.endDate = newEndDate;

    // If subscription was expired and now has a future end date, reactivate it
    if (subscription.status === SUBSCRIPTION_STATUS.EXPIRED && newEndDate > new Date()) {
      subscription.status = SUBSCRIPTION_STATUS.ACTIVE;
    }

    await subscription.save();

    await logAuditEvent({
      actor: req.user._id,
      action: 'ADMIN_EXTEND_SUBSCRIPTION',
      entityType: 'Subscription',
      entityId: subscription._id,
      oldValue,
      newValue: { endDate: subscription.endDate, daysExtended: days },
      req
    });

    return successResponse(res, 200, `Subscription extended by ${days} days successfully`, subscription);
  } catch (error) {
    next(error);
  }
};

/**
 * Update subscription status directly (Admin only)
 * PATCH /api/v1/subscriptions/:id/status
 */
const updateSubscriptionStatus = async (req, res, next) => {
  try {
    const subscription = await Subscription.findById(req.params.id);
    if (!subscription) {
      return errorResponse(res, 404, 'Subscription not found');
    }

    const { status } = req.body;
    if (!status || !Object.values(SUBSCRIPTION_STATUS).includes(status)) {
      return errorResponse(
        res,
        400,
        `Status must be one of: ${Object.values(SUBSCRIPTION_STATUS).join(', ')}`
      );
    }

    const oldStatus = subscription.status;
    subscription.status = status;

    if (status === SUBSCRIPTION_STATUS.CANCELLED) {
      subscription.cancelledAt = new Date();
    }
    // If reactivating a cancelled/expired subscription
    if (
      (oldStatus === SUBSCRIPTION_STATUS.CANCELLED || oldStatus === SUBSCRIPTION_STATUS.EXPIRED) &&
      status === SUBSCRIPTION_STATUS.ACTIVE
    ) {
      subscription.cancelledAt = null;
    }

    await subscription.save();

    await logAuditEvent({
      actor: req.user._id,
      action: 'ADMIN_UPDATE_SUBSCRIPTION_STATUS',
      entityType: 'Subscription',
      entityId: subscription._id,
      oldValue: { status: oldStatus },
      newValue: { status },
      req
    });

    return successResponse(res, 200, `Subscription status updated to '${status}' successfully`, subscription);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getMySubscriptions,
  getActiveSubscription,
  createSubscription,
  getAllSubscriptions,
  getSubscriptionById,
  updateSubscription,
  extendSubscription,
  updateSubscriptionStatus
};
