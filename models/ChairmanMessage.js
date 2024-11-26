const mongoose = require('mongoose');

const chairmanMessageSchema = new mongoose.Schema({
  chairmanMessageBanner: {
    type: String, // URL for the banner image
    required: true
  },
  aboutChairman: {
    type: String, // Text about the chairman
    required: true
  },
  chairmanPhoto: {
    type: String, // URL for chairman's photo
    required: true
  },
  chairmanPhotoRedirect: {
    type: String, // Optional redirect URL for the chairman's photo
  },
  chairmanMessage: {
    type: String, // Text of the chairman's message
    required: true
  },
  chairmanMessagePhoto: {
    type: String, // URL for the photo in the chairman's message
    required: true
  },
  chairmanMessageRedirect: {
    type: String, // Optional redirect URL for the chairman's message
  }
}, { timestamps: true });

module.exports = mongoose.model('ChairmanMessage', chairmanMessageSchema);
