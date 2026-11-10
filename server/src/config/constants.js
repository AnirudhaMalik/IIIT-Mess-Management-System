const USER_ROLES = {
  STUDENT: 'student',
  ADMIN: 'admin'
};

const MEAL_TYPES = ['breakfast', 'lunch', 'snacks', 'dinner'];

const SUBSCRIPTION_STATUS = {
  PENDING: 'pending',
  ACTIVE: 'active',
  EXPIRED: 'expired',
  CANCELLED: 'cancelled'
};

const TRANSACTION_STATUS = {
  PENDING: 'pending',
  SUCCESS: 'success',
  FAILED: 'failed',
  CANCELLED: 'cancelled'
};

const PAYMENT_METHODS = ['upi', 'card', 'netbanking'];

const COMPLAINT_CATEGORIES = [
  // Snake_case (legacy)
  'food_quality',
  'hygiene',
  'quantity',
  'staff_behaviour',
  'menu',
  'other',
  // Human-readable (used by frontend form)
  'Food Quality',
  'Hygiene & Sanitation',
  'Portion Size',
  'Staff Behavior',
  'Dietary Preference',
  'Timing & Service',
  'Other'
];

const COMPLAINT_STATUS = {
  PENDING: 'pending',
  UNDER_REVIEW: 'under_review',
  RESOLVED: 'resolved',
  REJECTED: 'rejected'
};

const NOTIFICATION_TYPES = [
  'subscription',
  'payment',
  'complaint',
  'announcement',
  'system',
  'reminder'
];

const TARGET_AUDIENCE = ['all', 'students', 'specific'];

const ATTENDANCE_STATUS = ['success', 'failed'];

module.exports = {
  USER_ROLES,
  MEAL_TYPES,
  SUBSCRIPTION_STATUS,
  TRANSACTION_STATUS,
  PAYMENT_METHODS,
  COMPLAINT_CATEGORIES,
  COMPLAINT_STATUS,
  NOTIFICATION_TYPES,
  TARGET_AUDIENCE,
  ATTENDANCE_STATUS
};
