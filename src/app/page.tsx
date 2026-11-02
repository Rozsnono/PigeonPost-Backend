import { headers } from 'next/headers';
import { redirect } from 'next/navigation';

/**
 * A főoldalon nincs publikus tartalom: az admin felületre irányítunk.
 * Telefonról (User-Agent alapján) a mobilra szabott, egyszerűsített adminra.
 */
export default async function Home() {
  const ua = (await headers()).get('user-agent') || '';
  const isMobile = /Android|iPhone|iPad|iPod|Mobile/i.test(ua);
  redirect(isMobile ? '/admin/mobile' : '/admin');
}
