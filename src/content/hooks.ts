// Session hooks (v5.13): the golden pizza and the special orders. Numbers and copy only; the rules live in
// src/engine/bonus.ts and src/engine/orders.ts. Balancing is an edit to this file.
import { TUNING } from './tuning';
export type { OrderCast } from './cities/types';

// ---------- The golden pizza (floating bonus) ----------

export const BONUS = {
  /** The first golden pizza of a session appears this many play seconds in. */
  firstAtPlay: 20,
  /** Then one every gapMin..gapMax play seconds after the last one was tapped or flew away. */
  gapMin: 75,
  gapMax: 120,
  /** How long it drifts across the sky before it leaves. */
  visibleSeconds: 12,
  /** A tap pays this many seconds of citywide income (the rewards' income: boosts ignored)… (v5.16: 45 → 5, cash rewards cut) */
  incomeSeconds: 5,
  /** …but never less than this. */
  minPayout: 5,
  /** Every Nth one is the lucky slice… */
  luckyEvery: 5,
  /** …which pays this many seconds of income. */
  luckyIncomeSeconds: 20,
  /** D445: the very first one comes at most this many play seconds after the golden pizzas unlock (Nonna's takeover scene ends). */
  firstAfterUnlock: 2,
} as const;

/** The lucky slice's multiple of a normal one ("LUCKY SLICE ×4!"). */
export const LUCKY_MULT = BONUS.luckyIncomeSeconds / BONUS.incomeSeconds;

/** How the golden pizza is drawn (pt). */
export const BONUS_VIEW = {
  /** The tap target's height; its width is a little more, for the wings. Apple's minimum is 44. */
  height: 44,
  width: 60,
  /** Where it flies: the top of the scene area, in the sky above the shop's back wall. */
  laneTop: 8,
  laneHeight: 34,
  /** Vertical bob (pt, peak) and its period (ms). */
  bobPx: 5,
  bobMs: 900,
  /** Wing flap period (ms). */
  flapMs: 260,
  /** The "+$X" pop. */
  popMs: 1300,
  popRisePx: 46,
  /** D437: every golden pizza is drawn this much bigger than the 60 × 44 art, the lucky slice more. Taps stay on the whole drawn box. */
  scale: 1.3,
  luckyScale: 1.6,
  /** The soft radial glow around the box reaches this far past it (pt). */
  glowPx: 10,
  /** Trailing sparkles behind the flight. */
  sparkles: 3,
  /** The lucky slice's rays turn once in this many ms. */
  raysMs: 5000,
  /** G93: the "+$X" pop is this wide; it keeps this far from the scene's edges and sits this far under the box. */
  popWidth: 180,
  popEdge: 8,
  popGap: 4,
  /** D444: the lucky slice's banner stays this long (ms) while this many coins fly to the cash. */
  bannerMs: 1200,
  luckyCoins: 10,
  /** A normal tap throws this many coins. */
  coins: 3,
  /** G95: the gift label's room above the lane (it sits over the pizza, clear of the roof sign below), and its size. */
  giftRoom: 28,
  giftWidth: 150,
  tagWidth: 54,
  /** D451: the lucky banner sits in the sky band (the lane's top) so the cooks' cheer below it stays in view. */
  bannerHeight: 48,
  /** D445: the label by the very first golden pizza. */
  giftLine: 'A gift, cara. Tap it!',
} as const;

// ---------- Special orders from the cast ----------

export const ORDER = {
  /** The first offer of a session comes this many play seconds in. */
  firstOfferAtPlay: 60,
  /** Then this many play seconds after the previous order ended (accepted and done or failed, declined or expired). */
  gapSeconds: 4 * 60,
  /** An offer waits this long, then leaves quietly. */
  offerWaitSeconds: 45,
  /** Time to sell the pies once accepted. */
  windowSeconds: 120,
  /**
   * v5.16: the target is what the shop sells in windowSeconds with rush held the whole time, × this (under 1, so constant tapping
   * wins without an upgrade). Where customers cap the rush, the target comes down with it.
   */
  targetMargin: 0.9,
  /** The tapping speed "rush held the whole time" means (taps per second; each takes LINE.rushSeconds off every running job). */
  rushTapsPerSecond: 3,
  minTarget: 20,
  /** A shop that doesn't run itself asks for this many (taps). */
  unmanagedTarget: 24,
  /** Success pays this many minutes of citywide income (rewards' income) at completion time (v5.16: 5 → 0.5). */
  rewardMinutes: 0.5,
  doneShowSeconds: 2.5,
  failShowSeconds: 2,
} as const;

export const ORDER_FAIL_LINE = 'So close — next time!';

/** Layout of the order chip (pt). */
export const ORDER_VIEW = {
  /** The chip is at least this tall: the Accept button is 44, the reward sits under it (D441) and the padding is around both. */
  height: 68,
  /** The chip's distance from the top of the scene area. */
  top: 6,
  side: 8,
  /** D436: the success burst: coins from the chip to the cash, and the portrait's bounce (scale, ms). */
  coins: 5,
  bounce: 1.15,
  bounceMs: 220,
  /** D442: the "tap to rush!" hint shows when the fill is this far (0..1) behind the clock. */
  paceSlack: 0.05,
} as const;

// ---------- Return hooks (v5.14): Nonna's night oven and the welcome-back gift ----------

export const NIGHT_OVEN = {
  /** What the away meter holds (s), by tier: the base cap, then 8 h and 12 h. Each upgrade is bought once, city-wide. */
  capSeconds: [TUNING.offlineCapSeconds, 8 * 3600, 12 * 3600],
  /** Price of each tier in minutes of citywide income (the rewards' income, boosts ignored). Tier 0 is free. */
  priceMinutes: [0, 20, 60],
  /** The build position (index into the city's neighbourhoods) that must be built before the tier can be bought: 2 and 4 are Waterfront and Industrial at home, and the third and fifth shops anywhere else. */
  needsBuilt: [null, 2, 4] as readonly (number | null)[],
  /** A tier never costs less than this (a city with no income yet would otherwise get it free). */
  minPrice: 500,
} as const;

/** The welcome-back gift's timings (ms) and look. */
export const GIFT = {
  /** The total counts up over this long once the oven is opened. */
  countUpMs: 800,
  /** The door swings open over this long. */
  doorMs: 380,
  /** After opening, the popup closes by itself this long after the count finishes. */
  autoCloseMs: 1500,
  /** Coins sent to the cash counter when the oven opens. */
  coins: 10,
} as const;

/** The oven's fill and the teaser ring change in steps of this much (a 5% step), so they never repaint on every tick. */
export const RING_STEP = 0.05;
