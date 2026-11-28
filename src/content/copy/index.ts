// The one copy system (card R5c): `t(key, vars, city)` is every player-facing line. It looks in the city pack's own `copy` first
// (`CityDef.copy`, in the city's folder) and then in the home tables below, and fills the `{placeholders}` (fill.ts). The components' old readers
// (copy(), lc(), lcc(), dressed(), isDressed()) are thin wrappers over it. content/copy may import content/cities; a pack never imports this.
import { CITIES } from '../cities';
import { COPY as AMBIENT } from './home/ambient';
import { COPY as CHAPTERS } from './home/chapters';
import { COPY as ENDGAME } from './home/endgame';
import { COPY as FREE_GIFT } from './home/free-gift';
import { LAYER_COPY } from './home/layers';
import { LINES } from './home/lines';
import { COPY as LOOKS } from './home/looks';
import { COPY as MENU } from './home/menu';
import { COPY as RENOVATION } from './home/renovation';
import { COPY as REPORT } from './home/report';
import { COPY as SHIFTS } from './home/shifts';
import { COPY as STARS } from './home/stars';
import { COPY as STORE } from './home/store-copy';
import { COPY as TUTORIAL } from './home/tutorial';
import { fill, type CopyVars } from './fill';

export { fill, type CopyVars } from './fill';

/** Every home line, by key (the keys of the tables are disjoint: copy.test.ts checks it). */
export const HOME_COPY: Readonly<Record<string, string>> = {
  ...AMBIENT,
  ...CHAPTERS,
  ...ENDGAME,
  ...FREE_GIFT,
  ...LAYER_COPY,
  ...LOOKS,
  ...MENU,
  ...RENOVATION,
  ...REPORT,
  ...SHIFTS,
  ...STARS,
  ...STORE,
  ...TUTORIAL,
  ...LINES,
};

/** The line a city says in place of the home one for `key` (its pack's `copy`), or undefined when it has none. */
export function cityLine(city: string | undefined, key: string): string | undefined {
  const table = CITIES[city ?? '']?.copy;
  return table !== undefined && Object.prototype.hasOwnProperty.call(table, key) ? table[key] : undefined;
}

/** The raw template for a key in a city: its own line, else the home one, else undefined. */
export const lineOf = (key: string, city?: string): string | undefined => cityLine(city, key) ?? HOME_COPY[key];

/** The line for `key` in `city` (home when omitted), each `{name}` replaced by `vars.name`. An unknown key says itself, so a typo shows up on screen. */
export const t = (key: string, vars: CopyVars = {}, city?: string): string => fill(lineOf(key, city) ?? key, vars);

/** The line a city says for a home key: its own dressing, or `home` (the home text) when it has none. */
export const dressed = (city: string | undefined, key: string, home: string): string => cityLine(city, key) ?? home;

/** Whether a city dresses a key (a screen that has no home text for it asks this). */
export const isDressed = (city: string | undefined, key: string): boolean => cityLine(city, key) !== undefined;
