// The welcome-back gift (v5.14): everything the popup shows, as pure functions (the component only draws). The popup is a
// closed night oven whose door glows in proportion to how full it got; opening it counts the total up and lists the shops.
import { NIGHT_OVEN, RING_STEP } from '../content/hooks';
import { shownValue } from '../engine/format';
import { commas } from '../engine/teaser';

/** What the store keeps about a return (OfflineSummary in game-store.ts is this shape). */
export interface GiftSummary {
  /** Seconds paid for (the away time, up to the oven's size). */
  seconds: number;
  /** Away longer than the oven holds. */
  capped: boolean;
  awaySeconds: number;
  earned: number;
  byShop: { name: string; earned: number; managed: boolean; pies: number }[];
  /** Names of built pizzerias with no manager (they didn't bake while you were away). */
  idle: string[];
}

/** 11520 → "3 h 12 m", 14400 → "4 h", 2700 → "45 m". */
export function clock(seconds: number): string {
  const total = Math.max(0, Math.floor(seconds / 60));
  const h = Math.floor(total / 60);
  const m = total % 60;
  if (h === 0) return `${m} m`;
  return m === 0 ? `${h} h` : `${h} h ${m} m`;
}

/** One line of news about the time away: the best seller, else the shop that waited, else what the kitchens finished. */
export function offlineNews(byShop: GiftSummary['byShop'], idle: readonly string[]): string {
  const best = byShop.filter((b) => b.managed && b.pies >= 1).sort((a, b) => b.pies - a.pies)[0];
  if (best) return `${best.name} sold ${commas(best.pies)} ${best.pies === 1 ? 'pie' : 'pies'} while you were\u00A0away`; // D455: "away", and the last two words never split (a lone "out" orphaned on line 2)
  if (idle.length) return `${idle[0]} waited for you: hire a manager and it bakes while you're away`;
  return 'Your kitchens finished the pizzas already in the oven';
}

export interface GiftView {
  title: string;
  /** How full the night oven got, 0..1. */
  fill: number;
  /** The glow and the meter, in whole steps of RING_STEP (0..20), so they repaint only when the step changes. */
  step: number;
  /** "3 h 12 m of 4 h" */
  fillText: string;
  /** The oven ran out of room (never the word "Capped"). */
  full: boolean;
  /** "The night oven was full — it holds 4 h" when full. */
  fullLine: string | null;
  /** "Upgrade it to hold 8 h" when full and a bigger tier exists. */
  upgradeLine: string | null;
  /** The total the count-up ends on: the sum of the lines as shown. */
  total: number;
  rows: { name: string; earned: number; note: string }[];
  news: string;
}

export function offlineGiftView(summary: GiftSummary, nightOven: number): GiftView {
  const tier = Math.min(NIGHT_OVEN.capSeconds.length - 1, Math.max(0, Math.floor(nightOven)));
  const cap = NIGHT_OVEN.capSeconds[tier];
  const held = Math.min(cap, Math.max(0, summary.seconds));
  const fill = cap > 0 ? held / cap : 0;
  const full = summary.capped || held >= cap;
  const bigger = NIGHT_OVEN.capSeconds[tier + 1];
  const steps = Math.round(1 / RING_STEP);
  return {
    title: 'Welcome back!',
    fill,
    step: Math.max(0, Math.min(steps, Math.round(fill * steps))),
    fillText: `${clock(held)} of ${clock(cap)}`,
    full,
    fullLine: full ? `The night oven was full — it holds ${clock(cap)}` : null,
    upgradeLine: full && bigger !== undefined ? `Upgrade it to hold ${clock(bigger)}` : null,
    total: summary.byShop.length ? summary.byShop.reduce((t, b) => t + shownValue(b.earned), 0) : summary.earned,
    rows: summary.byShop.map((b) => ({ name: b.name, earned: b.earned, note: b.managed ? '' : ' (orders already in the oven)' })),
    news: offlineNews(summary.byShop, summary.idle),
  };
}

/** The total shown `elapsedMs` into a count-up of `ms`: eases out, lands exactly on `total`, never overshoots. */
export function countUpValue(total: number, elapsedMs: number, ms: number): number {
  if (!(ms > 0) || elapsedMs >= ms) return total;
  if (elapsedMs <= 0) return 0;
  const k = elapsedMs / ms;
  return total * (1 - Math.pow(1 - k, 3));
}
