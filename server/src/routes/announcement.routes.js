const express = require('express');
const router = express.Router();
const announcementController = require('../controllers/announcement.controller');
const { verifyToken } = require('../middleware/auth');
const { requireRole } = require('../middleware/authorize');

// Published announcements for authenticated user
router.get('/', verifyToken, announcementController.getAnnouncements);

// Admin-only announcement management routes
router.get('/all', verifyToken, requireRole('admin'), announcementController.getAllAnnouncements);
router.post('/', verifyToken, requireRole('admin'), announcementController.createAnnouncement);
router.put('/:id', verifyToken, requireRole('admin'), announcementController.updateAnnouncement);
router.patch('/:id', verifyToken, requireRole('admin'), announcementController.updateAnnouncement); // alias used by frontend for publish
router.delete('/:id', verifyToken, requireRole('admin'), announcementController.deleteAnnouncement);
router.post('/:id/publish', verifyToken, requireRole('admin'), announcementController.publishAnnouncement);

module.exports = router;
