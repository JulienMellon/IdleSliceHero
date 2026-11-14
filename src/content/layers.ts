// The v5.16 layers: every number of Suburbs' Game Day, Waterfront's boats and warming rack, the Pier 9 live auction and the
// rival (docs/REVIEW-v5.9-playthrough.md, the layer table). Card E2b appends its own layers below.
// All times are PLAY seconds (`GameState.playSeconds`): they pause while the app is closed, so they never re-roll when the clock
// or the time zone changes.
import type { NeighborhoodId } from './types';

/** Where each layer keeps its state, `GameState.x[key]`. game.ts reads the boats' key (the auction), so it lives here, not in a feature. */
export const LAYER_KEYS = { gameDay: 'suburbsGameDay', boats: 'waterfrontBoats', rival: 'rival' } as const;

export const GAME_DAY = {
  hood: 'suburbs' as NeighborhoodId,
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
  hood: 'waterfront' as NeighborhoodId,
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
