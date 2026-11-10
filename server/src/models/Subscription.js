const mongoose = require('mongoose');
const { SUBSCRIPTION_STATUS } = require('../config/constants');

const subscriptionSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Student ID is required']
    },
    plan: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'MessPlan',
      required: [true, 'Mess plan ID is required']
    },
    status: {
      type: String,
      enum: Object.values(SUBSCRIPTION_STATUS),
      default: SUBSCRIPTION_STATUS.PENDING
    },
    startDate: {
      type: Date
    },
    endDate: {
      type: Date
    },
    paymentRef: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Transaction'
    },
    autoRenew: {
      type: Boolean,
      default: false
    },
    cancelledAt: {
      type: Date,
      default: null
    },
    cancelReason: {
      type: String,
      trim: true,
      default: null
    }
  },
  {
    timestamps: true
  }
);

// Index to quickly find student subscriptions by status
subscriptionSchema.index({ student: 1, status: 1 });
subscriptionSchema.index({ status: 1, endDate: 1 });

const Subscription = mongoose.model('Subscription', subscriptionSchema);
module.exports = Subscription;
