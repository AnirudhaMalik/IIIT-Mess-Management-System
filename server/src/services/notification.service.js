const Notification = require('../models/Notification');

/**
 * Base method to create a single notification record
 */
const createNotification = async (
  recipientId,
  title,
  message,
  type = 'system',
  relatedEntity = null,
  relatedEntityId = null
) => {
  try {
    const notification = new Notification({
      recipient: recipientId,
      title,
      message,
      type,
      relatedEntity,
      relatedEntityId
    });
    return await notification.save();
  } catch (error) {
    console.error('[Notification Error]: Failed to create notification:', error.message);
    return null;
  }
};

/**
 * Notify student when mess subscription is activated
 */
const notifySubscriptionActivated = async (studentId, planName, subscriptionId = null) => {
  return await createNotification(
    studentId,
    'Subscription Activated',
    `Your mess subscription for "${planName}" has been successfully activated. You can now scan your QR code at the mess counter.`,
    'subscription',
    'Subscription',
    subscriptionId
  );
};

/**
 * Notify student on successful payment
 */
const notifyPaymentSuccess = async (studentId, amount, transactionId, transactionDocId = null) => {
  return await createNotification(
    studentId,
    'Payment Successful',
    `Your payment of ₹${amount} (Transaction ID: ${transactionId}) was successful.`,
    'payment',
    'Transaction',
    transactionDocId
  );
};

/**
 * Notify student on payment failure
 */
const notifyPaymentFailed = async (studentId, amount, transactionDocId = null) => {
  return await createNotification(
    studentId,
    'Payment Failed',
    `Your payment of ₹${amount} could not be processed. If money was debited, it will be refunded within 3-5 business days.`,
    'payment',
    'Transaction',
    transactionDocId
  );
};

/**
 * Notify student when complaint status changes
 */
const notifyComplaintStatusChanged = async (studentId, category, newStatus, adminResponse = null, complaintId = null) => {
  let responseText = adminResponse ? ` Note: "${adminResponse}"` : '';
  const formattedCategory = category.replace('_', ' ').toUpperCase();
  const formattedStatus = newStatus.replace('_', ' ').toUpperCase();

  return await createNotification(
    studentId,
    'Complaint Status Update',
    `Your ${formattedCategory} complaint status has been updated to "${formattedStatus}".${responseText}`,
    'complaint',
    'Complaint',
    complaintId
  );
};

/**
 * Notify student when subscription is expiring
 */
const notifySubscriptionExpiring = async (studentId, daysLeft, subscriptionId = null) => {
  return await createNotification(
    studentId,
    'Subscription Expiring Soon',
    `Your current mess subscription will expire in ${daysLeft} day(s). Please renew in advance to avoid disruption of meals.`,
    'reminder',
    'Subscription',
    subscriptionId
  );
};

/**
 * Notify multiple students about an announcement
 */
const notifyAnnouncement = async (studentIds, title, content, announcementId = null) => {
  if (!Array.isArray(studentIds) || studentIds.length === 0) return [];

  const notifications = studentIds.map((id) => ({
    recipient: id,
    title: `Announcement: ${title}`,
    message: content.length > 150 ? `${content.substring(0, 147)}...` : content,
    type: 'announcement',
    relatedEntity: 'Announcement',
    relatedEntityId: announcementId
  }));

  try {
    return await Notification.insertMany(notifications);
  } catch (error) {
    console.error('[Announcement Notification Error]:', error.message);
    return [];
  }
};

module.exports = {
  createNotification,
  notifySubscriptionActivated,
  notifyPaymentSuccess,
  notifyPaymentFailed,
  notifyComplaintStatusChanged,
  notifySubscriptionExpiring,
  notifyAnnouncement
};
