const mongoose = require('mongoose')
const parkingSchema = require('./ParkingDetailsModal')

exports.userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        required: true,
    },
    password: {
        type: String,
        required: true
    },
    userFname: {
        type: String,
        required: true
    },
    userMname: {
        type: String,
        required: true
    },
    userLname: {
        type: String,
        required: true
    },
    role: {
        type: String,
        required: true
    },
    phone: {
        type: String,
        required: true
    },

    // parkingDetails: [parkingSchema]
    parkingDetails: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'parkingdetails', // The model name for ParkingDetails
        }
    ]
});