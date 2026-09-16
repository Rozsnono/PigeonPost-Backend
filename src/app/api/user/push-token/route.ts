import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import connectToDatabase from '@/lib/db';
import User from '@/models/User';

export async function OPTIONS() {
  return NextResponse.json({}, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    }
  });
}

function withCors(response: NextResponse) {
  response.headers.set('Access-Control-Allow-Origin', '*');
  return response;
}

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return withCors(NextResponse.json({ error: 'Missing token' }, { status: 401 }));
    }
    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret') as { userId: string };

    const body = await req.json();
    const { pushToken } = body;

    if (!pushToken) {
      return withCors(NextResponse.json({ error: 'Missing pushToken' }, { status: 400 }));
    }

    await connectToDatabase();

    const user = await User.findById(decoded.userId);
    if (!user) {
      return withCors(NextResponse.json({ error: 'User not found' }, { status: 404 }));
    }

    user.expoPushToken = pushToken;
    await user.save();

    return withCors(NextResponse.json({ success: true }));
  } catch (error) {
    console.error('Update push token error:', error);
    return withCors(NextResponse.json({ error: 'Server Error' }, { status: 500 }));
  }
}
