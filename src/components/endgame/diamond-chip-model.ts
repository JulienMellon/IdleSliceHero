// What the HUD's diamond chip says, or '' when it is hidden (DECISIONS #47). The chip is the way into the Shop: it shows from the Store intro
// (tutorial step 16, where the Starter Pack is first offered), or once the Starter Pack has been offered (`prefs.starterOffered`, a save that saw
// the old pop-up), or once rewards unlock (Nonna's takeover), whichever comes first, and then stays for good.
import { count } from '../../engine/format';
import type { GameState } from '../../engine/game';
import { rewardsUnlocked } from '../../engine/rewards';

/** The tutorial step that is the Store intro (card E6). The chip shows from here on; not `TUTORIAL_DONE`, which E6 moves past it. */
export const STORE_INTRO_STEP = 16;

/** The analytics event the Shop sends when it opens (props: `{ from }`). */
export const STORE_OPENED_EVENT = 'store_opened';
/** How the Shop was reached: the HUD chip, Nonna's Store intro (the chip while step 16 is up), or the "Store" nudge on the Style tab. */
export type StoreFrom = 'chip' | 'intro' | 'nudge';

export const chipShows = (game: GameState, starterOffered: boolean): boolean => game.tutorial >= STORE_INTRO_STEP || starterOffered || rewardsUnlocked(game);

export function diamondChipText(game: GameState, starterOffered: boolean): string {
  return chipShows(game, starterOffered) ? count(Math.floor(game.rewards.diamonds)) : '';
}

/** The Founder awning is what the Starter Pack gives; having it is how the game knows the pack is owned. */
const starterOwned = (game: GameState): boolean => game.rewards.cosmetics.includes('awning-founder');

/** The dot on the chip: once at the takeover, while the Starter Pack isn't owned, until the Shop is opened after it (`dotCleared`). */
export const chipDot = (game: GameState, dotCleared: boolean): boolean => rewardsUnlocked(game) && !starterOwned(game) && !dotCleared;

/** Where the chip leads: the Store tab while Nonna's intro is up (step 16), else the Shop on its first tab. */
export const shopHref = (game: GameState): string => (game.tutorial === STORE_INTRO_STEP ? '/shop?tab=store&from=intro' : '/shop?from=chip');

/** The `from` route param as a `StoreFrom` (anything else is the chip). */
export const storeFrom = (param: string | string[] | undefined): StoreFrom => (param === 'intro' || param === 'nudge' ? param : 'chip');

/** The Shop's tab for a route param: `store` is the Store tab (2), anything else the first (0). */
export const tabFromParam = (param: string | string[] | undefined): 0 | 1 | 2 => (param === 'store' ? 2 : param === 'boosters' ? 1 : 0);
