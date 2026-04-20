const mongoose = require('mongoose');
require('dotenv').config();
const Order = require('../models/Order');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/bolibazar';

async function fixOrders() {
    try {
        await mongoose.connect(MONGO_URI);
        console.log('Connected to DB...');

        const orders = await Order.find();
        console.log(`Found ${orders.length} orders to check.`);

        let updatedCount = 0;

        for (const order of orders) {
            let changed = false;

            // 1. Ensure paidAmount is set based on paymentMode if 0
            if (order.paidAmount === 0 || !order.paidAmount) {
                if (order.paymentMode === 'full') {
                    order.paidAmount = order.totalAmount;
                } else {
                    order.paidAmount = order.totalAmount * 0.1;
                }
                changed = true;
            }

            // 2. Ensure paymentHistory has at least one entry
            if (!order.paymentHistory || order.paymentHistory.length === 0) {
                order.paymentHistory = [{
                    amount: order.paidAmount,
                    date: order.createdAt || new Date(),
                    method: order.paymentMode === 'full' ? 'Full' : 'Advance'
                }];
                changed = true;
            }

            if (changed) {
                await order.save();
                updatedCount++;
            }
        }

        console.log(`Successfully updated ${updatedCount} orders.`);
        process.exit(0);
    } catch (err) {
        console.error('Error fixing orders:', err);
        process.exit(1);
    }
}

fixOrders();
