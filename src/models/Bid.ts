import mongoose from 'mongoose';

const BidSchema = new mongoose.Schema({
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true,
  },
  userId: {
    type: String, // Mock user ID for now
    required: true,
  },
  amount: {
    type: Number,
    required: true,
  },
  quantity: {
    type: Number,
    required: true,
    min: 1,
  },
  tokenPaid: {
    type: Number,
    required: true,
  },
  paymentMode: {
    type: String,
    enum: ['COD', 'Full Payment'],
    default: 'COD',
  },
  status: {
    type: String,
    enum: ['Pending', 'Confirmed', 'Outbid'],
    default: 'Pending',
  },
}, { timestamps: true });

export default mongoose.models.Bid || mongoose.model('Bid', BidSchema);
