// What the Shop remembers about its two one-off reminders (card U5), as plain data: the dot on the chip at the takeover (cleared when the Shop
// opens after it) and Nonna's "the Store" nudge (once per save). Pure: unit-tested in node; the store that saves it is shop-flags.ts.

export interface ShopFlags {
  /** The Shop was opened after the takeover: the chip's dot is gone for good. */
  dotCleared: boolean;
  /** The nudge has been shown. */
  nudged: boolean;
  /** The booster last bought into the paid slot and the slot's end after that buy: the running line names it while the slot still ends there (S101). */
  lastBooster: { id: string; until: number } | null;
}

export const NO_FLAGS: ShopFlags = { dotCleared: false, nudged: false, lastBooster: null };
export const FLAGS_KEY = 'slice-empire/shop/v1';
export const TEST_FLAGS_KEY = 'slice-empire/shop/test-v1';

export function parseFlags(raw: string | null): ShopFlags {
  try {
    const v = JSON.parse(raw ?? '') as Partial<ShopFlags>;
    const b = v.lastBooster;
    const lastBooster = b && typeof b.id === 'string' && typeof b.until === 'number' && Number.isFinite(b.until) ? { id: b.id, until: b.until } : null;
    return { dotCleared: v.dotCleared === true, nudged: v.nudged === true, lastBooster };
  } catch {
    return NO_FLAGS;
  }
}

/** The Shop opened: after the takeover that clears the dot (opening it earlier, at the intro, doesn't use the dot up). */
export const afterOpen = (f: ShopFlags, takenOver: boolean): ShopFlags => (takenOver && !f.dotCleared ? { ...f, dotCleared: true } : f);

/** Whether a refused buy of a look shows the nudge: the first time only, and only when the player was short of diamonds. */
export const nudgeShows = (f: ShopFlags, bought: boolean, short: boolean): boolean => !bought && short && !f.nudged;
