const MessPlan = require('../models/MessPlan');
const { successResponse, errorResponse } = require('../utils/apiResponse');
const { logAuditEvent } = require('../utils/auditLog');

/**
 * Get all mess plans
 * GET /api/v1/plans
 */
const getPlans = async (req, res, next) => {
  try {
    const isAdmin = req.user && req.user.role === 'admin';
    const filter = {};

    // Non-admins or default queries only see active plans
    if (!isAdmin || req.query.activeOnly === 'true') {
      filter.isActive = true;
    }

    const plans = await MessPlan.find(filter)
      .populate('subscriberCount')
      .sort({ price: 1 });

    return successResponse(res, 200, 'Mess plans retrieved successfully', plans);
  } catch (error) {
    next(error);
  }
};

/**
 * Get plan by ID
 * GET /api/v1/plans/:id
 */
const getPlanById = async (req, res, next) => {
  try {
    const plan = await MessPlan.findById(req.params.id).populate('subscriberCount');
    if (!plan) {
      return errorResponse(res, 404, 'Mess plan not found');
    }

    return successResponse(res, 200, 'Mess plan retrieved successfully', plan);
  } catch (error) {
    next(error);
  }
};

/**
 * Create a new mess plan (Admin only)
 * POST /api/v1/plans
 */
const createPlan = async (req, res, next) => {
  try {
    const { name, description, duration, price, mealTypes, features } = req.body;

    const existingPlan = await MessPlan.findOne({ name: name.trim() });
    if (existingPlan) {
      return errorResponse(res, 409, 'A plan with this name already exists');
    }

    const plan = new MessPlan({
      name: name.trim(),
      description,
      duration,
      price,
      mealTypes,
      features: features || [],
      isActive: true
    });

    await plan.save();

    await logAuditEvent({
      actor: req.user._id,
      action: 'CREATE_PLAN',
      entityType: 'MessPlan',
      entityId: plan._id,
      newValue: { name: plan.name, price: plan.price, duration: plan.duration },
      req
    });

    return successResponse(res, 201, 'Mess plan created successfully', plan);
  } catch (error) {
    next(error);
  }
};

/**
 * Update a mess plan (Admin only)
 * PUT /api/v1/plans/:id
 */
const updatePlan = async (req, res, next) => {
  try {
    const plan = await MessPlan.findById(req.params.id);
    if (!plan) {
      return errorResponse(res, 404, 'Mess plan not found');
    }

    const { name, description, duration, price, mealTypes, features, isActive } = req.body;

    if (name && name.trim() !== plan.name) {
      const existingPlan = await MessPlan.findOne({ name: name.trim() });
      if (existingPlan) {
        return errorResponse(res, 409, 'Another plan with this name already exists');
      }
      plan.name = name.trim();
    }

    const oldValue = plan.toObject();

    if (description !== undefined) plan.description = description;
    if (duration !== undefined) plan.duration = duration;
    if (price !== undefined) plan.price = price;
    if (mealTypes !== undefined) plan.mealTypes = mealTypes;
    if (features !== undefined) plan.features = features;
    if (isActive !== undefined) plan.isActive = isActive;

    await plan.save();

    await logAuditEvent({
      actor: req.user._id,
      action: 'UPDATE_PLAN',
      entityType: 'MessPlan',
      entityId: plan._id,
      oldValue,
      newValue: plan.toObject(),
      req
    });

    return successResponse(res, 200, 'Mess plan updated successfully', plan);
  } catch (error) {
    next(error);
  }
};

/**
 * Soft delete a mess plan (Admin only)
 * DELETE /api/v1/plans/:id
 */
const deletePlan = async (req, res, next) => {
  try {
    const plan = await MessPlan.findById(req.params.id);
    if (!plan) {
      return errorResponse(res, 404, 'Mess plan not found');
    }

    plan.isActive = false;
    await plan.save();

    await logAuditEvent({
      actor: req.user._id,
      action: 'DEACTIVATE_PLAN',
      entityType: 'MessPlan',
      entityId: plan._id,
      req
    });

    return successResponse(res, 200, 'Mess plan deactivated successfully', plan);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getPlans,
  getPlanById,
  createPlan,
  updatePlan,
  deletePlan
};
