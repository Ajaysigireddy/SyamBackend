const mongoose = require('mongoose');

// Define the Portfolio Schema
const portfolioSchema = new mongoose.Schema({
  imageUrl: {
    type: String, // URL for the image
    required: true,
    trim: true
  },
  category: {
    type: String,
    required: true,
    enum: ['LAB', 'TRAINING', 'FACULTY', 'ACHIEVEMENTS', 'STUDENTS'], // Enum for category options
    trim: true
  }
}, { timestamps: true });  // Include timestamps for createdAt and updatedAt

// Create a model for the Portfolio schema
const Portfolio = mongoose.model('Portfolio', portfolioSchema);

module.exports = Portfolio;
