import User from '@/models/User';
import Pigeon from '@/models/Pigeon';

/**
 * Simulates real-time loft dynamics based on elapsed time:
 * 1. Idle pigeons resting in the loft recover fatigue (-5% per 15 min).
 * 2. Idle pigeons consume energy, lowering satiety (-3% per 15 min).
 * 3. If hunger drops below 80% and the user has placed seeds in the feeder trough (feederSeeds),
 *    birds automatically eat from the trough (1 seed = +10 satiety).
 * 4. If satiety reaches 0% and remains at 0% for 24+ hours with no food, the bird flies away ('stray').
 *    Stray birds can be lured back with 25 seeds from the player's inventory.
 */
export async function simulateLoftTimeDelta(userId: string | any) {
  try {
    const now = new Date();
    const user = await User.findById(userId);
    if (!user) return;

    let feederSeeds = user.feederSeeds || 0;
    let userFeederChanged = false;

    const idlePigeons = await Pigeon.find({ ownerId: userId, status: 'idle' });

    for (const pigeon of idlePigeons) {
      const lastTick = pigeon.lastLoftTickAt || pigeon.updatedAt || pigeon.createdAt || now;
      const elapsedSeconds = Math.floor((now.getTime() - new Date(lastTick).getTime()) / 1000);

      // Require at least 60 seconds elapsed to calculate delta
      if (elapsedSeconds < 60) {
        continue;
      }

      // Calculate 15-minute ticks (capped at 96 ticks = 24 hours per batch)
      const ticks = Math.min(96, Math.max(1, Math.floor(elapsedSeconds / 900)));

      // 1. Fatigue recovery while resting
      let currentFatigue = pigeon.fatigue ?? 0;
      currentFatigue = Math.max(0, currentFatigue - ticks * 5);
      pigeon.fatigue = currentFatigue;

      // 2. Satiety depletion
      let currentSatiety = pigeon.satiety ?? 100;
      currentSatiety = Math.max(0, currentSatiety - ticks * 3);

      // 3. Automated feeding from loft trough
      if (currentSatiety < 80 && feederSeeds > 0) {
        while (feederSeeds > 0 && currentSatiety < 100) {
          feederSeeds -= 1;
          currentSatiety = Math.min(100, currentSatiety + 10);
          userFeederChanged = true;
        }
      }
      pigeon.satiety = currentSatiety;

      // 4. Starvation and Straying ('elrepül / elszökik')
      if (currentSatiety === 0) {
        if (!pigeon.starvingSince) {
          pigeon.starvingSince = now;
        } else {
          const starvingSeconds = Math.floor((now.getTime() - new Date(pigeon.starvingSince).getTime()) / 1000);
          // If starving for >= 24 hours, bird flies away looking for food
          if (starvingSeconds >= 86400) {
            pigeon.status = 'stray';
            pigeon.straySince = now;
            pigeon.starvingSince = null;
          }
        }
      } else {
        pigeon.starvingSince = null;
      }

      pigeon.lastLoftTickAt = now;
      await pigeon.save();
    }

    if (userFeederChanged) {
      user.feederSeeds = feederSeeds;
      await user.save();
    }
  } catch (err) {
    console.error('[simulateLoftTimeDelta] Error running loft simulation:', err);
  }
}
