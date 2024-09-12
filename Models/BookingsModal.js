const mongoose = require('mongoose')

exports.bookingsSchema = new mongoose.Schema({
    parkingOwnerName: {
        type: String,
        required: true
    },
    customerName: {
        type: String,
        required: true
    },
    vehicalType: {
        type: String,
        required: true
    },
    vehicalNumber: {
        type: Number,
        required: true
    },
    timeSlot: {
        type: Date,
        required: true
    },
    duration: {
        type: Date,
        required: true
    },
    tokan: {
        type: Number,
        required: true
    },
    isVerified: {
        type: Boolean,
        required: true
    },
    isExtended: {
        type: Boolean,
        required: true
    },
    price: {
        type: Number,
        required: true
    },
});

exports.