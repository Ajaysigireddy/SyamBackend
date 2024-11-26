const mongoose = require('mongoose');

const examCalendarSchema = new mongoose.Schema({
  title: { 
    type: String, 
    required: true 
  },
  pdfLink: { 
    type: String, 
    required: true 
  },
  timestamp: { 
    type: Date, 
    default: Date.now 
  }
});

const ExamCalendar = mongoose.model('ExamCalendar', examCalendarSchema);

module.exports = ExamCalendar;
