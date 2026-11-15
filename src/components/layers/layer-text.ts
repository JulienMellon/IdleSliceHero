// Reads the layer copy table (layer-copy.ts, generated from docs/story/COPY-v5.16.md): a line by its key, with {placeholders} filled.
// No string of the layer screens is written in a component: it is a key here, or one of the few labels in `LABELS` below (numbers' captions
// the copy file has no row for: listed in the card report as a copy ask). Pure: unit-tested in node.
import type { NeighborhoodId } from '../../content/types';
import { LAYER_COPY, LAYER_SPEAKERS, type LayerCopyKey } from './layer-copy';

export type CopyVars = Readonly<Record<string, string | number>>;

/** The line for `key`, each `{name}` replaced by `vars.name` (a placeholder with no value is left as written). */
export function lc(key: LayerCopyKey, vars: CopyVars = {}): string {
  return LAYER_COPY[key].replace(/\{(\w+)\}/g, (whole, name: string) => (name in vars ? String(vars[name]) : whole));
}

/** Who says the line, or null for a line with no speaker. */
export const speakerOf = (key: string): string | null => LAYER_SPEAKERS[key] ?? null;

export type RivalLine = 'open' | 'title' | 'win' | 'lose';
export const rivalKey = (hood: NeighborhoodId, kind: RivalLine): LayerCopyKey => `rival.${hood}.${kind}` as LayerCopyKey;
/** A rival line for a neighbourhood (`{n}` of the title is the pies asked). */
export const rivalLine = (hood: NeighborhoodId, kind: RivalLine, vars: CopyVars = {}): string => lc(rivalKey(hood, kind), vars);
/** Who speaks a rival line: Todd, Victor, or the shop's character. */
export const rivalSpeaker = (hood: NeighborhoodId, kind: RivalLine): string | null => speakerOf(rivalKey(hood, kind));

/** Captions for the numbers on the info sheets and cards. The copy file has no rows for them (card report: copy ask). */
export const LABELS = {
  nextGame: 'Next game',
  seatsFree: 'Seats free',
  rushLeft: 'Rush left',
  nextBoat: 'Next boat',
  boatLeft: 'Boat leaves in',
  rack: 'Warming rack',
  rackEmpty: 'No rack yet',
  bidNow: 'Bid now',
  bidBase: 'Starting bid',
  bidCap: 'Cap',
  nextRaise: 'Next raise',
  raises: 'Raises so far',
  sales: 'Sales here',
  target: 'To win',
  timeLeft: 'Time left',
  retryIn: 'Try again in',
  buyBetter: 'To do better',
  close: 'Close',
  bid: 'Bid',
  buy: 'Buy',
  start: 'Start',
  maxed: 'Biggest rack',
  challenge: 'Challenge',
  soon: 'Soon',
  fromGameDay: 'from Game Day',
  sold: 'sold',
} as const;
