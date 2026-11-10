const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { errorResponse } = require('../utils/apiResponse');

/**
 * Verify JWT token and attach user to request object
 */
const verifyToken = async (req, res, next) => {
  try {
    let token = null;

    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith('Bearer ')
    ) {
      token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies && req.cookies.token) {
      token = req.cookies.token;
    }

    if (!token) {
      return errorResponse(res, 401, 'Authentication token is required');
    }

    const secret = process.env.JWT_SECRET || 'super_secret_mess_jwt_token_key_iiit_bbsr_2024';
    let decoded;
    try {
      decoded = jwt.verify(token, secret);
    } catch (err) {
      if (err.name === 'TokenExpiredError') {
        return errorResponse(res, 401, 'Token has expired. Please log in again.');
      }
      return errorResponse(res, 401, 'Invalid authentication token');
    }

    const userId = decoded.id || decoded.userId;
    const user = await User.findById(userId);

    if (!user) {
      return errorResponse(res, 401, 'The user belonging to this token no longer exists');
    }

    if (!user.isActive) {
      return errorResponse(res, 403, 'Your account has been deactivated. Please contact the administrator.');
    }

    req.user = user;
    next();
  } catch (error) {
    return errorResponse(res, 500, `Authentication error: ${error.message}`);
  }
};

const requireAuth = verifyToken;

module.exports = {
  verifyToken,
  requireAuth
};
