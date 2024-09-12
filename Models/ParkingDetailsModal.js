const mongoose = require('mongoose')

exports.parkingSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    localityName: {
        type: String,
        required: true
    },
    address: {
        type: String,
        required: true
    },
    phone: {
        type: String,
    },
});