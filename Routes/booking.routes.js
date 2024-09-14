const express = require('express');
const router = express.Router();
const { userSchema, parkingSchema, bookingsSchema } = require('../Models/DBSchema')
const bcrypt = require('bcrypt');
const { ObjectId } = require('mongodb');
const nodemailer = require('nodemailer');
const jwt = require('jsonwebtoken');

const generateOTP = () => {
    return Math.floor(100000 + Math.random() * 900000).toString(); // Generate a 6-digit OTP
};

const sendTockenEmail = async (email, token) => {
    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS,
        },
    });

    const mailOptions = {
        from: process.env.EMAIL_USER,
        // to: email,
        to: "patilsarthak999@gmail.com",
        subject: 'Your OTP Code',
        text: `Your Token code is ${token}.`,
    };

    await transporter.sendMail(mailOptions);
};

const convertUTCtoIST = (istDateStr) => {
    // Create a Date object using the IST date string
    const istDate = new Date(istDateStr);

    // Get the UTC time from the IST date
    const utcDate = new Date(istDate.getTime() + (5.5 * 60 * 60 * 1000));

    return utcDate;
}

const convertTimeSD = (timeString) => {
    const [hours, minutes] = timeString.split(':').map(Number); // Split and convert to numbers

    const currentDate = new Date(); // Create a Date object with the current date
    currentDate.setHours(hours, minutes, 0, 0);
    console.log(currentDate)

    return currentDate;
}

const convertTimeDS = (dataListWithDate) => {
    let resultList = []
    for (let data of dataListWithDate) {
        let newData = {
            id: data._id.toString(),
            parkingOwnerName: data.parkingOwnerName,
            customerName: data.customerName,
            vehicalType: data.vehicalType,
            vehicalNumber: data.vehicalNumber,
            startTime: convertUTCtoIST(data.startTime),
            endTime: convertUTCtoIST(data.endTime),
            isVerified: data.isVerified,
            isExtended: data.isExtended,
        }

        resultList.push(newData)
    }
    return resultList
}

const calculatePrice = (startTime, endTime) => {
    let durationMs = endTime - startTime;

    // Convert milliseconds to hours, minutes, and seconds
    let seconds = Math.floor(durationMs / 1000);
    let minutes = Math.floor(seconds / 60);
    let hours = Math.floor(minutes / 60);
    hours = hours ? hours : 1;

    return hours * 10;
}

router.get("/", async (req, res) => {
    try {
        let bookings = await bookingsSchema.find({ isDelete: false })
        bookings = convertTimeDS(bookings)
        console.log(bookings)
        res.status(200).json(bookings)
    }
    catch (error) {
        console.log(error)
        res.status(500).json({
            error
        })
    }
});

router.get("/:search", async (req, res) => {
    try {
        let bookings = []

        if (req.params.search) {
            console.log(req.params.search)
            const filter = new RegExp(req.params.search, "i"); // "i" makes the search case-insensitive
            bookings = await bookingsSchema.find({ customerName: { $regex: filter }, isDelete: false })
        }
        else {
            bookings = await bookingsSchema.find()
        }
        bookings = convertTimeDS(bookings)
        console.log(bookings)
        res.status(200).json(bookings)
    }
    catch (error) {
        console.log(error)
        res.status(500).json({
            error
        })
    }
})

router.post("/create", async (req, res) => {
    try {
        let data = req.body
        console.log("data:")
        console.log(data)
        console.log(data.parkingOwnerID)

        let user = await parkingSchema.findOne({ _id: data.parkingOwnerID });
        console.log(user)

        if (user) {
            const token = generateOTP()
            console.log(token)
            const salt = await bcrypt.genSalt(10);
            const hashedToken = await bcrypt.hash(token, salt);

            console.log(data.startTime, typeof (data.startTime))
            console.log(data.endTime, typeof (data.endTime))
            const startTime = convertTimeSD(data.startTime)
            const endTime = convertTimeSD(data.endTime)
            const price = calculatePrice(startTime, endTime)

            const tempBooking = {
                parkingOwnerName: user.name,
                customerName: data.user.username,
                vehicalType: data.isBickClicked ? 'Bike' : 'Car',
                vehicalNumber: data.vehicleNumber,
                startTime: startTime,
                endTime: endTime,
                tokan: hashedToken,
                isVerified: false,
                isExtended: false,
                isDelete: false,
                price: price,
            }

            console.log(tempBooking)
            const responseBooking = await bookingsSchema.create(tempBooking)

            let parking = await parkingSchema.findOne({ name: tempBooking.parkingOwnerName })
            console.log(parking)
            console.log("parking.bikeSlots", parking.bikeSlots)

            if (data.isBickClicked) {
                parking.bikeSlots -= 1
            }
            else {
                parking.carSlots -= 1
            }
            console.log(parking)

            const responseParking = await parkingSchema.findOneAndUpdate(
                { name: tempBooking.parkingOwnerName },   // Query condition to find multiple documents
                { $set: { bikeSlots: parking.bikeSlots, carSlots: parking.carSlots } },    // Update specific field
            );

            console.log(responseBooking)
            console.log(responseParking)

            sendTockenEmail(user.email, token)

            return res.status(200).json({
                data: tempBooking,
                messaage: "inserted successful"
            })
        }
        return res.status(200).json({
            messaage: "Username is alredy existed"
        })
    }
    catch (error) {
        console.log(error)
        res.status(500).json({
            error
        })
    }
});

router.post("/verify-token", async (req, res) => {
    try {
        const { token, id } = req.body;

        const response = await bookingsSchema.findOne({ _id: id, isDelete: false })
        console.log(id, token, response.tokan)
        const isMatch = await bcrypt.compare(token, response.tokan);
        console.log(isMatch)
        if (isMatch) {
            const result = await bookingsSchema.findOneAndUpdate(
                { _id: id, isVerified: false, isDelete: false },   // Query condition to find multiple documents
                { $set: { isVerified: true } }    // Update specific field
            );
            res.status(200).json({ message: 'Token verified successfully' });
        }
        else {
            res.status(401).json({ message: 'Token not verified successfully' });
        }

    }
    catch (error) {
        console.log(error)
        return res.status(400).json({ message: 'Internal server error' });
    }
})

router.post("/extend-time", async (req, res) => {
    try {
        const { date, time, id } = req.body;

        const response = await bookingsSchema.findOne({ _id: id, isDelete: false })
        console.log(date, time, response.tokan)

        // Combine date and time into a single string
        const combinedStr = `${date}T${time}:00`;  // Adding ':00' for seconds

        // Convert the combined string to a Date object
        const dateTime = new Date(combinedStr);
        console.log(dateTime)

        const result = await bookingsSchema.findOneAndUpdate(
            { _id: id, isVerified: true, isDelete: false },   // Query condition to find multiple documents
            { $set: { isExtended: true, endTime: dateTime } },    // Update specific field
        );

        console.log(result)
        res.status(200).json({ message: 'Token verified successfully' });
    }
    catch (error) {
        console.log(error)
        return res.status(400).json({ message: 'Internal server error' });
    }
})

router.delete("/:id", async (req, res) => {
    try {
        if (req.params.id) {
            console.log(req.params.id)
            const result = await bookingsSchema.findOneAndUpdate(
                { _id: req.params.id },   // Query condition to find multiple documents
                { $set: { isDelete: true } },    // Update specific field
            );
            console.log(result)
            res.status(200).json({ message: "Delete Booking successfully." })
        }
    }
    catch (error) {
        console.log(error)
        res.status(500).json({ error })
    }
})

module.exports = router;