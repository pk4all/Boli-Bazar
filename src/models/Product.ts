import mongoose from 'mongoose';

const ProductSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Please provide a title'],
    maxlength: [100, 'Title cannot be more than 100 characters'],
  },
  description: {
    type: String,
    required: [true, 'Please provide a description'],
  },
  images: {
    type: [String],
    default: [],
  },
  unit: {
    type: String,
    default: 'pcs',
  },
  lotSize: {
    type: Number,
    required: true,
  },
  startPrice: {
    type: Number,
    required: true,
  },
  currentPrice: {
    type: Number,
    required: true,
  },
  moq: {
    type: Number,
    required: true,
    default: 1,
  },
  stock: {
    type: Number,
    required: true,
  },
  totalStock: {
    type: Number,
    required: true,
  },
  buyerCount: {
    type: Number,
    default: 0,
  },
  category: {
    type: String,
    required: true,
  },
  endTime: {
    type: Date,
    required: true,
  },
  priceHikePercentage: {
    type: Number,
    default: 0.01, // 1%
  },
  lastPriceUpdate: {
    type: Date,
    default: Date.now,
  },
  active: {
    type: Boolean,
    default: true,
  },
}, { timestamps: true });

export default mongoose.models.Product || mongoose.model('Product', ProductSchema);
