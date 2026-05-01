const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema({
    username: { type: String, required: true },
    email: { type: String }, // Optional
    phone: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    shopName: { type: String, required: true },
    address: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String, required: true },
    pincode: { type: String, required: true },
    role: { type: String, enum: ['retailer', 'admin', 'sales_executive'], default: 'retailer' },
    isRegistered: { type: Boolean, default: true }, // Registration is now free by default
    walletBalance: { type: Number, default: 0 },
    profileImage: { type: String, default: null },
    bids: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Auction' }],
    wonAuctions: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Auction' }],
    executiveCode: { type: String }, // Unique code for sales executives (e.g. SE-1001)
    linkedExecutive: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // The sales executive who onboarded this retailer
    approvalStatus: { type: String, enum: ['Pending', 'Approved', 'Rejected'], default: 'Approved' },
    bankAccountNo: { type: String },
    bankName: { type: String },
    ifscCode: { type: String },
    lastPayoutDate: { type: Date, default: null }
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
