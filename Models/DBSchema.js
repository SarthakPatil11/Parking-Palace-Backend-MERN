const mongoose = require('mongoose')

const bookingsSchema = new mongoose.Schema({
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
        type: String,
        required: true
    },
    startTime: {
        type: Date,
        required: true
    },
    endTime: {
        type: Date,
        required: true
    },
    tokan: {
        type: String,
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
    isDelete: {
        type: Boolean,
        required: true
    },
    price: {
        type: Number,
        required: true
    },
    // status: {
    //     type: String,
    //     require: false
    // }
});

const userSchema = new mongoose.Schema({
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

const parkingSchema = new mongoose.Schema({
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
    bikeSlots: {
        type: Number,
    },
    carSlots: {
        type: Number,
    },
    phone: {
        type: String,
    },
});

const OTPSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
    },
    otp: {
        type: String,
        required: true,
    },
    expiresAt: {
        type: Date,
        required: true,
    },
})

module.exports = {
    userSchema: mongoose.model("users", userSchema),
    parkingSchema: mongoose.model("parkingdetails", parkingSchema),
    bookingsSchema: mongoose.model("bookings", bookingsSchema),
    OTPSchema: mongoose.model("otps", OTPSchema),
}