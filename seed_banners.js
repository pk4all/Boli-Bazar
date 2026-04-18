require('dotenv').config();
const mongoose = require('mongoose');
const Banner = require('./models/Banner');

const banners = [
    { imageUrl: '/uploads/banner1.png', title: 'Premium Grocery Lots', order: 1 },
    { imageUrl: '/uploads/banner2.png', title: 'Personal Care Wholesale', order: 2 },
    { imageUrl: '/uploads/banner3.png', title: 'Direct From Factory to Retailer', order: 3 },
    { imageUrl: '/uploads/banner4.png', title: 'Win Big Monthly Rewards', order: 4 }
];

async function seed() {
    try {
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/bolibazar');
        console.log('Connected to DB');
        
        // Clear existing banners to start fresh for demo
        await Banner.deleteMany({});
        console.log('Cleared existing banners');
        
        await Banner.insertMany(banners);
        console.log('Banners seeded successfully');
        
        process.exit(0);
    } catch (err) {
        console.error('Seeding error:', err);
        process.exit(1);
    }
}

seed();
