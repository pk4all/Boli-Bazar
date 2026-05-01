require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const session = require('express-session');
const { MongoStore } = require('connect-mongo');
const path = require('path');
const multer = require('multer');
const fs = require('fs');
const Auction = require('./models/Auction');
const User = require('./models/User');
const Banner = require('./models/Banner');
const Order = require('./models/Order');
const Reward = require('./models/Reward');
const LeaderboardSnapshot = require('./models/LeaderboardSnapshot');
const ManufacturerRequest = require('./models/ManufacturerRequest');
const ExecutiveSnapshot = require('./models/ExecutiveSnapshot');
const ExecutivePayout = require('./models/ExecutivePayout');
const cron = require('node-cron');

const app = express();
const PORT = process.env.PORT || 3005;

// ENSURE UPLOADS DIRECTORY EXISTS
const uploadDir = path.join(__dirname, 'public', 'uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// MULTER CONFIGURATION
const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadDir),
    filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname)
});
const upload = multer({ storage });

// Explicit Views Configuration
const VIEWS_DIR = path.join(__dirname, 'views');
app.set('views', VIEWS_DIR);
app.set('view engine', 'ejs');
app.set('view cache', false);

// Middlewares
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.json()); // MANDATORY for API calls
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(uploadDir));

app.use(session({
    secret: process.env.SESSION_SECRET || 'bolibazar_arctic_secret',
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
        mongoUrl: process.env.MONGO_URI || 'mongodb://localhost:27017/bolibazar',
        ttl: 14 * 24 * 60 * 60 // 14 days
    }),
    cookie: { maxAge: 1000 * 60 * 60 * 24 }
}));

app.use((req, res, next) => {
    res.locals.user = req.session.user || null;
    console.log(`[STABLE-GATEWAY] ${req.method} ${req.url} - User: ${req.session.user ? req.session.user.username : 'Guest'}`);
    next();
});

// Diagnostic Route
app.get('/api/version', (req, res) => {
    res.json({ version: 'V5-STABLE', timestamp: new Date(), routes: ['checkout', 'leaderboard', 'admin'] });
});

// --- CORE API ROUTES (MOVING TO TOP FOR PRIORITY) ---
app.post('/api/checkout/:id', async (req, res) => {
    const { quantity, paymentMode } = req.body;
    try {
        const auction = await Auction.findById(req.params.id);
        const user = await User.findById(req.session.user?.id);

        if (!auction || !user) return res.status(404).json({ error: 'Auction or User not found' });

        const buyQty = parseInt(quantity) || auction.moq;

        // Strict Stock Validation
        if (!auction.stockRemaining || auction.stockRemaining <= 0) {
            return res.status(400).json({ error: 'THIS LOT IS SOLD OUT! Better luck next time.' });
        }
        if (buyQty > auction.stockRemaining) {
            return res.status(400).json({ error: `Sirf ${auction.stockRemaining} units stock mein hain.` });
        }

        // Strict MOQ Validation
        if (buyQty < (auction.moq || 1)) {
            return res.status(400).json({
                error: `Minimum order quantity for this lot is ${auction.moq || 1} bags. Your selection: ${buyQty}`
            });
        }

        const totalValue = Math.round(buyQty * (auction.currentBid || auction.initialPrice));
        const fee = paymentMode === 'cod' ? Math.round(totalValue * 0.1) : 0;
        const finalPayable = Math.round(totalValue + fee);

        user.walletBalance = Math.round((user.walletBalance || 0) + finalPayable);
        if (!user.wonAuctions) user.wonAuctions = [];
        if (!user.wonAuctions.includes(auction._id)) user.wonAuctions.push(auction._id);

        auction.stockRemaining = Math.max(0, (auction.stockRemaining || 0) - buyQty);
        auction.totalBuyers = (auction.totalBuyers || 0) + 1;

        if (auction.lotSize > 0) {
            auction.stockSoldPercent = Math.min(100, Math.round(((auction.lotSize - auction.stockRemaining) / auction.lotSize) * 100));
        }

        // Update current price based on hike percentage
        if (auction.hikePercentage > 0) {
            const cp = auction.currentBid || auction.initialPrice;
            const hike = cp * (auction.hikePercentage / 100);
            auction.currentBid = Math.round(cp + hike);
        }

        await user.save();
        await auction.save();

        // --- NEW: Record Order for Product Leaderboard ---
        try {
            await Order.create({
                user: user._id,
                auction: auction._id,
                username: user.username,
                city: user.city,
                quantity: buyQty,
                totalAmount: totalValue,
                paidAmount: paymentMode === 'full' ? totalValue : (totalValue * 0.1),
                paymentMode: paymentMode,
                paymentHistory: [{
                    amount: paymentMode === 'full' ? totalValue : (totalValue * 0.1),
                    date: new Date(),
                    method: paymentMode === 'full' ? 'Full' : 'Advance'
                }]
            });
        } catch (orderErr) {
            console.error('[ORDER-RECORD-ERROR]', orderErr);
        }

        res.json({ success: true, message: 'Booking Confirmed!', redirect: '/dashboard#winning-lots' });
    } catch (err) {
        console.error('[CHECKOUT-CRASH]', err);
        res.status(500).json({ error: 'Server Error: ' + err.message });
    }
});

app.post('/api/checkout', (req, res) => {
    res.status(400).json({ error: 'ID is missing' });
});

// MongoDB Connection
// MongoDB Connection
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/bolibazar';
mongoose.connect(MONGO_URI)
    .then(() => console.log('[STABLE-DB] Connected Successfully'))
    .catch(err => console.error('[STABLE-DB] Connection Error:', err));

// --- MONTHLY RESET LOGIC ---
async function runMonthlyReset() {
    console.log('[LEADERBOARD-RESET] Starting monthly reset process...');
    try {
        const now = new Date();
        const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
        
        let targetMonthIndex = now.getMonth();
        let targetYear = now.getFullYear();
        
        // If it runs on the 1st to 5th of the month, we are closing the PREVIOUS month.
        if (now.getDate() <= 5) {
            targetMonthIndex -= 1;
            if (targetMonthIndex < 0) {
                targetMonthIndex = 11;
                targetYear -= 1;
            }
        }
        
        const targetMonthName = monthNames[targetMonthIndex] + " " + targetYear;

        // Check if we already did the reset for this month
        const existing = await LeaderboardSnapshot.findOne({ month: targetMonthName });
        if (existing) {
            console.log(`[LEADERBOARD-RESET] Snapshot for ${targetMonthName} already exists. Skipping reset to avoid duplication.`);
            return;
        }

        // 1. Get Top 3 Winners with their data
        const topRetailers = await User.find({ role: 'retailer' })
            .sort({ walletBalance: -1, createdAt: 1 })
            .limit(3)
            .lean();

        if (topRetailers.length > 0) {
            const winners = topRetailers.map((u, index) => ({
                rank: index + 1,
                username: u.username,
                shopName: u.shopName,
                city: u.city,
                coins: u.walletBalance,
                profileImage: u.profileImage,
                mobileNumber: u.phone
            }));

            // 2. Save Snapshot
            const snapshot = new LeaderboardSnapshot({
                month: targetMonthName,
                year: targetYear,
                winners: winners
            });
            await snapshot.save();
            console.log(`[LEADERBOARD-RESET] Snapshot saved for ${targetMonthName}`);
        }

        // 3. Reset all walletBalance to 0 (Full Reset as requested)
        await User.updateMany({ role: 'retailer' }, { $set: { walletBalance: 0 } });
        console.log('[LEADERBOARD-RESET] All retailer balances reset to 0 for the new month');

        // 4. Save Executive Performance Snapshots
        const executives = await User.find({ role: 'sales_executive' });
        for (const exec of executives) {
            // Find retailers linked to this executive
            const retailers = await User.find({ linkedExecutive: exec._id, role: 'retailer' });
            const retailerIds = retailers.map(r => r._id);

            // Filter orders for the target month
            const startOfMonth = new Date(targetYear, targetMonthIndex, 1);
            const endOfMonth = new Date(targetYear, targetMonthIndex + 1, 0, 23, 59, 59);

            const orders = await Order.find({ 
                user: { $in: retailerIds },
                createdAt: { $gte: startOfMonth, $lte: endOfMonth }
            }).lean();

            let execTotalSales = 0;
            const retailerPerf = retailers.map(r => {
                const rOrders = orders.filter(o => o.user.toString() === r._id.toString());
                let rSales = 0;
                rOrders.forEach(o => {
                    const sub = Math.round(o.totalAmount || 0);
                    const fee = (o.paymentMode === 'cod') ? Math.round(sub * 0.1) : 0;
                    rSales += (sub + fee);
                });
                execTotalSales += rSales;
                return {
                    retailerId: r._id,
                    username: r.username,
                    shopName: r.shopName,
                    phone: r.phone,
                    sales: rSales,
                    commission: Math.round(rSales * 0.03)
                };
            });

            const execSnapshot = new ExecutiveSnapshot({
                executiveId: exec._id,
                month: targetMonthName,
                year: targetYear,
                totalSales: execTotalSales,
                totalCommission: Math.round(execTotalSales * 0.03),
                retailerCount: retailers.length,
                retailerPerformance: retailerPerf.sort((a, b) => b.sales - a.sales) // Rank top performers
            });

            await execSnapshot.save();
            console.log(`[LEADERBOARD-RESET] Snapshot saved for Executive: ${exec.username}`);
        }
    } catch (err) {
        console.error('[LEADERBOARD-RESET] CRITICAL ERROR:', err);
    }
}

// Schedule Reset: 11:55 PM (23:55) on the last day of the month
cron.schedule('55 23 28-31 * *', async () => {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    
    if (tomorrow.getDate() === 1) { // If tomorrow is the 1st, then today is the last day
        await runMonthlyReset();
    }
});

// Startup Safety Check: If the server was off during the midnight reset, do it now.
setTimeout(async () => {
    const today = new Date();
    if (today.getDate() <= 3) {
        await runMonthlyReset();
    }
}, 5000);

// --- SAMPLE DATA FOR HALL OF FAME (Auto-Seed) ---
(async () => {
    try {
        const count = await LeaderboardSnapshot.countDocuments();
        if (count === 0) {
            const sampleSnapshot = new LeaderboardSnapshot({
                month: "March 2026",
                year: 2026,
                winners: [
                    { rank: 1, username: "Ramesh Store", shopName: "Ramesh General Store", city: "Delhi", coins: 45200, mobileNumber: "9876543210" },
                    { rank: 2, username: "Priya Traders", shopName: "Priya Wholesale Traders", city: "Mumbai", coins: 38900, mobileNumber: "9988776655" },
                    { rank: 3, username: "Mehul Retailer", shopName: "Mehul Kirana", city: "Surat", coins: 35400, mobileNumber: "9122334455" }
                ]
            });
            await sampleSnapshot.save();
            console.log('[LEADERBOARD-SEED] Sample Hall of Fame data created.');
        }
    } catch (err) {
        console.error('[LEADERBOARD-SEED] Error:', err);
    }
})();

// --- ROUTES ---

// Home Route (Leaderboard + Hero Slider + Live Bidding Strip)
app.get('/', async (req, res) => {
    try {
        const now = new Date();
        const banners = await Banner.find({ isActive: true }).sort({ order: 1 }).lean();
        const liveProducts = await Auction.find({
            startTime: { $lte: now },
            endTime: { $gt: now }
        }).sort({ totalBuyers: -1 }).limit(5).lean();

        // Fetch real leaderboard data using walletBalance (Sync with Dashboard)
        const leaderboard = await User.find({ role: 'retailer' })
            .sort({ walletBalance: -1, createdAt: 1 })
            .select('username shopName city walletBalance profileImage')
            .limit(10)
            .lean();

        // Fetch Last Month Winners (Hall of Fame)
        const lastMonthSnapshot = await LeaderboardSnapshot.findOne().sort({ createdAt: -1 }).lean();
        const lastMonthWinners = lastMonthSnapshot ? lastMonthSnapshot.winners : [];

        // --- FETCH TOP 3 REWARDS ---
        let rewards = await Reward.find().sort({ rank: 1 }).lean();

        // Initialize if empty
        if (rewards.length === 0) {
            const defaultRewards = [
                { rank: 1, title: 'FREE Delivery for 1 Month', description: '• Exclusive Gold Badge • 5% Extra Discount', imageUrl: '/lot1.png' },
                { rank: 2, title: '3% Extra Discount on All Orders', description: '• Silver Badge • Priority Support', imageUrl: '/lot3.png' },
                { rank: 3, title: '500 Coins Reward', description: '• Bronze Badge • Early Access to New Lots', imageUrl: '/lot2.png' }
            ];
            await Reward.insertMany(defaultRewards);
            rewards = await Reward.find().sort({ rank: 1 }).lean();
        }

        console.log(`[STABLE-RENDER] Serving ${banners.length} Banners, ${liveProducts.length} Live Products, and ${leaderboard.length} Leaderboard entries [TRACER: PRIMARY_DESKTOP]`);

        res.render('index', {
            banners,
            liveProducts,
            leaderboard,
            lastMonthWinners,
            rewards,
            debug: "ALIVE_IN_PRIMARY_DESKTOP",
            user: req.session.user || null,
            v: Date.now()
        });
    } catch (err) {
        console.error('[STABLE-ERROR] Home Route:', err);
        res.render('index', { banners: [], liveProducts: [], leaderboard: [], rewards: [], user: req.session.user || null, v: Date.now() });
    }
});

app.get('/auctions', async (req, res) => {
    if (!req.session.user) return res.redirect('/login');
    try {
        const now = new Date();
        // Live: Started AND not yet ended
        const auctions = await Auction.find({
            startTime: { $lte: now },
            endTime: { $gt: now }
        }).lean();

        // Upcoming: Not yet started
        const upcomingAuctions = await Auction.find({
            startTime: { $gt: now }
        }).lean();

        // Closed: Already ended
        const closedAuctions = await Auction.find({
            endTime: { $lte: now }
        }).sort({ endTime: -1 }).limit(3).lean();

        console.log(`[DEBUG] Rendering auctions with ${auctions.length} live, ${upcomingAuctions.length} upcoming, and ${closedAuctions.length} closed items.`);

        return res.render('auctions', {
            auctions: auctions || [],
            liveAuctions: auctions || [],
            upcomingAuctions: upcomingAuctions || [],
            closedAuctions: closedAuctions || [],
            user: req.session.user || null
        });
    } catch (err) {
        console.error('Render Error:', err);
        res.status(500).send('Auctions Error');
    }
});

// Product Detail Route
app.get('/auctions/:id', async (req, res) => {
    if (!req.session.user) return res.redirect('/login');
    try {
        const auction = await Auction.findById(req.params.id).lean();
        if (!auction) return res.redirect('/auctions');

        // Mock Bid History & Activity
        const bidHistory = [
            { bidder: 'Mehul Retailer', amount: auction.currentBid - 200, time: '2 mins ago', quantity: 20 },
            { bidder: 'Ramesh Store', amount: auction.currentBid - 500, time: '15 mins ago', quantity: 50 },
            { bidder: 'Priya Traders', amount: auction.currentBid - 800, time: '1 hour ago', quantity: 15 }
        ];

        const fullUser = await User.findById(req.session.user.id).lean();

        res.render('product-detail', {
            auction,
            bidHistory,
            user: fullUser || req.session.user
        });
    } catch (err) {
        console.error('Detail Error:', err);
        res.redirect('/auctions');
    }
});

// --- ADMIN ROUTES ---
app.get('/admin', async (req, res) => {
    if (!req.session.user || req.session.user.role !== 'admin') {
        return res.redirect('/login');
    }
    try {
        const now = new Date();
        const { startDate, endDate } = req.query;
        let query = {};

        if (startDate || endDate) {
            query.createdAt = {};
            if (startDate) query.createdAt.$gte = new Date(startDate);
            if (endDate) {
                const end = new Date(endDate);
                end.setHours(23, 59, 59, 999);
                query.createdAt.$lte = end;
            }
        }

        const auctions = await Auction.find().sort({ createdAt: -1 });
        
        // Pagination for Retailers
        const page = parseInt(req.query.page) || 1;
        const limit = 20;
        const skip = (page - 1) * limit;
        const totalUsersCount = await User.countDocuments({ role: 'retailer' });
        const totalPages = Math.ceil(totalUsersCount / limit);

        const users = await User.find({ role: 'retailer' })
            .sort({ walletBalance: -1 })
            .skip(skip)
            .limit(limit);

        const banners = await Banner.find().sort({ order: 1 });
        const rewards = await Reward.find().sort({ rank: 1 });

        // Dynamic Orders with Filter
        const orders = await Order.find(query).populate('user').populate('auction').sort({ createdAt: -1 });

        // Financial Metrics Calculations (Source of Truth: paymentHistory)
        const allOrders = await Order.find();

        // 1. Calculate Summary Stats for current view
        const totalRevenue = Math.round(allOrders.reduce((sum, order) => {
            return sum + (order.paymentHistory || []).reduce((pSum, p) => pSum + p.amount, 0);
        }, 0));

        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);
        const todayRevenue = Math.round(allOrders.reduce((sum, order) => {
            const todayPayments = (order.paymentHistory || []).filter(p => new Date(p.date) >= todayStart);
            return sum + todayPayments.reduce((pSum, p) => pSum + p.amount, 0);
        }, 0));

        const pendingCod = Math.round(allOrders.reduce((sum, order) => {
            const subtotal = order.totalAmount;
            const fee = (order.paymentMode === 'cod') ? (subtotal * 0.1) : 0;
            const orderValue = subtotal + fee;
            const paidNowTotal = (order.paymentHistory || []).reduce((pSum, p) => pSum + p.amount, 0);
            const remaining = orderValue - paidNowTotal;
            return sum + (remaining > 0 ? remaining : 0);
        }, 0));

        // 2. NEW: Month-wise & Date-range detailed reports
        const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        const monthlyStatsMap = {};

        allOrders.forEach(o => {
            const sub = o.totalAmount;
            const fee = (o.paymentMode === 'cod') ? (sub * 0.1) : 0;
            const totalOrderValue = Math.round(sub + fee);
            
            // Total Paid vs COD Balance
            const totalPaid = Math.round((o.paymentHistory || []).reduce((s, p) => s + p.amount, 0));
            const balance = Math.round(totalOrderValue - totalPaid);

            // Month-wise Aggregation (Based on Order Creation Date)
            const oDate = new Date(o.createdAt);
            const monthKey = `${monthNames[oDate.getMonth()]} ${oDate.getFullYear()}`;
            
            if (!monthlyStatsMap[monthKey]) {
                monthlyStatsMap[monthKey] = { sales: 0, collected: 0, codBalance: 0 };
            }
            monthlyStatsMap[monthKey].sales += totalOrderValue;
            monthlyStatsMap[monthKey].collected += totalPaid;
            monthlyStatsMap[monthKey].codBalance += (balance > 0 ? balance : 0);
        });

        const monthlyReports = Object.keys(monthlyStatsMap).map(m => ({
            month: m,
            ...monthlyStatsMap[m]
        })).reverse(); // Latest months first

        // Filtered Report (Based on selected date range)
        let filteredStats = { sales: 0, collected: 0, codBalance: 0 };
        const filteredOrders = await Order.find(query); // 'query' is already defined with date filter
        filteredOrders.forEach(o => {
            const sub = o.totalAmount;
            const fee = (o.paymentMode === 'cod') ? (sub * 0.1) : 0;
            const totalVal = Math.round(sub + fee);
            const paid = Math.round((o.paymentHistory || []).reduce((s, p) => s + p.amount, 0));
            filteredStats.sales += totalVal;
            filteredStats.collected += paid;
            filteredStats.codBalance += Math.max(0, totalVal - paid);
        });

        // NEW: Operational Metrics
        const retailerCount = await User.countDocuments({ role: 'retailer' });
        const liveProductsCount = await Auction.countDocuments({ status: 'Live' });
        const upcomingProductsCount = await Auction.countDocuments({ status: 'Upcoming' });

        // --- DYNAMIC CHART DATA (Monthly or Filtered Range) ---
        const chartLabels = [];
        const chartTotalData = [];
        
        let chartStart = startDate ? new Date(startDate) : new Date(now.getFullYear(), now.getMonth(), 1);
        let chartEnd = endDate ? new Date(endDate) : new Date(now);
        chartEnd.setHours(23, 59, 59, 999);

        // Limit range to prevent performance issues (max 60 days)
        let diffTime = Math.abs(chartEnd - chartStart);
        let diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        if (diffDays > 60) {
            chartStart = new Date(chartEnd);
            chartStart.setDate(chartStart.getDate() - 60);
        }

        let currentLoopDate = new Date(chartStart);
        while (currentLoopDate <= chartEnd) {
            const dayStart = new Date(currentLoopDate);
            dayStart.setHours(0, 0, 0, 0);
            const dayEnd = new Date(currentLoopDate);
            dayEnd.setHours(23, 59, 59, 999);

            chartLabels.push(dayStart.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }));

            let dailySum = 0;
            allOrders.forEach(o => {
                const dayPayments = (o.paymentHistory || []).filter(p => {
                    const pDate = new Date(p.date);
                    return pDate >= dayStart && pDate <= dayEnd;
                });
                dailySum += dayPayments.reduce((s, p) => s + p.amount, 0);
            });
            chartTotalData.push(dailySum);

            currentLoopDate.setDate(currentLoopDate.getDate() + 1);
        }

        // Unique categories for the launch form
        const categories = [...new Set(auctions.map(a => a.category))].filter(Boolean);

        // Historical Hall of Fame Snapshots
        const hallOfFameSnapshots = await LeaderboardSnapshot.find().sort({ createdAt: -1 }).lean();

        const manufacturerRequests = await ManufacturerRequest.find().sort({ createdAt: -1 });

        // Fetch Sales Executives and calculate their stats
        const allSalesExecutives = await User.find({ role: 'sales_executive' }).lean();
        const pendingExecutives = allSalesExecutives.filter(e => e.approvalStatus === 'Pending');
        const salesExecutives = allSalesExecutives.filter(e => e.approvalStatus !== 'Pending');

        for (let exec of salesExecutives) {
            const linkedRetailers = await User.find({ linkedExecutive: exec._id });
            exec.retailerCount = linkedRetailers.length;
            
            const retailerIds = linkedRetailers.map(r => r._id);
            const execOrders = await Order.find({ user: { $in: retailerIds } });
            
            let totalOrderValue = 0;
            let pendingOrderValue = 0;
            
            execOrders.forEach(o => {
                const sub = Math.round(o.totalAmount || 0);
                const fee = (o.paymentMode === 'cod') ? Math.round(sub * 0.1) : 0;
                const fullValue = sub + fee;
                
                totalOrderValue += fullValue;
                
                // Calculate pending if after last payout
                if (!exec.lastPayoutDate || new Date(o.createdAt) > new Date(exec.lastPayoutDate)) {
                    pendingOrderValue += fullValue;
                }
            });
            
            exec.totalSales = totalOrderValue;
            exec.totalCommission = Math.round(totalOrderValue * 0.03);
            exec.pendingCommission = Math.round(pendingOrderValue * 0.03);
        }

        res.render('admin', {
            auctions, users, banners, rewards, orders,
            totalRevenue, todayRevenue, pendingCod,
            retailerCount, liveProductsCount, upcomingProductsCount,
            weekLabels: chartLabels, weekData: chartTotalData, categories,
            hallOfFameSnapshots,
            manufacturerRequests,
            salesExecutives,
            pendingExecutives,
            startDate: startDate || '',
            endDate: endDate || '',
            currentPage: page,
            totalPages,
            totalUsersCount,
            monthlyReports,
            filteredStats
        });
    } catch (err) {
        console.error('Admin Route Error:', err);
        res.status(500).send('Admin Error: ' + err.message);
    }
});

// Admin: Add Auction
app.post('/admin/add-product', upload.array('images', 4), async (req, res) => {
    if (!req.session.user || req.session.user.role !== 'admin') return res.redirect('/login');
    try {
        const { title, description, initialPrice, lotSize, category, newCategory, moq, hikePercentage, videoUrl, status, spec_keys, spec_values, startDate, startTime, endDate, endTime } = req.body;

        // Handle New Category Creation
        let finalCategory = category;
        if (category === 'other' && newCategory) {
            finalCategory = newCategory.trim();
        }

        // Process Specifications
        const specifications = [];
        if (Array.isArray(spec_keys) && Array.isArray(spec_values)) {
            for (let i = 0; i < spec_keys.length; i++) {
                if (spec_keys[i].trim() && spec_values[i].trim()) {
                    specifications.push({
                        key: spec_keys[i].trim(),
                        value: spec_values[i].trim(),
                        isBasic: false
                    });
                }
            }
        }

        const images = req.files ? req.files.map(f => `/uploads/${f.filename}`) : [];

        // Finalize Times
        let finalStartTime = new Date();
        if (status === 'Upcoming' && startDate && startTime) {
            finalStartTime = new Date(`${startDate}T${startTime}`);
        }

        let finalEndTime = new Date(finalStartTime.getTime() + 7 * 24 * 60 * 60 * 1000); // 7 days from start
        if (endDate && endTime) {
            finalEndTime = new Date(`${endDate}T${endTime}`);
        }

        const newAuction = new Auction({
            title,
            description,
            initialPrice,
            lotSize,
            category: finalCategory,
            moq: moq || 1,
            hikePercentage: hikePercentage || 0,
            videoUrl,
            status: status || 'Live',
            images: images,
            imageUrl: images[0] || '',
            currentBid: initialPrice,
            totalBuyers: 0,
            stockRemaining: lotSize,
            stockSoldPercent: 0,
            unitType: 'pcs', // Default for electronics
            specifications,
            startTime: finalStartTime,
            endTime: finalEndTime
        });

        await newAuction.save();
        res.redirect('/admin');
    } catch (err) {
        console.error('Add Product Error:', err);
        res.redirect('/admin');
    }
});

// Admin: Update Auction
app.post('/admin/update-product/:id', async (req, res) => {
    if (!req.session.user || req.session.user.role !== 'admin') return res.redirect('/login');
    try {
        const { title, initialPrice, lotSize, category, description, imageUrl, hikePercentage } = req.body;
        await Auction.findByIdAndUpdate(req.params.id, {
            title, initialPrice, lotSize, category, description, imageUrl, hikePercentage
        });
        res.redirect('/admin');
    } catch (err) {
        console.error('Update Error:', err);
        res.redirect('/admin');
    }
});

// Admin: Delete Auction
app.post('/admin/delete-product/:id', async (req, res) => {
    if (!req.session.user || req.session.user.role !== 'admin') return res.redirect('/login');
    try {
        await Auction.findByIdAndDelete(req.params.id);
        res.redirect('/admin');
    } catch (err) {
        res.redirect('/admin');
    }
});

// Admin: Upload Banner
app.post('/admin/banners/upload', upload.single('bannerImage'), async (req, res) => {
    if (!req.session.user || req.session.user.role !== 'admin') return res.redirect('/login');
    try {
        if (!req.file) return res.redirect('/admin');
        const newBanner = new Banner({
            imageUrl: '/uploads/' + req.file.filename,
            title: req.body.title || ''
        });
        await newBanner.save();
        res.redirect('/admin');
    } catch (err) {
        res.redirect('/admin');
    }
});

// Admin: Delete Banner
app.post('/admin/banners/delete/:id', async (req, res) => {
    if (!req.session.user || req.session.user.role !== 'admin') return res.redirect('/login');
    try {
        const banner = await Banner.findById(req.params.id);
        if (banner) {
            const filePath = path.join(__dirname, 'public', banner.imageUrl);
            if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
            await Banner.findByIdAndDelete(req.params.id);
        }
        res.redirect('/admin');
    } catch (err) {
        res.redirect('/admin');
    }
});

// Admin: Update Reward
app.post('/admin/rewards/update', upload.single('rewardImage'), async (req, res) => {
    if (!req.session.user || req.session.user.role !== 'admin') return res.redirect('/login');
    try {
        const { rank, title, description } = req.body;
        const updateData = { title, description };

        if (req.file) {
            updateData.imageUrl = '/uploads/' + req.file.filename;
        }

        await Reward.findOneAndUpdate(
            { rank: parseInt(rank) },
            updateData,
            { upsert: true, new: true }
        );
        res.redirect('/admin#rewards');
    } catch (err) {
        console.error('Reward Update Error:', err);
        res.redirect('/admin');
    }
});

// Admin: View Retailer Dashboard/History
app.get('/admin/retailer/:id', async (req, res) => {
    if (!req.session.user || req.session.user.role !== 'admin') return res.redirect('/login');
    try {
        const user = await User.findById(req.params.id).populate('bids');
        if (!user) return res.redirect('/admin');

        // Fetch Orders for this retailer
        const userOrders = await Order.find({ user: user._id }).populate('auction').sort({ createdAt: -1 }).lean();

        // Calculate Financial Stats
        let totalPurchased = 0;
        let totalPaid = 0;
        userOrders.forEach(o => {
            const sub = Math.round(o.totalAmount || 0);
            const fee = (o.paymentMode === 'cod') ? Math.round(sub * 0.1) : 0;
            totalPurchased += Math.round(sub + fee);
            totalPaid += Math.round((o.paymentHistory || []).reduce((sum, p) => sum + p.amount, 0));
        });

        // Reuse Dashboard Ranking Logic
        const allRetailers = await User.find({ role: 'retailer' }).sort({ walletBalance: -1, createdAt: 1 }).lean();
        const userIdx = allRetailers.findIndex(u => u._id.toString() === user._id.toString());
        const rank = userIdx !== -1 ? userIdx + 1 : (allRetailers.length + 1);
        const totalRetailers = Math.max(allRetailers.length, 1);
        const top3 = allRetailers.slice(0, 3);
        const top3Balance = (top3.length >= 3) ? (top3[2].walletBalance || 0) : (top3.length > 0 ? top3[0].walletBalance : 10000);
        const gapToTop3 = (rank > 3) ? Math.round(Math.max(0, top3Balance - (user.walletBalance || 0) + 1)) : 0;

        res.render('dashboard', {
            user,
            rank,
            totalRetailers,
            gapToTop3,
            orders: userOrders,
            financials: {
                totalPurchased,
                totalPaid,
                balanceDue: Math.max(0, totalPurchased - totalPaid)
            },
            topFive: allRetailers.slice(0, 5),
            viewMode: 'admin' 
        });
    } catch (err) {
        console.error('Admin Retailer View Error:', err);
        res.redirect('/admin');
    }
});

// Admin: View Sales Executive Dashboard
app.get('/admin/executive/:id', async (req, res) => {
    if (!req.session.user || req.session.user.role !== 'admin') return res.redirect('/login');
    try {
        const executive = await User.findById(req.params.id).lean();
        if (!executive || executive.role !== 'sales_executive') return res.redirect('/admin');

        // Fetch retailers linked to this executive
        const retailers = await User.find({ linkedExecutive: executive._id }).lean();
        const retailerIds = retailers.map(r => r._id);

        // Fetch current month's orders (to match Executive Dashboard view)
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const orders = await Order.find({ 
            user: { $in: retailerIds },
            createdAt: { $gte: startOfMonth }
        }).populate('user').populate('auction').sort({ createdAt: -1 }).lean();

        // Calculate Stats
        let totalPurchases = 0;
        const retailerPerformance = retailers.map(r => {
            const rOrders = orders.filter(o => o.user && o.user._id.toString() === r._id.toString());
            let rSales = 0;
            rOrders.forEach(o => {
                const sub = Math.round(o.totalAmount || 0);
                const fee = (o.paymentMode === 'cod') ? Math.round(sub * 0.1) : 0;
                rSales += (sub + fee);
            });
            totalPurchases += rSales;
            return {
                ...r,
                monthlySales: rSales,
                monthlyCommission: Math.round(rSales * 0.03)
            };
        }).sort((a, b) => b.monthlySales - a.monthlySales);

        // Calculate Pending Stats (all time since last payout)
        const allExecOrders = await Order.find({ user: { $in: retailerIds } }).lean();
        let totalAllTimePurchases = 0;
        let pendingPurchases = 0;
        
        allExecOrders.forEach(o => {
            const sub = Math.round(o.totalAmount || 0);
            const fee = (o.paymentMode === 'cod') ? Math.round(sub * 0.1) : 0;
            const fullVal = sub + fee;
            totalAllTimePurchases += fullVal;
            if (!executive.lastPayoutDate || new Date(o.createdAt) > new Date(executive.lastPayoutDate)) {
                pendingPurchases += fullVal;
            }
        });

        const pendingCommission = Math.round(pendingPurchases * 0.03);
        const payoutHistory = await ExecutivePayout.find({ executiveId: executive._id }).sort({ payoutDate: -1 }).lean();

        // Fetch historical reports (Snapshots)
        const reports = await ExecutiveSnapshot.find({ executiveId: executive._id }).sort({ createdAt: -1 }).lean();

        res.render('executive-dashboard', {
            executive,
            retailers: retailerPerformance,
            orders,
            totalPurchases,
            totalCommission,
            pendingCommission,
            payoutHistory,
            reports,
            viewMode: 'admin'
        });
    } catch (err) {
        console.error('Admin Executive View Error:', err);
        res.redirect('/admin');
    }
});

// Admin: Add Sales Executive
app.post('/admin/add-executive', async (req, res) => {
    if (!req.session.user || req.session.user.role !== 'admin') return res.redirect('/login');
    try {
        const { username, email, phone, password, bankName, bankAccountNo, ifscCode } = req.body;
        const executiveCode = 'SE' + Math.floor(1000 + Math.random() * 9000);
        
        const newExec = new User({
            username,
            email,
            phone,
            password,
            bankName,
            bankAccountNo,
            ifscCode,
            role: 'sales_executive',
            executiveCode,
            shopName: 'BoliBazar Sales',
            address: 'Head Office',
            city: 'HQ',
            state: 'HQ',
            pincode: '000000'
        });
        await newExec.save();
        res.redirect('/admin');
    } catch (err) {
        console.error('Error adding sales executive:', err);
        res.redirect('/admin');
    }
});

// Admin: Approve Sales Executive
app.post('/admin/approve-executive/:id', async (req, res) => {
    if (!req.session.user || req.session.user.role !== 'admin') return res.redirect('/login');
    try {
        const executiveCode = 'SE' + Math.floor(1000 + Math.random() * 9000);
        await User.findByIdAndUpdate(req.params.id, { 
            approvalStatus: 'Approved', 
            executiveCode 
        });
        res.redirect('/admin');
    } catch (err) {
        console.error('Error approving executive:', err);
        res.redirect('/admin');
    }
});

// Admin: Reject Sales Executive
app.post('/admin/reject-executive/:id', async (req, res) => {
    if (!req.session.user || req.session.user.role !== 'admin') return res.redirect('/login');
    try {
        await User.findByIdAndDelete(req.params.id);
        res.redirect('/admin');
    } catch (err) {
        console.error('Error rejecting executive:', err);
        res.redirect('/admin');
    }
});

// Sales Executive Dashboard
app.get('/executive', async (req, res) => {
    if (!req.session.user || req.session.user.role !== 'sales_executive') return res.redirect('/login');
    try {
        const executive = await User.findById(req.session.user.id);
        if (executive.approvalStatus === 'Pending') {
            return res.redirect('/pending-approval');
        }
        
        // Fetch linked retailers
        const retailers = await User.find({ linkedExecutive: executive._id }).lean();
        const retailerIds = retailers.map(r => r._id);
        
        // Fetch current month's orders
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const orders = await Order.find({ 
            user: { $in: retailerIds },
            createdAt: { $gte: startOfMonth }
        }).populate('user').populate('auction').sort({ createdAt: -1 }).lean();
        
        let totalPurchases = 0;
        const retailerPerformance = retailers.map(r => {
            const rOrders = orders.filter(o => o.user && o.user._id.toString() === r._id.toString());
            let rSales = 0;
            rOrders.forEach(o => {
                const sub = Math.round(o.totalAmount || 0);
                const fee = (o.paymentMode === 'cod') ? Math.round(sub * 0.1) : 0;
                rSales += (sub + fee);
            });
            totalPurchases += rSales;
            return {
                ...r,
                monthlySales: rSales,
                monthlyCommission: Math.round(rSales * 0.03)
            };
        }).sort((a, b) => b.monthlySales - a.monthlySales); // Top performer first
        
        const totalCommission = Math.round(totalPurchases * 0.03);

        // Calculate Pending Stats (since last payout)
        const allExecOrders = await Order.find({ user: { $in: retailerIds } }).lean();
        let pendingPurchases = 0;
        allExecOrders.forEach(o => {
            const sub = Math.round(o.totalAmount || 0);
            const fee = (o.paymentMode === 'cod') ? Math.round(sub * 0.1) : 0;
            if (!executive.lastPayoutDate || new Date(o.createdAt) > new Date(executive.lastPayoutDate)) {
                pendingPurchases += (sub + fee);
            }
        });

        const pendingCommission = Math.round(pendingPurchases * 0.03);
        const payoutHistory = await ExecutivePayout.find({ executiveId: executive._id }).sort({ payoutDate: -1 }).lean();

        // Fetch historical reports
        const reports = await ExecutiveSnapshot.find({ executiveId: executive._id }).sort({ createdAt: -1 }).lean();

        res.render('executive-dashboard', {
            executive,
            retailers: retailerPerformance,
            orders,
            totalPurchases,
            totalCommission,
            pendingCommission,
            payoutHistory,
            reports
        });
    } catch (err) {
        console.error('Executive Dashboard Error:', err);
        res.redirect('/login');
    }
});

// --- AUTH ROUTES ---
app.get('/login', (req, res) => res.render('login', { error: null }));
app.get('/register', (req, res) => res.render('register', { error: null }));

// --- MANUFACTURER REGISTRATION ROUTES ---
app.get('/manufacturer-register', (req, res) => {
    res.render('manufacturer-register', { success: false });
});

app.post('/manufacturer-register', async (req, res) => {
    try {
        const { companyName, contactPerson, email, phone, categories, city, state, gstNumber, message } = req.body;
        await ManufacturerRequest.create({
            companyName,
            contactPerson,
            email,
            phone,
            categories,
            city,
            state,
            gstNumber,
            message
        });
        res.render('manufacturer-register', { success: true });
    } catch (err) {
        console.error('[MANUFACTURER-REG-ERROR]', err);
        res.status(500).send('Registration Error: ' + err.message);
    }
});

// Admin Route for updating status (Optional but good for completeness)
app.post('/admin/manufacturer-requests/:id/status', async (req, res) => {
    if (!req.session.user || req.session.user.role !== 'admin') return res.status(403).json({ error: 'Access denied' });
    try {
        const { status } = req.body;
        await ManufacturerRequest.findByIdAndUpdate(req.params.id, { status });
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/login', async (req, res) => {
    const { phone, password } = req.body;
    try {
        const user = await User.findOne({ phone: phone.trim() });
        if (user && await user.comparePassword(password)) {
            if (user.role === 'sales_executive' && user.approvalStatus === 'Pending') {
                return res.redirect('/pending-approval');
            }
            req.session.user = { id: user._id, username: user.username, role: user.role };
            if (user.role === 'admin') return res.redirect('/admin');
            if (user.role === 'sales_executive') return res.redirect('/executive');
            return res.redirect('/auctions');
        }
        res.render('login', { error: 'Invalid credentials' });
    } catch (err) {
        res.render('login', { error: 'Login Error' });
    }
});

app.post('/register', async (req, res) => {
    try {
        const { username, shopName, phone, email, address, city, state, pincode, password, executiveCode } = req.body;
        
        // Check for duplicate phone
        const cleanPhone = phone.trim();
        const existingUser = await User.findOne({ phone: cleanPhone });
        if (existingUser) {
            return res.render('register', { error: 'Mobile number already registered.' });
        }

        const newUser = new User({
            username,
            shopName,
            phone: cleanPhone,
            email,
            address,
            city,
            state,
            pincode,
            password,
            role: 'retailer'
        });
        
        if (executiveCode && executiveCode.trim() !== '') {
            const execUser = await User.findOne({ executiveCode: executiveCode.trim(), role: 'sales_executive' });
            if (execUser) {
                newUser.linkedExecutive = execUser._id;
            }
        }

        await newUser.save();
        req.session.user = { id: newUser._id, username: newUser.username, role: newUser.role };
        res.redirect('/auctions');
    } catch (err) {
        console.error('[REGISTRATION-ERROR]', err);
        res.render('register', { error: 'Registration failed: ' + err.message });
    }
});

// --- SALES EXECUTIVE PUBLIC REGISTRATION ROUTES ---
app.get('/executive-register', (req, res) => {
    res.render('executive-register', { error: null });
});

app.post('/executive-register', upload.single('profileImage'), async (req, res) => {
    try {
        const { username, email, phone, password, address, city, state, pincode, bankName, bankAccountNo, ifscCode } = req.body;
        const profileImage = req.file ? '/uploads/' + req.file.filename : null;

        // Check for duplicate phone
        const existingUser = await User.findOne({ phone: phone.trim() });
        if (existingUser) {
            return res.render('executive-register', { error: 'Mobile number already registered.' });
        }

        const newExec = new User({
            username,
            email,
            phone,
            password,
            role: 'sales_executive',
            approvalStatus: 'Pending',
            shopName: 'BoliBazar Sales',
            address,
            city,
            state,
            pincode,
            bankName,
            bankAccountNo,
            ifscCode,
            profileImage
        });
        await newExec.save();
        res.redirect('/pending-approval');
    } catch (err) {
        console.error('Registration Error:', err);
        res.render('executive-register', { error: 'Registration failed: ' + err.message });
    }
});

app.get('/pending-approval', (req, res) => {
    res.render('pending-approval');
});

app.get('/dashboard', async (req, res) => {
    if (!req.session.user) return res.redirect('/login');
    try {
        const user = await User.findById(req.session.user.id).populate('bids');

        if (!user) {
            req.session.destroy();
            return res.redirect('/login');
        }

        // --- FETCH ORDERS (REPLACES wonAuctions) ---
        const userOrders = await Order.find({ user: user._id }).populate('auction').sort({ createdAt: -1 }).lean();

        // Calculate Financial Stats
        let totalPurchased = 0;
        let totalPaid = 0;
        userOrders.forEach(o => {
            const sub = Math.round(o.totalAmount || 0);
            const fee = (o.paymentMode === 'cod') ? Math.round(sub * 0.1) : 0;
            totalPurchased += Math.round(sub + fee);
            totalPaid += Math.round((o.paymentHistory || []).reduce((sum, p) => sum + p.amount, 0));
        });

        // --- SHARED RANKING LOGIC ---
        const allRetailers = await User.find({ role: 'retailer' })
            .sort({ walletBalance: -1, createdAt: 1 })
            .lean();

        const userIdx = allRetailers.findIndex(u => u._id.toString() === user._id.toString());
        const rank = userIdx !== -1 ? userIdx + 1 : (allRetailers.length + 1);
        const totalRetailers = Math.max(allRetailers.length, 1);

        // Path to Top 3
        const top3 = allRetailers.slice(0, 3);
        const top3Balance = (top3.length >= 3) ? (top3[2].walletBalance || 0) : (top3.length > 0 ? top3[0].walletBalance : 10000);
        const gapToTop3 = (rank > 3) ? Math.round(Math.max(0, top3Balance - (user.walletBalance || 0) + 1)) : 0;

        res.render('dashboard', {
            user,
            rank,
            totalRetailers,
            gapToTop3,
            orders: userOrders,
            financials: {
                totalPurchased,
                totalPaid,
                balanceDue: Math.max(0, totalPurchased - totalPaid)
            },
            topFive: allRetailers.slice(0, 5)
        });
    } catch (err) {
        console.error('Dashboard Error:', err);
        res.status(500).send('Dashboard Error');
    }
});

app.get('/my-account', (req, res) => res.redirect('/dashboard'));

// API: Leaderboard (Matches Dashboard Logic)
app.get('/api/leaderboard', async (req, res) => {
    try {
        const retailers = await User.find({ role: 'retailer' })
            .sort({ walletBalance: -1, createdAt: 1 })
            .select('username shopName city walletBalance profileImage')
            .limit(10)
            .lean();
        res.json(retailers || []);
    } catch (err) {
        res.status(500).json({ error: 'Leaderboard API Error' });
    }
});

// NEW: Product-Specific Leaderboard API
app.get('/api/auctions/:id/leaderboard', async (req, res) => {
    try {
        // Aggregate top buyers for this specific auction
        const leaderboard = await Order.aggregate([
            { $match: { auction: new mongoose.Types.ObjectId(req.params.id) } },
            {
                $group: {
                    _id: "$user",
                    username: { $first: "$username" },
                    city: { $first: "$city" },
                    totalQuantity: { $sum: "$quantity" },
                    totalAmount: { $sum: "$totalAmount" }
                }
            },
            { $sort: { totalQuantity: -1 } },
            { $limit: 10 }
        ]);
        res.json(leaderboard || []);
    } catch (err) {
        console.error('[PRODUCT-LEADERBOARD-ERROR]', err);
        res.status(500).json({ error: 'Product Leaderboard Error' });
    }
});

// (Routes moved to top)

// Admin: Finalize Auction & Award Coins
app.post('/admin/finalize-auction/:id', async (req, res) => {
    if (!req.session.user || req.session.user.role !== 'admin') return res.status(403).send('Forbidden');
    const { winnerId } = req.body;
    try {
        const auction = await Auction.findById(req.params.id);
        const winner = await User.findById(winnerId);

        if (!auction || !winner) return res.status(404).send('Not Found');

        // 1. Award Coins: Shopping Value = Coins
        const coinAward = auction.currentBid || auction.initialPrice;
        winner.walletBalance += coinAward;

        // 2. Add to Won Auctions
        if (!winner.wonAuctions.includes(auction._id)) {
            winner.wonAuctions.push(auction._id);
        }

        // 3. Close Auction
        auction.status = 'Closed';

        await winner.save();
        await auction.save();

        console.log(`[STABLE-ECONOMY] Awarded ${coinAward} Coins to ${winner.username} for win: ${auction.title}`);
        res.redirect('/admin');
    } catch (err) {
        console.error('Finalize Error:', err);
        res.status(500).send('Finalize Error');
    }
});

// Profile Update Route
app.post('/dashboard/update-profile', upload.single('profileImage'), async (req, res) => {
    if (!req.session.user) return res.redirect('/login');
    try {
        const updateData = {};
        if (req.file) {
            updateData.profileImage = '/uploads/' + req.file.filename;
        }
        await User.findByIdAndUpdate(req.session.user.id, updateData);
        res.redirect('/dashboard');
    } catch (err) {
        console.error('Profile Update Error:', err);
        res.redirect('/dashboard');
    }
});

app.get('/logout', (req, res) => {
    req.session.destroy();
    res.redirect('/');
});

// --- ADMIN ACTIONS ---

// Mark Order as Delivered
app.post('/api/admin/orders/:id/deliver', async (req, res) => {
    if (!req.session.user || req.session.user.role !== 'admin') return res.status(401).json({ error: 'Unauthorized' });
    try {
        const order = await Order.findById(req.params.id);
        if (!order) return res.status(404).json({ error: 'Order not found' });

        order.status = 'Delivered';
        order.deliveredAt = new Date();
        await order.save();
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Confirm COD Payment Balance
app.post('/api/admin/orders/:id/confirm-payment', async (req, res) => {
    if (!req.session.user || req.session.user.role !== 'admin') return res.status(401).json({ error: 'Unauthorized' });
    try {
        const order = await Order.findById(req.params.id);
        if (!order) return res.status(404).json({ error: 'Order not found' });

        const subtotal = Math.round(order.totalAmount);
        const totalValue = Math.round(subtotal + (order.paymentMode === 'cod' ? subtotal * 0.1 : 0));
        const balance = Math.round(totalValue - order.paidAmount);

        if (balance > 0) {
            order.paidAmount = totalValue;
            order.paymentHistory.push({
                amount: balance,
                date: new Date(),
                method: 'Final COD'
            });
            await order.save();
        }
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Force Manual Leaderboard Reset (Archive + Reset Balances)
app.post('/api/admin/force-reset-leaderboard', async (req, res) => {
    if (!req.session.user || req.session.user.role !== 'admin') return res.status(401).json({ error: 'Unauthorized' });
    try {
        await runMonthlyReset();
        res.json({ success: true, message: 'Monthly leaderboard has been finalized and archived.' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Admin: Process Executive Payout
app.post('/api/admin/payout-executive/:id', async (req, res) => {
    if (!req.session.user || req.session.user.role !== 'admin') return res.status(401).json({ error: 'Unauthorized' });
    try {
        const executive = await User.findById(req.params.id);
        if (!executive || executive.role !== 'sales_executive') return res.status(404).json({ error: 'Executive not found' });

        // Calculate pending commission again for safety
        const retailers = await User.find({ linkedExecutive: executive._id });
        const retailerIds = retailers.map(r => r._id);
        const orders = await Order.find({ 
            user: { $in: retailerIds }
        });

        let pendingPurchases = 0;
        orders.forEach(o => {
            if (!executive.lastPayoutDate || new Date(o.createdAt) > new Date(executive.lastPayoutDate)) {
                const sub = Math.round(o.totalAmount || 0);
                const fee = (o.paymentMode === 'cod') ? Math.round(sub * 0.1) : 0;
                pendingPurchases += (sub + fee);
            }
        });

        const pendingCommission = Math.round(pendingPurchases * 0.03);

        if (pendingCommission <= 0) {
            return res.status(400).json({ error: 'No pending commission to pay.' });
        }

        // Create Payout Record
        const payout = new ExecutivePayout({
            executiveId: executive._id,
            amount: pendingCommission,
            transactionId: 'PAY-' + Date.now() + '-' + Math.floor(Math.random() * 1000),
            periodEnd: new Date()
        });
        await payout.save();

        // Update Executive Last Payout Date
        executive.lastPayoutDate = new Date();
        await executive.save();

        res.json({ success: true, message: `Payout of ₹${pendingCommission.toLocaleString()} processed successfully.` });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Invoice Route
app.get('/admin/invoice/:id', async (req, res) => {
    if (!req.session.user || req.session.user.role !== 'admin') return res.redirect('/login');
    try {
        const order = await Order.findById(req.params.id).populate('auction').populate('user');
        if (!order) return res.send('Order not found');
        res.render('invoice', { order });
    } catch (err) {
        res.status(500).send(err.message);
    }
});


app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
