import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import connectToDatabase from '@/lib/db';
import User from '@/models/User';
import { z } from 'zod';
import { createLog } from '@/lib/logger';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

const loginSchema = z.object({
  usernameOrEmail: z.string().min(3),
  password: z.string().min(6),
});

// Handle CORS preflight requests from mobile
export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}

export async function POST(req: NextRequest) {
  console.log('=== [login/route] POST called ===');
  console.log('URL:', req.url);
  try {
    console.log('[login/route] Connecting to database...');
    await connectToDatabase();
    console.log('[login/route] Database connected.');

    const body = await req.json();
    console.log('[login/route] Request body:', JSON.stringify(body));

    const validation = loginSchema.safeParse(body);
    if (!validation.success) {
      console.log('[login/route] Validation failed:', JSON.stringify(validation.error.issues));
      return NextResponse.json(
        { error: 'Invalid data', details: validation.error.issues },
        { status: 400, headers: CORS_HEADERS }
      );
    }

    const { usernameOrEmail, password } = validation.data;
    console.log('[login/route] Looking up user:', usernameOrEmail);

    // Find user by username OR email (case-insensitive)
    const searchRegex = new RegExp(`^${usernameOrEmail}$`, 'i');
    let user;
    try {
      user = await User.findOne({
        $or: [{ email: searchRegex }, { username: searchRegex }],
      });
    } catch (dbErr) {
      console.error('[login/route] DB findOne error:', dbErr);
      return NextResponse.json(
        { error: 'Database error' },
        { status: 500, headers: CORS_HEADERS }
      );
    }

    if (!user) {
      console.log(`[login/route] User NOT FOUND for: "${usernameOrEmail}"`);
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401, headers: CORS_HEADERS }
      );
    }

    console.log('[login/route] User found:', user.username, '| passwordHash exists:', !!user.passwordHash);

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    console.log('[login/route] Password valid:', isPasswordValid);

    if (!isPasswordValid) {
      console.log(`[login/route] Incorrect password for user: ${user.username}`);
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401, headers: CORS_HEADERS }
      );
    }

    // Check if user is banned
    if (user.status === 'banned') {
      return NextResponse.json(
        { error: 'Account is banned' },
        { status: 403, headers: CORS_HEADERS }
      );
    }

    const jwtSecret = process.env.JWT_SECRET || 'fallback_secret_for_development';

    // Generate token
    const token = jwt.sign(
      {
        userId: user._id,
        username: user.username,
        role: user.role,
      },
      jwtSecret,
      { expiresIn: '7d' }
    );

    console.log('[login/route] Login successful for:', user.username);
    await createLog('info', 'Auth', `Sikeres bejelentkezés: ${user.username}`, { userId: user._id });

    return NextResponse.json(
      {
        message: 'Login successful',
        token,
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
          role: user.role,
        },
      },
      { status: 200, headers: CORS_HEADERS }
    );
  } catch (error) {
    console.error('[login/route] Unhandled error:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500, headers: CORS_HEADERS }
    );
  }
}
