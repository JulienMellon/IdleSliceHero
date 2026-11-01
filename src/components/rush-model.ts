// The visible rush on a General Manager shop (v5.10, D5): what the kitchen pill says while the player taps.
// Pure (no React, no engine): unit-tested in node. The scene computes it from the store's `rushTaps`
// (wall ms of the last few rush taps, newest last) and memoises it, so nothing here runs per frame.

/** The window a combo is counted over (ms). */
export const COMBO_WINDOW_MS = 1500;
/** A combo needs at least this many taps per second. */
export const COMBO_MIN_TAPS_PER_SEC = 2;
/** The hint "Tap to rush!" shows on a managed shop until a rush tap lands within this long (ms). */
export const HINT_IDLE_MS = 8000;
/** The hint shows only when customers want at least this much more than the kitchen makes (demand/kitchen − 1): else a rush sells nothing (G86). */
export const HINT_MIN_HEADROOM = 0.1;
/** The hint shows for this long when the shop's scene opens, then again every `HINT_PERIOD_MS` (D406). */
export const HINT_VISIT_MS = 3000;
export const HINT_PERIOD_MS = 60_000;

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

/** How much more customers want than the kitchen makes, as a fraction (0.1 = 10% more); 0 for a dead kitchen. */
export function rushHeadroom(kitchenRate: number, demandRate: number): number {
  const h = kitchenRate > 0 ? demandRate / kitchenRate - 1 : 0;
  return Number.isFinite(h) ? h : 0;
}

/**
 * How much faster the kitchen runs at this tapping speed, as a fraction (0.5 = +50%): every second of tapping at k
 * taps/s moves each job on by 1 + 0.25·k seconds, so the kitchen runs 0.25·k faster (+50% at 2 taps/s; the
 * playthrough measured +44%), counted up to 4 taps/s. The kitchen can't sell past what customers want, so it stops at demand.
 */
export function rushBoost(tapsPerSec: number, kitchenRate: number, demandRate: number): number {
  const speedUp = RUSH_SECONDS_PER_TAP * Math.min(RUSH_MAX_TAPS_PER_SEC, Math.max(0, tapsPerSec));
  const headroom = rushHeadroom(kitchenRate, demandRate);
  const boost = Math.max(0, Math.min(speedUp, headroom));
  return Number.isFinite(boost) ? boost : 0;
}

export type RushPill = {
  kind: 'hint' | 'combo';
  text: string;
  /** The scene pulses the pill while the hint shows (D406); a combo is already moving. */
  pulse: boolean;
} | null;

export interface RushPillInput {
  /** A General Manager runs the shop: rush only exists there. */
  managed: boolean;
  /** Wall ms of the last rush taps, newest last. */
  taps: readonly number[];
  /** Wall ms now. */
  now: number;
  /** Wall ms when this shop's scene was opened (the hint shows for the first 3 s of the visit, then 3 s every minute). */
  visitAt: number;
  /** min(prep, oven, counter) rate of the shop. */
  kitchenRate: number;
  /** What customers want per second (`G.demandRate`). */
  demandRate: number;
}

/** Whether `now` is inside a hint window of the visit: the first 3 s, then 3 s of every 60 s (a clock step back counts as the visit's start). */
export function inHintWindow(now: number, visitAt: number): boolean {
  const since = Math.max(0, now - visitAt);
  return since % HINT_PERIOD_MS < HINT_VISIT_MS;
}

/**
 * What to draw: nothing, the "Tap to rush!" hint, or the combo while the player taps at 2+ taps/s. The hint needs room to
 * grow (customers want ≥10% more than the kitchen makes, G86), no rush tap for 8 s, and a hint window of the visit (D406).
 * A combo with no boost left says what is missing instead of "+0%".
 */
export function rushPill({ managed, taps, now, visitAt, kitchenRate, demandRate }: RushPillInput): RushPill {
  if (!managed) return null;
  const { n, perSec } = rushCombo(taps, now);
  if (perSec >= COMBO_MIN_TAPS_PER_SEC) {
    const pct = Math.round(rushBoost(perSec, kitchenRate, demandRate) * 100);
    return { kind: 'combo', text: pct > 0 ? `RUSH ×${n} · +${pct}%` : `RUSH ×${n} · need drivers`, pulse: false };
  }
  const last = taps.length ? taps[taps.length - 1] : -Infinity;
  if (now - last <= HINT_IDLE_MS) return null;
  if (rushHeadroom(kitchenRate, demandRate) < HINT_MIN_HEADROOM - 1e-9) return null;
  return inHintWindow(now, visitAt) ? { kind: 'hint', text: 'Tap to rush!', pulse: true } : null;
}
