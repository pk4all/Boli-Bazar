import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Full name is required'],
    trim: true,
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: 6,
  },
  phone: {
    type: String,
    required: [true, 'Phone number is required'],
    trim: true,
  },
  role: {
    type: String,
    enum: ['retailer', 'admin'],
    default: 'retailer',
  },

  // Retailer-specific fields
  shopName: { type: String, trim: true },
  gstNumber: { type: String, trim: true },
  pinCode: { type: String, trim: true },
  city: { type: String, trim: true },
  state: { type: String, trim: true },
  address: { type: String, trim: true },
  businessType: {
    type: String,
    enum: ['Sole Proprietor', 'Partnership', 'Pvt Ltd', 'LLP', 'Other'],
    default: 'Sole Proprietor',
  },

  // Platform fields
  tokenBalance: { type: Number, default: 0 },
  isVerified: { type: Boolean, default: false },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

export default mongoose.models.User || mongoose.model('User', UserSchema);
