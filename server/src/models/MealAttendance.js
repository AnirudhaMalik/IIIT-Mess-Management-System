const mongoose = require('mongoose');
const { MEAL_TYPES, ATTENDANCE_STATUS } = require('../config/constants');

const mealAttendanceSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Student ID is required']
    },
    subscription: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Subscription',
      required: [true, 'Subscription ID is required']
    },
    date: {
      type: Date,
      required: [true, 'Date is required']
    },
    mealType: {
      type: String,
      enum: MEAL_TYPES,
      required: [true, 'Meal type is required']
    },
    verifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    scanTime: {
      type: Date,
      default: Date.now
    },
    status: {
      type: String,
      enum: ATTENDANCE_STATUS,
      default: 'success'
    },
    notes: {
      type: String,
      trim: true
    }
  },
  {
    timestamps: true
  }
);

// Normalize date to UTC midnight before saving to ensure day-granularity uniqueness
mealAttendanceSchema.pre('save', function (next) {
  if (this.date) {
    const d = new Date(this.date);
    this.date = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  }
  next();
});

// Compound unique index to prevent duplicate attendance on same date and mealType
mealAttendanceSchema.index({ student: 1, date: 1, mealType: 1 }, { unique: true });
mealAttendanceSchema.index({ date: 1, mealType: 1 });
mealAttendanceSchema.index({ student: 1, createdAt: -1 });

const MealAttendance = mongoose.model('MealAttendance', mealAttendanceSchema);
module.exports = MealAttendance;
