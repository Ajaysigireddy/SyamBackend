const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
    notificationName: {
        type: String,
        required: true,
    },
    notificationDate: {
        type: String, // You can change to Date if needed
        required: true,
    },
    notificationLink: {
        type: String, // Optional field for notification link
        required: false,
    },
}, { timestamps: true });

const Notification = mongoose.model('Notification', notificationSchema);
module.exports = Notification;
