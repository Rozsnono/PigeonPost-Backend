import User from '@/models/User';

/**
 * Atomi compare-and-set egy felhasználói időbélyegre (pl. lastGambleAt):
 * csak akkor állítja `now`-ra, ha az érték még mindig az, amit a hívó korábban látott.
 * Visszatér: true, ha a "claim" sikerült (nem előzte meg párhuzamos kérés).
 */
export async function claimOnce(userId: string, path: string, observed: Date | null, now: Date): Promise<boolean> {
  const condition = observed ? { [path]: observed } : { [path]: null }; // null a hiányzó mezőre is illeszkedik
  const res = await User.updateOne({ _id: userId, ...condition }, { $set: { [path]: now } });
  return res.modifiedCount === 1;
}
