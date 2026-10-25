import type { TimeUntilTrigger } from './types';

export type { TimeUntilTrigger };

export interface TimeUntilResult {
  hours: number | null;
  label: string | null;
  direction: 'increasing' | 'decreasing' | 'none';
}

/**
 * Find the nearest trigger ahead in the current direction of travel and compute
 * how long (in hours) it will take to reach it at the given rate.
 *
 * Works in any unit space — percent mode passes %/hour; absolute mode passes
 * absolute-units/hour. Callers normalise both currentValue and ratePerHour into
 * the same unit before calling.
 */
export function calculateTimeUntil(
  currentValue: number,
  ratePerHour: number,   // positive = increasing, negative = decreasing
  triggers: TimeUntilTrigger[],
): TimeUntilResult {
  const direction: TimeUntilResult['direction'] =
    ratePerHour > 0 ? 'increasing' : ratePerHour < 0 ? 'decreasing' : 'none';

  if (direction === 'none') return { hours: null, label: null, direction: 'none' };

  let target: TimeUntilTrigger | undefined;
  if (direction === 'increasing') {
    const candidates = triggers.filter((t) => t.value > currentValue);
    target = candidates.reduce<TimeUntilTrigger | undefined>(
      (best, t) => best === undefined || t.value < best.value ? t : best,
      undefined,
    );
  } else {
    const candidates = triggers.filter((t) => t.value < currentValue);
    target = candidates.reduce<TimeUntilTrigger | undefined>(
      (best, t) => best === undefined || t.value > best.value ? t : best,
      undefined,
    );
  }

  if (!target) return { hours: null, label: null, direction };

  const delta = Math.abs(target.value - currentValue);
  const hours = delta / Math.abs(ratePerHour);
  if (!Number.isFinite(hours)) return { hours: null, label: null, direction };

  return { hours, label: target.label, direction };
}
