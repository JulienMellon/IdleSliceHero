// Tap-target sizes. Apple's minimum is 44 pt. On iOS a hitSlop only counts inside space the parent owns (a touch
// outside the parent's bounds never reaches the child), and react-native-web ignores hitSlop, so the screenshots
// can't show it. So every control here is drawn at 44 pt, except Close, whose small margin stays inside the
// drawer header's padding. The StyleSheets in sidewalk-row.tsx and app/index.tsx are built from these numbers,
// so the tests below describe the real layout. Unit-tested in node.

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

/** The drawn height of every compact (sidewalk) button, including its 4 pt lip. */
export const BUTTON_H = 44;

/** A sidewalk station card: a frame around its 44 pt button. */
export const STATION_CARD = { border: 2.5, padding: 3 } as const;
/** The drawer header around the title and Close. */
export const DRAWER_HEAD = { padTop: 10, padBottom: 4, padX: 14 } as const;
/** Gap between the chip row and the manager button on a shop with no manager. */
export const IDLE_STACK_GAP = 5;
/** Text in the fixed 44 pt buttons may grow with iOS Larger Text only this much before it would overflow (C50). */
export const COMPACT_FONT_MAX_SCALE = 1.15;

const drawn = (height: number): TapControl => ({ height, slopTop: 0, slopBottom: 0, roomTop: 0, roomBottom: 0 });

export const TAP = {
  min: 44,
  controls: {
    /** Station buttons, the unmanaged shop's chips and its manager button all share the compact button. */
    compactButton: drawn(BUTTON_H),
    /** Drawer Close: 36 pt drawn, a 4 pt margin inside the header's padding. */
    closeButton: { height: 36, slopTop: 4, slopBottom: 4, roomTop: DRAWER_HEAD.padTop, roomBottom: DRAWER_HEAD.padBottom },
  },
} as const satisfies { min: number; controls: Record<string, TapControl> };

/** Close's hit margin, hoisted so the screen doesn't allocate it on every render. */
export const CLOSE_SLOP = { top: TAP.controls.closeButton.slopTop, bottom: TAP.controls.closeButton.slopBottom, left: 10, right: 10 } as const;

/**
 * The sidewalk row. The row's foot sits this far above the kerb line (pt): a managed shop's 55 pt cards keep their
 * top where v3.7's 62 pt cards had it, so the curb walk-ins still clear it, and the street below stays visible.
 * An unmanaged shop stacks the chip row and the manager button; it sits lower to clear the WELCOME mat.
 */
export const SIDEWALK_ROW = {
  cardHeight: BUTTON_H + 2 * (STATION_CARD.border + STATION_CARD.padding),
  idleStackHeight: BUTTON_H + IDLE_STACK_GAP + BUTTON_H,
  raiseManaged: 13,
  raiseIdle: 2,
} as const;
