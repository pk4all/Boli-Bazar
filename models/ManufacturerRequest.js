const mongoose = require('mongoose');

const manufacturerRequestSchema = new mongoose.Schema({
    companyName: { type: String, required: true },
    contactPerson: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String, required: true },
    categories: { type: String, required: true }, // comma separated or single
    city: { type: String, required: true },
    state: { type: String, required: true },
    gstNumber: { type: String },
    message: { type: String },
    status: { type: String, enum: ['Pending', 'Contacted', 'Approved', 'Rejected'], default: 'Pending' },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('ManufacturerRequest', manufacturerRequestSchema);
