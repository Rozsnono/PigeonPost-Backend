/** Admin által megadott mennyiség ellenőrzése: véges egész szám, ésszerű határokon belül. */
export const MAX_ADMIN_AMOUNT = 1_000_000;

export function parseAdminAmount(value: unknown): number | null {
  const n = Number(value);
  if (!Number.isFinite(n) || !Number.isInteger(n) || n === 0 || Math.abs(n) > MAX_ADMIN_AMOUNT) return null;
  return n;
}
