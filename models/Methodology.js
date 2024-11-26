const mongoose = require('mongoose');

// Define the schema for the Methodology model
const methodologySchema = new mongoose.Schema({
  bannerImage: {
    type: String,
    required: true,
    // Assuming this will be an S3 URL for the banner image
  },
  highlightContent: {
    type: String,
    required: true,
  },
  interactiveClassesContent: {
    type: String,
    required: true,
  },
  interactiveClassesBanner: {
    type: String,
    required: true,
    // This will be the S3 URL for the banner image
  },
  studyMaterialContent: {
    type: String,
    required: true,
  },
  studyMaterialBanner: {
    type: String,
    required: true,
    // This will be the S3 URL for the study material banner image
  },
  assessmentsContent: {
    type: String,
    required: true,
  },
  assessmentsBanner: {
    type: String,
    required: true,
    // This will be the S3 URL for the assessments banner image
  },
}, { timestamps: true });

// Create a Model from the schema
const Methodology = mongoose.model('Methodology', methodologySchema);

module.exports = Methodology;
