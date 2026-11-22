// The Shop's "Buy" shelf of diamond boosters (v5.23, card U5) as plain data: three cards (name, "2×", duration, W4's line, "≈ {cash} at your
// shop's pace", the diamond price), the running slot's line, and the refusal. The rules are the engine's (engine/paid-boost.ts: one slot,
// 2× while it runs, 24 h at most); the words are docs/story/COPY-v5.23.md §5 and §6 (booster.*, store.nudge, store.dot.label), checked by a test. Pure.
import { PAID_BOOST_MULT, PAID_BOOSTERS } from '../../content/rewards';
import { gameNow } from '../../engine/clock';
import { money } from '../../engine/format';
import { canAffordDiamonds, type GameState } from '../../engine/game';
import { boosterFits, boosterPace, paidBoostLeft } from '../../engine/paid-boost';
import { rewardsUnlocked } from '../../engine/rewards';
import { tidySpan } from './shop-model';

/** COPY-v5.23 §5: each booster's name and line, by the id the engine sells it under. */
export const BOOSTER_WORDS: Readonly<Record<string, { key: string; name: string; desc: string }>> = {
  'rush-hour': { key: 'rush', name: 'Rush Hour', desc: 'Double income, 1 hour. The lunch crowd.' },
  'dinner-service': { key: 'dinner', name: 'Dinner Service', desc: 'Double income, 4 hours. All tables full.' },
  'big-night': { key: 'bignight', name: 'Big Night', desc: 'Double income, 12 hours. The ovens sing.' },
};

/** The lines with a placeholder or a speaker (COPY-v5.23 §5 and §6). */
export const BOOSTER_LINES = {
  pace: "≈ {cash} at your shop's pace",
  running: '{name} running · {time} left',
  full: 'Ay, the slot holds 24 h. Nothing spent.',
  dot: "Nonna's Starter Pack is in the Store",
  nudge: 'In my day, we waited. Today? The Store.',
} as const;

const fill = (line: string, vars: Record<string, string>): string => line.replace(/\{(\w+)\}/g, (m, k: string) => vars[k] ?? m);

/** `buy`: enough diamonds and room; `poor`: short of diamonds; `full`: the slot would pass 24 h; `locked`: rewards aren't open yet (the engine's own refusal). */
export type BoosterState = 'buy' | 'poor' | 'full' | 'locked';

export interface BoosterView {
  id: string;
  name: string;
  /** "2×". */
  mult: string;
  /** "1 h". */
  duration: string;
  desc: string;
  /** "≈ $1.2K at your shop's pace". */
  pace: string;
  price: number;
  state: BoosterState;
}

export interface BoosterSection {
  cards: BoosterView[];
  /** The running slot ("Rush Hour running · 59 m left"), or null while the slot is empty. */
  running: string | null;
}

/** The slot holds one running stretch, bought one or more times, so the line names the boost by what it does, not by a booster it may no longer be. */
const SLOT_NAME = `${PAID_BOOST_MULT}× income`;

export function boosterSection(g: GameState, now: number = gameNow()): BoosterSection {
  const open = rewardsUnlocked(g);
  const cards = PAID_BOOSTERS.map((b): BoosterView => {
    const words = BOOSTER_WORDS[b.id];
    return {
      id: b.id,
      name: words?.name ?? b.id,
      mult: `${PAID_BOOST_MULT}×`,
      duration: tidySpan(b.seconds),
      desc: words?.desc ?? '',
      pace: fill(BOOSTER_LINES.pace, { cash: money(boosterPace(g, b.id)) }),
      price: b.diamonds,
      state: !open ? 'locked' : !boosterFits(g, b.id, now) ? 'full' : canAffordDiamonds(g, b.diamonds) ? 'buy' : 'poor',
    };
  });
  const left = paidBoostLeft(g, now);
  return { cards, running: left > 0 ? fill(BOOSTER_LINES.running, { name: SLOT_NAME, time: tidySpan(left) }) : null };
}
