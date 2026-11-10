const User = require('../models/User');
const Subscription = require('../models/Subscription');
const MealAttendance = require('../models/MealAttendance');
const Transaction = require('../models/Transaction');
const Complaint = require('../models/Complaint');
const MessPlan = require('../models/MessPlan');
const { successResponse, errorResponse } = require('../utils/apiResponse');
const { SUBSCRIPTION_STATUS, TRANSACTION_STATUS, COMPLAINT_STATUS } = require('../config/constants');

/**
 * Helper to escape CSV values
 */
const escapeCsv = (val) => {
  if (val === null || val === undefined) return '""';
  const str = String(val).replace(/"/g, '""');
  return `"${str}"`;
};

/**
 * Get dashboard overview metrics
 * GET /api/v1/reports/dashboard-stats
 */
const getDashboardStats = async (req, res, next) => {
  try {
    const now = new Date();
    const todayMidnight = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));

    const [
      totalStudents,
      activeSubscriptions,
      expiredSubscriptions,
      todayAttendance,
      revenueResult,
      pendingComplaints,
      recentRegistrations,
      recentTransactions
    ] = await Promise.all([
      User.countDocuments({ role: 'student' }),
      Subscription.countDocuments({ status: SUBSCRIPTION_STATUS.ACTIVE, endDate: { $gte: now } }),
      Subscription.countDocuments({ status: SUBSCRIPTION_STATUS.EXPIRED }),
      MealAttendance.aggregate([
        { $match: { date: todayMidnight, status: 'success' } },
        { $group: { _id: '$mealType', count: { $sum: 1 } } }
      ]),
      Transaction.aggregate([
        { $match: { status: TRANSACTION_STATUS.SUCCESS } },
        { $group: { _id: null, totalRevenue: { $sum: '$amount' } } }
      ]),
      Complaint.countDocuments({ status: COMPLAINT_STATUS.PENDING }),
      User.find({ role: 'student' })
        .sort({ createdAt: -1 })
        .limit(5)
        .select('name email studentId hostel roomNumber createdAt'),
      Transaction.find()
        .populate('student', 'name studentId')
        .populate('plan', 'name')
        .sort({ createdAt: -1 })
        .limit(5)
    ]);

    let breakfastCount = 0;
    let lunchCount = 0;
    let snacksCount = 0;
    let dinnerCount = 0;
    let todayMealsServed = 0;

    todayAttendance.forEach((item) => {
      if (item._id === 'breakfast') breakfastCount = item.count;
      if (item._id === 'lunch') lunchCount = item.count;
      if (item._id === 'snacks') snacksCount = item.count;
      if (item._id === 'dinner') dinnerCount = item.count;
      todayMealsServed += item.count;
    });

    const totalRevenue = revenueResult[0]?.totalRevenue || 0;

    return successResponse(res, 200, 'Dashboard statistics retrieved successfully', {
      totalStudents,
      activeSubscriptions,
      expiredSubscriptions,
      todayMealsServed,
      breakfastCount,
      lunchCount,
      snacksCount,
      dinnerCount,
      totalRevenue,
      pendingComplaints,
      recentRegistrations,
      recentTransactions
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get daily meal consumption report for charts (last 7 or 30 days)
 * GET /api/v1/reports/meal-consumption
 */
const getMealConsumptionReport = async (req, res, next) => {
  try {
    const days = parseInt(req.query.days, 10) || 14;
    const sinceDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const report = await MealAttendance.aggregate([
      {
        $match: {
          scanTime: { $gte: sinceDate },
          status: 'success'
        }
      },
      {
        $group: {
          _id: {
            date: { $dateToString: { format: '%Y-%m-%d', date: '$scanTime' } },
            mealType: '$mealType'
          },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { '_id.date': 1 }
      }
    ]);

    return successResponse(res, 200, 'Meal consumption report retrieved', report);
  } catch (error) {
    next(error);
  }
};

/**
 * Get subscription metrics by plan
 * GET /api/v1/reports/subscriptions
 */
const getSubscriptionReport = async (req, res, next) => {
  try {
    const report = await Subscription.aggregate([
      {
        $group: {
          _id: {
            plan: '$plan',
            status: '$status'
          },
          count: { $sum: 1 }
        }
      },
      {
        $lookup: {
          from: 'messplans',
          localField: '_id.plan',
          foreignField: '_id',
          as: 'planDetails'
        }
      },
      {
        $unwind: '$planDetails'
      },
      {
        $project: {
          planId: '$_id.plan',
          planName: '$planDetails.name',
          status: '$_id.status',
          count: 1
        }
      }
    ]);

    return successResponse(res, 200, 'Subscription report retrieved', report);
  } catch (error) {
    next(error);
  }
};

/**
 * Get payment revenue by date
 * GET /api/v1/reports/payments
 */
const getPaymentReport = async (req, res, next) => {
  try {
    const days = parseInt(req.query.days, 10) || 30;
    const sinceDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const report = await Transaction.aggregate([
      {
        $match: {
          createdAt: { $gte: sinceDate },
          status: TRANSACTION_STATUS.SUCCESS
        }
      },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          totalAmount: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { _id: 1 }
      }
    ]);

    return successResponse(res, 200, 'Payment report retrieved', report);
  } catch (error) {
    next(error);
  }
};

/**
 * Get complaint breakdown by category and status
 * GET /api/v1/reports/complaints
 */
const getComplaintReport = async (req, res, next) => {
  try {
    const [byCategory, byStatus] = await Promise.all([
      Complaint.aggregate([
        {
          $group: {
            _id: '$category',
            count: { $sum: 1 }
          }
        }
      ]),
      Complaint.aggregate([
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 }
          }
        }
      ])
    ]);

    return successResponse(res, 200, 'Complaint statistics retrieved', {
      byCategory,
      byStatus
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Export data as CSV
 * GET /api/v1/reports/export?type=transactions|attendance|subscriptions
 */
const exportCSV = async (req, res, next) => {
  try {
    const type = (req.query.type || 'transactions').toLowerCase();

    if (type === 'transactions') {
      const records = await Transaction.find()
        .populate('student', 'name email studentId')
        .populate('plan', 'name')
        .sort({ createdAt: -1 });

      const headers = [
        'Transaction ID',
        'Student Name',
        'Student Email',
        'Student ID',
        'Plan Name',
        'Amount',
        'Payment Method',
        'Status',
        'Gateway Ref',
        'Date'
      ];

      const rows = records.map((r) => [
        escapeCsv(r.transactionId),
        escapeCsv(r.student?.name || 'N/A'),
        escapeCsv(r.student?.email || 'N/A'),
        escapeCsv(r.student?.studentId || 'N/A'),
        escapeCsv(r.plan?.name || 'N/A'),
        r.amount,
        escapeCsv(r.paymentMethod),
        escapeCsv(r.status),
        escapeCsv(r.gatewayRef || 'N/A'),
        escapeCsv(r.createdAt.toISOString())
      ]);

      const csvContent = [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="transactions_export.csv"');
      return res.status(200).send(csvContent);
    }

    if (type === 'attendance') {
      const records = await MealAttendance.find()
        .populate('student', 'name studentId hostel roomNumber')
        .sort({ scanTime: -1 });

      const headers = [
        'Student Name',
        'Student ID',
        'Hostel',
        'Room Number',
        'Date',
        'Meal Type',
        'Scan Time',
        'Status',
        'Notes'
      ];

      const rows = records.map((r) => [
        escapeCsv(r.student?.name || 'N/A'),
        escapeCsv(r.student?.studentId || 'N/A'),
        escapeCsv(r.student?.hostel || 'N/A'),
        escapeCsv(r.student?.roomNumber || 'N/A'),
        escapeCsv(r.date ? r.date.toISOString().split('T')[0] : 'N/A'),
        escapeCsv(r.mealType),
        escapeCsv(r.scanTime.toISOString()),
        escapeCsv(r.status),
        escapeCsv(r.notes || '')
      ]);

      const csvContent = [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="attendance_export.csv"');
      return res.status(200).send(csvContent);
    }

    if (type === 'subscriptions') {
      const records = await Subscription.find()
        .populate('student', 'name email studentId')
        .populate('plan', 'name price duration')
        .sort({ createdAt: -1 });

      const headers = [
        'Student Name',
        'Student Email',
        'Student ID',
        'Plan Name',
        'Plan Price',
        'Status',
        'Start Date',
        'End Date',
        'Auto Renew',
        'Created At'
      ];

      const rows = records.map((r) => [
        escapeCsv(r.student?.name || 'N/A'),
        escapeCsv(r.student?.email || 'N/A'),
        escapeCsv(r.student?.studentId || 'N/A'),
        escapeCsv(r.plan?.name || 'N/A'),
        r.plan?.price || 0,
        escapeCsv(r.status),
        escapeCsv(r.startDate ? r.startDate.toISOString().split('T')[0] : 'N/A'),
        escapeCsv(r.endDate ? r.endDate.toISOString().split('T')[0] : 'N/A'),
        r.autoRenew ? 'Yes' : 'No',
        escapeCsv(r.createdAt.toISOString())
      ]);

      const csvContent = [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="subscriptions_export.csv"');
      return res.status(200).send(csvContent);
    }

    return errorResponse(res, 400, `Unsupported export type: ${type}. Use 'transactions', 'attendance', or 'subscriptions'.`);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getDashboardStats,
  getMealConsumptionReport,
  getSubscriptionReport,
  getPaymentReport,
  getComplaintReport,
  exportCSV
};
