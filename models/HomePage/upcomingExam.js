const mongoose = require('mongoose');

const upcomingExamSchema = new mongoose.Schema({
    examName: {
        type: String,
        required: true,
    },
    examDate: {
        type: String, // You can change to Date if needed
        required: true,
    },
    examLink: {
        type: String, // Optional field for exam link
        required: false,
    },
}, { timestamps: true });

const UpcomingExam = mongoose.model('UpcomingExam', upcomingExamSchema);
module.exports = UpcomingExam;
