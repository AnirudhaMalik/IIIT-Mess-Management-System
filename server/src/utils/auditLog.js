/**
 * Audit log recording utility
 */

const logAuditEvent = async ({ actor, action, entityType, entityId, oldValue, newValue, req }) => {
  try {
    // Dynamic import to prevent circular dependency issues
    const AuditLog = require('../models/AuditLog');

    const ipAddress = req
      ? req.ip || req.headers['x-forwarded-for'] || req.socket?.remoteAddress || ''
      : '';
    const userAgent = req ? req.headers['user-agent'] || '' : '';

    const logEntry = new AuditLog({
      actor: actor || (req && req.user ? req.user._id : null),
      action,
      entityType,
      entityId,
      oldValue: oldValue || null,
      newValue: newValue || null,
      ipAddress: String(ipAddress),
      userAgent: String(userAgent)
    });

    await logEntry.save();
    return logEntry;
  } catch (error) {
    // Audit log should never crash the main application flow
    console.error(`[AuditLog Error]: Failed to create log entry for ${action}:`, error.message);
    return null;
  }
};

module.exports = {
  logAuditEvent
};
