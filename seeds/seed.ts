import dbConnect from '../src/lib/db';
import Product from '../src/models/Product';

const products = [
  {
    title: '18W Fast Chargers - Production Lot (20,000 pcs)',
    description: 'High-quality 18W Fast Chargers, compatible with major brands. Direct from Noida factory. Bulk production lot clearance.',
    images: ['https://images.unsplash.com/photo-1583863788434-e58a36330cf0?auto=format&fit=crop&q=80&w=800'],
    unit: 'pcs',
    lotSize: 20000,
    startPrice: 35,
    currentPrice: 40,
    moq: 500,
    stock: 15400,
    totalStock: 20000,
    buyerCount: 128,
    category: 'Live Auction',
    endTime: new Date(Date.now() + 1000 * 60 * 60 * 4).toISOString(), 
    priceHikePercentage: 0.01,
  },
  {
    title: 'Samsung Galaxy S24 Ultra - Bulk Lot (10 Units)',
    description: 'Pristine condition, factory unlocked, mixed colors. High resale value for retailers.',
    images: ['https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?auto=format&fit=crop&q=80&w=800'],
    unit: 'Units',
    lotSize: 10,
    startPrice: 850000,
    currentPrice: 920000,
    moq: 1,
    stock: 8,
    totalStock: 10,
    buyerCount: 12,
    category: 'Live Auction',
    endTime: new Date(Date.now() + 1000 * 60 * 60 * 24).toISOString(),
    priceHikePercentage: 0.01,
  },
  {
    title: 'Premium Bluetooth Neckbands - 500 pcs Lot',
    description: 'High-bass neckbands, 40 hours playtime. Original factory packaging. Upcoming stock tomorrow.',
    images: ['https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&q=80&w=800'],
    unit: 'pcs',
    lotSize: 500,
    startPrice: 150,
    currentPrice: 150,
    moq: 50,
    stock: 500,
    totalStock: 500,
    buyerCount: 0,
    category: 'Upcoming Lots',
    endTime: new Date(Date.now() + 1000 * 60 * 60 * 36).toISOString(), 
    priceHikePercentage: 0.01,
  }
];

async function seed() {
  try {
    console.log('Connecting to database...');
    await dbConnect();
    console.log('Clearing existing products...');
    await Product.deleteMany({});
    console.log('Seeding products...');
    await Product.insertMany(products);
    console.log('Seeding completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
}

seed();
