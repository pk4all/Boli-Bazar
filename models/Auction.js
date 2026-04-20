const mongoose = require('mongoose');

const AuctionSchema = new mongoose.Schema({
    title: { type: String, required: true },
    description: { type: String },
    category: { type: String, default: 'General' },
    initialPrice: { type: Number, required: true },
    startedAtPrice: { type: Number },
    tokenAmount: { type: Number, default: 99 },
    currentBid: { type: Number },
    startTime: { type: Date, required: true },
    endTime: { type: Date, required: true },
    imageUrl: { type: String }, // Primary Image
    images: [{ type: String }], // Additional Images (up to 4)
    videoUrl: { type: String }, // Product Video Link
    lotSize: { type: Number, required: true },
    moq: { type: Number, default: 1 },
    unitType: { type: String, default: 'unit' }, // e.g., bag, tin, kg
    stockRemaining: { type: Number },
    stockSoldPercent: { type: Number, default: 0 },
    hikePercentage: { type: Number, default: 0 },
    isFeatured: { type: Boolean, default: false },
    closingSoon: { type: Boolean, default: false },
    totalBuyers: { type: Number, default: 0 },
    status: { type: String, enum: ['Live', 'Closed', 'Upcoming'], default: 'Live' }
}, { timestamps: true });

module.exports = mongoose.model('Auction', AuctionSchema);
