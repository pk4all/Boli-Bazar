require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const session = require('express-session');
const path = require('path');
const multer = require('multer');
const fs = require('fs');
const Auction = require('./models/Auction');
const User = require('./models/User');
const Banner = require('./models/Banner');
const Order = require('./models/Order');
const Reward = require('./models/Reward');

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
    secret: 'bolibazar_arctic_secret',
    resave: false,
    saveUninitialized: false,
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
        const totalValue = buyQty * (auction.currentBid || auction.initialPrice);
        const fee = paymentMode === 'cod' ? totalValue * 0.1 : 0;
        const finalPayable = totalValue + fee;
        
        user.walletBalance = (user.walletBalance || 0) + finalPayable;
        if (!user.wonAuctions) user.wonAuctions = [];
        if (!user.wonAuctions.includes(auction._id)) user.wonAuctions.push(auction._id);
        
        auction.stockRemaining = Math.max(0, (auction.stockRemaining || 0) - buyQty);
        auction.totalBuyers = (auction.totalBuyers || 0) + 1;

        if (auction.lotSize > 0) {
            auction.stockSoldPercent = Math.min(100, Math.round(((auction.lotSize - auction.stockRemaining) / auction.lotSize) * 100));
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
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/bolibazar';
mongoose.connect(MONGO_URI)
    .then(() => console.log('[STABLE-DB] Connected Successfully'))
    .catch(err => console.error('[STABLE-DB] Connection Error:', err));

// --- ROUTES ---

// Home Route (Leaderboard + Hero Slider + Live Bidding Strip)
app.get('/', async (req, res) => {
    try {
        const banners = await Banner.find({ isActive: true }).sort({ order: 1 }).lean();
        const liveProducts = await Auction.find({ status: 'Live' }).sort({ totalBuyers: -1 }).limit(5).lean();
        
        // Fetch real leaderboard data
        const leaderboard = await User.find({ role: 'retailer' })
            .sort({ walletBalance: -1, createdAt: 1 })
            .select('username shopName city walletBalance profileImage')
            .limit(10)
            .lean();

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
        const auctions = await Auction.find({ status: 'Live' }).lean();
        const upcomingAuctions = await Auction.find({ status: 'Upcoming' }).lean();
        const closedAuctions = await Auction.find({ status: 'Closed' }).sort({ endTime: -1 }).limit(3).lean();
        
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
        const users = await User.find({ role: 'retailer' }).sort({ createdAt: -1 });
        const banners = await Banner.find().sort({ order: 1 });
        const rewards = await Reward.find().sort({ rank: 1 });
        
        // Dynamic Orders with Filter
        const orders = await Order.find(query).populate('user').populate('auction').sort({ createdAt: -1 });

        // Financial Metrics Calculations (Source of Truth: paymentHistory)
        const allOrders = await Order.find(); 
        
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);
        
        // Total Received (Lifetime)
        const totalRevenue = allOrders.reduce((sum, order) => {
            return sum + (order.paymentHistory || []).reduce((pSum, p) => pSum + p.amount, 0);
        }, 0);
        
        // Today's Collection
        const todayRevenue = allOrders.reduce((sum, order) => {
            const todayPayments = (order.paymentHistory || []).filter(p => new Date(p.date) >= todayStart);
            return sum + todayPayments.reduce((pSum, p) => pSum + p.amount, 0);
        }, 0);
            
        // Total Outstanding COD (Balance yet to be collected)
        const pendingCod = allOrders.reduce((sum, order) => {
            const subtotal = order.totalAmount;
            const fee = (order.paymentMode === 'cod') ? (subtotal * 0.1) : 0;
            const orderValue = subtotal + fee;
            const paidNowTotal = (order.paymentHistory || []).reduce((pSum, p) => pSum + p.amount, 0);
            const remaining = orderValue - paidNowTotal;
            return sum + (remaining > 0 ? remaining : 0);
        }, 0);

        // NEW: Operational Metrics
        const retailerCount = await User.countDocuments({ role: 'retailer' });
        const liveProductsCount = await Auction.countDocuments({ status: 'Live' });
        const upcomingProductsCount = await Auction.countDocuments({ status: 'Upcoming' });

        // Weekly Sales Performance Data (Labels & Values)
        const weekLabels = [];
        const weekData = [];
        for (let i = 6; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            date.setHours(0, 0, 0, 0);
            const endOfDay = new Date(date);
            endOfDay.setHours(23, 59, 59, 999);

            weekLabels.push(date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }));
            
            let dailySum = 0;
            allOrders.forEach(o => {
                const dayPayments = (o.paymentHistory || []).filter(p => {
                    const pDate = new Date(p.date);
                    return pDate >= date && pDate <= endOfDay;
                });
                dailySum += dayPayments.reduce((s, p) => s + p.amount, 0);
            });
            weekData.push(dailySum);
        }

        // Unique categories for the launch form
        const categories = [...new Set(auctions.map(a => a.category))].filter(Boolean);

        res.render('admin', { 
            auctions, users, banners, rewards, orders, 
            totalRevenue, todayRevenue, pendingCod,
            retailerCount, liveProductsCount, upcomingProductsCount,
            weekLabels, weekData, categories,
            startDate: startDate || '',
            endDate: endDate || ''
        });
    } catch (err) {
        console.error('Admin Route Error:', err);
        res.redirect('/');
    }
});

// Admin: Add Auction
app.post('/admin/add-product', upload.array('images', 4), async (req, res) => {
    if (!req.session.user || req.session.user.role !== 'admin') return res.redirect('/login');
    try {
        let { title, description, initialPrice, lotSize, category, newCategory, moq, hikePercentage, videoUrl, status } = req.body;
        
        // Handle New Category Creation
        if (category === 'other' && newCategory) {
            category = newCategory.trim();
        }
        const images = req.files ? req.files.map(f => `/uploads/${f.filename}`) : [];
        
        const newAuction = new Auction({
            title,
            description,
            initialPrice,
            lotSize,
            category,
            moq: moq || 1,
            hikePercentage: hikePercentage || 0,
            videoUrl,
            status: status || 'Live',
            images: images,
            imageUrl: images[0] || '', // Use first image as primary
            currentBid: initialPrice, // Initialize currentBid
            totalBuyers: 0,
            stockRemaining: lotSize,
            stockSoldPercent: 0,
            unitType: 'bag', // Default unit
            startTime: new Date(), // Default to now
            endTime: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // Default to 7 days
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

// --- AUTH ROUTES ---
app.get('/login', (req, res) => res.render('login', { error: null }));
app.get('/register', (req, res) => res.render('register', { error: null }));

app.post('/login', async (req, res) => {
    const { email, password } = req.body;
    try {
        const user = await User.findOne({ email: email.toLowerCase() });
        if (user && await user.comparePassword(password)) {
            req.session.user = { id: user._id, username: user.username, role: user.role };
            if (user.role === 'admin') return res.redirect('/admin');
            return res.redirect('/auctions');
        }
        res.render('login', { error: 'Invalid credentials' });
    } catch (err) {
        res.render('login', { error: 'Login Error' });
    }
});

app.post('/register', async (req, res) => {
    try {
        const newUser = new User(req.body);
        await newUser.save();
        req.session.user = { id: newUser._id, username: newUser.username, role: newUser.role };
        res.redirect('/auctions');
    } catch (err) {
        res.render('register', { error: 'Registration failed' });
    }
});

app.get('/dashboard', async (req, res) => {
    if (!req.session.user) return res.redirect('/login');
    try {
        const user = await User.findById(req.session.user.id).populate('bids').populate('wonAuctions');
        
        if (!user) {
            req.session.destroy();
            return res.redirect('/login');
        }
        
        // --- SHARED RANKING LOGIC (Must match /api/leaderboard) ---
        const allRetailers = await User.find({ role: 'retailer' })
            .sort({ walletBalance: -1, createdAt: 1 })
            .lean();
        
        const userIdx = allRetailers.findIndex(u => u._id.toString() === user._id.toString());
        const rank = userIdx !== -1 ? userIdx + 1 : (allRetailers.length + 1);
        const totalRetailers = Math.max(allRetailers.length, 1);
        
        // Path to Top 3
        const top3 = allRetailers.slice(0, 3);
        const top3Balance = (top3.length >= 3) ? top3[2].walletBalance : (top3.length > 0 ? top3[0].walletBalance : 10000);
        const gapToTop3 = (rank > 3) ? Math.max(0, top3Balance - user.walletBalance + 1) : 0;
        
        const userProfitMargin = 18.5; 
        const avgProfitMargin = 12.4;
        
        res.render('dashboard', { 
            user, 
            rank, 
            totalRetailers, 
            gapToTop3, 
            userProfitMargin, 
            avgProfitMargin,
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
            { $group: {
                _id: "$user",
                username: { $first: "$username" },
                city: { $first: "$city" },
                totalQuantity: { $sum: "$quantity" },
                totalAmount: { $sum: "$totalAmount" }
            }},
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
        
        const subtotal = order.totalAmount;
        const totalValue = subtotal + (order.paymentMode === 'cod' ? subtotal * 0.1 : 0);
        const balance = totalValue - order.paidAmount;

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
