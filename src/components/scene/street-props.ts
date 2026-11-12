// Geometry of the neighbourhoods' sidewalk signature props that needs a budget (D432). Pure, so node tests can check it;
// room.tsx `StreetProp` draws from it.

/**
 * The Suburbs' picket fence (D432): it used to be two rails and nine pickets floating on the sidewalk, cut off at both ends with
 * nothing behind it, which read as a fragment of a fence. It is now a small fenced front-garden bed: a grass-and-soil border under it,
 * a capped post at each end (so the fence visibly starts and stops), and the shrub planted inside.
 */
export const PICKET = {
  halfW: 26,
  height: 22,
  /** The end posts' x (a post is 4 wide, so its outer edge is halfW). */
  posts: [-24, 24] as const,
  postW: 4,
  /** Pickets between the posts. */
  pickets: [-18, -12, -6, 0, 6, 12, 18] as const,
  /**
   * The front lawn the fence stands in (v5.14, D432): a grass strip that runs 4 past each end post and 8 deep behind the fence's foot, so the
   * pickets enclose a yard instead of floating on the paving. x extent and the y range it covers (y down from the baseline).
   */
  bed: { x0: -30, x1: 30, y0: -8, y1: 2.5 },
  /** The shrubs planted in the yard behind the pickets (centre, radius): wholly inside the lawn's x range, their foot on its grass. */
  shrubs: [
    { cx: -15, cy: -11, r: 8 },
    { cx: 14, cy: -10, r: 6.5 },
  ],
} as const;
