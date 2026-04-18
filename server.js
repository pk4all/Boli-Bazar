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

// FORCED ABSOLUTE CONFIGURATION
const VIEWS_DIR = path.join(__dirname, 'views');
app.set('views', VIEWS_DIR);
app.set('view engine', 'ejs');
app.set('view cache', false);

// 1. ABSOLUTE DIAGNOSTIC LOGGING
console.log(`[INIT] SERVER STARTING FROM: ${__dirname}`);
console.log(`[INIT] VIEWS DIRECTORY SET TO: ${VIEWS_DIR}`);

app.use((req, res, next) => {
    console.log(`[TRAFFIC] ${new Date().toLocaleTimeString()} - ${req.method} ${req.url}`);
    next();
});

// 2. CORE MIDDLEWARES
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

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
    .then(() => console.log('Connected to MongoDB Successfully'))
    .catch(err => console.error('MongoDB Connection Error:', err));

// --- FORCED ABSOLUTE ROUTES ---

// Home Route (Leaderboard) - Screenshot Match v6
app.get('/', (req, res) => {
    try {
        const indexPath = path.join(VIEWS_DIR, 'index.ejs');
        console.log(`[RENDER] Rendering absolute path: ${indexPath}`);
        res.render(indexPath, { 
            user: req.session.user || null,
            v: Date.now() // Cache Buster
        });
    } catch (err) {
        console.error('Home Render Error:', err);
        res.status(500).send('Design Match Error');
    }
});

// Live Auctions Route
app.get('/auctions', async (req, res) => {
    if (!req.session.user) return res.redirect('/login');
    try {
        const auctions = await Auction.find({ status: 'Live' });
        res.render('auctions', { auctions, user: req.session.user });
    } catch (err) {
        res.status(500).send('DB Error');
    }
});

app.get('/login', (req, res) => res.render('login', { error: null }));
app.get('/register', (req, res) => res.render('register', { error: null }));

app.post('/login', async (req, res) => {
    const { email, password } = req.body;
    try {
        const user = await User.findOne({ email });
        if (user && await user.comparePassword(password)) {
            req.session.user = { id: user._id, username: user.username, role: user.role, walletBalance: user.walletBalance || 0 };
            return res.redirect('/auctions');
        }
        res.render('login', { error: 'Invalid credentials' });
    } catch (err) {
        res.status(500).send('Login Error');
    }
});

app.post('/register', async (req, res) => {
    try {
        const newUser = new User(req.body);
        await newUser.save();
        req.session.user = { id: newUser._id, username: newUser.username, role: newUser.role, walletBalance: 0 };
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

app.listen(PORT, () => console.log(`Boli Bazar Server running at http://localhost:${PORT}`));
