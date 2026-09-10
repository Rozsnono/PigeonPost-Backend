import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export { CORS_HEADERS };

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}

export interface JWTPayload {
  userId: string;
  username: string;
  role: string;
}

/**
 * Verifies the JWT from the Authorization header.
 * Returns the decoded payload or null if invalid.
 */
export function verifyAuth(req: NextRequest): JWTPayload | null {
  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
    const token = authHeader.substring(7);
    const jwtSecret = process.env.JWT_SECRET || 'fallback_secret_for_development';
    const decoded = jwt.verify(token, jwtSecret) as JWTPayload;
    return decoded;
  } catch {
    return null;
  }
}

export function unauthorizedResponse() {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: CORS_HEADERS });
}
