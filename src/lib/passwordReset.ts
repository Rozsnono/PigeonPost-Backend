import crypto from 'crypto';

/** A visszaállító kód hash-e (felhasználóhoz kötve), az adatbázisban csak ez tárolódik. */
export const hashResetCode = (code: string, userId: string) =>
  crypto.createHash('sha256').update(`${userId}:${code}`).digest('hex');
