const express = require('express');
const router = express.Router();
const { userSchema, parkingSchema, OTPSchema } = require('../Models/DBSchema')
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const OTP_EXPIRATION_TIME = 5 * 60 * 1000; // 5 minutes


// get all user
// router.get("/", async (req, res) => {
//     try {
//         const alldata = []
//         const users = await userSchema.find()
//         for (const user of users) {
//             const ids = user.parkingDetails

//             const tempParkingDetails = []
//             for (const id of ids) {
//                 const parkingDetails = await parkingSchema.findById(id)
//                 tempParkingDetails.push(parkingDetails)
//             }

//             const tempUser = { ...user, parkingDetails: tempParkingDetails }
//             alldata.push(tempUser)
//         }
//         res.json(alldata)
//     }

//     catch (error) {
//         res.status(500).json({
//             error
//         })

//     }
// });

// create user
router.post("/create", async (req, res) => {
    try {
        let data = req.body
        console.log("data:")
        console.log(data)
        let user = await userSchema.findOne({ $or: [{ email: data.email }, { username: data.username }] });

        if (!user) {
            let parkingData;
            if (data.isParkingOwner) {
                const tempParking = {
                    name: data.parkingname,
                    localityName: data.areaname,
                    address: data.fulladdress,
                    phone: data.phone,
                }
                console.log("tempParking:")
                console.log(tempParking)

                parkingData = await parkingSchema.create(tempParking)
                console.log("\nparkingData:")
                console.log(parkingData)
            }

            const tempUser = {
                username: data.username,
                email: data.email,
                password: await bcrypt.hash(data.password, 10),
                userFname: data.firstname,
                userLname: data.lastname,
                phone: data.phone,
                role: data.isParkingOwner ? 'ParkingOwner' : 'User',
                parkingDetails: data.isParkingOwner ? [parkingData._id] : []
            }
            console.log("tempUser:")
            console.log(tempUser)

            let newUser = await userSchema.create(tempUser)
            console.log("newUser:")
            console.log(newUser)

            return res.status(200).json({
                data: newUser,
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

// Login API endpoint
router.post('/login', async (req, res) => {
    const { username, password } = req.body;

    try {
        // Find the user by email        
        let user = await userSchema.findOne({ username });

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Compare passwords
        const isPasswordValid = await bcrypt.compare(password, user.password);

        if (!isPasswordValid) {
            return res.status(401).json({ message: 'Invalid password' });
        }

        // Create and return a JWT token
        const token = jwt.sign({ username: user.username }, 'secret-key');

        res.json({ token, user });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

const generateOTP = () => {
    return Math.floor(100000 + Math.random() * 900000).toString(); // Generate a 6-digit OTP
};

const sendOTPEmail = async (email, otp) => {
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
        text: `Your OTP code is ${otp}. It expires in 5 minutes.`,
    };

    await transporter.sendMail(mailOptions);
};

const storeOTP = async (email, otp) => {
    const data = OTPSchema.findOne({ email })
    const expiry = Date.now() + OTP_EXPIRATION_TIME;

    const salt = await bcrypt.genSalt(10);
    const hashedOTP = await bcrypt.hash(otp, salt);

    console.log("storeOTP")
    console.log(data)
    console.log(otp)

    // Store hashed OTP in the database with expiry time
    if (!data) {
        await OTPSchema.updateOne({ email, otp: hashedOTP, expiresAt: expiry })
    }
    else {
        await OTPSchema.create({ email, otp: hashedOTP, expiresAt: expiry });
    }
};

// Example endpoint to generate and send OTP
router.post('/send-otp', async (req, res) => {
    const { username } = req.body;
    const user = await userSchema.findOne({ username });

    if (!user) {
        return res.status(404).send('User not found');
    }

    const otp = generateOTP();
    await sendOTPEmail(user.email, otp);
    await storeOTP(user.email, otp);

    res.status(200).send('OTP sent successfully');
});

router.post('/verify-otp', async (req, res) => {
    try {
        const { username, otp } = req.body;

        console.log(otp)
        console.log(typeof (otp))

        console.log(username)
        const user = await userSchema.findOne({ username })
        if (!user) {
            return res.status(404).send('User not found');
        }

        const otpRecord = await OTPSchema.findOne({ email: user.email });
        if (!otpRecord) {
            return res.status(400).send('Invalid OTP N');
        }

        if (otpRecord.expiresAt < Date.now()) {
            await OTPSchema.deleteMany({ email: user.email })
            return res.status(400).send('OTP has expired');
        }

        const isMatch = await bcrypt.compare(otp, otpRecord.otp);

        if (!isMatch) {
            return res.status(400).send('Invalid OTP');
        }

        // OTP is valid, proceed with the user's request
        await OTPSchema.deleteMany({ email: user.email })
        res.status(200).send('OTP verified successfully');
    }
    catch (error) {
        console.log(error)
        return res.status(400).send('Somthing went wrong!');
    }
});

// router.put('/:id', (req, res) => {
//     console.log(">>>>>>>>>>>>>")
//     const id = req.params.id;
//     const updatedData = req.body.data;

//     // Find the document by ID and update it
//     userSchema.findByIdAndUpdate(id, updatedData, { new: true }, (err, updatedModel) => {
//         if (err) {
//             console.error(err);
//             res.status(500).json({ error: 'Failed to update document' });
//         } else {
//             res.status(200).json(updatedModel);
//         }
//     });
// });

// router.get("/:id", async (req, res) => {
//     try {
//         const { id } = req.params
//         const user_data = await userSchema.findOne({ _id: id })
//         console.log(user_data, ">>user_data")
//         const user_id = (user_data._id).toString();
//         const chapterinfo = await chapterSchema.find({ userId: user_id })
//         user_data.chapter = chapterinfo
//         // user_data.save()
//         console.log(chapterinfo, ">>chapterinfo")
//         const addassignment = chapterinfo.forEach(async (chapter) => {
//             ;
//             const id = (chapter._id).toString();
//             const assignmentinfo = await assignmentDataSchema.find({ chapterId: id })
//             console.log(assignmentinfo, ">>assignmentinfo")
//             chapter.assignment = assignmentinfo
//             await chapter.save()
//         })
//         // console.log(user_data,">>id")

//         await user_data.save()
//         console.log("id>>id>>id")
//         res.json(user_data)
//     }
//     catch (error) {
//         res.status(500).json({
//             error
//         })

//     }
// });

module.exports = router;