const mongoose = require('mongoose');

const serviceSchema = new mongoose.Schema({
  logo: {
    type: String,
    required: true,  // URL to S3 image
  },
  title: {
    type: String,
    required: true,  // Title of the service
  },
}, {
  timestamps: true, // Automatically add createdAt and updatedAt timestamps
});

const Service = mongoose.model('Service', serviceSchema);

module.exports = Service;
