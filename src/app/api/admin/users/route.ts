import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import User from '@/models/User';

export async function GET(req: NextRequest) {
  try {
    const adminSecret = process.env.ADMIN_SECRET;
    if (req.headers.get('authorization') !== `Bearer ${adminSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();
    
    const users = await User.find({ isDeleted: false }).select('-passwordHash').sort({ createdAt: -1 }).lean();
    
    return NextResponse.json(users);
  } catch (error) {
    return NextResponse.json({ error: 'Server Error' }, { status: 500 });
  }
}

// Delete user (soft delete)
export async function DELETE(req: NextRequest) {
  try {
    const adminSecret = process.env.ADMIN_SECRET;
    if (req.headers.get('authorization') !== `Bearer ${adminSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('id');

    if (!userId) return NextResponse.json({ error: 'User ID missing' }, { status: 400 });

    await connectToDatabase();
    
    await User.findByIdAndUpdate(userId, { 
      isDeleted: true, 
      deletedAt: new Date() 
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Server Error' }, { status: 500 });
  }
}
