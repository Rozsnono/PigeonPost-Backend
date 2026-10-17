import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

const CORS_HEADERS = {
  // Natív mobilalkalmazásnak nem kell CORS; webes buildhez szűkíthető a CORS_ALLOW_ORIGIN env-vel.
  'Access-Control-Allow-Origin': process.env.CORS_ALLOW_ORIGIN || '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export { CORS_HEADERS };

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}

/**
 * A JWT aláíró titok kizárólag környezeti változóból jön. Ha hiányzik,
 * kivételt dobunk (nincs bedrótozott fallback, mert az hamisítható tokent jelentene).
 */
export function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET környezeti változó nincs beállítva.');
  }
  return secret;
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
    const decoded = jwt.verify(token, getJwtSecret()) as JWTPayload;
    return decoded;
  } catch (err) {
    // Lejárt / érvénytelen token: a kliens refresh-sel vagy újra belépéssel kezeli.
    // Hiányzó JWT_SECRET konfigurációs hiba: ezt naplózzuk.
    if (err instanceof Error && err.message.includes('JWT_SECRET')) {
      console.error('[auth]', err.message);
    }
    return null;
  }
}

export function unauthorizedResponse() {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: CORS_HEADERS });
}
