const mongoose = require('mongoose');
const Auction = require('./models/Auction');
const User = require('./models/User');

const MONGO_URI = 'mongodb://localhost:27017/bolibazar';

const seedAuctions = [
    {
        title: "Premium Basmati Rice Lot (50 Bags)",
        description: "Export quality long-grain basmati rice. Sourced direct from Karnal mills. Moisture tested and aged 2 years.",
        category: "Grocery",
        initialPrice: 45000,
        currentBid: 48500,
        startedAtPrice: 45000,
        lotSize: 50,
        moq: 1,
        tokenAmount: 999,
        imageUrl: "/lot1.png",
        startTime: new Date(),
        endTime: new Date(Date.now() + 1000 * 60 * 60 * 24),
        status: 'Live',
        totalBuyers: 12
    },
    {
        title: "Cold Pressed Mustard Oil Pallet",
        description: "Pure Kacchi Ghani mustard oil. 1 Litre bottles x 240 units. High pungent value, laboratory certified.",
        category: "Grocery",
        initialPrice: 28000,
        currentBid: 31000,
        startedAtPrice: 28000,
        lotSize: 240,
        moq: 1,
        tokenAmount: 500,
        imageUrl: "/lot2.png",
        startTime: new Date(),
        endTime: new Date(Date.now() + 1000 * 60 * 60 * 12),
        status: 'Live',
        totalBuyers: 8
    },
    {
        title: "Assorted Soft Drinks Combo Lot",
        description: "Mixed pallet of popular 250ml PET bottles. Perfect for small retailers and Kirana stores.",
        category: "Beverages",
        initialPrice: 12500,
        currentBid: 14200,
        startedAtPrice: 12500,
        lotSize: 500,
        moq: 1,
        tokenAmount: 200,
        imageUrl: "/hero.png",
        startTime: new Date(),
        endTime: new Date(Date.now() + 1000 * 60 * 60 * 4),
        status: 'Live',
        totalBuyers: 15
    }
];

mongoose.connect(MONGO_URI)
    .then(async () => {
        console.log('Clearing existing data...');
        await Auction.deleteMany({});
        await User.deleteMany({ email: { $in: ['admin@bolibazar.com', 'retailer@bolibazar.com'] } });

        console.log('Seeding products...');
        await Auction.insertMany(seedAuctions);

        console.log('Seeding Admin User...');
        const admin = new User({
            username: 'Admin',
            email: 'admin@bolibazar.com',
            phone: '9999999999',
            password: 'admin123',
            shopName: 'BoliBazar Head Office',
            address: 'Industrial Area, Phase 2',
            city: 'Lucknow',
            state: 'Uttar Pradesh',
            pincode: '226001',
            role: 'admin',
            isRegistered: true
        });
        await admin.save();
        
        console.log('Seeding Demo Retailer...');
        const retailer = new User({
            username: 'Retailer',
            email: 'retailer@bolibazar.com',
            phone: '9876543210',
            password: 'retailer123',
            shopName: 'Suraj Kirana Store',
            address: 'Shop No. 42, Main Market',
            city: 'Lucknow',
            state: 'Uttar Pradesh',
            pincode: '226001',
            role: 'retailer',
            isRegistered: true
        });
        await retailer.save();

        console.log('Database Seeded Successfully!');
        console.log('Admin Email: admin@bolibazar.com');
        console.log('Admin Password: admin123');
        console.log('Retailer Email: retailer@bolibazar.com');
        console.log('Retailer Password: retailer123');
        process.exit();
    })
    .catch(err => {
        console.error('Seed Error:', err);
        process.exit(1);
    });
