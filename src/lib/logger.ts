import connectToDatabase from '@/lib/db';
import Log from '@/models/Log';

/**
 * Központi naplózó segédfüggvény a PigeonPost backendhez.
 * Az eseményeket a MongoDB Log gyűjteménybe menti, ahonnan az Admin
 * felület valós időben ki tudja olvasni.
 */
export async function createLog(
  level: 'info' | 'warn' | 'error',
  context: string,
  message: string,
  metadata?: any
) {
  try {
    await connectToDatabase();
    await Log.create({
      level,
      context,
      message,
      metadata,
    });
  } catch (err) {
    console.error('[Logger] Hiba a log mentésekor:', err);
  }
}
