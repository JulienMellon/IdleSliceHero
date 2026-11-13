// What the mastery stars show, as plain data (v5.15). The rules are engine/features/mastery.ts; the words are the copy table.
// Pure: unit-tested in node.
import { MASTERY_STARS, type MasteryStar } from '../../content/endgame';
import type { NeighborhoodId } from '../../content/types';
import { def, type Shop } from '../../engine/game';
import { masteryStars, shopStars, type MasteryNews, type NextStar } from '../../engine/features/mastery';
import { copy } from './copy-text';

/** The copy keys name the stars `crew`, `flagship` and `gold`. */
const COPY_STAR: Record<MasteryStar, 'crew' | 'flagship' | 'gold'> = { heads: 'crew', flagship: 'flagship', golden: 'gold' };

/** "Full Crew", "Flagship", "Golden Ovens". */
export const starName = (star: MasteryStar): string => copy(`mastery.${COPY_STAR[star]}.name`);

/** "Golden ovens glow in Uptown!": the toast for a star just earned. */
export const starToast = (shopId: NeighborhoodId, star: MasteryStar): string => copy(`mastery.${COPY_STAR[star]}.toast`, { shop: def(shopId).name });

/** "Next: Flagship in Suburbs". */
export const nextStarLine = (n: Pick<NextStar, 'shopId' | 'star'>): string => copy('goal.mastery.next', { star: starName(n.star), shop: def(n.shopId).name });

/** A shop's three pips, in star order (heads, Flagship, golden ovens): lit or not. */
export const starPips = (shop: Shop): boolean[] => {
  const have = masteryStars(shop);
  return MASTERY_STARS.map((k) => have[k]);
};

/** The pips as a 3-bit number (heads = 1, Flagship = 2, golden ovens = 4): a primitive for a memoised pip row. */
export const pipBits = (pips: readonly boolean[]): number => pips.reduce((b, on, i) => (on ? b | (1 << i) : b), 0);

/** D464: the pips are hidden until the shop's first head is hired (a manager brings all three), so a new shop doesn't wear three empty stars. */
export const showPips = (shop: Shop): boolean => shop.managed || Object.values(shop.heads).some(Boolean);

export { shopStars };

/** A toast's text for one piece of mastery news; null for a cosmetic (the toast shows its name through the shop copy). */
export function masteryNewsText(n: MasteryNews): string | null {
  return n.kind === 'star' ? starToast(n.shopId, n.star) : null;
}

/** The outline of a five-point star centred on (cx, cy) with outer radius r, as an SVG path. */
export function starPath(cx: number, cy: number, r: number): string {
  const pts: string[] = [];
  for (let i = 0; i < 10; i++) {
    const a = -Math.PI / 2 + (i * Math.PI) / 5;
    const rr = i % 2 === 0 ? r : r * 0.45;
    pts.push(`${(cx + Math.cos(a) * rr).toFixed(2)} ${(cy + Math.sin(a) * rr).toFixed(2)}`);
  }
  return `M${pts.join(' L')} Z`;
}
