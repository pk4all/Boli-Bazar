require('dotenv').config();
const mongoose = require('mongoose');
const ManufacturerRequest = require('../models/ManufacturerRequest');

async function check() {
    try {
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/bolibazar');
        const count = await ManufacturerRequest.countDocuments();
        const data = await ManufacturerRequest.find();
        console.log('Total Requests:', count);
        console.log('Data:', JSON.stringify(data, null, 2));
        process.exit();
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}
check();
