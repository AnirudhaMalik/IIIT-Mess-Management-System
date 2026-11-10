const Menu = require('../models/Menu');
const { successResponse, errorResponse } = require('../utils/apiResponse');
const { getPaginationParams, buildPaginationData } = require('../utils/pagination');
const { logAuditEvent } = require('../utils/auditLog');

/**
 * Helper to get UTC midnight date
 */
const getNormalizedDate = (dateInput) => {
  const d = dateInput ? new Date(dateInput) : new Date();
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
};

/**
 * Get menu for a specific date
 * GET /api/v1/menu?date=YYYY-MM-DD
 */
const getMenuByDate = async (req, res, next) => {
  try {
    const targetDate = req.query.date ? getNormalizedDate(req.query.date) : getNormalizedDate();

    const menus = await Menu.find({ date: targetDate })
      .populate('createdBy', 'name email')
      .sort({ mealType: 1 });

    return successResponse(res, 200, `Menu for ${targetDate.toISOString().split('T')[0]}`, menus);
  } catch (error) {
    next(error);
  }
};

/**
 * Get weekly menu starting from startDate or today
 * GET /api/v1/menu/week?startDate=YYYY-MM-DD
 */
const getWeeklyMenu = async (req, res, next) => {
  try {
    const startDate = req.query.startDate
      ? getNormalizedDate(req.query.startDate)
      : getNormalizedDate();

    const endDate = new Date(startDate.getTime() + 7 * 24 * 60 * 60 * 1000);

    const menus = await Menu.find({
      date: {
        $gte: startDate,
        $lt: endDate
      }
    })
      .populate('createdBy', 'name email')
      .sort({ date: 1, mealType: 1 });

    return successResponse(
      res,
      200,
      `Weekly menu from ${startDate.toISOString().split('T')[0]}`,
      menus
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Get today's menu
 * GET /api/v1/menu/today
 */
const getTodayMenu = async (req, res, next) => {
  try {
    const today = getNormalizedDate();

    const menus = await Menu.find({ date: today })
      .populate('createdBy', 'name email')
      .sort({ mealType: 1 });

    return successResponse(res, 200, "Today's mess menu", menus);
  } catch (error) {
    next(error);
  }
};

/**
 * Create or replace menu entry (Admin only)
 * POST /api/v1/menu
 */
const createMenu = async (req, res, next) => {
  try {
    const { date, mealType, items, timing, isSpecial, specialNote } = req.body;
    const normalizedDate = getNormalizedDate(date);

    // Upsert menu for the given date and mealType
    const menu = await Menu.findOneAndUpdate(
      { date: normalizedDate, mealType },
      {
        date: normalizedDate,
        mealType,
        items,
        timing: timing || '',
        isSpecial: Boolean(isSpecial),
        specialNote: specialNote || '',
        createdBy: req.user._id
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    await logAuditEvent({
      actor: req.user._id,
      action: 'UPSERT_MENU',
      entityType: 'Menu',
      entityId: menu._id,
      newValue: { date: normalizedDate, mealType, itemsCount: items.length },
      req
    });

    return successResponse(res, 201, 'Menu saved successfully', menu);
  } catch (error) {
    next(error);
  }
};

/**
 * Update menu entry by ID (Admin only)
 * PUT /api/v1/menu/:id
 */
const updateMenu = async (req, res, next) => {
  try {
    const menu = await Menu.findById(req.params.id);
    if (!menu) {
      return errorResponse(res, 404, 'Menu item not found');
    }

    const { date, mealType, items, timing, isSpecial, specialNote } = req.body;
    const oldValue = menu.toObject();

    if (date) menu.date = getNormalizedDate(date);
    if (mealType) menu.mealType = mealType;
    if (items) menu.items = items;
    if (timing !== undefined) menu.timing = timing;
    if (isSpecial !== undefined) menu.isSpecial = isSpecial;
    if (specialNote !== undefined) menu.specialNote = specialNote;

    await menu.save();

    await logAuditEvent({
      actor: req.user._id,
      action: 'UPDATE_MENU',
      entityType: 'Menu',
      entityId: menu._id,
      oldValue,
      newValue: menu.toObject(),
      req
    });

    return successResponse(res, 200, 'Menu updated successfully', menu);
  } catch (error) {
    next(error);
  }
};

/**
 * Delete menu entry by ID (Admin only)
 * DELETE /api/v1/menu/:id
 */
const deleteMenu = async (req, res, next) => {
  try {
    const menu = await Menu.findByIdAndDelete(req.params.id);
    if (!menu) {
      return errorResponse(res, 404, 'Menu item not found');
    }

    await logAuditEvent({
      actor: req.user._id,
      action: 'DELETE_MENU',
      entityType: 'Menu',
      entityId: menu._id,
      req
    });

    return successResponse(res, 200, 'Menu entry deleted successfully', menu);
  } catch (error) {
    next(error);
  }
};

/**
 * Get all menus paginated (Admin only)
 * GET /api/v1/menu
 */
const getAllMenus = async (req, res, next) => {
  try {
    // If date query is provided, redirect to getMenuByDate behavior
    if (req.query.date) {
      return getMenuByDate(req, res, next);
    }

    const { page, limit, skip } = getPaginationParams(req.query);
    const { mealType, isSpecial } = req.query;

    const filter = {};
    if (mealType) filter.mealType = mealType;
    if (isSpecial !== undefined) filter.isSpecial = isSpecial === 'true';

    const [totalCount, menus] = await Promise.all([
      Menu.countDocuments(filter),
      Menu.find(filter)
        .populate('createdBy', 'name email')
        .sort({ date: -1, mealType: 1 })
        .skip(skip)
        .limit(limit)
    ]);

    const pagination = buildPaginationData(totalCount, page, limit);

    return successResponse(res, 200, 'Menus retrieved successfully', menus, pagination);
  } catch (error) {
    next(error);
  }
};

/**
 * Get menu item by ID
 * GET /api/v1/menu/:id
 */
const getMenuById = async (req, res, next) => {
  try {
    const menu = await Menu.findById(req.params.id).populate('createdBy', 'name email');
    if (!menu) {
      return errorResponse(res, 404, 'Menu item not found');
    }
    return successResponse(res, 200, 'Menu item retrieved', menu);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getMenuByDate,
  getWeeklyMenu,
  getTodayMenu,
  getMenuById,
  createMenu,
  updateMenu,
  deleteMenu,
  getAllMenus
};

