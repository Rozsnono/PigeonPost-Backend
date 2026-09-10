export interface Coordinates {
  lat: number;
  lng: number;
}

/**
 * Calculates the great-circle distance between two points on the Earth using the Haversine formula.
 * @param coord1 Start coordinates
 * @param coord2 End coordinates
 * @returns Distance in kilometers
 */
export function calculateDistanceKm(coord1: Coordinates, coord2: Coordinates): number {
  const R = 6371; // Radius of the Earth in km
  const dLat = (coord2.lat - coord1.lat) * (Math.PI / 180);
  const dLng = (coord2.lng - coord1.lng) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(coord1.lat * (Math.PI / 180)) *
      Math.cos(coord2.lat * (Math.PI / 180)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  return distance; // Distance in km
}

/**
 * Calculates the estimated flight duration based on a constant speed.
 * @param distanceKm The distance to travel in km
 * @param speedKmh The speed of the pigeon in km/h (default 100)
 * @returns Duration in minutes
 */
export function calculateFlightDurationMinutes(distanceKm: number, speedKmh: number = 100): number {
  const hours = distanceKm / speedKmh;
  return Math.ceil(hours * 60);
}

/**
 * Determines the survival chances of a pigeon based on distance and level.
 * @param distanceKm The total distance of the flight
 * @param level The level of the pigeon (1, 2, 3+)
 * @returns Object containing deathChance and lostChance as percentages
 */
export function calculateHazards(distanceKm: number, level: number): { deathChance: number; lostChance: number } {
  // Base chance per 100km
  const baseDeathChance = 1.5; // 1.5% chance of dying per 100km
  const baseLostChance = 3.0; // 3.0% chance of getting lost per 100km

  // Level multipliers (higher level = lower chance)
  const levelMultiplier = Math.max(0.2, 1 - (level - 1) * 0.3); // Level 1: 1.0, Level 2: 0.7, Level 3: 0.4

  let deathChance = (distanceKm / 100) * baseDeathChance * levelMultiplier;
  let lostChance = (distanceKm / 100) * baseLostChance * levelMultiplier;

  // Cap the chances so it's never 100% (max 50% death, max 70% lost)
  deathChance = Math.min(deathChance, 50);
  lostChance = Math.min(lostChance, 70);

  return { deathChance, lostChance };
}

/**
 * Simulates the flight outcome based on calculated chances.
 * @param deathChance The percentage chance of death
 * @param lostChance The percentage chance of getting lost
 * @returns The outcome state: 'delivered', 'expired_lost', or 'dead'
 */
export function simulateFlightOutcome(deathChance: number, lostChance: number): 'delivered' | 'expired_lost' | 'dead' {
  const roll = Math.random() * 100;

  if (roll < deathChance) {
    return 'dead';
  } else if (roll < deathChance + lostChance) {
    return 'expired_lost';
  }

  return 'delivered';
}
