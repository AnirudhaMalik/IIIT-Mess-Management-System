const mongoose = require('mongoose');

const qrTokenSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Student ID is required'],
      unique: true
    },
    token: {
      type: String,
      required: [true, 'Token string is required'],
      unique: true,
      index: true
    },
    expiresAt: {
      type: Date,
      required: [true, 'Expiration date is required']
    },
    isActive: {
      type: Boolean,
      default: true
    }
  },
  {
    timestamps: true
  }
);

// TTL index to automatically purge or index by expiry
qrTokenSchema.index({ expiresAt: 1 });

const QRToken = mongoose.model('QRToken', qrTokenSchema);
module.exports = QRToken;
