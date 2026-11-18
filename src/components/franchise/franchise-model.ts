// What the franchise screens say, as plain data (v5.18, card T2): the confirm sheet's two lists and numbers, the franchise moment's lines, the
// map lot's label and the City screen's list of cities. The numbers come from the engine (`franchiseGain`, which `franchise()` is pinned to),
// so the sheet never promises more or less than the franchise gives. Pure: unit-tested in node.
import { CITIES, cityOf } from '../../content/cities';
import { CITY_ORDER, cityIndex } from '../../content/franchise';
import { canFranchise, franchiseCount, franchiseGain, multiplierNow, starsOf } from '../../engine/features/franchise';
import { money } from '../../engine/format';
import type { GameState } from '../../engine/game';

/** The sheet asks twice (`ask`, then `sure`); the moment is the send-off, and its button is what commits. */
export type FlowStep = 'ask' | 'sure' | 'moment';

/** The step after a "go" press; `'commit'` once the moment's button is pressed (the franchise itself). */
export const advance = (s: FlowStep): FlowStep | 'commit' => (s === 'ask' ? 'sure' : s === 'sure' ? 'moment' : 'commit');
/** The step a "back" press returns to, or null to close the sheet. The moment cannot be left once reached (the player has said yes twice). */
export const retreat = (s: FlowStep): FlowStep | null => (s === 'sure' ? 'ask' : s === 'ask' ? null : 'moment');

/** "×1.0", "×2.3": a multiplier to one decimal. */
export const times = (m: number): string => `×${(Math.round(m * 10) / 10).toFixed(1)}`;

export interface SheetView {
  from: string;
  to: string;
  title: string;
  /** What the player keeps, and what the franchise takes. */
  keep: string[];
  giveUp: string[];
  /** The Stars this franchise pays, the multiplier before and after, as text. */
  starsLine: string;
  multiplierLine: string;
  /** The two confirmations' button labels, and the cancel's. */
  go: [string, string];
  cancel: string;
  warning: string;
}

/** The confirm sheet for a game that may franchise; null when none is on offer. */
export function sheetView(g: GameState): SheetView | null {
  if (!canFranchise(g)) return null;
  const gain = franchiseGain(g);
  const to = gain.next ? CITIES[gain.next]?.name : undefined;
  if (!to) return null;
  const from = cityOf(g).name;
  const built = Object.values(g.shops).filter((s) => s.built).length;
  return {
    from,
    to,
    title: `Franchise ${from}?`,
    keep: ['Diamonds, cosmetics and boosters', 'Recipe cards you have earned', 'Mastery stars already won', 'Your Scrapbook, every story', 'Your lifetime stats'],
    giveUp: [`Your cash (${money(g.cash)})`, `All ${built} pizzerias and their upgrades`, 'The fleet and the night oven', 'Open orders and layer progress'],
    starsLine: gain.stars > 0 ? `+${gain.stars} Franchise Star${gain.stars === 1 ? '' : 's'} (${gain.totalStars} in all)` : 'No new Franchise Stars yet',
    multiplierLine: `Every pizza, in every city: ${times(gain.multiplierBefore)} → ${times(gain.multiplierAfter)}`,
    go: [`Franchise to ${to}`, `Yes, start ${to}`],
    cancel: 'Not yet',
    warning: 'This cannot be undone.',
  };
}

export interface MomentView {
  title: string;
  lines: string[];
  stars: number;
  multiplier: string;
  button: string;
  /** The teaser under Rosa's bubble (D506): a postcard from the city ahead, its neighbourhoods named and coloured. */
  postcard: { title: string; line: string; colors: string[] };
}

/** The postcard from the next city: "Greetings from Boston", then its neighbourhoods in build order; one colour stripe each. */
function postcardOf(city: { neighbourhoods: { name: string; color: string }[] } | undefined, to: string): MomentView['postcard'] {
  const hoods = city?.neighbourhoods ?? [];
  return { title: `Greetings from ${to}`, line: hoods.map((h) => h.name).join(' · '), colors: hoods.map((h) => h.color) };
}

/** The Stars the count-up shows `t` (0 to 1) of the way through: whole numbers, rising at first fast and then slowly, ending exactly on `target`. */
export function countUp(target: number, t: number): number {
  if (t >= 1 || target <= 0) return Math.max(0, target);
  const eased = 1 - (1 - Math.max(0, t)) ** 2;
  return Math.min(target, Math.floor(eased * target));
}

export interface ConfettiPiece {
  /** Radians out from the burst's centre. */
  angle: number;
  /** Points travelled. */
  dist: number;
  color: string;
  /** Spin, in turns, over the burst. */
  turns: number;
}
const CONFETTI_COLORS = ['#FFD23F', '#E8432E', '#FFFFFF', '#6FCF97', '#56CCF2'] as const;
/** `n` pieces of confetti, evenly spread around the circle with a steady jitter in distance, colour and spin (no randomness: the same every time). */
export function confettiPieces(n: number): ConfettiPiece[] {
  return Array.from({ length: n }, (_, i) => ({
    angle: (i / n) * Math.PI * 2 + (i % 2 ? 0.12 : -0.12),
    dist: 90 + ((i * 37) % 60),
    color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
    turns: 1 + (i % 3),
  }));
}

/** The franchise moment: shown after the second yes, before the new city opens (the story's `boston-0` plays right after it). */
export function momentView(g: GameState): MomentView | null {
  const sheet = sheetView(g);
  if (!sheet) return null;
  const gain = franchiseGain(g);
  return {
    title: `${sheet.from} is franchised`,
    lines: [`Every Rosa's has a manager now, and a new word on the sign: FRANCHISE.`, `You don't lose shops, cara mia. They grow up.`],
    stars: gain.stars,
    multiplier: times(gain.multiplierAfter),
    button: `On to ${sheet.to}`,
    postcard: postcardOf(gain.next ? CITIES[gain.next] : undefined, sheet.to),
  };
}

/** The map lot for the next city: two label lines ("Franchise", "Boston"), or null when no franchise is on offer. */
export function lotLabel(g: GameState): [string, string] | null {
  const gain = canFranchise(g) ? franchiseGain(g) : null;
  const to = gain?.next ? CITIES[gain.next]?.name : undefined;
  return to ? ['Franchise', to] : null;
}

export interface CityRow {
  id: string;
  name: string;
  /** The city the game is in now (not a place to go back to: a franchise is one way). */
  current: boolean;
  /** An earlier city: its Scrapbook can be read. */
  past: boolean;
}

/** The cities up to the current one, in play order (a city this build has no pack for is not listed). */
export function cityRows(g: GameState): CityRow[] {
  const here = cityIndex(g.city);
  return CITY_ORDER.slice(0, here + 1)
    .filter((id) => CITIES[id])
    .map((id, i) => ({ id, name: CITIES[id].name, current: i === here, past: i < here }));
}

/** The line under the cities: the Stars held and what they multiply by (null before the first franchise). */
export function starsSummary(g: GameState): string | null {
  const stars = starsOf(g);
  if (franchiseCount(g) === 0 && stars === 0) return null;
  return `★ ${stars} Franchise Star${stars === 1 ? '' : 's'} · ${times(multiplierNow(g))} on every pizza`;
}

/** "no manager yet", "1 with a manager", "3 with managers" (D516). */
export const managersText = (n: number): string => (n === 0 ? 'no managers yet' : n === 1 ? '1 with a manager' : `${n} with managers`);
