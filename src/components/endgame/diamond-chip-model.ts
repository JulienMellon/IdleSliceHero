// What the HUD's diamond chip says, or '' when it is hidden (DECISIONS #47). The chip is the way into the Shop: it shows once rewards unlock
// (Nonna's takeover) or once the Starter Pack has been offered (`prefs.starterOffered`), whichever comes first, and then stays for good.
import { count } from '../../engine/format';
import type { GameState } from '../../engine/game';
import { rewardsUnlocked } from '../../engine/rewards';

export function diamondChipText(game: GameState, starterOffered: boolean): string {
  return rewardsUnlocked(game) || starterOffered ? count(Math.floor(game.rewards.diamonds)) : '';
}
