// The ink colour and the thin outline most outfit pieces share, in one place so the home outfits and each city's agree.
export const INK = '#3B1F14';

/** The thin outline of an outfit piece (spread, then override `strokeWidth` where a piece is finer or bolder). */
export const THIN = { stroke: INK, strokeWidth: 1.5, strokeLinejoin: 'round' as const };
