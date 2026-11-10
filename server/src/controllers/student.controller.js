const User = require('../models/User');
const Subscription = require('../models/Subscription');
const MealAttendance = require('../models/MealAttendance');
const { successResponse, errorResponse } = require('../utils/apiResponse');
const { getPaginationParams, buildPaginationData } = require('../utils/pagination');
const { logAuditEvent } = require('../utils/auditLog');

/**
 * Get own profile
 * GET /api/v1/students/profile
 */
const getProfile = async (req, res, next) => {
  try {
    const student = await User.findById(req.user._id);
    if (!student) {
      return errorResponse(res, 404, 'Student profile not found');
    }
    return successResponse(res, 200, 'Profile retrieved successfully', student);
  } catch (error) {
    next(error);
  }
};

/**
 * Update own profile (name, phone, hostel, roomNumber only)
 * PUT /api/v1/students/profile
 */
const updateProfile = async (req, res, next) => {
  try {
    const { name, phone, hostel, roomNumber } = req.body;
    const student = await User.findById(req.user._id);

    if (!student) {
      return errorResponse(res, 404, 'Student not found');
    }

    const oldValue = {
      name: student.name,
      phone: student.phone,
      hostel: student.hostel,
      roomNumber: student.roomNumber
    };

    if (name !== undefined) student.name = name;
    if (phone !== undefined) student.phone = phone;
    if (hostel !== undefined) student.hostel = hostel;
    if (roomNumber !== undefined) student.roomNumber = roomNumber;

    await student.save();

    await logAuditEvent({
      actor: student._id,
      action: 'UPDATE_OWN_PROFILE',
      entityType: 'User',
      entityId: student._id,
      oldValue,
      newValue: { name: student.name, phone: student.phone, hostel: student.hostel, roomNumber: student.roomNumber },
      req
    });

    return successResponse(res, 200, 'Profile updated successfully', student);
  } catch (error) {
    next(error);
  }
};

/**
 * Change own password
 * PUT /api/v1/students/profile/password
 */
const changePassword = async (req, res, next) => {
  try {
    const oldPassword = req.body.oldPassword || req.body.currentPassword;
    const { newPassword } = req.body;
    const user = await User.findById(req.user._id).select('+password');

    if (!user) {
      return errorResponse(res, 404, 'User not found');
    }

    const isMatch = await user.comparePassword(oldPassword);
    if (!isMatch) {
      return errorResponse(res, 400, 'Current password does not match');
    }

    user.password = newPassword;
    await user.save();

    await logAuditEvent({
      actor: user._id,
      action: 'PASSWORD_CHANGED',
      entityType: 'User',
      entityId: user._id,
      req
    });

    return successResponse(res, 200, 'Password updated successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Upload profile photo
 * POST /api/v1/students/profile/photo
 */
const uploadProfilePhoto = async (req, res, next) => {
  try {
    if (!req.file) {
      return errorResponse(res, 400, 'Please upload an image file');
    }

    const student = await User.findById(req.user._id);
    if (!student) {
      return errorResponse(res, 404, 'User not found');
    }

    student.profilePhoto = req.file.filename;
    await student.save();

    await logAuditEvent({
      actor: student._id,
      action: 'PROFILE_PHOTO_UPLOADED',
      entityType: 'User',
      entityId: student._id,
      newValue: { profilePhoto: req.file.filename },
      req
    });

    return successResponse(res, 200, 'Profile photo uploaded successfully', {
      profilePhoto: student.profilePhoto,
      photoUrl: `/uploads/${student.profilePhoto}`
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get all students (Admin only)
 * GET /api/v1/students
 */
const getAllStudents = async (req, res, next) => {
  try {
    const { page, limit, skip } = getPaginationParams(req.query);
    const { search, hostel, isActive } = req.query;

    const query = { role: 'student' };

    if (search) {
      const searchRegex = new RegExp(search, 'i');
      query.$or = [
        { name: searchRegex },
        { email: searchRegex },
        { studentId: searchRegex },
        { phone: searchRegex }
      ];
    }

    if (hostel) {
      query.hostel = new RegExp(hostel, 'i');
    }

    if (isActive !== undefined && isActive !== '') {
      query.isActive = isActive === 'true' || isActive === true;
    }

    const [totalCount, students] = await Promise.all([
      User.countDocuments(query),
      User.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit)
    ]);

    const pagination = buildPaginationData(totalCount, page, limit);

    return successResponse(res, 200, 'Students retrieved successfully', students, pagination);
  } catch (error) {
    next(error);
  }
};

/**
 * Get student by ID with full details, active subscription & recent attendance (Admin only)
 * GET /api/v1/students/:id
 */
const getStudentById = async (req, res, next) => {
  try {
    const student = await User.findById(req.params.id);
    if (!student) {
      return errorResponse(res, 404, 'Student not found');
    }

    const [activeSubscription, recentAttendance] = await Promise.all([
      Subscription.findOne({
        student: student._id,
        status: 'active'
      }).populate('plan'),
      MealAttendance.find({
        student: student._id
      })
        .sort({ scanTime: -1 })
        .limit(10)
    ]);

    return successResponse(res, 200, 'Student details retrieved successfully', {
      student,
      activeSubscription,
      recentAttendance
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update student active status (Admin only)
 * PATCH /api/v1/students/:id/status
 */
const updateStudentStatus = async (req, res, next) => {
  try {
    const { isActive } = req.body;
    if (typeof isActive !== 'boolean') {
      return errorResponse(res, 400, 'isActive must be a boolean');
    }

    const student = await User.findById(req.params.id);
    if (!student) {
      return errorResponse(res, 404, 'Student not found');
    }

    const oldStatus = student.isActive;
    student.isActive = isActive;
    await student.save();

    await logAuditEvent({
      actor: req.user._id,
      action: 'UPDATE_STUDENT_STATUS',
      entityType: 'User',
      entityId: student._id,
      oldValue: { isActive: oldStatus },
      newValue: { isActive },
      req
    });

    return successResponse(res, 200, `Student status updated to ${isActive ? 'active' : 'inactive'}`, student);
  } catch (error) {
    next(error);
  }
};

/**
 * Add student manually (Admin only)
 * POST /api/v1/students
 */
const addStudentManually = async (req, res, next) => {
  try {
    const { name, email, password, studentId, phone, hostel, roomNumber } = req.body;

    if (!name || !email || !password) {
      return errorResponse(res, 400, 'Name, email, and password are required');
    }

    const existingEmail = await User.findOne({ email: email.toLowerCase() });
    if (existingEmail) {
      return errorResponse(res, 409, 'A user with this email already exists');
    }

    if (studentId) {
      const existingId = await User.findOne({ studentId: studentId.toUpperCase() });
      if (existingId) {
        return errorResponse(res, 409, 'A student with this Student ID already exists');
      }
    }

    const student = new User({
      name,
      email: email.toLowerCase(),
      password,
      role: 'student',
      studentId: studentId ? studentId.toUpperCase() : undefined,
      phone,
      hostel,
      roomNumber,
      isActive: true
    });

    await student.save();

    await logAuditEvent({
      actor: req.user._id,
      action: 'ADMIN_CREATE_STUDENT',
      entityType: 'User',
      entityId: student._id,
      newValue: { name: student.name, email: student.email, studentId: student.studentId },
      req
    });

    return successResponse(res, 201, 'Student created successfully', student);
  } catch (error) {
    next(error);
  }
};

/**
 * Update student by Admin
 * PUT /api/v1/students/:id
 */
const updateStudentAdmin = async (req, res, next) => {
  try {
    const student = await User.findById(req.params.id);
    if (!student) {
      return errorResponse(res, 404, 'Student not found');
    }

    const { name, email, studentId, phone, hostel, roomNumber, isActive } = req.body;

    // Check unique email if changed
    if (email && email.toLowerCase() !== student.email) {
      const existingEmail = await User.findOne({ email: email.toLowerCase() });
      if (existingEmail) {
        return errorResponse(res, 409, 'Email is already taken by another account');
      }
      student.email = email.toLowerCase();
    }

    // Check unique studentId if changed
    if (studentId && studentId.toUpperCase() !== student.studentId) {
      const existingId = await User.findOne({ studentId: studentId.toUpperCase() });
      if (existingId) {
        return errorResponse(res, 409, 'Student ID is already taken by another account');
      }
      student.studentId = studentId.toUpperCase();
    }

    if (name !== undefined) student.name = name;
    if (phone !== undefined) student.phone = phone;
    if (hostel !== undefined) student.hostel = hostel;
    if (roomNumber !== undefined) student.roomNumber = roomNumber;
    if (isActive !== undefined) student.isActive = isActive;

    await student.save();

    await logAuditEvent({
      actor: req.user._id,
      action: 'ADMIN_UPDATE_STUDENT',
      entityType: 'User',
      entityId: student._id,
      newValue: { name: student.name, email: student.email, studentId: student.studentId },
      req
    });

    return successResponse(res, 200, 'Student details updated successfully', student);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getProfile,
  updateProfile,
  changePassword,
  uploadProfilePhoto,
  getAllStudents,
  getStudentById,
  updateStudentStatus,
  addStudentManually,
  updateStudentAdmin
};
