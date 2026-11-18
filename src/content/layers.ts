// The v5.16 layers: every number of Suburbs' Game Day, Waterfront's boats and warming rack, the Pier 9 live auction and the
// rival (docs/REVIEW-v5.9-playthrough.md, the layer table). Card E2b's layers (University, Industrial, Uptown) are at the end.
// All times are PLAY seconds (`GameState.playSeconds`): they pause while the app is closed, so they never re-roll when the clock
// or the time zone changes.

/** Where each layer keeps its state, `GameState.x[key]`. game.ts reads the boats' key (the auction), so it lives here, not in a feature. */
export const LAYER_KEYS = {
  gameDay: 'suburbsGameDay',
  boats: 'waterfrontBoats',
  rival: 'rival',
  menu: 'universityMenu',
  shifts: 'industrialShifts',
  stars: 'uptownStars',
} as const;

export const GAME_DAY = {
  /** A game every this many play seconds (each gap moves by up to `jitter`, seeded). */
  everySeconds: 8 * 60,
  /** The rush after the game lasts this long. */
  rushSeconds: 45,
  /** Walk-in demand is multiplied by this (before the seats say how much of it fits). */
  walkInMult: 6,
  /** Seats per table drawn in the shop (tablesShown + the sidewalk's patioTables). */
  seatsPerTable: 4,
  /** A gap is `everySeconds` × (1 ± jitter). */
  jitter: 0.1,
  seedSalt: 5101,
} as const;

export const BOATS = {
  everySeconds: 3 * 60,
  /** A boat's rush lasts this long… */
  rushSeconds: 30,
  /** …and multiplies the whole demand rate by this. */
  demandMult: 3,
  jitter: 0.1,
  seedSalt: 5102,
  /** The warming rack's four tiers: pies held, and the price in minutes of the shop's income at purchase time. */
  rack: { capacity: [20, 40, 80, 160], minutes: [5, 15, 45, 120] } as { capacity: readonly number[]; minutes: readonly number[] },
} as const;

/** The Pier 9 bid becomes a live auction while it is open and unpaid: +stepShare of the base price every stepSeconds, to +maxShare. */
export const AUCTION = { stepSeconds: 2 * 60, stepShare: 0.05, maxShare: 0.5 } as const;

/** The price multiplier of the Pier 9 auction: `openedAt` is the play second it opened (below 0 = not opened yet). */
export function auctionMult(openedAt: number, playSeconds: number): number {
  if (!(openedAt >= 0) || !(playSeconds > openedAt)) return 1;
  return 1 + Math.min(AUCTION.maxShare, AUCTION.stepShare * Math.floor((playSeconds - openedAt) / AUCTION.stepSeconds));
}

export const RIVAL = {
  /** The rival opens when this beat has been seen. */
  beat: 3,
  /** While the rival is open, that shop's value per pizza is multiplied by this. */
  valueMult: 0.8,
  /** The challenge: sell ceil(challengeSeconds × the shop's pizza rate × targetMargin) pies in challengeSeconds. */
  challengeSeconds: 5 * 60,
  targetMargin: 1.2,
  /** A lost challenge may be tried again after this long (play seconds). */
  retrySeconds: 2 * 60,
} as const;

// ---------- Card E2b: University, Industrial, Uptown ----------

/** University, the menu: the mix is whole percents of the pies (Cheese is the rest). A recipe's price multiplies the value per pizza; its prep and bake factors multiply the time a pizza takes at that station. */
export const MENU = {
  recipes: [
    { id: 'cheese', name: 'Cheese', price: 1, prep: 1, bake: 1 },
    { id: 'pepperoni', name: 'Pepperoni', price: 1.4, prep: 1.3, bake: 1 },
    { id: 'knots', name: 'Garlic Knots', price: 0.6, prep: 1, bake: 0.5 },
  ] as readonly { id: 'cheese' | 'pepperoni' | 'knots'; name: string; price: number; prep: number; bake: number }[],
  /** The step the sim's best-mix search moves in (whole percents). */
  searchStep: 25,
} as const;

/** University, the campus zones. `distance` multiplies the round trip; `share` is the percent of the demand; a zone opens at `footprint`. Drones (vehicle id below) ignore distance. */
export const ZONES = {
  droneId: 'drone',
  zones: [
    { id: 'dorms', name: 'Dorms', distance: 1, share: 50, footprint: 0 },
    { id: 'library', name: 'Library', distance: 2, share: 30, footprint: 1 },
    { id: 'stadium', name: 'Stadium', distance: 3, share: 20, footprint: 2 },
  ] as readonly { id: 'dorms' | 'library' | 'stadium'; name: string; distance: number; share: number; footprint: number }[],
} as const;

/** Industrial, the shifts: a cycle of play seconds cut into equal shifts, in order from the moment the shop is first seen built. */
export const SHIFTS = {
  cycleSeconds: 20 * 60,
  shifts: [
    { id: 'day', name: 'Day', demand: 1, value: 1 },
    { id: 'swing', name: 'Swing', demand: 0.8, value: 1 },
    { id: 'night', name: 'Night', demand: 1.2, value: 2 },
  ] as readonly { id: 'day' | 'swing' | 'night'; name: string; demand: number; value: number }[],
  /** Time away is paid at this shift (the night's rate). */
  offlineShift: 'night' as 'day' | 'swing' | 'night',
} as const;

/** Industrial, the breakdowns: every `everySeconds` of play (± jitter, seeded) one oven jams and the oven rate falls by one oven's share until it is fixed. */
export const JAMS = {
  everySeconds: 5 * 60,
  jitter: 0.1,
  seedSalt: 5103,
  /** With the Head Baker (the oven head) hired a jam fixes itself after this long. */
  autoFixSeconds: 30,
} as const;

/** Uptown, the star rating: stars = 1 + floor(points x 4 / maxPoints). */
export const STARS = {
  /** Points from the oven grade: grade index 0 gives 0, 1-2 give 1, 3 and up give 2. */
  ovenPoints: [0, 1, 1, 2, 2] as readonly number[],
  /** Points from decor: tiers owned in all (of 15) at which the first and second point are earned. */
  decorTiersForPoint: [5, 10] as readonly number[],
  /** The Ingredients track: tier 0 is the shop's starting stock; each later tier gives a point and costs minutes of Uptown's income at purchase time. */
  ingredients: [
    { name: 'Store-brand', minutes: 0 },
    { name: 'Imported', minutes: 30 },
    { name: 'Farm', minutes: 120 },
    { name: 'Truffle', minutes: 480 },
  ] as readonly { name: string; minutes: number }[],
  maxPoints: 7,
  maxStars: 5,
  /** What Uptown's pizzas are worth by stars: under 3, 3 and 4, 5. */
  pay: { low: 0.5, mid: 1, top: 2 },
} as const;

/** Uptown, the critic: visits every `everySeconds` of play (± jitter, seeded) with a target rating; meeting it pays `rewardMinutes` of citywide income and adds a star to the sign. */
export const CRITIC = {
  everySeconds: 15 * 60,
  jitter: 0.1,
  seedSalt: 5104,
  /** The target is 2 to 4 by the seed; every `fiveEvery`-th visit asks for 5. */
  fiveEvery: 5,
  /** The card said 3 minutes before Julien's cut of cash rewards by 70 to 80% (2026-11-13); on that scale it is 45 seconds, as a golden pizza. Measured: at 3 minutes a player who hits every visit pushed the story's reward share from 9.7% to 15.5%. */
  rewardMinutes: 0.75,
} as const;
