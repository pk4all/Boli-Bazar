const mongoose = require('mongoose');
const Auction = require('../models/Auction');
require('dotenv').config();

async function check() {
    try {
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/bolibazar');
        const auctions = await Auction.find({});
        console.log('Total Auctions:', auctions.length);
        auctions.forEach(a => {
            if (typeof a.initialPrice !== 'number' || isNaN(a.initialPrice)) {
                console.log(`[BAD-DATA] Auction ${a._id} (${a.title}) has invalid initialPrice:`, a.initialPrice);
            }
            if (a.currentBid !== undefined && (typeof a.currentBid !== 'number' || isNaN(a.currentBid))) {
                console.log(`[BAD-DATA] Auction ${a._id} (${a.title}) has invalid currentBid:`, a.currentBid);
            }
        });
        console.log('Check complete.');
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}
check();
