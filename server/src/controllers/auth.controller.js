const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('../models/User');
const { successResponse, errorResponse } = require('../utils/apiResponse');
const { logAuditEvent } = require('../utils/auditLog');

/**
 * Helper to generate JWT token (7 days expiry)
 */
const generateAuthToken = (user) => {
  const secret = process.env.JWT_SECRET || 'super_secret_mess_jwt_token_key_iiit_bbsr_2024';
  const expiresIn = process.env.JWT_EXPIRES_IN || '7d';

  return jwt.sign(
    {
      id: user._id,
      email: user.email,
      role: user.role
    },
    secret,
    { expiresIn }
  );
};

/**
 * Register a new student account
 * POST /api/v1/auth/register
 */
const register = async (req, res, next) => {
  try {
    const { name, email, password, studentId, phone, hostel, roomNumber } = req.body;

    const existingEmail = await User.findOne({ email: email.toLowerCase() });
    if (existingEmail) {
      return errorResponse(res, 409, 'An account with this email address already exists');
    }

    if (studentId) {
      const existingStudentId = await User.findOne({ studentId: studentId.toUpperCase() });
      if (existingStudentId) {
        return errorResponse(res, 409, 'A student with this Student ID already exists');
      }
    }

    const newUser = new User({
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

    await newUser.save();

    const token = generateAuthToken(newUser);
    const userJson = newUser.toJSON();

    await logAuditEvent({
      actor: newUser._id,
      action: 'USER_REGISTERED',
      entityType: 'User',
      entityId: newUser._id,
      newValue: { email: newUser.email, role: newUser.role },
      req
    });

    return successResponse(
      res,
      201,
      'User registered successfully',
      {
        token,
        user: userJson
      }
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Login user
 * POST /api/v1/auth/login
 */
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
    if (!user) {
      return errorResponse(res, 401, 'Invalid email or password');
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return errorResponse(res, 401, 'Invalid email or password');
    }

    if (!user.isActive) {
      return errorResponse(res, 403, 'Your account has been deactivated. Please contact admin.');
    }

    const token = generateAuthToken(user);
    const userJson = user.toJSON();

    await logAuditEvent({
      actor: user._id,
      action: 'USER_LOGIN',
      entityType: 'User',
      entityId: user._id,
      req
    });

    return successResponse(res, 200, 'Login successful', {
      token,
      user: userJson
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Logout user (client-side clears token)
 * POST /api/v1/auth/logout
 */
const logout = async (req, res, next) => {
  try {
    if (req.user) {
      await logAuditEvent({
        actor: req.user._id,
        action: 'USER_LOGOUT',
        entityType: 'User',
        entityId: req.user._id,
        req
      });
    }

    return successResponse(res, 200, 'Logged out successfully', null);
  } catch (error) {
    next(error);
  }
};

/**
 * Forgot password - generates demo reset token
 * POST /api/v1/auth/forgot-password
 */
const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
      // Return 200 to prevent user enumeration attacks
      return successResponse(
        res,
        200,
        'If an account with that email exists, password reset instructions have been generated.'
      );
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');

    user.passwordResetToken = hashedToken;
    user.passwordResetExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
    await user.save();

    console.log('====================================================');
    console.log(`[PASSWORD RESET DEMO] Email: ${user.email}`);
    console.log(`[PASSWORD RESET DEMO] Reset Token: ${resetToken}`);
    console.log('====================================================');

    await logAuditEvent({
      actor: user._id,
      action: 'PASSWORD_RESET_REQUESTED',
      entityType: 'User',
      entityId: user._id,
      req
    });

    return successResponse(
      res,
      200,
      'Password reset token generated. In this demo environment, check the server console for the reset token.'
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Get current authenticated user
 * GET /api/v1/auth/me
 */
const getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return errorResponse(res, 404, 'User not found');
    }

    return successResponse(res, 200, 'Current user profile', user);
  } catch (error) {
    next(error);
  }
};

/**
 * Change own password (authenticated)
 * POST /api/v1/auth/change-password
 */
const changePassword = async (req, res, next) => {
  try {
    const currentPassword = req.body.currentPassword || req.body.oldPassword;
    const { newPassword } = req.body;

    if (!currentPassword) {
      return errorResponse(res, 400, 'Current password is required');
    }
    if (!newPassword || newPassword.length < 6) {
      return errorResponse(res, 400, 'New password must be at least 6 characters');
    }

    const user = await User.findById(req.user._id).select('+password');
    if (!user) {
      return errorResponse(res, 404, 'User not found');
    }

    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return errorResponse(res, 400, 'Current password is incorrect');
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

module.exports = {
  register,
  login,
  logout,
  forgotPassword,
  getMe,
  changePassword
};
