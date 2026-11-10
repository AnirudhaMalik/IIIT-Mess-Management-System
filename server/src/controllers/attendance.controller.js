const MealAttendance = require('../models/MealAttendance');
const { successResponse, errorResponse } = require('../utils/apiResponse');
const { getPaginationParams, buildPaginationData } = require('../utils/pagination');

/**
 * Get student's own attendance history
 * GET /api/v1/attendance/my
 */
const getMyAttendance = async (req, res, next) => {
  try {
    const { page, limit, skip } = getPaginationParams(req.query);
    const { startDate, endDate, mealType } = req.query;

    const filter = { student: req.user._id };

    if (mealType) filter.mealType = mealType;

    if (startDate || endDate) {
      filter.date = {};
      if (startDate) filter.date.$gte = new Date(startDate);
      if (endDate) filter.date.$lte = new Date(endDate);
    }

    const [totalCount, records] = await Promise.all([
      MealAttendance.countDocuments(filter),
      MealAttendance.find(filter)
        .populate('subscription')
        .populate('verifiedBy', 'name email')
        .sort({ scanTime: -1 })
        .skip(skip)
        .limit(limit)
    ]);

    const pagination = buildPaginationData(totalCount, page, limit);

    return successResponse(res, 200, 'Attendance history retrieved', records, pagination);
  } catch (error) {
    next(error);
  }
};

/**
 * Get student's attendance summary (counts by meal type)
 * GET /api/v1/attendance/my/summary
 */
const getMyAttendanceSummary = async (req, res, next) => {
  try {
    const counts = await MealAttendance.aggregate([
      { $match: { student: req.user._id, status: 'success' } },
      {
        $group: {
          _id: '$mealType',
          count: { $sum: 1 }
        }
      }
    ]);

    const summary = {
      breakfast: 0,
      lunch: 0,
      snacks: 0,
      dinner: 0,
      totalMeals: 0
    };

    counts.forEach((c) => {
      summary[c._id] = c.count;
      summary.totalMeals += c.count;
    });

    return successResponse(res, 200, 'Attendance summary retrieved', summary);
  } catch (error) {
    next(error);
  }
};

/**
 * Get all attendance records (Admin only)
 * GET /api/v1/attendance
 */
const getAllAttendance = async (req, res, next) => {
  try {
    const { page, limit, skip } = getPaginationParams(req.query);
    const { studentId, mealType, date, status } = req.query;

    const filter = {};
    if (studentId) filter.student = studentId;
    if (mealType) filter.mealType = mealType;
    if (status) filter.status = status;

    if (date) {
      const d = new Date(date);
      const startOfDay = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 0, 0, 0));
      const endOfDay = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 23, 59, 59));
      filter.date = { $gte: startOfDay, $lte: endOfDay };
    }

    const [totalCount, records] = await Promise.all([
      MealAttendance.countDocuments(filter),
      MealAttendance.find(filter)
        .populate('student', 'name email studentId hostel roomNumber')
        .populate('verifiedBy', 'name email')
        .populate('subscription')
        .sort({ scanTime: -1 })
        .skip(skip)
        .limit(limit)
    ]);

    const pagination = buildPaginationData(totalCount, page, limit);

    return successResponse(res, 200, 'All attendance records retrieved', records, pagination);
  } catch (error) {
    next(error);
  }
};

/**
 * Get attendance statistics for Admin (Today's counts + 30-day breakdown)
 * GET /api/v1/attendance/stats
 */
const getAttendanceStats = async (req, res, next) => {
  try {
    const now = new Date();
    const todayMidnight = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));

    // Today's breakdown
    const todayBreakdown = await MealAttendance.aggregate([
      {
        $match: {
          date: todayMidnight,
          status: 'success'
        }
      },
      {
        $group: {
          _id: '$mealType',
          count: { $sum: 1 }
        }
      }
    ]);

    const todayStats = {
      breakfast: 0,
      lunch: 0,
      snacks: 0,
      dinner: 0,
      totalToday: 0
    };

    todayBreakdown.forEach((item) => {
      todayStats[item._id] = item.count;
      todayStats.totalToday += item.count;
    });

    // Monthly breakdown (last 30 days)
    const thirtyDaysAgo = new Date(todayMidnight.getTime() - 30 * 24 * 60 * 60 * 1000);
    const monthlyBreakdown = await MealAttendance.aggregate([
      {
        $match: {
          date: { $gte: thirtyDaysAgo },
          status: 'success'
        }
      },
      {
        $group: {
          _id: {
            date: { $dateToString: { format: '%Y-%m-%d', date: '$date' } },
            mealType: '$mealType'
          },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { '_id.date': 1 }
      }
    ]);

    return successResponse(res, 200, 'Attendance statistics retrieved', {
      today: todayStats,
      monthlyBreakdown
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getMyAttendance,
  getMyAttendanceSummary,
  getAllAttendance,
  getAttendanceStats
};
