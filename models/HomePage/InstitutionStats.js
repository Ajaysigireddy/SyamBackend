const mongoose = require('mongoose');

const statSchema = new mongoose.Schema({
    id: {
        type: String,  // Unique identifier for each stat
        required: true,
    },
    value: {
        type: Number,  // The numerical value of the stat
        required: true,
    },
    logo: {
        type: String,  // S3 URL for the logo related to this stat
        required: false,  // Optional logo field
    }
}
,{ timestamps: true });

const InstitutionStats = mongoose.model('InstitutionStats',statSchema);
module.exports = InstitutionStats;
