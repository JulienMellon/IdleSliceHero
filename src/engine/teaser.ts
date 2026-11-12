// The next-scene teaser (v5.14): one line saying whose story is next and what it waits for, never what happens in it.
// "Next: Dale's story continues after 1,200 more Suburbs pies", "…when you build Waterfront", "…when you bid on Pier 9".
// A ring on the HUD's scrapbook button shows the progress toward it, in RING_STEP steps so it never repaints on a tick.
import { RING_STEP } from '../content/hooks';
import { HOME_SCENES } from '../content/scenes/home';
import { PIER9_BID } from '../content/tuning';
import type { CharacterId, Scene } from '../content/types';
import { count } from './format';
import { buildLock, def, pier9Available, sceneTriggered, type GameState } from './game';

/** The name the story line uses for each character (the character only, no scene content). */
const WHO: Record<CharacterId, string> = {
  'nonna-rosa': 'Nonna Rosa',
  dale: 'Dale',
  marisol: 'Marisol',
  priya: 'Priya',
  'big-sal': 'Big Sal',
  genevieve: 'Genevieve',
  'victor-crust': 'Victor Crust',
  'megaslice-rep': 'the MegaSlice rep',
};

export type TeaserKind = 'deliveries' | 'unlock' | 'bid' | 'soon' | 'complete';

export interface Teaser {
  kind: TeaserKind;
  text: string;
  /** 0..1, exact. */
  progress: number;
  /** The ring: progress in whole steps of RING_STEP (0..20). 0 and no ring when the story is complete. */
  step: number;
}

export const TEASER_COMPLETE = 'The story is complete (for now)';
const STEPS = Math.round(1 / RING_STEP);

/** Whole steps of RING_STEP, rounded down so a ring never shows a step it hasn't reached (full only at 100%). */
export const ringStep = (progress: number): number => (Number.isFinite(progress) ? Math.max(0, Math.min(STEPS, Math.floor(progress * STEPS + 1e-9))) : 0);

/** 1200 → "1,200"; from a million up the usual "1.2M". */
export function commas(n: number): string {
  const w = Math.max(0, Math.ceil(n - 1e-9));
  return w < 1e6 ? String(w).replace(/\B(?=(\d{3})+(?!\d))/g, ',') : count(w);
}

const ratio = (a: number, b: number) => (b > 0 ? Math.max(0, Math.min(1, a / b)) : 0);

/** The first scene not yet seen, in story order (an already-triggered one is only waiting for its moment). */
export function nextScene(s: GameState, scenes: readonly Scene[] = HOME_SCENES): Scene | null {
  const seen = new Set(s.seenScenes);
  return scenes.find((sc) => !seen.has(sc.id)) ?? null;
}

export function nextSceneTeaser(s: GameState, scenes: readonly Scene[] = HOME_SCENES): Teaser {
  const sc = nextScene(s, scenes);
  if (!sc) return { kind: 'complete', text: TEASER_COMPLETE, progress: 1, step: 0 };
  const who = `Next: ${WHO[sc.character]}'s story continues`;
  const hood = def(sc.neighborhood);
  const shop = s.shops[sc.neighborhood];
  const make = (kind: TeaserKind, text: string, progress: number): Teaser => ({ kind, text, progress, step: ringStep(progress) });
  if (sceneTriggered(s, sc)) return make('soon', `${who} in a moment`, 1);
  // the shop isn't there yet: whatever the scene waits for, the player's next move is to build it
  if (!shop.built) return make('unlock', `${who} when you build ${hood.name}`, buildLock(s, sc.neighborhood) ? 0 : ratio(s.cash, hood.buildCost));
  const tr = sc.trigger;
  if (tr.kind === 'bid') return make('bid', `${who} when you bid on Pier 9`, pier9Available(s) ? ratio(s.cash, PIER9_BID.cost) : ratio(shop.sold, PIER9_BID.unlockPizzas));
  if (tr.kind === 'deliveries') {
    const left = tr.count - shop.sold;
    return make('deliveries', `${who} after ${commas(left)} more ${hood.name} ${left <= 1 ? 'pie' : 'pies'}`, ratio(shop.sold, tr.count));
  }
  // an unlock scene of a built shop is already triggered (handled above); this keeps the compiler and a malformed scene list honest
  return make('soon', `${who} in a moment`, 1);
}
