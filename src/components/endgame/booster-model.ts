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
  'rush-hour': { key: 'rush', name: 'Rush Hour', desc: 'The whole lunch crowd, all at once.' },
  'dinner-service': { key: 'dinner', name: 'Dinner Service', desc: 'Every table full, every candle lit.' },
  'big-night': { key: 'bignight', name: 'Big Night', desc: 'The ovens sing till morning.' },
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
  /** Diamonds still missing (0 when the player has the price): the greyed button says it (D565). */
  short: number;
  state: BoosterState;
}

export interface BoosterSection {
  cards: BoosterView[];
  /** The running slot ("Rush Hour running · 59 m left"), or null while the slot is empty. */
  running: string | null;
}

/** The booster last bought into the slot (S101), remembered with the slot's end after that buy. */
export interface LastBooster {
  id: string;
  until: number;
}

/**
 * The name the running line prints: the booster last bought into the slot, while the slot still ends where that buy left it. When something else
 * filled or moved the slot (the Starter Pack's boost, an older save), the smallest booster that covers the time left (the biggest when none does).
 */
export function slotName(g: GameState, left: number, last: LastBooster | null): string {
  const known = last && last.until === g.rewards.paidUntil ? BOOSTER_WORDS[last.id] : undefined;
  if (known) return known.name;
  const cover = PAID_BOOSTERS.find((b) => b.seconds >= left) ?? PAID_BOOSTERS[PAID_BOOSTERS.length - 1];
  return BOOSTER_WORDS[cover.id]?.name ?? cover.id;
}

/**
 * What the section depends on, as one cheap string (U39): the diamonds, the slot (its end and the minute that is shown), whether rewards are open, and a
 * five-second bucket of play time for the pace lines (income moves slowly; the pace says "about"). The section is built only when this changes.
 */
export const boosterKey = (g: GameState, now: number): string =>
  `${Math.floor(g.rewards.diamonds)}|${g.rewards.paidUntil}|${Math.floor(paidBoostLeft(g, now) / 60)}|${rewardsUnlocked(g) ? 1 : 0}|${Math.floor(g.playSeconds / 5)}`;

export function boosterSection(g: GameState, now: number = gameNow(), last: LastBooster | null = null): BoosterSection {
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
      short: Math.max(0, Math.ceil(b.diamonds - g.rewards.diamonds)),
      state: !open ? 'locked' : !boosterFits(g, b.id, now) ? 'full' : canAffordDiamonds(g, b.diamonds) ? 'buy' : 'poor',
    };
  });
  const left = paidBoostLeft(g, now);
  return { cards, running: left > 0 ? fill(BOOSTER_LINES.running, { name: slotName(g, left, last), time: tidySpan(left) }) : null };
}
