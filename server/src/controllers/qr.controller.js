const qrService = require('../services/qr.service');
const Subscription = require('../models/Subscription');
const MealAttendance = require('../models/MealAttendance');
const User = require('../models/User');
const { successResponse, errorResponse } = require('../utils/apiResponse');
const { logAuditEvent } = require('../utils/auditLog');
const { MEAL_TYPES, SUBSCRIPTION_STATUS } = require('../config/constants');

/**
 * Determine default current meal type based on local time (IST)
 */
const getCurrentMealType = () => {
  const currentHour = new Date().getUTCHours() + 5.5; // Rough IST conversion
  const hour = (currentHour + 24) % 24;

  if (hour >= 7 && hour < 10.5) return 'breakfast';
  if (hour >= 11.5 && hour < 15) return 'lunch';
  if (hour >= 16.5 && hour < 18.5) return 'snacks';
  return 'dinner';
};

/**
 * Get student's active QR code token
 * GET /api/v1/qr/my-token
 */
const getMyQRToken = async (req, res, next) => {
  try {
    const qrData = await qrService.getOrCreateQRToken(req.user._id);
    return successResponse(res, 200, 'QR Token retrieved successfully', qrData);
  } catch (error) {
    next(error);
  }
};

/**
 * Regenerate student's QR code token
 * POST /api/v1/qr/regenerate
 */
const regenerateQR = async (req, res, next) => {
  try {
    const qrData = await qrService.regenerateToken(req.user._id);

    await logAuditEvent({
      actor: req.user._id,
      action: 'REGENERATE_QR_TOKEN',
      entityType: 'QRToken',
      entityId: req.user._id,
      req
    });

    return successResponse(res, 200, 'QR Token regenerated successfully', qrData);
  } catch (error) {
    next(error);
  }
};

/**
 * Verify scanned QR token (Admin / Mess Staff only)
 * POST /api/v1/qr/verify
 * Body: { token, mealType, notes? }
 */
const verifyQR = async (req, res, next) => {
  try {
    const { token, notes } = req.body;
    let mealType = req.body.mealType;

    if (!token) {
      return errorResponse(res, 400, 'QR Token is required');
    }

    if (!mealType || !MEAL_TYPES.includes(mealType)) {
      mealType = getCurrentMealType();
    }

    // 1. Find token in DB and verify expiry
    const verification = await qrService.verifyToken(token);
    if (!verification.valid) {
      return errorResponse(res, 400, verification.reason || 'Invalid QR Token');
    }

    const student = verification.student;

    // 2. Check active subscription
    const now = new Date();
    const activeSub = await Subscription.findOne({
      student: student._id,
      status: SUBSCRIPTION_STATUS.ACTIVE,
      startDate: { $lte: now },
      endDate: { $gte: now }
    }).populate('plan');

    if (!activeSub) {
      return errorResponse(
        res,
        400,
        `Student ${student.name} (${student.studentId || student.email}) does not have an active mess subscription`
      );
    }

    // Check if subscription plan includes this meal type
    if (activeSub.plan && !activeSub.plan.mealTypes.includes(mealType)) {
      return errorResponse(
        res,
        400,
        `Student's subscription plan (${activeSub.plan.name}) does not include ${mealType}`
      );
    }

    // 3. Normalize date to UTC midnight for duplicate check
    const today = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));

    // 4. Check duplicate attendance
    const existingAttendance = await MealAttendance.findOne({
      student: student._id,
      date: today,
      mealType
    });

    if (existingAttendance) {
      return errorResponse(
        res,
        409,
        `Student has already been served ${mealType} today at ${existingAttendance.scanTime.toISOString()}`,
        {
          student: {
            id: student._id,
            name: student.name,
            studentId: student.studentId,
            hostel: student.hostel,
            roomNumber: student.roomNumber
          },
          existingScanTime: existingAttendance.scanTime
        }
      );
    }

    // 5. Create MealAttendance record
    const attendance = new MealAttendance({
      student: student._id,
      subscription: activeSub._id,
      date: today,
      mealType,
      verifiedBy: req.user._id,
      scanTime: now,
      status: 'success',
      notes: notes || 'QR code scanned successfully'
    });

    await attendance.save();

    await logAuditEvent({
      actor: req.user._id,
      action: 'VERIFY_QR_ATTENDANCE',
      entityType: 'MealAttendance',
      entityId: attendance._id,
      newValue: { studentId: student._id, mealType, date: today },
      req
    });

    return successResponse(res, 200, `${mealType.toUpperCase()} marked successfully`, {
      attendance,
      student: {
        id: student._id,
        name: student.name,
        studentId: student.studentId,
        email: student.email,
        hostel: student.hostel,
        roomNumber: student.roomNumber,
        profilePhoto: student.profilePhoto
      },
      plan: {
        name: activeSub.plan?.name,
        endDate: activeSub.endDate
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Manual lookup student by studentId (Admin only)
 * GET /api/v1/qr/lookup/:studentId
 */
const manualLookup = async (req, res, next) => {
  try {
    const { studentId } = req.params;
    const student = await User.findOne({
      studentId: studentId.toUpperCase(),
      role: 'student'
    });

    if (!student) {
      return errorResponse(res, 404, `Student with ID "${studentId}" not found`);
    }

    const now = new Date();
    const today = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));

    const [activeSub, todayAttendance] = await Promise.all([
      Subscription.findOne({
        student: student._id,
        status: SUBSCRIPTION_STATUS.ACTIVE,
        endDate: { $gte: now }
      }).populate('plan'),
      MealAttendance.find({
        student: student._id,
        date: today
      })
    ]);

    return successResponse(res, 200, 'Student details retrieved for manual verification', {
      student,
      activeSubscription: activeSub,
      todayAttendance
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getMyQRToken,
  regenerateQR,
  verifyQR,
  manualLookup
};
