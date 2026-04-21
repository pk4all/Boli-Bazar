const mongoose = require('mongoose');
require('dotenv').config();
const Auction = require('../models/Auction');
const User = require('../models/User');

async function debugCheckout() {
    const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/bolibazar';
    try {
        await mongoose.connect(MONGO_URI);
        console.log('Connected to DB');

        // 1. Find or create a test user
        let user = await User.findOne({ username: 'testuser' });
        if (!user) {
            user = await User.create({ username: 'testuser', email: 'test@example.com', password: 'password' });
        }

        // 2. Find or create the product from the screenshot (Start 99, Hike 0.5)
        let auction = await Auction.findOne({ title: 'Hike Test 99' });
        if (!auction) {
            auction = await Auction.create({
                title: 'Hike Test 99',
                initialPrice: 99,
                lotSize: 10000,
                stockRemaining: 10000,
                hikePercentage: 0.5,
                startTime: new Date(),
                endTime: new Date(Date.now() + 86400000),
                status: 'Live'
            });
        }
        
        console.log('Initial State:', {
            title: auction.title,
            initialPrice: auction.initialPrice,
            currentBid: auction.currentBid,
            hikePercentage: auction.hikePercentage,
            totalBuyers: auction.totalBuyers
        });

        // 3. Simulate checkout logic
        const buyQty = 1;
        const currentPrice = auction.currentBid || auction.initialPrice;
        console.log(`Processing order at price: ${currentPrice}`);

        auction.stockRemaining = Math.max(0, (auction.stockRemaining || 0) - buyQty);
        auction.totalBuyers = (auction.totalBuyers || 0) + 1;

        if (auction.hikePercentage > 0) {
            const cp = auction.currentBid || auction.initialPrice;
            const hikeAmount = cp * (auction.hikePercentage / 100);
            auction.currentBid = Math.round((cp + hikeAmount) * 100) / 100;
            console.log(`Hike applied! hikeAmount: ${hikeAmount}, new currentBid: ${auction.currentBid}`);
        }

        await auction.save();
        console.log('Auction saved successfully.');

        // Re-fetch to verify
        const updatedAuction = await Auction.findById(auction._id);
        console.log('Final State in DB:', {
            currentBid: updatedAuction.currentBid,
            totalBuyers: updatedAuction.totalBuyers
        });

        await mongoose.disconnect();
    } catch (err) {
        console.error('Debug Failed:', err);
        process.exit(1);
    }
}

debugCheckout();
