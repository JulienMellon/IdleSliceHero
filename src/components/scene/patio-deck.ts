// The patio's deck (D428): the sidewalk patio used to be two chairs and a parasol on bare paving, which read as an indoor
// table that had wandered out. Each set now stands on a plank deck, one step down from the shop front, behind a low rail with
// a gap where the guests walk in. Pure, so the budgets are tested in node (the drawing is street.tsx `PatioDeck`).
import { CHAIR_WAY_HALF_W, PATIO_HALF_W, PATIO_SEAT, QUEUE_Y } from './layout';
import { P } from './projection';

export const DECK_COLOR = '#C99A6B';
export const DECK_LINE = '#A9794A';
/** The step down from the shop front to the deck (pt), drawn as a lit riser on the deck's back edge. */
export const STEP_PT = 10;
/** The rail’s height over the deck (pt): low enough that a seated diner's head and the parasol stay in clear view. */
export const RAIL_PT = 8;
/** Room depths of the deck's back (against the shop front) and front (the rail) edges. */
export const DECK_BACK_Y = -6;
export const DECK_FRONT_Y = -19;
/** Planks run across the deck, this many room units apart. */
export const PLANK = 3.2;

type Pt = [number, number];

export interface Deck {
  /** Corners of the deck's top, screen units: back-left, back-right, front-right, front-left. */
  top: [Pt, Pt, Pt, Pt];
  /** The riser on the back edge: the same corners lifted STEP_PT. */
  riser: [Pt, Pt, Pt, Pt];
  /** Room x of the left and right edge. */
  x0: number;
  x1: number;
  /** Plank seams as screen segments. */
  planks: [Pt, Pt][];
  /** Rail runs along the front edge and both sides, as screen segments [from, to]; the front one is split around the way in. */
  rail: { posts: Pt[]; bars: [Pt, Pt][] };
  /** Room x range of the gap in the front rail (where the right-hand chair's guest walks in). */
  gap: [number, number];
}

export function patioDeck(p: { x: number; y: number }): Deck {
  const x0 = p.x - PATIO_HALF_W;
  const x1 = p.x + PATIO_HALF_W;
  const at = (x: number, y: number, z = 0): Pt => P(x, y, z);
  const top: Deck['top'] = [at(x0, DECK_BACK_Y), at(x1, DECK_BACK_Y), at(x1, DECK_FRONT_Y), at(x0, DECK_FRONT_Y)];
  const riser: Deck['riser'] = [at(x0, DECK_BACK_Y, STEP_PT), at(x1, DECK_BACK_Y, STEP_PT), top[1], top[0]];
  const planks: Deck['planks'] = [];
  for (let y = DECK_BACK_Y - PLANK; y > DECK_FRONT_Y + 0.5; y -= PLANK) planks.push([at(x0, y), at(x1, y)]);
  // the guest walks up to the right-hand chair from the curb: leave their way open
  const way = p.x + PATIO_SEAT;
  const gap: [number, number] = [way - CHAIR_WAY_HALF_W, way + CHAIR_WAY_HALF_W];
  const front = DECK_FRONT_Y;
  const posts: Pt[] = [at(x0 + 1, front), at(gap[0], front), at(gap[1], front), at(x1 - 1, front)];
  const bars: [Pt, Pt][] = [
    [at(x0 + 1, front, RAIL_PT), at(gap[0], front, RAIL_PT)],
    [at(gap[1], front, RAIL_PT), at(x1 - 1, front, RAIL_PT)],
    // the sides run back along the deck's edges
    [at(x0 + 1, front, RAIL_PT), at(x0 + 1, DECK_BACK_Y - 2, RAIL_PT)],
    [at(x1 - 1, front, RAIL_PT), at(x1 - 1, DECK_BACK_Y - 2, RAIL_PT)],
  ];
  return { top, riser, x0, x1, planks, rail: { posts, bars }, gap };
}

/** The deck's screen box (top and riser), for the crowd budgets. */
export function deckBox(d: Deck) {
  const all = [...d.top, ...d.riser];
  return { x0: Math.min(...all.map((q) => q[0])), x1: Math.max(...all.map((q) => q[0])), y0: Math.min(...all.map((q) => q[1])), y1: Math.max(...all.map((q) => q[1])) + 0.5 };
}

/** Where the deck's back edge stands relative to the queue's feet: the deck starts below the lane so figures never stand on it. */
export const DECK_CLEARS_QUEUE = DECK_BACK_Y < QUEUE_Y;
