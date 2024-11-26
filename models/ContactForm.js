const mongoose = require('mongoose');

const contactFormSchema = new mongoose.Schema({
  name: { type: String, required: true },
  mobile: { type: String, required: true },
  email: { type: String, required: true },
  course: { type: String, required: true },
  city: { type: String, required: true },
  message: { type: String, required: true },  // Added message field
  timestamp: { type: Date, default: Date.now }
});

const Form = mongoose.model('Form', contactFormSchema);

module.exports = Form;
