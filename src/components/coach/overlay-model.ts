// The Coach overlay's geometry (v5.20, card C1), pure: where the scrim's holes are, where Nonna's hand points and where her card docks.
// Every rect is in screen points. The hand follows the old scene spotlight's rules (D384): inside the cut-out, over the
// work surface, 30 up from its bottom edge; on a narrow target beside it, so it never covers what it points at.
import type { Rect } from './targets';

export type { Rect };

export interface Screen {
  w: number;
  h: number;
}

/** The safe-area insets that matter to the card. */
export interface Safe {
  top: number;
  bottom: number;
}

/** A cut-out is its target grown by `pad` with corners of `radius` (the old scene spotlight's 8 and 12). */
export const CUT = { pad: 8, radius: 12 } as const;
/** Nonna's card: the room it is planned with (two or three lines of text beside her portrait), the gap to the cut-out, the margin to the screen's edge. */
export const CARD = { height: 84, gap: 12, margin: 8, side: 16 } as const;
/** The hand: its box (pt), the width under which a target is "narrow" and the height under which it is "short", how far up from the bottom edge it rests, its tilt (the glyph points up at 0). */
export const HAND = { size: 34, narrow: 64, short: 90, rest: 30, along: 0.78, tilt: -20, beside: 70, down: 160 } as const;
/** A target whose bottom edge is in the top fifth of the screen (the HUD) gets its card right below it; any other gets it at the street band, clear of the shop. */
export const HUD_ZONE = 0.22;

export const padCut = (r: Rect, pad: number = CUT.pad): Rect => ({ x0: r.x0 - pad, y0: r.y0 - pad, x1: r.x1 + pad, y1: r.y1 + pad });

const clampTo = (r: Rect, s: Screen): Rect => ({
  x0: Math.max(0, Math.min(s.w, r.x0)),
  y0: Math.max(0, Math.min(s.h, r.y0)),
  x1: Math.max(0, Math.min(s.w, r.x1)),
  y1: Math.max(0, Math.min(s.h, r.y1)),
});

const meets = (a: Rect, b: Rect) => a.x0 < b.x1 && a.x1 > b.x0 && a.y0 < b.y1 && a.y1 > b.y0;
const hull = (rs: readonly Rect[]): Rect => ({
  x0: Math.min(...rs.map((r) => r.x0)),
  y0: Math.min(...rs.map((r) => r.y0)),
  x1: Math.max(...rs.map((r) => r.x1)),
  y1: Math.max(...rs.map((r) => r.y1)),
});

/** Cut-outs that overlap become one (their bounding box); the rest stay apart, so two far-apart targets keep two holes. */
export function mergeCuts(cuts: readonly Rect[]): Rect[] {
  const out = [...cuts];
  for (let again = true; again;) {
    again = false;
    for (let i = 0; i < out.length && !again; i++)
      for (let j = i + 1; j < out.length && !again; j++)
        if (meets(out[i], out[j])) {
          out[i] = hull([out[i], out[j]]);
          out.splice(j, 1);
          again = true;
        }
  }
  return out;
}

/** The rects that cover the screen except the cut-outs: where the scrim's pressables sit (a touch there is swallowed, a touch in a hole falls through). */
export function blockers(cuts: readonly Rect[], screen: Screen): Rect[] {
  const ys = [...new Set([0, screen.h, ...cuts.flatMap((c) => [c.y0, c.y1])])].filter((y) => y >= 0 && y <= screen.h).sort((a, b) => a - b);
  const out: Rect[] = [];
  for (let i = 0; i + 1 < ys.length; i++) {
    const [y0, y1] = [ys[i], ys[i + 1]];
    const spans = cuts
      .filter((c) => c.y0 <= y0 && c.y1 >= y1)
      .map((c) => [c.x0, c.x1] as const)
      .sort((a, b) => a[0] - b[0]);
    let x = 0;
    for (const [a, b] of spans) {
      if (a > x) out.push({ x0: x, y0, x1: a, y1 });
      x = Math.max(x, b);
    }
    if (x < screen.w) out.push({ x0: x, y0, x1: screen.w, y1 });
  }
  return out;
}

export interface HandPose {
  /** The hand's centre. */
  x: number;
  y: number;
  /** Rotation in degrees; the glyph points up at 0. */
  rot: number;
  where: 'inside' | 'above' | 'left' | 'right';
}

export interface CardDock {
  dock: 'below' | 'above' | 'bottom';
  /** Distance from the screen's top, for `below` and `bottom`-less docks. */
  top?: number;
  /** Distance from the screen's bottom, for `above` and `bottom`. */
  bottom?: number;
  /** False when neither side had room for the card (a cut-out taller than the screen leaves): it then overlaps. */
  fits: boolean;
}

export interface OverlayLayout {
  /** The holes (rounded by `CUT.radius`), clamped to the screen. */
  cuts: Rect[];
  /** The box round every hole. */
  bounds: Rect;
  hand: HandPose;
  card: CardDock;
}

/**
 * The hand's pose for the cut-out `c` it points at. Wide target: inside it. Narrow target (a dial, the All button): above it, pointing down, so it never lands on the
 * control beside it (D525); beside it only when there is no room above or the card would be under it (`card`).
 */
export function handPose(c: Rect, screen: Screen, card?: Rect): HandPose {
  const half = HAND.size / 2;
  const keep = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));
  const w = c.x1 - c.x0;
  const h = c.y1 - c.y0;
  let pose: HandPose;
  if (w < HAND.narrow) {
    const above: HandPose = { x: (c.x0 + c.x1) / 2, y: c.y0 - half - 2, rot: HAND.down, where: 'above' };
    const box = (p: HandPose): Rect => ({ x0: p.x - half, y0: p.y - half, x1: p.x + half, y1: p.y + half });
    const covers = (p: HandPose) => !!card && box(p).x0 < card.x1 && box(p).x1 > card.x0 && box(p).y0 < card.y1 && box(p).y1 > card.y0;
    if (above.y - half >= 0 && !covers(above)) pose = above;
    else {
      const right = screen.w - c.x1 >= HAND.beside || screen.w - c.x1 >= c.x0;
      pose = right
        ? { x: c.x1 + half + 2, y: (c.y0 + c.y1) / 2, rot: -75, where: 'right' }
        : { x: c.x0 - half - 2, y: (c.y0 + c.y1) / 2, rot: 75, where: 'left' };
    }
  } else {
    // inside, centred across and 30 up from the bottom edge (over the work surface); on a short bar or card (cash, goal, a sidewalk card) it would hide the
    // text, so it rests on the bottom edge, three quarters along (its card sits 12 below, so the hand must not reach it)
    const short = h < HAND.short;
    pose = { x: short ? c.x0 + w * HAND.along : (c.x0 + c.x1) / 2, y: short ? c.y1 - 6 : c.y1 - HAND.rest, rot: HAND.tilt, where: 'inside' };
  }
  return { ...pose, x: keep(pose.x, half, screen.w - half), y: keep(pose.y, half, screen.h - half) };
}

/**
 * The card's dock. A target in the HUD gets it right below (room permitting). Anything else gets it at the street band, the bottom of the screen, so it covers
 * neither the shop nor its diners (D526); when the cut-out reaches too far down for that (a phone with a short screen), above the cut-out. Never over a cut-out unless nothing fits.
 */
export function cardDock(bounds: Rect, screen: Screen, safe: Safe, cardH: number = CARD.height): CardDock {
  const floor = screen.h - Math.max(safe.bottom, CARD.margin);
  const ceil = safe.top + CARD.margin;
  const roomBelow = floor - (bounds.y1 + CARD.gap);
  const roomAbove = bounds.y0 - CARD.gap - ceil;
  if (roomBelow >= cardH) {
    if (bounds.y1 <= screen.h * HUD_ZONE) return { dock: 'below', top: bounds.y1 + CARD.gap, fits: true };
    return { dock: 'bottom', bottom: Math.max(safe.bottom, CARD.margin), fits: true };
  }
  if (roomAbove >= cardH) return { dock: 'above', bottom: screen.h - (bounds.y0 - CARD.gap), fits: true };
  // neither: the side with more room, as near the cut-out as the screen lets it be
  return roomBelow >= roomAbove
    ? { dock: 'below', top: Math.min(bounds.y1 + CARD.gap, Math.max(ceil, floor - cardH)), fits: false }
    : { dock: 'above', bottom: Math.min(screen.h - (bounds.y0 - CARD.gap), screen.h - ceil - cardH), fits: false };
}

/** Where the card is on the screen for a dock (its height planned as `cardH`): for the tests and for anything that must stay clear of it. */
export function cardRect(card: CardDock, screen: Screen, cardH: number = CARD.height): Rect {
  const y0 = card.top ?? screen.h - (card.bottom ?? 0) - cardH;
  return { x0: CARD.side, y0, x1: screen.w - CARD.side, y1: y0 + cardH };
}

/** A dotted leader between two holes (D524): from the point of each nearest the other's centre. */
export interface Leader {
  x0: number;
  y0: number;
  x1: number;
  y1: number;
}
export function leaders(cuts: readonly Rect[]): Leader[] {
  const near = (r: Rect, to: Rect) => ({
    x: Math.max(r.x0, Math.min(r.x1, (to.x0 + to.x1) / 2)),
    y: Math.max(r.y0, Math.min(r.y1, (to.y0 + to.y1) / 2)),
  });
  return cuts.slice(1).map((c) => {
    const a = near(cuts[0], c);
    const b = near(c, cuts[0]);
    return { x0: a.x, y0: a.y, x1: b.x, y1: b.y };
  });
}

/**
 * Everything the overlay draws, from the targets' rects. The hand points at the first target on a `tap` step (the thing to tap) and at the last on a `wait` or `look`
 * step (the dial the line is about: D520). Null when there are none, or when the first one is off the screen (a zero-area hole would leave a scrim that swallows every touch).
 */
export function overlayLayout(targets: readonly Rect[], screen: Screen, safe: Safe, mode: 'tap' | 'wait' | 'look' = 'tap'): OverlayLayout | null {
  if (targets.length === 0) return null;
  const area = (r: Rect) => (r.x1 - r.x0) * (r.y1 - r.y0);
  const padded = targets.map((t) => clampTo(padCut(t), screen));
  if (area(padded[0]) <= 0) return null;
  const shown = padded.filter((r) => area(r) > 0);
  const cuts = mergeCuts(shown);
  const bounds = hull(cuts);
  const card = cardDock(bounds, screen, safe);
  const point = mode === 'tap' ? shown[0] : shown[shown.length - 1];
  return { cuts, bounds, hand: handPose(point, screen, cardRect(card, screen)), card };
}

/** Where a card sits with no target (a `free` step): along the bottom, above the safe inset. */
export const freeDock = (safe: Safe): CardDock => ({ dock: 'bottom', bottom: Math.max(safe.bottom, CARD.margin), fits: true });
