import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import User from '@/models/User';

export async function POST(request: Request) {
  try {
    await dbConnect();
    const body = await request.json();
    const {
      name, email, password, phone, shopName,
      gstNumber, pinCode, city, state, address, businessType
    } = body;

    // Validation
    if (!name || !email || !password || !phone || !shopName || !pinCode || !state || !city) {
      return NextResponse.json(
        { error: 'Please fill all required fields' },
        { status: 400 }
      );
    }
    if (password.length < 6) {
      return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 });
    }

    // Check existing user
    const existing = await User.findOne({ email });
    if (existing) {
      return NextResponse.json({ error: 'Email already registered. Please login.' }, { status: 409 });
    }

    // Simple password storing (for demo — in production use bcrypt)
    const user = await User.create({
      name, email, password, phone, shopName,
      gstNumber, pinCode, city, state, address, businessType,
      role: 'retailer',
      tokenBalance: 0,
      isVerified: false,
    });

    return NextResponse.json({
      success: true,
      message: 'Registration successful! Please wait for admin verification.',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        shopName: user.shopName,
        role: user.role,
      }
    }, { status: 201 });

  } catch (error: any) {
    console.error('Register error:', error);
    return NextResponse.json({ error: 'Registration failed. Please try again.' }, { status: 500 });
  }
}
