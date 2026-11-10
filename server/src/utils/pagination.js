/**
 * Pagination helper to parse query params and construct pagination metadata
 */

const getPaginationParams = (query, defaultLimit = 10, maxLimit = 100) => {
  const page = Math.max(1, parseInt(query.page, 10) || 1);
  let limit = parseInt(query.limit, 10) || defaultLimit;

  if (limit < 1) limit = defaultLimit;
  if (limit > maxLimit) limit = maxLimit;

  const skip = (page - 1) * limit;

  return { page, limit, skip };
};

const buildPaginationData = (totalCount, page, limit) => {
  const totalPages = Math.ceil(totalCount / limit) || 1;
  return {
    totalItems: totalCount,
    totalPages,
    currentPage: page,
    pageSize: limit,
    hasNextPage: page < totalPages,
    hasPrevPage: page > 1
  };
};

module.exports = {
  getPaginationParams,
  buildPaginationData
};
