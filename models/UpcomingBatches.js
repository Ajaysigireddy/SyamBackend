const mongoose = require('mongoose');

const upcomingBatchSchema = new mongoose.Schema({
  Branch: {
    type: String,
    required: true,
  },
  Course: {
    type: String,
    required: true,
  },
  StartDate: {
    type: Date,
    required: true,
  },
  ContactNumber: {
    type: String,
    required: true,
    match: /^[0-9]{10}$/, // Validates that the contact number is a 10-digit number
  },
}, { timestamps: true });

const UpcomingBatch = mongoose.model('UpcomingBatch', upcomingBatchSchema);

module.exports = UpcomingBatch;
