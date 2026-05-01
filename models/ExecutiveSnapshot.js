const mongoose = require('mongoose');

const ExecutiveSnapshotSchema = new mongoose.Schema({
    executiveId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    month: { type: String, required: true }, // e.g. "April 2026"
    year: { type: Number, required: true },
    totalSales: { type: Number, default: 0 },
    totalCommission: { type: Number, default: 0 },
    retailerCount: { type: Number, default: 0 },
    retailerPerformance: [{
        retailerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        username: String,
        shopName: String,
        phone: String,
        sales: { type: Number, default: 0 },
        commission: { type: Number, default: 0 }
    }]
}, { timestamps: true });

module.exports = mongoose.model('ExecutiveSnapshot', ExecutiveSnapshotSchema);
