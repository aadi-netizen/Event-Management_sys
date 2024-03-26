const mongoose = require('mongoose');
const dotenv = require('dotenv').config();


const mySchema = new mongoose.Schema({
    evt_name: {
        type: String
    },
    city: {
        type: String
    },
    date: {
        type: Date
    },
    time: {
        type: String
    },
    location: {
        longitude: Number,
        latitude: Number
    }
})


const evt = mongoose.model('evt', mySchema);
module.exports = evt;