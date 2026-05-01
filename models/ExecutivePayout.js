const mongoose = require('mongoose');

const executivePayoutSchema = new mongoose.Schema({
    executiveId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    amount: {
        type: Number,
        required: true
    },
    payoutDate: {
        type: Date,
        default: Date.now
    },
    transactionId: {
        type: String,
        unique: true
    },
    status: {
        type: String,
        enum: ['Paid', 'Pending'],
        default: 'Paid'
    },
    periodStart: Date,
    periodEnd: Date,
    note: String
}, { timestamps: true });

module.exports = mongoose.model('ExecutivePayout', executivePayoutSchema);
