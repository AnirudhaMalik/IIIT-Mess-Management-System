const mongoose = require('mongoose');
const { MEAL_TYPES } = require('../config/constants');

const menuItemSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Item name is required'],
    trim: true
  },
  description: {
    type: String,
    trim: true,
    default: ''
  },
  isVeg: {
    type: Boolean,
    default: true
  }
});

const menuSchema = new mongoose.Schema(
  {
    date: {
      type: Date,
      required: [true, 'Date is required']
    },
    mealType: {
      type: String,
      enum: MEAL_TYPES,
      required: [true, 'Meal type is required']
    },
    items: {
      type: [menuItemSchema],
      validate: {
        validator: function (v) {
          return Array.isArray(v) && v.length > 0;
        },
        message: 'Menu must contain at least one item'
      }
    },
    timing: {
      type: String,
      trim: true,
      default: ''
    },
    isSpecial: {
      type: Boolean,
      default: false
    },
    specialNote: {
      type: String,
      trim: true,
      default: ''
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  },
  {
    timestamps: true
  }
);

// Normalize date to UTC midnight before saving
menuSchema.pre('save', function (next) {
  if (this.date) {
    const d = new Date(this.date);
    this.date = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  }
  next();
});

// Compound unique index: each date can have only one menu per mealType
menuSchema.index({ date: 1, mealType: 1 }, { unique: true });

const Menu = mongoose.model('Menu', menuSchema);
module.exports = Menu;
