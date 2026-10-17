import { NextRequest } from 'next/server';
import crypto from 'crypto';

/**
 * Admin kérés hitelesítése a `Authorization: Bearer <ADMIN_SECRET>` fejlécből.
 * - Ha az ADMIN_SECRET nincs beállítva, minden kérés elutasításra kerül
 *   (korábban a "Bearer undefined" fejléc átjutott).
 * - Időzítés-biztos összehasonlítást használ.
 */
export function isAdminRequest(req: NextRequest | Request): boolean {
  const secret = process.env.ADMIN_SECRET;
  if (!secret) {
    console.error('[adminAuth] ADMIN_SECRET nincs beállítva – admin hozzáférés letiltva.');
    return false;
  }
  const header = req.headers.get('authorization') || '';
  const expected = Buffer.from(`Bearer ${secret}`);
  const actual = Buffer.from(header);
  if (expected.length !== actual.length) return false;
  return crypto.timingSafeEqual(expected, actual);
}
