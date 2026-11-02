/** Admin által megadott mennyiség ellenőrzése: véges egész szám, ésszerű határokon belül. */
/** Egyszeri jóváírás/levonás felső határa (elgépelés elleni védelem): ±10 000 000. */
export const MAX_ADMIN_AMOUNT = 10_000_000;

export function parseAdminAmount(value: unknown): number | null {
  const n = Number(value);
  if (!Number.isFinite(n) || !Number.isInteger(n) || n === 0 || Math.abs(n) > MAX_ADMIN_AMOUNT) return null;
  return n;
}
