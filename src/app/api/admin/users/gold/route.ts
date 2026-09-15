import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import User from '@/models/User';

export async function POST(req: NextRequest) {
  try {
    const adminSecret = process.env.ADMIN_SECRET;
    if (req.headers.get('authorization') !== `Bearer ${adminSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { userId, amount } = await req.json();

    if (!userId || amount === undefined || amount === null) {
      return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
    }

    const numAmount = Number(amount);
    if (isNaN(numAmount)) {
      return NextResponse.json({ error: 'Invalid amount' }, { status: 400 });
    }

    await connectToDatabase();

    const user = await User.findByIdAndUpdate(
      userId,
      { $inc: { gold: numAmount } },
      { new: true }
    );

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, newGold: user.gold });
  } catch (error) {
    console.error('Admin give gold error:', error);
    return NextResponse.json({ error: 'Server Error' }, { status: 500 });
  }
}
