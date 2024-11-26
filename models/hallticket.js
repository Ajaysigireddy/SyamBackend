const mongoose = require('mongoose');

const hallTicketSchema = new mongoose.Schema({
    name: String,
    fatherName: String,
    dob: String,
    sscHallTicketNo: String,
    mobile: String,
    email: String,
    motherName: String,
    community: String,
    aadharNo: String,
    parentNo: String,
    gender: String,
    district: String,
    hallTicketNumber: { type: String, unique: true },
    subscriptionStartDate: { type: Date, default: Date.now }, // Subscription start date
    expiryDate: Date
    //added
});

const HallTicket = mongoose.model('HallTicket', hallTicketSchema);

module.exports = HallTicket;
