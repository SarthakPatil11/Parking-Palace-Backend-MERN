require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const session = require('express-session');
const cors = require('cors')
const { userSchema, parkingSchema } = require('./Models/DBSchema')

const app = express();
app.use(cors())
const PORT = process.env.PORT || '5000';

// database connection 
try {
    mongoose.set("strictQuery", false);
    mongoose.connect(process.env.DB_URI, { useNewUrlParser: true, useUnifiedTopology: true });
    const db = mongoose.connection;
    db.on("error", (error) => console.log('error'));
    db.once("open", () => console.log("connected to database!"));
} catch (err) {
    console.log(err);
}

app.set("view engine", "ejs");

app.use(express.json())

app.use("/api/user", require('./Routes/user.routes'))

app.get("/", async (req, res) => {
    const users = await userSchema.find()
    console.log(users)
    res.json(users)
})

app.get("/api/p/all", async (req, res) => {
    let parking = await parkingSchema.find()
    console.log(parking)
    res.json(parking)
})

app.get("/api/p/:search", async (req, res) => {
    let parking = []

    if (req.params.search) {
        console.log(req.params.search)
        const filter = new RegExp(req.params.search, "i"); // "i" makes the search case-insensitive
        parking = await parkingSchema.find({ address: { $regex: filter } })
    }
    else {
        parking = await parkingSchema.find()
    }
    console.log(parking)
    res.json(parking)
})

app.listen(PORT, () => {
    console.log(`Server is listening at http://localhost:${PORT}`);
});