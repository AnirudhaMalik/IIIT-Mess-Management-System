const mongoose = require('mongoose');
const { MEAL_TYPES } = require('../config/constants');

const messPlanSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Plan name is required'],
      unique: true,
      trim: true
    },
    description: {
      type: String,
      trim: true
    },
    duration: {
      type: Number,
      required: [true, 'Plan duration in days is required'],
      min: [1, 'Duration must be at least 1 day']
    },
    price: {
      type: Number,
      required: [true, 'Price is required'],
      min: [0, 'Price cannot be negative']
    },
    mealTypes: {
      type: [
        {
          type: String,
          enum: MEAL_TYPES
        }
      ],
      validate: {
        validator: function (v) {
          return Array.isArray(v) && v.length > 0;
        },
        message: 'Plan must include at least one meal type'
      }
    },
    features: {
      type: [String],
      default: []
    },
    isActive: {
      type: Boolean,
      default: true
    }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Virtual for count of active subscriptions using this plan
messPlanSchema.virtual('subscriberCount', {
  ref: 'Subscription',
  localField: '_id',
  foreignField: 'plan',
  count: true,
  match: { status: 'active' }
});

const MessPlan = mongoose.model('MessPlan', messPlanSchema);
module.exports = MessPlan;
