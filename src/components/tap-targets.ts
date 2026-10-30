// Tap-target sizes (v3.9). Apple's minimum is 44 pt. On iOS a hitSlop only counts inside space the parent owns
// (a touch outside the parent's bounds never reaches the child), and react-native-web ignores hitSlop, so the
// screenshots can't show it. So every control here is drawn at 44 pt, except Close, whose small margin stays
// inside the drawer header's padding. Unit-tested in node.

export interface TapControl {
  /** Drawn height (pt). */
  height: number;
  slopTop: number;
  slopBottom: number;
  /** Space the parent owns above / below the control, which a hitSlop may use. */
  roomTop: number;
  roomBottom: number;
}

export const hitSize = (c: TapControl) => c.height + c.slopTop + c.slopBottom;

const drawn = (height: number): TapControl => ({ height, slopTop: 0, slopBottom: 0, roomTop: 0, roomBottom: 0 });

export const TAP = {
  min: 44,
  controls: {
    /** Each sidewalk station is one button: its name above the price (the label strip of v3.8 is gone). */
    stationButton: drawn(44),
    /** Station chips on a shop with no manager. */
    miniChip: drawn(44),
    /** "Hire a manager" on a shop with no manager. */
    managerButton: drawn(44),
    /** Drawer Close: 36 pt drawn, a 4 pt margin inside the header's padding (10 pt above, 4 pt below). */
    closeButton: { height: 36, slopTop: 4, slopBottom: 4, roomTop: 10, roomBottom: 4 },
  },
} as const satisfies { min: number; controls: Record<string, TapControl> };

/** Close's hit margin, hoisted so the screen doesn't allocate it on every render. */
export const CLOSE_SLOP = { top: TAP.controls.closeButton.slopTop, bottom: TAP.controls.closeButton.slopBottom, left: 10, right: 10 } as const;

/**
 * The sidewalk row. A station card is its 44 pt button plus a border and padding. The row's foot sits this far
 * above the kerb line (pt): a managed shop's 55 pt cards keep their top where v3.7's 62 pt cards had it, so the
 * curb walk-ins still clear it, and the street below stays visible.
 */
export const SIDEWALK_ROW = {
  cardInset: 2.5 + 3,
  cardHeight: 44 + 2 * (2.5 + 3),
  raiseManaged: 13,
  /** An unmanaged shop stacks chips (44) + 5 + the manager button (44) = 93 pt; it sits lower to clear the WELCOME mat. */
  raiseIdle: 2,
} as const;
