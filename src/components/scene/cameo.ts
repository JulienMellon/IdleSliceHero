// The day-30 visitor's cameo (v5.15, S1): while the visit's 2x boost runs, Nonna Rosa (cycle 1; later cycles Big Sal, Genevieve) stands by
// the counter in the shop on screen with the visit's time left on a small tag, and says a line every few minutes. Pure (no React): who,
// what they say and when, and where everything goes, so the budget is tested in node. storefront.tsx draws it.
import { CAMEO, CAMEO_NONNA_LINES } from '../../content/heads';
import { VISITOR_LINES, VISITOR_NAMES, VISITORS } from '../../content/rewards';
import type { Boost } from '../../engine/game';
import type { Layout } from './layout';
import type { PersonProps } from './looks';
import { figureBox } from './ladder';
import { P } from './projection';
import type { Rect } from './stations';

export interface Visit {
  /** A VISITORS id: 'nonna', 'big-sal', 'genevieve'. */
  visitor: string;
  name: string;
  /** Seconds of the visit's boost left. */
  left: number;
}

/** The visit running at `now` (wall ms), from the boosts (`rewards.boosts`; rewards.ts `claimGift` names the day-30 one `visit-<visitor>`), or null. The longest-running one wins. */
export function visitOf(boosts: readonly Pick<Boost, 'source' | 'until'>[], now: number): Visit | null {
  let best: Pick<Boost, 'source' | 'until'> | null = null;
  for (const b of boosts) if (b.until > now && b.source.startsWith('visit-') && (!best || b.until > best.until)) best = b;
  if (!best) return null;
  const visitor = best.source.slice('visit-'.length);
  if (!VISITORS.includes(visitor)) return null;
  return { visitor, name: VISITOR_NAMES[visitor] ?? visitor, left: (best.until - now) / 1000 };
}

/** The tag's text: "6d 4h" while there are days, "5h 12m" under a day, "42m" under an hour. Rounded up to the minute, so it never reads 0m while the visit runs. */
export function visitTag(left: number): string {
  const mins = Math.max(1, Math.ceil(left / 60));
  const d = Math.floor(mins / 1440);
  const h = Math.floor((mins % 1440) / 60);
  const m = mins % 60;
  return d > 0 ? `${d}d ${h}h` : h > 0 ? `${h}h ${m}m` : `${m}m`;
}

/** What a visitor can say: Nonna her six lines (COPY section 8); the others the one line they gave on the gift card. */
export const linesOf = (visitor: string): readonly string[] => (visitor === 'nonna' ? CAMEO_NONNA_LINES : [VISITOR_LINES[visitor] ?? '']).filter(Boolean);

/**
 * The line on show at wall second `t` (a line every CAMEO.everySeconds, up for CAMEO.lineSeconds from CAMEO.firstAfter into each period),
 * or null. The period number picks the line, so the six come round in turn and the same moment always says the same thing.
 */
export function visitLine(visitor: string, t: number): string | null {
  const lines = linesOf(visitor);
  if (!lines.length) return null;
  const slot = Math.floor(t / CAMEO.everySeconds);
  const into = t - slot * CAMEO.everySeconds;
  if (into < CAMEO.firstAfter || into >= CAMEO.firstAfter + CAMEO.lineSeconds) return null;
  return lines[slot % lines.length];
}

/** A line longer than this many characters is set on two lines (the narrowest room's walls fit about 40; Big Sal's and Genevieve's gift-card lines run to 49). */
export const SAY_MAX_CHARS = 34;
/** The line's lines: itself, or split at the space nearest its middle. */
export function sayLines(text: string): string[] {
  if (text.length <= SAY_MAX_CHARS) return [text];
  const mid = text.length / 2;
  let cut = -1;
  for (let i = 0; i < text.length; i++) if (text[i] === ' ' && (cut < 0 || Math.abs(i - mid) < Math.abs(cut - mid))) cut = i;
  return cut < 0 ? [text] : [text.slice(0, cut), text.slice(cut + 1)];
}
/** The pill's height: 18 for a line, 30 for two. */
export const sayHeight = (lines: readonly string[]) => 6 + 12 * lines.length;

/** How each visitor is drawn: a standing guest figure with their own hair and shirt (people.tsx `Person` props), facing us. */
export const VISITOR_LOOK: Readonly<Record<string, Pick<PersonProps, 'seed' | 'shirt' | 'hair'>>> = {
  nonna: { seed: 4107, shirt: '#6B3E7A', hair: '#CFCBC6' },
  'big-sal': { seed: 5213, shirt: '#E8742A', hair: '#2B1A12' },
  genevieve: { seed: 6329, shirt: '#7B1E3A', hair: '#E3C16F' },
};

/** Where the visitor stands: behind the counter's right end, the cashiers' depth (the door side, clear of the counter staff). Room units. */
export const cameoSpot = (lay: Pick<Layout, 'counter'>): { x: number; y: number } => ({ x: lay.counter.x1 - 10, y: 92 });

/** The tag's size on screen, and the air between it and the head. */
export const TAG_H = 13;
export const tagWidth = (text: string) => text.length * 5.6 + 12;
const TAG_AIR = 13;

/** Where the figure, its tag and its speech pill go, in scene units (the figure's box is the crowd budget's: 22 wide, 56 tall at its depth). */
export function cameoGeom(lay: Pick<Layout, 'counter' | 'door' | 'R'>, tag: string): { spot: { x: number; y: number }; body: Rect; tag: Rect; sayY: number; tailX: number } {
  const spot = cameoSpot(lay);
  const body = figureBox(spot.x, spot.y, 56);
  const w = tagWidth(tag);
  const cx = (body.x0 + body.x1) / 2;
  const y1 = body.y0 - TAG_AIR;
  // the tag stays left of the doorway's left jamb (the door's window starts at 270 and the tag is 272 up)
  const x1 = Math.min(cx + w / 2, P(lay.door.x0 - 8, 0)[0] - 2);
  return { spot, body, tag: { x0: x1 - w, x1, y0: y1 - TAG_H, y1 }, sayY: y1 - TAG_H - 6, tailX: cx };
}
