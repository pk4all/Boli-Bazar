require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const session = require('express-session');
const path = require('path');
const Auction = require('./models/Auction');
const User = require('./models/User');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.set('view engine', 'ejs');

// Session Config
app.use(session({
    secret: 'bolibazar_arctic_secret',
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 1000 * 60 * 60 * 24 } // 1 day
}));

// Middleware to check if user is admin
const isAdmin = (req, res, next) => {
    if (req.session.user && req.session.user.role === 'admin') {
        next();
    } else {
        res.status(403).send('Access Denied: Admins Only');
    }
};

// Global User Context Middleware
app.use((req, res, next) => {
    res.locals.user = req.session.user || null;
    next();
});

// MongoDB Connection
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/bolibazar';
mongoose.connect(MONGO_URI)
    .then(() => console.log('Connected to MongoDB Successfully'))
    .catch(err => console.error('MongoDB Connection Error:', err));

// --- ROUTES ---

// Home Route
app.get('/', async (req, res) => {
    try {
        const auctions = await Auction.find({ status: 'Live' });
        res.render('index', { auctions });
    } catch (err) {
        res.status(500).send('Database Error');
    }
});

// Auth Views
app.get('/login', (req, res) => res.render('login', { error: null }));
app.get('/register', (req, res) => res.render('register', { error: null }));

// Register Logic
app.post('/register', async (req, res) => {
    const { username, email, phone, password, shopName, address, city, state, pincode } = req.body;
    try {
        const newUser = new User({ 
            username, 
            email, 
            phone, 
            password, 
            shopName, 
            address, 
            city, 
            state, 
            pincode 
        });
        await newUser.save();
        req.session.user = { 
            id: newUser._id, 
            username: newUser.username, 
            isRegistered: true, 
            role: newUser.role,
            shopName: newUser.shopName
        };
        res.redirect('/');
    } catch (err) {
        console.error('Registration Error:', err);
        res.render('register', { error: 'Registration failed. Email might already be registered.' });
    }
});

// Login Logic
app.post('/login', async (req, res) => {
    const { email, password } = req.body;
    try {
        const user = await User.findOne({ email });
        if (user && await user.comparePassword(password)) {
            req.session.user = { id: user._id, username: user.username, isRegistered: user.isRegistered, role: user.role, walletBalance: user.walletBalance };
            res.redirect('/');
        } else {
            res.render('login', { error: 'Invalid email or password.' });
        }
    } catch (err) {
        res.status(500).send('Server Error');
    }
});

// --- NEW ROUTES ---

// Retailer Dashboard
app.get('/dashboard', async (req, res) => {
    if (!req.session.user) return res.redirect('/login');
    try {
        const user = await User.findById(req.session.user.id).populate('bids').populate('wonAuctions');
        res.render('dashboard', { user });
    } catch (err) {
        res.status(500).send('Error loading dashboard');
    }
});

// Admin Dashboard
app.get('/admin', isAdmin, async (req, res) => {
    try {
        const auctions = await Auction.find().sort({ createdAt: -1 });
        const users = await User.find({ role: 'retailer' });
        res.render('admin', { auctions, users });
    } catch (err) {
        res.status(500).send('Error loading admin panel');
    }
});

// Product Detail
app.get('/product/:id', async (req, res) => {
    try {
        const auction = await Auction.findById(req.params.id);
        if (!auction) return res.status(404).send('Lot not found');
        res.render('product-detail', { auction });
    } catch (err) {
        res.status(500).send('Error');
    }
});


// Admin: Add Product
app.post('/admin/add-product', isAdmin, async (req, res) => {
    try {
        const newAuction = new Auction({
            ...req.body,
            startTime: new Date(),
            endTime: new Date(Date.now() + 1000 * 60 * 60 * 24) // 24 hours
        });
        await newAuction.save();
        res.redirect('/admin');
    } catch (err) {
        res.status(500).send('Error adding product');
    }
});

// Admin: Delete Product
app.post('/admin/delete-product/:id', isAdmin, async (req, res) => {
    try {
        await Auction.findByIdAndDelete(req.params.id);
        res.redirect('/admin');
    } catch (err) {
        res.status(500).send('Error deleting product');
    }
});

// Logout
app.get('/logout', (req, res) => {
    req.session.destroy();
    res.redirect('/');
});

// Start Server
app.listen(PORT, () => {
    console.log(`Boli Bazar Server running at http://localhost:${PORT}`);
});
