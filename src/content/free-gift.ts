// The free gift (v5.25, card E9): a gift waits in the shop 2 minutes into the game, then one every 4 hours of real time; only one waits at a
// time. It holds minutes of the shop's income in cash, and every third gift holds diamonds too. The rules are in engine/features/free-gift.ts.

export const FREE_GIFT = {
  /** The first gift is ready after this many seconds of active play. */
  firstAtPlaySeconds: 120,
  /** Then one is ready this long (real, wall ms) after the last was claimed. It counts while the app is closed. */
  everyMs: 4 * 3_600_000,
  /** The cash: this many minutes of the shop's income when the gift is claimed (whole dollars). */
  cashMinutes: 5,
  /** Every this-many-th claim also holds `diamonds`. */
  diamondsEvery: 3,
  diamonds: 10,
} as const;
