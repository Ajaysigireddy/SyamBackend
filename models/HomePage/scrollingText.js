const mongoose = require('mongoose');

const scrollingTextSchema = new mongoose.Schema({
    text: {
        type: String,
        required: true, // Scrolling text for the homepage
    },
    link: {
        type: String,
        required: false, // Optional field for link associated with scrolling text
    },
}, { timestamps: true });

const ScrollingText = mongoose.model('ScrollingText', scrollingTextSchema);
module.exports = ScrollingText;
