const Announcement = require('../models/Announcement');
const User = require('../models/User');
const notificationService = require('../services/notification.service');
const { successResponse, errorResponse } = require('../utils/apiResponse');
const { getPaginationParams, buildPaginationData } = require('../utils/pagination');
const { logAuditEvent } = require('../utils/auditLog');

/**
 * Get published announcements visible to current user
 * GET /api/v1/announcements
 */
const getAnnouncements = async (req, res, next) => {
  try {
    const isStudent = req.user.role === 'student';

    const conditions = [{ targetAudience: 'all' }];

    if (isStudent) {
      conditions.push({ targetAudience: 'students' });
      conditions.push({ targetStudents: req.user._id });
    }

    const announcements = await Announcement.find({
      isPublished: true,
      $or: conditions
    })
      .populate('createdBy', 'name email')
      .sort({ publishedAt: -1, createdAt: -1 });

    return successResponse(res, 200, 'Announcements retrieved', announcements);
  } catch (error) {
    next(error);
  }
};

/**
 * Get all announcements (Admin only)
 * GET /api/v1/announcements/all
 */
const getAllAnnouncements = async (req, res, next) => {
  try {
    const { page, limit, skip } = getPaginationParams(req.query);
    const { isPublished } = req.query;

    const filter = {};
    if (isPublished !== undefined) {
      filter.isPublished = isPublished === 'true';
    }

    const [totalCount, announcements] = await Promise.all([
      Announcement.countDocuments(filter),
      Announcement.find(filter)
        .populate('createdBy', 'name email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
    ]);

    const pagination = buildPaginationData(totalCount, page, limit);

    return successResponse(res, 200, 'All announcements retrieved', announcements, pagination);
  } catch (error) {
    next(error);
  }
};

/**
 * Create announcement (Admin only)
 * POST /api/v1/announcements
 */
const createAnnouncement = async (req, res, next) => {
  try {
    const { title, content, targetAudience = 'all', targetStudents, isPublished } = req.body;

    const announcement = new Announcement({
      title,
      content,
      targetAudience,
      targetStudents: targetStudents || [],
      createdBy: req.user._id,
      isPublished: Boolean(isPublished),
      publishedAt: isPublished ? new Date() : null
    });

    await announcement.save();

    if (announcement.isPublished) {
      // Find students to notify
      let targetUserIds = [];
      if (targetAudience === 'all' || targetAudience === 'students') {
        const students = await User.find({ role: 'student', isActive: true }).select('_id');
        targetUserIds = students.map((s) => s._id);
      } else if (targetAudience === 'specific' && Array.isArray(targetStudents)) {
        targetUserIds = targetStudents;
      }

      await notificationService.notifyAnnouncement(
        targetUserIds,
        announcement.title,
        announcement.content,
        announcement._id
      );
    }

    await logAuditEvent({
      actor: req.user._id,
      action: 'CREATE_ANNOUNCEMENT',
      entityType: 'Announcement',
      entityId: announcement._id,
      newValue: { title: announcement.title, isPublished: announcement.isPublished },
      req
    });

    return successResponse(res, 201, 'Announcement created successfully', announcement);
  } catch (error) {
    next(error);
  }
};

/**
 * Update announcement (Admin only)
 * PUT /api/v1/announcements/:id
 */
const updateAnnouncement = async (req, res, next) => {
  try {
    const announcement = await Announcement.findById(req.params.id);
    if (!announcement) {
      return errorResponse(res, 404, 'Announcement not found');
    }

    const { title, content, targetAudience, targetStudents, isPublished, status } = req.body;
    const oldValue = announcement.toObject();
    const wasPublished = announcement.isPublished;

    if (title !== undefined) announcement.title = title;
    if (content !== undefined) announcement.content = content;
    if (targetAudience !== undefined) announcement.targetAudience = targetAudience;
    if (targetStudents !== undefined) announcement.targetStudents = targetStudents;

    // Allow publishing via isPublished flag or status field (frontend uses both patterns)
    const shouldPublish = isPublished === true || status === 'published';
    if (shouldPublish && !wasPublished) {
      announcement.isPublished = true;
      announcement.publishedAt = new Date();
    } else if (isPublished === false) {
      announcement.isPublished = false;
    }

    await announcement.save();

    // Send notifications if newly published
    if (shouldPublish && !wasPublished) {
      let targetUserIds = [];
      if (announcement.targetAudience === 'all' || announcement.targetAudience === 'students') {
        const students = await User.find({ role: 'student', isActive: true }).select('_id');
        targetUserIds = students.map((s) => s._id);
      } else if (announcement.targetAudience === 'specific' && announcement.targetStudents?.length) {
        targetUserIds = announcement.targetStudents;
      }

      if (targetUserIds.length > 0) {
        await notificationService.notifyAnnouncement(
          targetUserIds,
          announcement.title,
          announcement.content,
          announcement._id
        );
      }
    }

    await logAuditEvent({
      actor: req.user._id,
      action: 'UPDATE_ANNOUNCEMENT',
      entityType: 'Announcement',
      entityId: announcement._id,
      oldValue,
      newValue: announcement.toObject(),
      req
    });

    return successResponse(res, 200, 'Announcement updated successfully', announcement);
  } catch (error) {
    next(error);
  }
};

/**
 * Delete announcement (Admin only)
 * DELETE /api/v1/announcements/:id
 */
const deleteAnnouncement = async (req, res, next) => {
  try {
    const announcement = await Announcement.findByIdAndDelete(req.params.id);
    if (!announcement) {
      return errorResponse(res, 404, 'Announcement not found');
    }

    await logAuditEvent({
      actor: req.user._id,
      action: 'DELETE_ANNOUNCEMENT',
      entityType: 'Announcement',
      entityId: announcement._id,
      req
    });

    return successResponse(res, 200, 'Announcement deleted successfully', announcement);
  } catch (error) {
    next(error);
  }
};

/**
 * Publish an announcement and broadcast notifications (Admin only)
 * POST /api/v1/announcements/:id/publish
 */
const publishAnnouncement = async (req, res, next) => {
  try {
    const announcement = await Announcement.findById(req.params.id);
    if (!announcement) {
      return errorResponse(res, 404, 'Announcement not found');
    }

    announcement.isPublished = true;
    announcement.publishedAt = new Date();
    await announcement.save();

    // Broadcast notifications to relevant users
    let targetUserIds = [];
    if (announcement.targetAudience === 'all' || announcement.targetAudience === 'students') {
      const students = await User.find({ role: 'student', isActive: true }).select('_id');
      targetUserIds = students.map((s) => s._id);
    } else if (announcement.targetAudience === 'specific' && announcement.targetStudents?.length) {
      targetUserIds = announcement.targetStudents;
    }

    await notificationService.notifyAnnouncement(
      targetUserIds,
      announcement.title,
      announcement.content,
      announcement._id
    );

    await logAuditEvent({
      actor: req.user._id,
      action: 'PUBLISH_ANNOUNCEMENT',
      entityType: 'Announcement',
      entityId: announcement._id,
      req
    });

    return successResponse(res, 200, 'Announcement published and notifications sent', announcement);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAnnouncements,
  getAllAnnouncements,
  createAnnouncement,
  updateAnnouncement,
  deleteAnnouncement,
  publishAnnouncement
};
