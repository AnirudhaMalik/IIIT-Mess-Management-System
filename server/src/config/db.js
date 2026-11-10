const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/mess-management';
    const conn = await mongoose.connect(mongoURI, {
      autoIndex: true
    });

    console.log(`[MongoDB Connected]: ${conn.connection.host}/${conn.connection.name}`);
    return conn;
  } catch (error) {
    console.error(`[MongoDB Connection Error]: ${error.message}`);
    process.exit(1);
  }
};

mongoose.connection.on('disconnected', () => {
  console.warn('[MongoDB Disconnected]: Lost connection to database');
});

mongoose.connection.on('reconnected', () => {
  console.log('[MongoDB Reconnected]: Database connection restored');
});

module.exports = connectDB;
