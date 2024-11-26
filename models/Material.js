const mongoose = require('mongoose');

const materialSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  banner: {
    type: String, // S3 URL
    required: true
  },
  price: {
    type: Number,
    required: true
  },
  stock: {
    type: Boolean,
    default: true
  },
  subtopic: {
    type: String,  // Optional field
    required: false
  }
}, { timestamps: true });

const Material = mongoose.model('Material', materialSchema);

module.exports = Material;
