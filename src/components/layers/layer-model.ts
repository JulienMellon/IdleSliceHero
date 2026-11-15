// What every layer screen shares, as plain data: time and progress text, the 5% steps, and where the layer notices stack under the
// endgame stack. Pure: unit-tested in node.
import { STACK, stackTop } from '../endgame/stack-model';

/** "3:07": seconds as minutes and seconds (rounded up, never negative). */
export function mmss(seconds: number): string {
  const t = Math.max(0, Math.ceil(Number.isFinite(seconds) ? seconds : 0));
  return `${Math.floor(t / 60)}:${String(t % 60).padStart(2, '0')}`;
}

/** Progress in steps of 5% (0..20): a bar repaints a step at a time, never per game tick. */
export const STEPS = 20;
export const step5 = (share: number): number => Math.round(Math.max(0, Math.min(1, Number.isFinite(share) ? share : 0)) * STEPS);
export const pct5 = (step: number): number => (Math.max(0, Math.min(STEPS, step)) / STEPS) * 100;

/** Every layer chip is as tall as a tap target (tap-targets.ts `TAP.min`). */
export const CHIP_H = 44;

/** A chip's text as up to three short lines, a word to a line ("Game" / "Day" / "3:07"); a longer text keeps its first words together on line one. */
export function chipLines(text: string): string[] {
  const words = text.split(' ').filter(Boolean);
  return words.length <= 3 ? words : [words.slice(0, -2).join(' '), ...words.slice(-2)];
}

/** pt a 10 pt Fredoka bold character takes (measured in the web build: "Game Day" needs about 52 pt). */
export const CHAR_W = 6.6;

/** How wide a chip must be for its longest line, inside 2 pt borders and 4 pt padding. */
export const chipWidth = (text: string): number => Math.max(CHIP_H, Math.ceil(Math.max(0, ...chipLines(text).map((l) => l.length)) * CHAR_W) + 12);

/** What stands in the BANNERS stack above the layer column (endgame/stack-model.ts rows). */
export interface StackAbove {
  orderUp: boolean;
  /** A weekly event's banner is up. */
  eventUp: boolean;
  /** The attack's face: its banner, its chip (running / result) or none. */
  attack: 'none' | 'banner' | 'running' | 'won' | 'lost';
  /** The attack banner is collapsed to its badge (so the badge, not the banner, takes the row). */
  collapsed?: boolean;
}

/** Where the layer notices start: under the order chip, the event banner and the attack's row, in the column's own order. */
export function layerTop(a: StackAbove): number {
  let top = stackTop(a.orderUp);
  if (a.eventUp) top += STACK.event + STACK.gap;
  if (a.attack === 'banner') top += (a.collapsed ? STACK.badge : STACK.banner) + STACK.gap;
  else if (a.attack !== 'none') top += STACK.chip + STACK.gap;
  return top;
}

/** The layer column's rows: a one-line notice, then the rival's card. */
export const ROWS = { notice: 30, rival: 46 } as const;
