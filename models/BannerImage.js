const mongoose = require('mongoose');

const bannerImageSchema = new mongoose.Schema({
  pageName: {
    type: String,
    required: true, // e.g., 'examResult', 'contact', 'home', etc.
    unique: true
  },
  imageUrl: {
    type: String,
    required: true // The S3 URL of the banner image
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('PageBannerImages', bannerImageSchema);
