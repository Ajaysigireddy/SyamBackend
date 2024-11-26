const mongoose = require('mongoose');

const popupSchema = new mongoose.Schema({
  image: {
    type: String,
    required: true,
  },
  link: {
    type: String,
    required: false,
  }
}, { timestamps: true });

module.exports = mongoose.model('Popup', popupSchema);
