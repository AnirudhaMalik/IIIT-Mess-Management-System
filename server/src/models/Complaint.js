const mongoose = require('mongoose');
const { COMPLAINT_CATEGORIES, COMPLAINT_STATUS } = require('../config/constants');

const complaintSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Student ID is required']
    },
    category: {
      type: String,
      enum: COMPLAINT_CATEGORIES,
      required: [true, 'Complaint category is required']
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      minlength: [10, 'Description must be at least 10 characters'],
      maxlength: [2000, 'Description cannot exceed 2000 characters'],
      trim: true
    },
    images: {
      type: [String],
      default: []
    },
    status: {
      type: String,
      enum: Object.values(COMPLAINT_STATUS),
      default: COMPLAINT_STATUS.PENDING
    },
    adminResponse: {
      type: String,
      trim: true,
      default: null
    },
    adminNote: {
      type: String,
      trim: true,
      default: null
    },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    resolvedAt: {
      type: Date,
      default: null
    }
  },
  {
    timestamps: true
  }
);

complaintSchema.index({ student: 1, createdAt: -1 });
complaintSchema.index({ status: 1, category: 1 });

const Complaint = mongoose.model('Complaint', complaintSchema);
module.exports = Complaint;
