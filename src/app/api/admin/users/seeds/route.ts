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

    if (!userId || !amount) {
      return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
    }

    await connectToDatabase();
    
    await User.findByIdAndUpdate(userId, { 
      $inc: { 'inventory.seeds': amount } 
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Server Error' }, { status: 500 });
  }
}
