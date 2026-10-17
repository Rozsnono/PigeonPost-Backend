import { checkFlightStatuses } from '@/lib/flightCron';

export async function register() {
  // Serverless környezetben (pl. Vercel) a folyamat nem tartós: ott DISABLE_INTERNAL_FLIGHT_RUNNER=true
  // és külső ütemező hívja a /api/cron/check-flights végpontot (Bearer CRON_SECRET).
  if (process.env.NEXT_RUNTIME === 'nodejs' && process.env.DISABLE_INTERNAL_FLIGHT_RUNNER !== 'true') {
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
