// The visible rush on a General Manager shop (v5.10, D5): what the kitchen pill says while the player taps.
// Pure (no React, no engine): unit-tested in node. The scene computes it from the store's `rushTaps`
// (wall ms of the last few rush taps, newest last) and memoises it, so nothing here runs per frame.

/** The window a combo is counted over (ms). */
export const COMBO_WINDOW_MS = 1500;
/** A combo needs at least this many taps per second. */
export const COMBO_MIN_TAPS_PER_SEC = 2;
/** The hint "Tap to rush!" shows on a managed shop until a rush tap lands within this long (ms). */
export const HINT_IDLE_MS = 8000;

export interface RushCombo {
  /** Taps inside the window. */
  n: number;
  /** n over the window length, in taps per second. */
  perSec: number;
}

/** Taps in the last 1.5 s (a tap in the future, from a clock step back, counts as now), and taps/s over that window. */
export function rushCombo(taps: readonly number[], now: number): RushCombo {
  let n = 0;
  for (const t of taps) if (now - t <= COMBO_WINDOW_MS) n++;
  return { n, perSec: n / (COMBO_WINDOW_MS / 1000) };
}

/** Each rush tap takes this long off every running job (pipeline.ts LINE.rushSeconds). */
export const RUSH_SECONDS_PER_TAP = 0.25;
/** Past this tapping speed the jobs are already near their end: the boost stops growing (measured +85% at 4 taps/s). */
export const RUSH_MAX_TAPS_PER_SEC = 4;

/**
 * How much faster the kitchen runs at this tapping speed, as a fraction (0.5 = +50%): every second of tapping at k
 * taps/s moves each job on by 1 + 0.25·k seconds, so the kitchen runs 0.25·k faster (+50% at 2 taps/s; the
 * playthrough measured +44%), counted up to 4 taps/s. The kitchen can't sell past what customers want, so it stops at demand.
 */
export function rushBoost(tapsPerSec: number, kitchenRate: number, demandRate: number): number {
  const speedUp = RUSH_SECONDS_PER_TAP * Math.min(RUSH_MAX_TAPS_PER_SEC, Math.max(0, tapsPerSec));
  const headroom = kitchenRate > 0 ? demandRate / kitchenRate - 1 : 0;
  const boost = Math.max(0, Math.min(speedUp, headroom));
  return Number.isFinite(boost) ? boost : 0;
}

export type RushPill = { kind: 'hint' | 'combo'; text: string } | null;

export interface RushPillInput {
  /** A General Manager runs the shop: rush only exists there. */
  managed: boolean;
  /** Wall ms of the last rush taps, newest last. */
  taps: readonly number[];
  /** Wall ms now. */
  now: number;
  /** min(prep, oven, counter) rate of the shop. */
  kitchenRate: number;
  /** What customers want per second (`G.demandRate`). */
  demandRate: number;
}

/** What to draw: nothing, the "Tap to rush!" hint, or the combo while the player taps at 2+ taps/s. */
export function rushPill({ managed, taps, now, kitchenRate, demandRate }: RushPillInput): RushPill {
  if (!managed) return null;
  const { n, perSec } = rushCombo(taps, now);
  if (perSec >= COMBO_MIN_TAPS_PER_SEC) {
    const pct = Math.round(rushBoost(perSec, kitchenRate, demandRate) * 100);
    return { kind: 'combo', text: `RUSH ×${n} · +${pct}%` };
  }
  const last = taps.length ? taps[taps.length - 1] : -Infinity;
  return now - last > HINT_IDLE_MS ? { kind: 'hint', text: 'Tap to rush!' } : null;
}
