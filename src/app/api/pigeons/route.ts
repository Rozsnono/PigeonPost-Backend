import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import Pigeon from '@/models/Pigeon';
import { verifyAuth, unauthorizedResponse, CORS_HEADERS } from '@/lib/auth';

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}

// GET /api/pigeons — get my pigeons
export async function GET(req: NextRequest) {
  const auth = verifyAuth(req);
  if (!auth) return unauthorizedResponse();

  try {
    await connectToDatabase();
    const pigeons = await Pigeon.find({ ownerId: auth.userId }).lean();
    return NextResponse.json({ pigeons }, { status: 200, headers: CORS_HEADERS });
  } catch (error) {
    console.error('GET /api/pigeons error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500, headers: CORS_HEADERS });
  }
}
