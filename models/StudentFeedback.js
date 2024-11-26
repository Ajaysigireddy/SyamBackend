const mongoose = require('mongoose');

const studentFeedbackSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  whatTheySay: {
    type: String,
    required: true
  },
  studentImageUrl: {
    type: String,
    required: true  // Store the URL of the image (uploaded to S3)
  },
  achievement: {
    type: String, // You can adjust the type as needed (String, Array, etc.)
    required: false // Set to true if the field is mandatory
  }
}, { timestamps: true });

const StudentFeedback = mongoose.model('StudentFeedback', studentFeedbackSchema);
module.exports = StudentFeedback;