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

    const numAmount = parseAdminAmount(amount);
    if (!userId || numAmount === null) {
      return NextResponse.json({ error: 'Missing or invalid parameters' }, { status: 400 });
    }

    await connectToDatabase();
    
    await User.findByIdAndUpdate(userId, { 
      $inc: { 'inventory.seeds': numAmount } 
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Server Error' }, { status: 500 });
  }
}
