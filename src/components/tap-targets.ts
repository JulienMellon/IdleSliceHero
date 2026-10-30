// Tap-target sizes (v3.8). Apple's minimum is 44 pt. A control may be drawn smaller as long as its hit
// margin (hitSlop) makes up the rest; the main buy button is drawn at full size. Unit-tested in node.

export interface TapControl {
  /** Drawn height (pt). */
  height: number;
  slopTop: number;
  slopBottom: number;
}

export const hitSize = (c: TapControl) => c.height + c.slopTop + c.slopBottom;

export const TAP = {
  min: 44,
  /** Dead space between a station's label strip (opens the drawer) and its buy button. */
  stripButtonGap: 4,
  controls: {
    /** Sidewalk buy button: the main action, drawn at 44 pt. */
    buyButton: { height: 44, slopTop: 0, slopBottom: 0 },
    /** The label strip on top of each station card opens the drawer; its hit area reaches upward only. */
    stationStrip: { height: 18, slopTop: 26, slopBottom: 0 },
    /** Station chips on a shop with no manager: drawn at 26 pt so the column doesn't cover the WELCOME mat; the margin fills the gap above and below. */
    miniChip: { height: 26, slopTop: 9, slopBottom: 9 },
    /** Drawer Close button. */
    closeButton: { height: 30, slopTop: 7, slopBottom: 7 },
  },
} as const satisfies { min: number; stripButtonGap: number; controls: Record<string, TapControl> };

/** hitSlop props for a control. */
export const slopOf = (c: TapControl, side = 6) => ({ top: c.slopTop, bottom: c.slopBottom, left: side, right: side });
