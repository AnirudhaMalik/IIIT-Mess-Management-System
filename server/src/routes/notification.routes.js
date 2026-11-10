const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notification.controller');
const { verifyToken } = require('../middleware/auth');

router.use(verifyToken);

router.get('/my', notificationController.getMyNotifications);
router.get('/', notificationController.getMyNotifications); // alias: frontend calls /notifications
router.get('/unread-count', notificationController.getUnreadCount);
router.put('/read-all', notificationController.markAllRead);
router.put('/mark-all-read', notificationController.markAllRead); // alias used by frontend
router.put('/:id/read', notificationController.markAsRead);
router.patch('/:id/read', notificationController.markAsRead); // alias: frontend uses PATCH
router.delete('/:id', notificationController.deleteNotification);

module.exports = router;
