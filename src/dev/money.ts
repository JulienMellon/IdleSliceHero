// Card X2, the Money section's actions (the rows are in x2-sections.tsx). Pure TS over the store's public API, so a node test can drive them.
// Free buys and the store's answer are module state elsewhere (engine/game.ts, services/purchases.web.ts); here they are only switched and saved.
import { earningsPerSecond, setFreeBuys } from '../engine/game';
import { setTestBuyAnswer } from '../services/purchases.web';
import { useGame } from '../store/game-store';
import { saveCheats } from './cheat-prefs';

/** The income rows: a label and how many seconds of the current $/s they pay. */
export const INCOME_ROWS = [
  { label: '+10 min income', seconds: 600 },
  { label: '+1 h income', seconds: 3600 },
] as const;

export const DIAMONDS_GIVEN = 100;

const persist = () => void useGame.getState().save();

/** Free buys on or off (the test build starts with them on); saved with the test cheats. */
export function toggleFreeBuys(on: boolean): void {
  setFreeBuys(on);
  void saveCheats();
}

/** "Store purchases succeed": the web purchase stub answers `purchased` (in memory: the artifact host strips `?buy=`), or goes back to its query string. */
export function toggleStoreSucceeds(on: boolean): void {
  setTestBuyAnswer(on ? 'purchased' : null);
  void saveCheats();
}

/** Cash as money earned: the current $/s × `seconds`, added to `cash` and `totalEarned` (tasks and stats read it as income). Returns what was added. */
export function addIncome(seconds: number): number {
  const g = useGame.getState().game;
  const amount = earningsPerSecond(g) * seconds;
  if (!(amount > 0)) return 0;
  useGame.setState({ game: { ...g, cash: g.cash + amount, totalEarned: g.totalEarned + amount } });
  persist();
  return amount;
}

/** Cash → $0, to see the "can't afford" states and the need-text. `totalEarned` stays. */
export function cashToZero(): void {
  const g = useGame.getState().game;
  useGame.setState({ game: { ...g, cash: 0 } });
  persist();
}

/** Diamonds +100. */
export function addDiamonds(n: number = DIAMONDS_GIVEN): void {
  const g = useGame.getState().game;
  useGame.setState({ game: { ...g, rewards: { ...g.rewards, diamonds: g.rewards.diamonds + n } } });
  persist();
}
