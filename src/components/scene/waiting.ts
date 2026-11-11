// What the sidewalk says about the people waiting outside (G90, D421). Pure, so the counts and the words are tested in node.
import type { Stage } from '../../engine/game';

/** Most idle drivers the scene draws; each figure stands for up to ten drivers. */
export const MAX_DRIVER_FIGURES = 4;
/** Idle drivers per drawn figure. */
export const DRIVERS_PER_FIGURE = 10;

/**
 * How many figures stand for `idle` drivers: one per ten, at most four, never more than the shop's idle count says (G90: the old
 * scene showed as many as the footprint had room for, so ×29 idle drew one figure and ×9 drew three). A pure function of the
 * count, so it cannot flicker between frames.
 */
export const driverFigures = (idle: number): number => (idle > 0 ? Math.min(MAX_DRIVER_FIGURES, Math.ceil(idle / DRIVERS_PER_FIGURE)) : 0);

const KITCHEN_NAME: Partial<Record<Stage, string>> = { prep: 'Prep', ovens: 'Ovens', counter: 'Counter' };

/**
 * The pill over the idle drivers (D421): how many wait, and which station to buy. `slowest` is the stages tied for the
 * bottleneck (`Game.tiedStages`); only the kitchen's stations can be bought to feed idle drivers. Two tied stations
 * read "Prep + Ovens" (one alone adds nothing), all three read "all three".
 */
export function waitingText(idle: number, slowest: readonly Stage[]): string {
  const n = Math.max(0, Math.round(idle));
  const names = (['prep', 'ovens', 'counter'] as const).filter((st) => slowest.includes(st)).map((st) => KITCHEN_NAME[st]!);
  const what = names.length === 0 ? '' : names.length === 3 ? ' · buy all three' : ` · buy ${names.join(' + ')}`;
  return `${n} driver${n === 1 ? '' : 's'} idle${what}`;
}

/** The "+N" pill at the end of the diner queue: how many hungry diners the spots cannot show (0: no pill). */
export const queueOverflow = (diners: number, spots: number): number => Math.max(0, Math.floor(diners) - spots);
