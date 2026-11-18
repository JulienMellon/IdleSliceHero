// The Uptown critic as plain data: when the figure is in the shop, how far it has walked, the target chip over its head and the pass or
// fail moment with the copy's lines. Pure: unit-tested in node.
import type { CriticView } from '../../../engine/features/layers/stars';
import { money } from '../../../engine/format';
import { DINING_AISLE_Y } from '../../scene/layout';
import { fill } from '../../report/report-model';
import { COPY, SPEAKERS } from './copy';

/** The critic comes in this many seconds before the visit (the engine judges the shop at the visit, not at the door). */
export const CRITIC_LEAD = 24;
/** The walk from the pavement to the spot takes this long (s). */
export const WALK_SECONDS = 6;
/** The pass or fail moment stays up this long (ms) before the UI acknowledges it. */
export const MOMENT_MS = 5000;

export type CriticPhase = 'away' | 'walking' | 'seated' | 'result';

/** Where the critic is: away, walking in (the last WALK_SECONDS of the lead-in's start), seated until the visit, or at the result. */
export function criticPhase(v: Pick<CriticView, 'active' | 'nextIn' | 'last'>): CriticPhase {
  if (!v.active) return 'away';
  if (v.last) return 'result';
  if (v.nextIn > CRITIC_LEAD) return 'away';
  return CRITIC_LEAD - v.nextIn < WALK_SECONDS ? 'walking' : 'seated';
}

/** The chip over the critic's head: the rating the visit asks for ("Target 4★"). */
export const targetChip = (target: number): string => fill(COPY['layer.uptown.critic.chip.target'], { n: target });

/** The figure's path through the door, in room units, for progress p of the walk (0..1): along the pavement to the door, then in to its spot. */
export function criticPath(p: number, doorCx: number, doorX0: number): { x: number; y: number; step: number; flip: boolean } {
  const q = Math.max(0, Math.min(1, p));
  const spot = { x: doorX0 - 26, y: DINING_AISLE_Y };
  const start = { x: doorCx + 60, y: -9 };
  const door = { x: doorCx, y: -4 };
  const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
  if (q < 0.4) {
    const t = q / 0.4;
    return { x: lerp(start.x, door.x, t), y: lerp(start.y, door.y, t), step: q * 40, flip: true };
  }
  const t = (q - 0.4) / 0.6;
  return { x: lerp(door.x, spot.x, t), y: lerp(door.y, spot.y, t), step: q < 1 ? q * 40 : 0, flip: true };
}

export interface Moment {
  hit: boolean;
  /** "Target 4★ · you had 4★ · +$1.2K": the headline. */
  headline: string;
  /** Genevieve's line: pass or fail, and who says it. */
  line: string;
  speaker: string;
}

/** The pass or fail moment for a finished visit: the numbers, then Genevieve's line from the copy. */
export function moment(last: NonNullable<CriticView['last']>): Moment {
  const key = last.hit ? 'layer.uptown.critic.pass' : 'layer.uptown.critic.fail';
  const headline = `Target ${last.target}\u2605 \u00B7 you had ${last.stars}\u2605${last.hit && last.cash > 0 ? ` \u00B7 +${money(last.cash)}` : ''}`;
  return { hit: last.hit, headline, line: COPY[key], speaker: SPEAKERS[key] ?? '' };
}

/** The arrival notice: "A critic is dining here!" with Genevieve's warning. */
export const arrival = (): { text: string; line: string; speaker: string } => ({
  text: COPY['layer.uptown.critic.banner'],
  line: COPY['layer.uptown.critic.start'],
  speaker: SPEAKERS['layer.uptown.critic.start'] ?? '',
});
