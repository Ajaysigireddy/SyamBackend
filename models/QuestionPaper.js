const mongoose = require('mongoose');

const QuestionPaperSchema = new mongoose.Schema({
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

const QuestionPaper = mongoose.model('QuestionPaper', QuestionPaperSchema);

module.exports = QuestionPaper;
