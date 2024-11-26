const mongoose = require('mongoose');

const preparationActivitySchema = new mongoose.Schema({
  logo: { type: String, required: true }, // S3 URL of the logo
  title: { type: String, required: true }, // Title of the activity
  content: { type: String, required: true }, // Content or description of the activity
}, {
  timestamps: true, // Automatically adds createdAt and updatedAt fields
});

const PreparationActivity = mongoose.model('PreparationActivity', preparationActivitySchema);

module.exports = PreparationActivity;
