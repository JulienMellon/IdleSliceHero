// Reads the layer copy table (content/copy/home/layers.ts, generated from docs/story/COPY-v5.16.md): a line by its key, with {placeholders} filled.
// No string of the layer screens is written in a component: it is a key here, or one of the few labels in `LABELS` below (numbers' captions
// the copy file has no row for: listed in the card report as a copy ask). Pure: unit-tested in node.
import { dressed, fill, t, type CopyVars } from '../../content/copy';
import type { NeighborhoodId } from '../../content/types';
import { LAYER_COPY, LAYER_SPEAKERS, type LayerCopyKey } from '../../content/copy/home/layers';

export type { CopyVars };

/** The line for `key`, each `{name}` replaced by `vars.name` (a placeholder with no value is left as written). A thin wrapper over `t` (home). */
export const lc = (key: LayerCopyKey, vars: CopyVars = {}): string => t(key, vars);

/** A template with each `{name}` replaced by `vars.name` (the one `fill`). */
export const fillText = fill;

/** `lc` in a city: the city's own line for the key when it dresses it (its pack's `copy`), else the home line. A thin wrapper over `t`. */
export const lcc = (city: string | undefined, key: LayerCopyKey, vars: CopyVars = {}): string => t(key, vars, city);

/** Who says the line, or null for a line with no speaker. */
export const speakerOf = (key: string): string | null => LAYER_SPEAKERS[key] ?? null;

export type RivalLine = 'open' | 'title' | 'win' | 'lose';
export const rivalKey = (hood: NeighborhoodId, kind: RivalLine): LayerCopyKey => `rival.${hood}.${kind}` as LayerCopyKey;
/** A rival line for a neighbourhood (`{n}` of the title is the pies asked). */
export const rivalLine = (hood: NeighborhoodId, kind: RivalLine, vars: CopyVars = {}, city?: string): string => {
  const key = rivalKey(hood, kind);
  // a neighbourhood the home table has no row for (another city's) says the city's own rival line
  return key in LAYER_COPY ? lc(key, vars) : fill(dressed(city, `rival.${kind}`, ''), vars);
};
/** Who speaks a rival line: Todd, Victor, or the shop's character. */
export const rivalSpeaker = (hood: NeighborhoodId, kind: RivalLine): string | null => speakerOf(rivalKey(hood, kind));

/** Captions for the numbers on the info sheets and cards. The copy file has no rows for them (card report: copy ask). */
export const LABELS = {
  nextGame: 'Next game',
  seatsFree: 'Seats free',
  rushLeft: 'Rush ends in',
  nextBoat: 'Next boat',
  boatLeft: 'Boat leaves in',
  rack: 'Warming rack',
  rackEmpty: 'No rack yet',
  bidNow: 'Current bid',
  bidBase: 'Starting bid',
  bidCap: 'Bid cap',
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
