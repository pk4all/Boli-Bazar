const mongoose = require('mongoose');
require('dotenv').config();
const Auction = require('../models/Auction');

async function testHike() {
    const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/bolibazar';
    try {
        await mongoose.connect(MONGO_URI);
        console.log('Connected to DB');

        // 1. Create a test auction
        const auction = await Auction.create({
            title: 'Hike Test Product',
            initialPrice: 1000,
            lotSize: 100,
            stockRemaining: 100,
            hikePercentage: 10,
            startTime: new Date(),
            endTime: new Date(Date.now() + 86400000),
            status: 'Live'
        });
        console.log('Test Auction Created:', { id: auction._id, initialPrice: auction.initialPrice, hike: auction.hikePercentage });

        // 2. Simulate 3 price hikes
        for (let i = 1; i <= 3; i++) {
            const currentPrice = auction.currentBid || auction.initialPrice;
            const hikeAmount = currentPrice * (auction.hikePercentage / 100);
            auction.currentBid = Math.round((currentPrice + hikeAmount) * 100) / 100;
            await auction.save();
            console.log(`Hike ${i}: New Price = ₹${auction.currentBid}`);
        }

        // 3. Cleanup
        await Auction.findByIdAndDelete(auction._id);
        console.log('Cleaned up test auction');

        await mongoose.disconnect();
    } catch (err) {
        console.error('Test Failed:', err);
        process.exit(1);
    }
}

testHike();
