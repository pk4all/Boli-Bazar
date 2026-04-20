const mongoose = require('mongoose');
const User = require('../models/User'); // Fixed path
require('dotenv').config();

async function check() {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/bolibazar');
    const count = await User.countDocuments({ role: 'retailer' });
    const retailers = await User.find({ role: 'retailer' }).sort({ walletBalance: -1 }).limit(5);
    console.log('Retailer Count:', count);
    retailers.forEach(r => console.log(`- ${r.username}: ${r.walletBalance}`));
    process.exit(0);
}
check();
