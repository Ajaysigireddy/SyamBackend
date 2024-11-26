const mongoose = require('mongoose');

// Define the Course Schema
const courseSchema = new mongoose.Schema({
  courseName: {
    type: String,
    required: true,
    trim: true
  },
  medium: {
    type: String,
    required: true,
    enum: ['ENGLISH/TELUGU', 'ENGLISH', 'TELUGU'],
    trim: true
  },
  mode: {
    type: String,
    required: true,
    enum: ['online', 'offline','online/offline'],
    trim: true
  },
  bannerImg: {
    type: String, // Assuming the image URL or file path will be stored as a string
    required: true
  },
  category: {
    type: String,
    required: true,
    enum: ['GOVERNMENT JOBS', 'STATE PSC EXAMS'], // Added the two new categories
    trim: true
  }
}, { timestamps: true });  // Optionally include timestamps for createdAt and updatedAt

// Create a model for the Course schema
const Course = mongoose.model('Course', courseSchema);

module.exports = Course;
