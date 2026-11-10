const { errorResponse } = require('../utils/apiResponse');

/**
 * Restrict access to specific roles
 * @param {...string} roles Allowed roles ('admin', 'student', etc.)
 */
const requireRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return errorResponse(res, 401, 'Authentication required');
    }

    // Flatten if an array was passed as the first parameter
    const allowedRoles = roles.flat();

    if (!allowedRoles.includes(req.user.role)) {
      return errorResponse(
        res,
        403,
        `Access denied. Role '${req.user.role}' is not authorized to access this resource.`
      );
    }

    next();
  };
};

module.exports = {
  requireRole
};
