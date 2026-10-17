import { NextRequest, NextResponse } from 'next/server';
import { isAdminRequest } from '@/lib/adminAuth';
import connectToDatabase from '@/lib/db';
import User from '@/models/User';
import { parseAdminAmount } from '@/lib/adminAmount';

export async function POST(req: NextRequest) {
  try {
    if (!isAdminRequest(req)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { userId, amount } = await req.json();

    if (!userId || amount === undefined || amount === null) {
      return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
    }

    const numAmount = parseAdminAmount(amount);
    if (numAmount === null) {
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
