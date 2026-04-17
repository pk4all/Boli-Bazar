import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import User from '@/models/User';

// Hardcoded admin credentials for demo
const ADMIN_EMAIL = 'admin@bolibazar.com';
const ADMIN_PASSWORD = 'admin@123';

export async function POST(request: Request) {
  try {
    await dbConnect();
    const body = await request.json();
    const { email, password, role } = body;

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
    }

    // Admin login
    if (role === 'admin') {
      if (email === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
        return NextResponse.json({
          success: true,
          user: {
            id: 'admin-001',
            name: 'Admin',
            email: ADMIN_EMAIL,
            role: 'admin',
            tokenBalance: 0,
          }
        });
      }
      return NextResponse.json({ error: 'Invalid admin credentials' }, { status: 401 });
    }

    // Retailer login
    const user = await User.findOne({ email, role: 'retailer' });
    if (!user) {
      return NextResponse.json({ error: 'Account not found. Please register first.' }, { status: 404 });
    }

    if (user.password !== password) {
      return NextResponse.json({ error: 'Incorrect password. Please try again.' }, { status: 401 });
    }

    if (!user.isActive) {
      return NextResponse.json({ error: 'Your account has been deactivated. Contact support.' }, { status: 403 });
    }

    return NextResponse.json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        shopName: user.shopName,
        state: user.state,
        city: user.city,
        role: user.role,
        tokenBalance: user.tokenBalance,
        isVerified: user.isVerified,
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({ error: 'Login failed. Please try again.' }, { status: 500 });
  }
}
