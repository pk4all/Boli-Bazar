const mongoose = require('mongoose');
const Auction = require('./models/Auction');
const User = require('./models/User');

const MONGO_URI = 'mongodb://localhost:27017/bolibazar';

const seedAuctions = [
    {
        title: "Basmati Rice Premium 25kg",
        description: "Export quality long-grain aged basmati rice.",
        category: "Grains",
        initialPrice: 1200,
        currentBid: 1404.80,
        startedAtPrice: 1200,
        lotSize: 200,
        stockRemaining: 34,
        stockSoldPercent: 83,
        hikePercentage: 17.1,
        moq: 5,
        unitType: "bag",
        tokenAmount: 99,
        imageUrl: "/lot1.png",
        startTime: new Date(),
        endTime: new Date(Date.now() + 1000 * 60 * 5), // Closing very soon
        status: 'Live',
        totalBuyers: 16,
        isFeatured: true,
        closingSoon: true
    },
    {
        title: "Mustard Oil Kachi Ghani 15L",
        description: "Pure cold-pressed mustard oil, high pungency.",
        category: "Oils",
        initialPrice: 2100,
        currentBid: 2273.34,
        startedAtPrice: 2100,
        lotSize: 150,
        stockRemaining: 107,
        stockSoldPercent: 29,
        hikePercentage: 8.3,
        moq: 10,
        unitType: "tin",
        tokenAmount: 99,
        imageUrl: "/lot2.png",
        startTime: new Date(),
        endTime: new Date(Date.now() + 1000 * 60 * 60 * 2),
        status: 'Live',
        totalBuyers: 8,
        isFeatured: false,
        closingSoon: true
    },
    {
        title: "Sugar M-30 Grade 50kg",
        description: "Sparkling white large grain sugar.",
        category: "Sugar",
        initialPrice: 1950,
        currentBid: 2307.17,
        startedAtPrice: 1950,
        lotSize: 300,
        stockRemaining: 193,
        stockSoldPercent: 36,
        hikePercentage: 18.3,
        moq: 20,
        unitType: "bag",
        tokenAmount: 99,
        imageUrl: "/lot1.png",
        startTime: new Date(),
        endTime: new Date(Date.now() + 1000 * 60 * 60 * 4),
        status: 'Live',
        totalBuyers: 17,
        isFeatured: false,
        closingSoon: true
    },
    {
        title: "Toor Dal Premium 25kg",
        description: "Unpolished, protein-rich yellow split peas.",
        category: "Pulses",
        initialPrice: 2800,
        currentBid: 2913.69,
        startedAtPrice: 2800,
        lotSize: 100,
        stockRemaining: 96,
        stockSoldPercent: 4,
        hikePercentage: 4.1,
        moq: 5,
        unitType: "bag",
        tokenAmount: 99,
        imageUrl: "/lot2.png",
        startTime: new Date(),
        endTime: new Date(Date.now() + 1000 * 60 * 60 * 11 + 1000 * 60 * 5),
        status: 'Live',
        totalBuyers: 4,
        isFeatured: false,
        closingSoon: false
    },
    {
        title: "Desi Ghee Pure 15kg",
        description: "Freshly churned traditional desi ghee.",
        category: "Grocery",
        initialPrice: 8500,
        currentBid: 8500,
        startedAtPrice: 8500,
        lotSize: 60,
        stockRemaining: 60,
        stockSoldPercent: 0,
        hikePercentage: 0,
        moq: 2,
        unitType: "tin",
        tokenAmount: 500,
        imageUrl: "/lot1.png",
        startTime: new Date(Date.now() + 1000 * 60 * 60 * 12), // 12h away
        endTime: new Date(Date.now() + 1000 * 60 * 60 * 36),
        status: 'Upcoming',
        totalBuyers: 0
    },
    {
        title: "Besan Gram Flour 25kg",
        description: "Finely ground pure gram flour.",
        category: "Grocery",
        initialPrice: 1650,
        currentBid: 1650,
        startedAtPrice: 1650,
        lotSize: 200,
        stockRemaining: 200,
        stockSoldPercent: 0,
        hikePercentage: 0,
        moq: 10,
        unitType: "bag",
        tokenAmount: 200,
        imageUrl: "/lot2.png",
        startTime: new Date(Date.now() + 1000 * 60 * 60 * 18), // 18h away
        endTime: new Date(Date.now() + 1000 * 60 * 60 * 42),
        status: 'Upcoming',
        totalBuyers: 0
    },
    {
        title: "Black Pepper Whole 5kg",
        description: "Premium bold black pepper berries.",
        category: "Condiments",
        initialPrice: 2800,
        currentBid: 2800,
        startedAtPrice: 2800,
        lotSize: 40,
        stockRemaining: 40,
        stockSoldPercent: 0,
        hikePercentage: 0,
        moq: 1,
        unitType: "bag",
        tokenAmount: 150,
        imageUrl: "/lot1.png",
        startTime: new Date(Date.now() + 1000 * 60 * 60 * 26), // 26h away
        endTime: new Date(Date.now() + 1000 * 60 * 60 * 50),
        status: 'Upcoming',
        totalBuyers: 0
    },
    {
        title: "Sugar Pure S-30 50kg",
        description: "Standard industrial grade white sugar.",
        category: "Sugar",
        initialPrice: 1850,
        currentBid: 1980,
        startedAtPrice: 1850,
        lotSize: 500,
        stockRemaining: 0,
        stockSoldPercent: 100,
        hikePercentage: 7.0,
        moq: 20,
        unitType: "bag",
        tokenAmount: 100,
        imageUrl: "/lot1.png",
        startTime: new Date(Date.now() - 1000 * 60 * 60 * 48),
        endTime: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2h ago
        status: 'Closed',
        totalBuyers: 12
    },
    {
        title: "Mustard Oil 1L Pouch",
        description: "Consumer pack mustard oil (Carton of 12).",
        category: "Oils",
        initialPrice: 1250,
        currentBid: 1420,
        startedAtPrice: 1250,
        lotSize: 1000,
        stockRemaining: 0,
        stockSoldPercent: 100,
        hikePercentage: 13.6,
        moq: 50,
        unitType: "carton",
        tokenAmount: 250,
        imageUrl: "/lot2.png",
        startTime: new Date(Date.now() - 1000 * 60 * 60 * 24),
        endTime: new Date(Date.now() - 1000 * 60 * 60 * 5), // 5h ago
        status: 'Closed',
        totalBuyers: 28
    },
    {
        title: "Basmati Rice Tibar 25kg",
        description: "Broken basmati rice for daily use.",
        category: "Grains",
        initialPrice: 1400,
        currentBid: 1450,
        startedAtPrice: 1400,
        lotSize: 300,
        stockRemaining: 0,
        stockSoldPercent: 100,
        hikePercentage: 3.5,
        moq: 10,
        unitType: "bag",
        tokenAmount: 150,
        imageUrl: "/lot1.png",
        startTime: new Date(Date.now() - 1000 * 60 * 60 * 72),
        endTime: new Date(Date.now() - 1000 * 60 * 60 * 12), // 12h ago
        status: 'Closed',
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
