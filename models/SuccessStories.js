const mongoose = require('mongoose');

const successStorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  photo: {
    type: String,  // S3 URL
    required: true
  },
  achievement: {
    type: String,
    required: true
  }
}, { timestamps: true });

const SuccessStory = mongoose.model('SuccessStory', successStorySchema);

module.exports = SuccessStory;
