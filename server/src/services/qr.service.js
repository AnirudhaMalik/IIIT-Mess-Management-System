const crypto = require('crypto');
const QRCode = require('qrcode');
const QRToken = require('../models/QRToken');
const User = require('../models/User');

/**
 * Generate a cryptographically secure UUID token
 */
const generateToken = () => {
  return crypto.randomUUID();
};

/**
 * Generate QR code data URL (Base64 PNG) for a given token string
 */
const generateQRDataUrl = async (token) => {
  try {
    return await QRCode.toDataURL(token, {
      errorCorrectionLevel: 'H',
      margin: 2,
      width: 300
    });
  } catch (error) {
    console.error('[QR Generation Error]:', error.message);
    return null;
  }
};

/**
 * Get active QR token for student or create a new 24-hour token
 */
const getOrCreateQRToken = async (studentId) => {
  const now = new Date();

  // Find existing active and unexpired token
  let tokenDoc = await QRToken.findOne({
    student: studentId,
    isActive: true,
    expiresAt: { $gt: now }
  });

  if (!tokenDoc) {
    // Generate new token valid for 24 hours
    const token = generateToken();
    const expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    tokenDoc = await QRToken.findOneAndUpdate(
      { student: studentId },
      {
        token,
        expiresAt,
        isActive: true
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
  }

  const qrCodeImage = await generateQRDataUrl(tokenDoc.token);

  return {
    token: tokenDoc.token,
    expiresAt: tokenDoc.expiresAt,
    isActive: tokenDoc.isActive,
    qrCodeImage
  };
};

/**
 * Regenerate QR token for a student, invalidating the previous one
 */
const regenerateToken = async (studentId) => {
  const token = generateToken();
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

  const tokenDoc = await QRToken.findOneAndUpdate(
    { student: studentId },
    {
      token,
      expiresAt,
      isActive: true
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  const qrCodeImage = await generateQRDataUrl(tokenDoc.token);

  return {
    token: tokenDoc.token,
    expiresAt: tokenDoc.expiresAt,
    isActive: tokenDoc.isActive,
    qrCodeImage
  };
};

/**
 * Verify token: Find in DB, verify isActive and unexpired, return populated student
 */
const verifyToken = async (tokenString) => {
  if (!tokenString) {
    return { valid: false, reason: 'No token provided' };
  }

  const tokenDoc = await QRToken.findOne({
    token: tokenString,
    isActive: true
  }).populate('student', '-password');

  if (!tokenDoc) {
    return { valid: false, reason: 'Invalid QR token' };
  }

  if (new Date() > tokenDoc.expiresAt) {
    return { valid: false, reason: 'QR token has expired', tokenDoc };
  }

  if (!tokenDoc.student || !tokenDoc.student.isActive) {
    return { valid: false, reason: 'Student account is inactive or not found' };
  }

  return {
    valid: true,
    tokenDoc,
    student: tokenDoc.student
  };
};

module.exports = {
  generateToken,
  generateQRDataUrl,
  getOrCreateQRToken,
  regenerateToken,
  verifyToken
};
