// What the sidewalk says about the people waiting outside (G90, D421). Pure, so the counts and the words are tested in node.

/** Most idle drivers the scene draws (D430: four were a wall of caps); each figure stands for up to ten drivers, the pill counts them all. */
export const MAX_DRIVER_FIGURES = 3;
/** Idle drivers per drawn figure. */
export const DRIVERS_PER_FIGURE = 10;

/**
 * How many figures stand for `idle` drivers: one per ten, at most three, never more than the shop's idle count says (G90: the old
 * scene showed as many as the footprint had room for, so ×29 idle drew one figure and ×9 drew three). A pure function of the
 * count, so it cannot flicker between frames.
 */
export const driverFigures = (idle: number): number => (idle > 0 ? Math.min(MAX_DRIVER_FIGURES, Math.ceil(idle / DRIVERS_PER_FIGURE)) : 0);

/**
 * The pill over the idle drivers (D421, v5.22): how many wait, and nothing else. It never says which station to buy: the player reads that from the
 * scene (the piles, the workers' poses) and the report.
 */
export function waitingText(idle: number): string {
  const n = Math.max(0, Math.round(idle));
  return `${n} driver${n === 1 ? '' : 's'} waiting`;
}

/** The "+N" pill at the end of the diner queue: how many hungry diners the spots cannot show (0: no pill). */
export const queueOverflow = (diners: number, spots: number): number => Math.max(0, Math.floor(diners) - spots);

/**
 * The pill's text for the hungry diners the lane does not show (D430): "+N" when some stand in the lane (it counts the rest), otherwise
 * "N waiting" (the shop front's tables leave no room for a figure, so the pill is all there is).
 */
export const queueLabel = (more: number, shown: number): string => (shown > 0 ? `+${more}` : `${more} waiting`);
