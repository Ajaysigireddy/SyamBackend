const mongoose = require('mongoose');

const missionAndVisionSchema = new mongoose.Schema({
  mission: {
    type: String,
    required: true
  },
  missionImage: {
    type: String,  // URL of the mission image
    required: false
  },
  vision: {
    type: String,
    required: true
  },
  visionImage: {
    type: String,  // URL of the vision image
    required: false
  }
}, { timestamps: true });

const MissionAndVision = mongoose.model('MissionAndVision', missionAndVisionSchema);
module.exports = MissionAndVision;
