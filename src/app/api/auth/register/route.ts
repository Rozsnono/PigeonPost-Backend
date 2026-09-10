import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcrypt';
import connectToDatabase from '@/lib/db';
import User from '@/models/User';
import Pigeon from '@/models/Pigeon';
import { z } from 'zod';

import { verifyAuth, CORS_HEADERS } from '@/lib/auth';

const registerSchema = z.object({
  username: z.string().min(3).max(30),
  email: z.string().email(),
  password: z.string().min(6)
});

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}

export async function POST(req: NextRequest) {
  try {
    await connectToDatabase();
    
    const body = await req.json();
    const validation = registerSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({ error: 'Invalid data', details: validation.error.issues }, { status: 400, headers: CORS_HEADERS });
    }

    const { username, email, password } = validation.data;

    // Check if user already exists
    const existingUser = await User.findOne({ $or: [{ email }, { username }] });
    if (existingUser) {
      return NextResponse.json({ error: 'User with this email or username already exists' }, { status: 409, headers: CORS_HEADERS });
    }

    // Hash password
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Create user
    const newUser = await User.create({
      username,
      email,
      passwordHash,
      inventory: { seeds: 50, cages: 2 } // Give starter items
    });

    // Give starter pigeon
    await Pigeon.create({
      ownerId: newUser._id,
      name: 'Barnaby',
      identifier: `#${Math.floor(Math.random() * 9000) + 1000}`,
      level: 1,
      status: 'idle'
    });

    return NextResponse.json({ 
      message: 'User created successfully', 
      user: { 
        id: newUser._id, 
        username: newUser.username, 
        email: newUser.email 
      } 
    }, { status: 201, headers: CORS_HEADERS });

  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500, headers: CORS_HEADERS });
  }
}
