// Tap-target rule (Julien's decisions #29 to #31, 2026-11-13). Apple's minimum is 44 pt. A control passes when, in both
// directions, it is drawn at MIN_HIT (44 pt) or more, OR it is drawn at MIN_DRAWN (40 pt) or more and its hitSlop brings
// it to 44 pt using only space its parent owns. Never under 40 pt drawn. The one exception is a drawer's Close (36 pt
// drawn, a 4 pt margin inside the header's padding; documented in layout_allow.json). Text is 10 pt or more.
// On iOS a hitSlop only counts inside the parent's bounds (a touch outside the parent never reaches the child) and
// react-native-web ignores hitSlop, so the screenshots can't show it: `controlPasses` below is what proves it, and the
// numbers in this file are the ones the StyleSheets in sidewalk-row.tsx, game-ui.tsx and app/index.tsx are built from.
// A control kept at 40 to 43 pt carries a `"proof"` in scripts/layout_allow.json that names its test. Unit-tested in node.

/** The least a control may be drawn (pt) when a hitSlop makes up the rest. */
export const MIN_DRAWN = 40;
/** The least a touch area may be (pt), in both directions. */
export const MIN_HIT = 44;

/** One direction of a control: how big it is drawn, how far its hitSlop reaches each way, and the space its parent owns each way. */
export interface Axis {
  drawn: number;
  slopBefore: number;
  slopAfter: number;
  /** Space the parent owns before / after the control, which a hitSlop may use. */
  roomBefore: number;
  roomAfter: number;
}

/** The touch length of an axis (drawn plus slop), counting only the slop the parent's room lets through. */
export const reach = (a: Axis): number => a.drawn + Math.min(a.slopBefore, a.roomBefore) + Math.min(a.slopAfter, a.roomAfter);

/** True when the axis follows the rule: 44 pt drawn, or 40 pt drawn and a slop that stays inside the parent and reaches 44 pt. */
export function axisPasses(a: Axis): boolean {
  if (a.drawn >= MIN_HIT) return true;
  return a.drawn >= MIN_DRAWN && a.slopBefore <= a.roomBefore && a.slopAfter <= a.roomAfter && a.drawn + a.slopBefore + a.slopAfter >= MIN_HIT;
}

/** A control passes when both of its directions do. */
export const controlPasses = (x: Axis, y: Axis): boolean => axisPasses(x) && axisPasses(y);

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
/** The width Close and its gap take from the drawer header's line (pt): the title and the line under it share the rest. */
export const DRAWER_CLOSE_W = 100;
/** Gap between the chip row and the manager button on a shop with no manager. */
export const IDLE_STACK_GAP = 5;
/** Text in the fixed 44 pt buttons may grow with iOS Larger Text only this much before it would overflow (C50). */
export const COMPACT_FONT_MAX_SCALE = 1.15;

const drawn = (height: number): TapControl => ({ height, slopTop: 0, slopBottom: 0, roomTop: 0, roomBottom: 0 });

export const TAP = {
  min: MIN_HIT,
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
  /** G102: the row's geometry, one place for the layout and the fit arithmetic (endgame/fit-model.ts). */
  edge: 8,
  gap: 5,
  /** The "All" button and the ×1/×10/MAX chip at the row's left end: 42 and 40 pt wide, the full 55 pt row tall. */
  allWidth: 42,
  amountWidth: 40,
  /** The gap between the unframed chips of an unmanaged shop. */
  chipGap: 4,
  /** A compact button's own horizontal chrome: its 2 pt border and 1 pt padding on both sides. */
  buttonChrome: 2 * (2 + 1),
} as const;

/** The sidewalk row's two end buttons are 40 and 42 pt wide, the full row tall: their hitSlop takes the rest from the row's own 5 pt gaps (never past the row's ends). */
export const SIDEWALK_SLOP = {
  /** ×1 / ×10 / MAX: the row's left end, so all of the slop goes to its right. */
  amount: { top: 0, bottom: 0, left: 0, right: 4 },
  /** "All": the row's right end, so all of the slop goes to its left. */
  all: { top: 0, bottom: 0, left: 2, right: 0 },
} as const;

// ---------- the HUD's top row ----------

/** The HUD's round buttons are drawn this big (pt), with this gap between them and this padding at the row's ends. */
export const HUD_ICON = 40;
export const HUD_GAP = 6;
export const HUD_PAD = 12;
/** The top row is never shorter than this (its cash pill is taller; this is the least the buttons are promised): 4 pt of room above and below a 40 pt button. */
export const HUD_ROW_H = 48;

/**
 * The round buttons' hitSlop (pt). The row owns its own bounds only, so the leftmost button (the book) borrows nothing on its left
 * and the rightmost (the map) nothing on its right; both take their 4 pt from the gap beside them. A middle button takes 2 pt each
 * side, so two neighbours' slops together never exceed the 6 pt gap between them (HUD_GAP).
 */
export const HUD_SLOP = {
  first: { top: 4, bottom: 4, left: 0, right: 4 },
  middle: { top: 4, bottom: 4, left: 2, right: 2 },
  last: { top: 4, bottom: 4, left: 4, right: 0 },
} as const;

export type HudKey = 'scrapbook' | 'tasks' | 'gift' | 'shop' | 'city';
export const HUD_BUTTON_SLOP = { scrapbook: HUD_SLOP.first, tasks: HUD_SLOP.middle, gift: HUD_SLOP.middle, shop: HUD_SLOP.middle, city: HUD_SLOP.last } as const satisfies Record<HudKey, object>;

export interface HudButton {
  key: HudKey;
  x: number;
  width: number;
  /** The touch area along the row, and how far the parent's bounds let it go either side. */
  slop: { top: number; bottom: number; left: number; right: number };
}

/**
 * The top row laid out left to right from the StyleSheet's own constants: book, clipboard (once rewards unlock), the cash pill (flex),
 * gift, the top-row chips (the diamonds), map. `x` is from the row's left edge; the row is `screenW - 2 * HUD_PAD` wide.
 */
export function hudRow(screenW: number, { tasks, gift, topChips }: { tasks: boolean; gift: boolean; topChips: number }) {
  const rowW = screenW - 2 * HUD_PAD;
  const keys: (HudKey | 'cash')[] = ['scrapbook', ...(tasks ? (['tasks'] as const) : []), 'cash', ...(gift ? (['gift'] as const) : []), ...Array.from({ length: topChips }, () => 'shop' as const), 'city'];
  const icons = keys.length - 1;
  const cashW = rowW - icons * HUD_ICON - (keys.length - 1) * HUD_GAP;
  let x = 0;
  const buttons: HudButton[] = [];
  let cash = { x: 0, width: cashW };
  for (const k of keys) {
    if (k === 'cash') {
      cash = { x, width: cashW };
      x += cashW + HUD_GAP;
    } else {
      buttons.push({ key: k, x, width: HUD_ICON, slop: HUD_BUTTON_SLOP[k] });
      x += HUD_ICON + HUD_GAP;
    }
  }
  return { rowW, rowH: HUD_ROW_H, buttons, cash };
}

// ---------- the goal bar ----------

/**
 * The goal bar is drawn 30 pt tall, inside a button that is 44 pt tall (the bar's 7 pt of clear space above and below it are part of the
 * button, so the touch area is drawn, not borrowed). Its row cancels that space with a negative margin, so the HUD is no taller than with a
 * bare 30 pt bar: the space comes out of the 8 pt gap above the row and the 10 pt padding under it, which the HUD owns.
 */
export const GOAL_BAR_H = 30;
export const GOAL_TAP_ROOM = 7;
export const GOAL_TAP_H = GOAL_BAR_H + 2 * GOAL_TAP_ROOM;
/** The HUD's vertical rhythm: the gap between the top row and the goal row, and the padding under the goal row. */
export const HUD_STACK = { gap: 8, padBottom: 10 } as const;
