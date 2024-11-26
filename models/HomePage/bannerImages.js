const mongoose = require('mongoose');

const bannerImageSchema = new mongoose.Schema({
    url: {
        type: String,
        required: true, // URL to the banner image
    },
}, { timestamps: true });

const BannerImage = mongoose.model('BannerImage', bannerImageSchema);
module.exports = BannerImage;
