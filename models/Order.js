const mongoose = require('mongoose');

const OrderSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    auction: { type: mongoose.Schema.Types.ObjectId, ref: 'Auction', required: true },
    username: { type: String, required: true },
    city: { type: String },
    quantity: { type: Number, required: true },
    totalAmount: { type: Number, required: true },
    paymentMode: { type: String, enum: ['full', 'cod'], default: 'full' },
    status: { type: String, enum: ['Confirmed', 'Pending', 'Delivered'], default: 'Confirmed' }
}, { timestamps: true });

module.exports = mongoose.model('Order', OrderSchema);
