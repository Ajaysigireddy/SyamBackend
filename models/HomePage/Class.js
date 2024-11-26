const mongoose = require('mongoose');

const classSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
    },
    videolink: {
        type: String,
        required: true,
    },
    photo: {
        type: String, // URL to the class photo from S3
        required: false,
    },
}, { timestamps: true });

const Class = mongoose.model('Class', classSchema);
module.exports = Class;
