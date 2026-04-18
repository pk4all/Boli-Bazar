const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema({
    username: { type: String, required: true }, // Changed unique: true to false to allow shop-driven naming, or use email as primary unique
    email: { type: String, required: true, unique: true },
    phone: { type: String, required: true },
    password: { type: String, required: true },
    shopName: { type: String, required: true },
    address: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String, required: true },
    pincode: { type: String, required: true },
    role: { type: String, enum: ['retailer', 'admin'], default: 'retailer' },
    isRegistered: { type: Boolean, default: true }, // Registration is now free by default
    walletBalance: { type: Number, default: 0 },
    bids: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Auction' }],
    wonAuctions: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Auction' }]
}, { timestamps: true });

// Hash password before saving
UserSchema.pre('save', async function() {
    if (!this.isModified('password')) return;
    try {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
    } catch (err) {
        throw err;
    }
});

// Method to compare password
UserSchema.methods.comparePassword = async function(candidatePassword) {
    return bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', UserSchema);
