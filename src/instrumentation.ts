import { checkFlightStatuses } from '@/lib/flightCron';

export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    console.log('[instrumentation] Initializing PigeonPost server-side background flight runner...');

    // Run once shortly after startup
    setTimeout(() => {
      checkFlightStatuses().catch((err) => console.error('[flightRunner] Initial check error:', err));
    }, 5000);

    // Run periodically every 20 seconds
    setInterval(() => {
      checkFlightStatuses().catch((err) => console.error('[flightRunner] Periodic check error:', err));
    }, 20000);
  }
}
