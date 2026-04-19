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
    next();
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
        
        console.log(`[STABLE-RENDER] Serving ${banners.length} Banners and ${liveProducts.length} Live Products [TRACER: PRIMARY_DESKTOP]`);
        
        res.render('index', { 
            banners,
            liveProducts,
            debug: "ALIVE_IN_PRIMARY_DESKTOP",
            user: req.session.user || null,
            v: Date.now() 
        });
    } catch (err) {
        console.error('[STABLE-ERROR] Home Route:', err);
        res.render('index', { banners: [], liveProducts: [], user: req.session.user || null, v: Date.now() });
    }
});

app.get('/auctions', async (req, res) => {
    if (!req.session.user) return res.redirect('/login');
    try {
        const auctions = await Auction.find({ status: 'Live' }).lean();
        res.render('auctions', { auctions, user: req.session.user });
    } catch (err) {
        res.status(500).send('Auctions Error');
    }
});

// --- ADMIN ROUTES ---
app.get('/admin', async (req, res) => {
    if (!req.session.user || req.session.user.role !== 'admin') {
        return res.redirect('/login');
    }
    try {
        const auctions = await Auction.find().sort({ createdAt: -1 });
        const users = await User.find({ role: 'retailer' });
        const banners = await Banner.find().sort({ order: 1 });
        res.render('admin', { auctions, users, banners });
    } catch (err) {
        res.redirect('/');
    }
});

// Admin: Add Auction
app.post('/admin/add-product', async (req, res) => {
    if (!req.session.user || req.session.user.role !== 'admin') return res.redirect('/login');
    try {
        const newAuction = new Auction(req.body);
        await newAuction.save();
        res.redirect('/admin');
    } catch (err) {
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

// --- AUTH ROUTES ---
app.get('/login', (req, res) => res.render('login', { error: null }));
app.get('/register', (req, res) => res.render('register', { error: null }));

app.post('/login', async (req, res) => {
    const { email, password } = req.body;
    try {
        const user = await User.findOne({ email });
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
        res.render('dashboard', { user });
    } catch (err) {
        res.status(500).send('Dashboard Error');
    }
});

app.get('/logout', (req, res) => {
    req.session.destroy();
    res.redirect('/');
});

const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`[STABLE-READY] Running on http://localhost:${PORT}`);
});
