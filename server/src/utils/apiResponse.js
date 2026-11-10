/**
 * Standardized API Response Helper
 * Format: { success: boolean, message: string, data?: any, pagination?: object, errors?: any }
 */

const successResponse = (res, statusCode = 200, message = 'Success', data = null, pagination = undefined) => {
  const response = {
    success: true,
    message,
    data
  };

  if (pagination !== undefined && pagination !== null) {
    response.pagination = pagination;
  }

  return res.status(statusCode).json(response);
};

const errorResponse = (res, statusCode = 500, message = 'An error occurred', errors = null) => {
  const response = {
    success: false,
    message
  };

  if (errors !== null && errors !== undefined) {
    response.errors = errors;
  }

  return res.status(statusCode).json(response);
};

module.exports = {
  successResponse,
  errorResponse
};
