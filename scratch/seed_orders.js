require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');
const Auction = require('../models/Auction');
const Order = require('../models/Order');

async function seedOrders() {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/bolibazar');
    
    // Find a live auction
    const auction = await Auction.findOne({ status: 'Live' });
    if (!auction) {
        console.log('No live auction found to seed orders.');
        process.exit();
    }

    // Find some retailers
    const retailers = await User.find({ role: 'retailer' }).limit(3);
    if (!retailers.length) {
        console.log('No retailers found to seed orders.');
        process.exit();
    }

    console.log(`Seeding orders for Auction: ${auction.title} (${auction._id})`);

    const orders = [
        {
            user: retailers[0]._id,
            auction: auction._id,
            username: retailers[0].username,
            city: retailers[0].city,
            quantity: 50,
            totalAmount: 50 * (auction.currentBid || auction.initialPrice)
        },
        {
            user: (retailers[1] || retailers[0])._id,
            auction: auction._id,
            username: (retailers[1] || retailers[0]).username,
            city: (retailers[1] || retailers[1] || retailers[0]).city,
            quantity: 30,
            totalAmount: 30 * (auction.currentBid || auction.initialPrice)
        }
    ];

    await Order.deleteMany({ auction: auction._id });
    await Order.insertMany(orders);

    console.log('Seed orders created successfully.');
    process.exit();
}

seedOrders();
