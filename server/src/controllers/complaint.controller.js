const Complaint = require('../models/Complaint');
const User = require('../models/User');
const notificationService = require('../services/notification.service');
const { successResponse, errorResponse } = require('../utils/apiResponse');
const { getPaginationParams, buildPaginationData } = require('../utils/pagination');
const { logAuditEvent } = require('../utils/auditLog');
const { COMPLAINT_STATUS } = require('../config/constants');

/**
 * Submit a complaint (Student)
 * POST /api/v1/complaints
 */
const submitComplaint = async (req, res, next) => {
  try {
    const { category, description } = req.body;

    const images = [];
    if (req.files && Array.isArray(req.files)) {
      req.files.forEach((f) => images.push(f.filename));
    } else if (req.file) {
      images.push(req.file.filename);
    }

    const complaint = new Complaint({
      student: req.user._id,
      category,
      description,
      images,
      status: COMPLAINT_STATUS.PENDING
    });

    await complaint.save();

    await logAuditEvent({
      actor: req.user._id,
      action: 'SUBMIT_COMPLAINT',
      entityType: 'Complaint',
      entityId: complaint._id,
      newValue: { category, descriptionLength: description.length },
      req
    });

    return successResponse(res, 201, 'Complaint submitted successfully', complaint);
  } catch (error) {
    next(error);
  }
};

/**
 * Get student's complaints
 * GET /api/v1/complaints/my
 */
const getMyComplaints = async (req, res, next) => {
  try {
    const { page, limit, skip } = getPaginationParams(req.query);
    const { status, category } = req.query;

    const filter = { student: req.user._id };
    if (status) filter.status = status;
    if (category) filter.category = category;

    const [totalCount, complaints] = await Promise.all([
      Complaint.countDocuments(filter),
      Complaint.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
    ]);

    const pagination = buildPaginationData(totalCount, page, limit);

    return successResponse(res, 200, 'Complaints retrieved successfully', complaints, pagination);
  } catch (error) {
    next(error);
  }
};

/**
 * Get all complaints (Admin only)
 * GET /api/v1/complaints
 */
const getAllComplaints = async (req, res, next) => {
  try {
    const { page, limit, skip } = getPaginationParams(req.query);
    const { status, category, studentId, search } = req.query;

    const filter = {};
    if (status) filter.status = status;
    if (category) filter.category = category;
    if (studentId) filter.student = studentId;

    if (search && search.trim()) {
      const searchRegex = new RegExp(search.trim(), 'i');
      const matchingStudents = await User.find({
        role: 'student',
        $or: [{ name: searchRegex }, { studentId: searchRegex }]
      }).select('_id');
      filter.$or = [
        { description: searchRegex },
        { student: { $in: matchingStudents.map(s => s._id) } }
      ];
    }

    const [totalCount, complaints] = await Promise.all([
      Complaint.countDocuments(filter),
      Complaint.find(filter)
        .populate('student', 'name email studentId hostel roomNumber')
        .populate('assignedTo', 'name email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
    ]);

    const pagination = buildPaginationData(totalCount, page, limit);

    return successResponse(res, 200, 'All complaints retrieved', complaints, pagination);
  } catch (error) {
    next(error);
  }
};

/**
 * Get complaint by ID
 * GET /api/v1/complaints/:id
 */
const getComplaintById = async (req, res, next) => {
  try {
    const complaint = await Complaint.findById(req.params.id)
      .populate('student', 'name email studentId hostel roomNumber')
      .populate('assignedTo', 'name email');

    if (!complaint) {
      return errorResponse(res, 404, 'Complaint not found');
    }

    if (req.user.role !== 'admin' && String(complaint.student._id) !== String(req.user._id)) {
      return errorResponse(res, 403, 'Unauthorized access to this complaint');
    }

    return successResponse(res, 200, 'Complaint retrieved successfully', complaint);
  } catch (error) {
    next(error);
  }
};

/**
 * Respond to complaint and update status (Admin only)
 * PUT /api/v1/complaints/:id/respond
 */
const respondToComplaint = async (req, res, next) => {
  try {
    const { status, adminResponse } = req.body;

    const complaint = await Complaint.findById(req.params.id);
    if (!complaint) {
      return errorResponse(res, 404, 'Complaint not found');
    }

    const oldStatus = complaint.status;
    complaint.status = status;
    complaint.adminResponse = adminResponse;
    complaint.assignedTo = req.user._id;

    if (status === COMPLAINT_STATUS.RESOLVED || status === COMPLAINT_STATUS.REJECTED) {
      complaint.resolvedAt = new Date();
    }

    await complaint.save();

    // Notify student about status change
    await notificationService.notifyComplaintStatusChanged(
      complaint.student,
      complaint.category,
      status,
      adminResponse,
      complaint._id
    );

    await logAuditEvent({
      actor: req.user._id,
      action: 'RESPOND_TO_COMPLAINT',
      entityType: 'Complaint',
      entityId: complaint._id,
      oldValue: { status: oldStatus },
      newValue: { status, adminResponse },
      req
    });

    return successResponse(res, 200, 'Complaint response recorded and student notified', complaint);
  } catch (error) {
    next(error);
  }
};

/**
 * Add internal admin note to complaint (Admin only)
 * PATCH /api/v1/complaints/:id/note
 */
const addAdminNote = async (req, res, next) => {
  try {
    const { adminNote } = req.body;

    const complaint = await Complaint.findById(req.params.id);
    if (!complaint) {
      return errorResponse(res, 404, 'Complaint not found');
    }

    complaint.adminNote = adminNote;
    await complaint.save();

    await logAuditEvent({
      actor: req.user._id,
      action: 'ADD_COMPLAINT_NOTE',
      entityType: 'Complaint',
      entityId: complaint._id,
      newValue: { adminNote },
      req
    });

    return successResponse(res, 200, 'Admin note saved successfully', complaint);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  submitComplaint,
  getMyComplaints,
  getAllComplaints,
  getComplaintById,
  respondToComplaint,
  addAdminNote
};
