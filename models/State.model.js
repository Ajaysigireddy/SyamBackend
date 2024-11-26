const mongoose = require('mongoose');

const centreSchema = new mongoose.Schema({
  stateName: { type: String, required: true },
  districts: [{
    districtName: { type: String, required: true },
    cities: [{
      cityName: { type: String, required: true },
      centres: [{
        name: { type: String, required: true },
       
      }]
    }]
  }]
});



const State = mongoose.model('State', centreSchema);

module.exports = State;
