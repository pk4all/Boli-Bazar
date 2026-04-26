
const mongoose = require('mongoose');
const User = require('../models/User');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/bolibazar';

async function checkAdmin() {
    await mongoose.connect(MONGO_URI);
    const user = await User.findOne({ email: 'admin@bolibazar.com' });
    console.log('Admin User:', user);
    await mongoose.disconnect();
}

checkAdmin();
