/**
 * Runtime tracing, off in every bundle until `mosaicDebug = true` is set in the
 * browser console. It briefly defaulted on in the dev bundle so it would
 * survive a reload while a duplicate-fetch bug was being chased; that is not
 * worth a console line on every poll for the rest of time, so it is opt-in
 * again. To catch the first seconds after a load, set it and reload — the flag
 * is read per call, not captured at startup.
 *
 * Data refresh is the one behaviour with no visible symptom either way: the
 * numbers sit there unchanged whether the timer fired, died, or fetched the
 * same thing twice. This module is how that becomes observable. It lives on
 * its own so the fetch layer can trace as well as the host — the useful
 * question ("where did five seconds go?") is answered inside `stats.ts`, not
 * where the timer lives.
 */
export function mcDebug(): boolean {
  return typeof window !== 'undefined' && window.mosaicDebug === true;
}

export function mcLog(msg: string): void {
  if (mcDebug()) console.info(`[mosaic ${new Date().toLocaleTimeString()}] ${msg}`);
}

/** `300000` → `5m`, `3600000` → `1h`. For interval reporting only. */
export function fmtMins(ms: number): string {
  const m = ms / 60_000;
  return m >= 60 && m % 60 === 0 ? `${m / 60}h` : `${m}m`;
}

/** Milliseconds since `t0`, rounded — `mcDebug()` guards the caller's cost. */
export function since(t0: number): number {
  return Math.round(performance.now() - t0);
}
