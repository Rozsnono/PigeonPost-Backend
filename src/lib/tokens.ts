import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import User from '@/models/User';
import { getJwtSecret } from '@/lib/auth';

/** Hozzáférési (access) JWT élettartama. Konfigurálható, alapértelmezés: 7 nap (a régi viselkedés). */
const ACCESS_TTL = process.env.JWT_ACCESS_TTL || '7d';
/** Refresh token élettartama napokban; minden használatnál megújul (csúszó munkamenet). */
const REFRESH_TTL_DAYS = Number(process.env.REFRESH_TTL_DAYS) || 90;
const MAX_REFRESH_TOKENS_PER_USER = 10;

const hashToken = (raw: string) => crypto.createHash('sha256').update(raw).digest('hex');

export function signAccessToken(user: { _id: unknown; username: string; role: string }): string {
  return jwt.sign(
    { userId: String(user._id), username: user.username, role: user.role },
    getJwtSecret(),
    { expiresIn: ACCESS_TTL as jwt.SignOptions['expiresIn'] }
  );
}

/**
 * Új refresh tokent ad a felhasználónak. A régi (opcionálisan megadott) tokent kicseréli (rotáció).
 * Visszaadja a nyers tokent – ezt csak egyszer látja a kliens.
 */
export async function issueRefreshToken(userId: string, replaceRawToken?: string): Promise<string> {
  const raw = crypto.randomBytes(48).toString('base64url');
  const now = new Date();
  const entry = {
    hash: hashToken(raw),
    expiresAt: new Date(now.getTime() + REFRESH_TTL_DAYS * 86400 * 1000),
    createdAt: now,
  };

  if (replaceRawToken) {
    await User.updateOne({ _id: userId }, { $pull: { refreshTokens: { hash: hashToken(replaceRawToken) } } });
  }
  // Lejártak törlése, majd új hozzáadása a maximális darabszám megtartásával
  await User.updateOne({ _id: userId }, { $pull: { refreshTokens: { expiresAt: { $lt: now } } } });
  await User.updateOne(
    { _id: userId },
    { $push: { refreshTokens: { $each: [entry], $slice: -MAX_REFRESH_TOKENS_PER_USER } } }
  );
  return raw;
}

/** Megkeresi a felhasználót a (nem lejárt) refresh token alapján. */
export async function findUserByRefreshToken(raw: string) {
  return User.findOne({
    isDeleted: { $ne: true },
    refreshTokens: { $elemMatch: { hash: hashToken(raw), expiresAt: { $gt: new Date() } } },
  });
}

export async function revokeRefreshToken(raw: string): Promise<void> {
  await User.updateOne({}, { $pull: { refreshTokens: { hash: hashToken(raw) } } });
}

/** Minden munkamenet visszavonása (pl. jelszócsere után). */
export async function revokeAllRefreshTokens(userId: string): Promise<void> {
  await User.updateOne({ _id: userId }, { $set: { refreshTokens: [] } });
}
