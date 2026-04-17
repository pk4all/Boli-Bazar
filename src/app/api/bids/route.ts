import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Bid from '@/models/Bid';
import Product from '@/models/Product';

export async function POST(request: Request) {
  try {
    await dbConnect();
    const body = await request.json();
    const { productId, quantity, paymentMode } = body;

    const product = await Product.findById(productId);
    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    // Business Logic: 10% Advance mandatory
    const tokenPaid = Math.round(product.currentPrice * quantity * 0.1);

    const newBid = await Bid.create({
      productId,
      userId: 'retailer_' + Math.floor(Math.random() * 1000), // Random mock user
      amount: product.currentPrice,
      quantity,
      tokenPaid,
      paymentMode,
      status: 'Confirmed',
    });

    // Business Logic: Dynamic Price Hike (1% increase per buy)
    // Formula: currentPrice = currentPrice * 1.01
    const hike = product.currentPrice * 0.01;
    product.currentPrice = Math.round(product.currentPrice + hike);
    product.buyerCount = (product.buyerCount || 0) + 1;
    product.stock = Math.max(0, product.stock - quantity);
    product.lastPriceUpdate = new Date();
    
    await product.save();

    return NextResponse.json(newBid);
  } catch (error) {
    console.error('Bid Error:', error);
    return NextResponse.json({ error: 'Failed to place bid' }, { status: 500 });
  }
}
