const mongoose = require('mongoose');

const LeaderboardSnapshotSchema = new mongoose.Schema({
    month: { type: String, required: true }, // e.g., "April 2026"
    year: { type: Number, required: true },
    winners: [{
        rank: Number,
        username: String,
        shopName: String,
        city: String,
        coins: Number,
        profileImage: String,
        mobileNumber: String // The user specifically asked for mobile no.
    }],
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('LeaderboardSnapshot', LeaderboardSnapshotSchema);
