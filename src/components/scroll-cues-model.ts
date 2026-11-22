// Off-screen cues for a wide shop (v5.18, card V2). The Restaurant and the Flagship are wider than the screen, so something that wants the player can be
// out of sight: a station with orders piling up, a jammed oven, a head's bubble, a station to tap in a shop that is run by hand. A chevron at the screen's edge says
// which way, one per side, the most urgent; a tap on it scrolls there, and so does a tap on a lamp of the shop report (`askScroll`): every place in
// the shop stays reachable by taps alone, the drag is an addition, never a requirement (Julien's October rule). Pure: tested in node.
import { openScroll, sceneToScreen, type SceneFit } from './scene/projection';

/** What wants attention, most urgent first: a jam stops the oven, a station with orders piling up is losing sales, a bubble is a head asking, a tap is a hand-run station. */
export type CueKind = 'jam' | 'piling' | 'bubble' | 'tap';
export const CUE_URGENCY: Readonly<Record<CueKind, number>> = { jam: 4, piling: 3, bubble: 2, tap: 1 };

/** The report's three stations (the engine's names: `ovens`, not the line's `oven`). */
export type KitchenSpot = 'prep' | 'ovens' | 'counter';
/** Where a request to scroll can point: a station, the dining floor or the door. */
export type ScrollTarget = KitchenSpot | 'floor' | 'door';

/** Something that wants attention, and the place it is in (scene units, across, in the shop's frame). */
export interface Want {
  kind: CueKind;
  x: number;
  /** Which station it is at, for the label. */
  at: ScrollTarget;
}

/** A place this close to the screen's edge (pt) counts as off screen: it is half hidden, and a chevron there would flicker as the player scrolls. */
export const CUE_EDGE = 16;
/** The chevron is drawn this big (pt): a tap target of 44 pt each way, at least. */
export const CUE_W = 52;
export const CUE_H = 44;
export interface Cue {
  side: 'left' | 'right';
  kind: CueKind;
  at: ScrollTarget;
  /** The scroll position (px) that brings the place to the middle of the screen. */
  scrollTo: number;
  /** What a screen reader hears. */
  label: string;
  /** The word under the chevron (10 pt or more, short enough for CUE_W). */
  word: string;
}

const PLACE: Readonly<Record<ScrollTarget, string>> = {
  prep: 'the prep bench',
  ovens: 'the ovens',
  counter: 'the counter',
  floor: 'the dining room',
  door: 'the door',
};
/** The word under the chevron names the place (D515), 7 letters at most; the kind is the colour and the screen reader's label. A jam keeps its own word: it is at the ovens. */
const NAME: Readonly<Record<ScrollTarget, string>> = { prep: 'Prep', ovens: 'Ovens', counter: 'Counter', floor: 'Dining', door: 'Door' };
export const cueWord = (kind: CueKind, at: ScrollTarget): string => (kind === 'jam' ? 'Jam!' : NAME[at]);
const PHRASE: Readonly<Record<CueKind, string>> = {
  jam: 'An oven is jammed',
  piling: 'has orders piling up',
  bubble: 'has something to say',
  tap: 'is ready to tap',
};

/** What a screen reader says for a cue: "Scroll right: An oven is jammed at the ovens" / "Scroll left: The prep bench has orders piling up". */
export function cueLabel(kind: CueKind, at: ScrollTarget, side: 'left' | 'right'): string {
  const dir = `Scroll ${side}: `;
  if (kind === 'jam') return `${dir}${PHRASE.jam} at ${PLACE[at]}`;
  const place = PLACE[at];
  return `${dir}${place.charAt(0).toUpperCase()}${place.slice(1)} ${PHRASE[kind]}`;
}

/** Where a place is on the screen (pt), given how far the view has scrolled. */
export const screenX = (x: number, scrollX: number, fit: Pick<SceneFit, 's' | 'ox'>): number => sceneToScreen(x, scrollX, fit);

/** A place is out of sight when it is left of CUE_EDGE or right of `viewW - CUE_EDGE`. */
export const offScreen = (sx: number, viewW: number): 'left' | 'right' | null => (sx < CUE_EDGE ? 'left' : sx > viewW - CUE_EDGE ? 'right' : null);

/**
 * The cues for the wants that are off screen: one per side, the most urgent (a tie goes to the nearer one). Nothing when the shop does not scroll
 * (`maxScroll` 0: all of it is on screen).
 */
export function cuesFor(
  wants: readonly Want[],
  scrollX: number,
  viewW: number,
  fit: Pick<SceneFit, 's' | 'ox'>,
  maxScroll: number,
): { left: Cue | null; right: Cue | null } {
  const out: { left: Cue | null; right: Cue | null } = { left: null, right: null };
  if (maxScroll <= 0) return out;
  const best: { left: { w: Want; d: number } | null; right: { w: Want; d: number } | null } = { left: null, right: null };
  for (const w of wants) {
    const sx = screenX(w.x, scrollX, fit);
    const side = offScreen(sx, viewW);
    if (!side) continue;
    const d = side === 'left' ? -sx : sx - viewW;
    const cur = best[side];
    if (!cur || CUE_URGENCY[w.kind] > CUE_URGENCY[cur.w.kind] || (CUE_URGENCY[w.kind] === CUE_URGENCY[cur.w.kind] && d < cur.d)) best[side] = { w, d };
  }
  for (const side of ['left', 'right'] as const) {
    const b = best[side];
    if (b)
      out[side] = {
        side,
        kind: b.w.kind,
        at: b.w.at,
        scrollTo: openScroll(b.w.x, fit.s, viewW, maxScroll),
        label: cueLabel(b.w.kind, b.w.at, side),
        word: cueWord(b.w.kind, b.w.at),
      };
  }
  return out;
}

/** A tappable on screen, in the shop view's own points (the view's top left is 0, 0). */
export interface PtRect {
  x0: number;
  y0: number;
  x1: number;
  y1: number;
}
/** A cue stays this far (pt) from any other tappable on screen (G111). */
export const CUE_GAP = 8;

/** Where the jam's wrench stands on the view (pt): a `size` square centred on the oven's scene place (`cx`, `cy` in content px), the view scrolled by `scrollX`. */
export const wrenchRect = (cx: number, cy: number, size: number, scrollX: number): PtRect => ({
  x0: cx - scrollX - size / 2,
  y0: cy - size / 2,
  x1: cx - scrollX + size / 2,
  y1: cy + size / 2,
});

/**
 * Where a cue's top goes so that it is `gap` pt clear of every tappable on screen (G111: the right cue sat over the jam's wrench). The cue keeps its side
 * and slides up or down to the nearest free place inside the view; with no free place it stays where it was asked for.
 */
export function clearCueTop(side: 'left' | 'right', top: number, viewW: number, viewH: number, avoid: readonly PtRect[], gap = CUE_GAP): number {
  const x0 = side === 'left' ? 0 : viewW - CUE_W;
  const x1 = x0 + CUE_W;
  const blocks = (y: number, r: PtRect) => x0 < r.x1 + gap && x1 > r.x0 - gap && y < r.y1 + gap && y + CUE_H > r.y0 - gap;
  const free = (y: number) => y >= 0 && y + CUE_H <= viewH && !avoid.some((r) => blocks(y, r));
  if (free(top)) return top;
  let best = top;
  let bestD = Infinity;
  for (const r of avoid) {
    for (const y of [r.y0 - gap - CUE_H, r.y1 + gap]) {
      const d = Math.abs(y - top);
      if (d < bestD && free(y)) {
        best = y;
        bestD = d;
      }
    }
  }
  return best;
}

/** The stations the report shows a pile-up at (symptom `piling`), as wants at the stations' places. */
export function wantsOf(input: {
  /** The stations with a pile-up (the report's symptoms); empty for a shop with no report. Still named `slammed` until storefront.tsx, which feeds it, is renamed with it. */
  slammed: readonly KitchenSpot[];
  /** An oven is jammed (Industrial). */
  jam: boolean;
  /** The station whose head's bubble is up. */
  bubble: KitchenSpot | null;
  /** The station a hand-run shop wants tapped next. */
  tap: KitchenSpot | null;
  /** Each station's place, and the jammed oven's. */
  xs: Readonly<Record<KitchenSpot, number>>;
  jamX: number;
}): Want[] {
  const w: Want[] = [];
  for (const st of input.slammed) w.push({ kind: 'piling', x: input.xs[st], at: st });
  if (input.jam) w.push({ kind: 'jam', x: input.jamX, at: 'ovens' });
  if (input.bubble) w.push({ kind: 'bubble', x: input.xs[input.bubble], at: input.bubble });
  if (input.tap) w.push({ kind: 'tap', x: input.xs[input.tap], at: input.tap });
  return w;
}

/**
 * How many of a queue's figures the street draws (v5.16's cold line): all of them, or `share` of them (the report's `queueShare`) while the line is
 * cold, never fewer than one while anybody is waiting, so a cold line is short, not gone.
 */
export const queueShown = (n: number, share: number): number => (share >= 1 || n <= 0 ? n : Math.max(1, Math.floor(n * share)));

// ---- a tiny bus, so a tap on a lamp of the shop report (it has no idea where the shop is) can scroll the shop to that station ----
const asks = new Set<(t: ScrollTarget) => void>();
/** The shop's scene listens here; returns the unsubscribe. */
export function onScrollAsk(fn: (t: ScrollTarget) => void) {
  asks.add(fn);
  return () => {
    asks.delete(fn);
  };
}
/** Ask the shop on screen to scroll to a station (the dining room, the door). Nothing happens in a shop that does not scroll. */
export function askScroll(target: ScrollTarget) {
  asks.forEach((fn) => fn(target));
}
