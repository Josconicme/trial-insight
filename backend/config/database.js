// backend/config/database.js
const mongoose = require('mongoose');

async function connectDatabase() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('MONGODB_URI is not defined in .env file.');
    return false;
  }
  try {
    await mongoose.connect(uri);
    console.log('Successfully connected to MongoDB.');
    // We no longer try to create the index here.
    // It must be created in the Atlas UI.
    return true;
  } catch (error) {
    console.error('MongoDB connection error:', error.message);
    return false;
  }
}

module.exports = { connectDatabase };