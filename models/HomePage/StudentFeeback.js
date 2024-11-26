const mongoose = require('mongoose');

const feedbackSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,  // Name of the student
    },
    achievement: {
        type: String,
        required: false, // Achievement or additional information
    },
    feedbackText: {
        type: String,
        required: true,  // Feedback text from the student
    },
    photo: {
        type: String, // URL to the feedback photo from S3
        required: false,
    },
}, { timestamps: true });

const StudentFeedback = mongoose.model('StudentFeedback', feedbackSchema);
module.exports = StudentFeedback;
