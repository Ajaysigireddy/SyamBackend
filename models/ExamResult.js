const mongoose = require('mongoose');

const examResultSchema = new mongoose.Schema({
  title: { 
    type: String, 
    required: true 
  },
  pdfLink: { 
    type: String, 
    required: true 
  },
  bannerImage: { 
    type: String, // Stores the S3 URL for the banner image
    required: false // Optional field; set to `true` if it's required
  },
  timestamp: { 
    type: Date, 
    default: Date.now 
  }
});

const ExamResult = mongoose.model('ExamResult', examResultSchema);

module.exports = ExamResult;
