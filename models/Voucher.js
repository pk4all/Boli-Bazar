const mongoose = require('mongoose');

const voucherSchema = new mongoose.Schema({
    date: {
        type: Date,
        default: Date.now
    },
    title: {
        type: String,
        required: true
    },
    category: {
        type: String,
        enum: ['Purchase', 'Salary', 'Rent', 'Travel', 'Marketing', 'Office', 'Other'],
        required: true
    },
    amount: {
        type: Number,
        required: true
    },
    note: String,
    addedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }
}, { timestamps: true });

module.exports = mongoose.model('Voucher', voucherSchema);
