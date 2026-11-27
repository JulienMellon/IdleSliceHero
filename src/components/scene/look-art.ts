// What the v5.24 looks (card S4: the Downtown, Suburbs and Waterfront sets and the generic small looks) change in the shop, as pure data: colours per look, which shape a sign
// takes, and the two small boxes the new props stand in (the tip jar, the door chime). Pure (no React), so the budget test can put every box against the stations, the heads,
// the badges, the mat and the coach targets, and the thumbnails (look-thumb.tsx) read the same tables as the scene. The colours of a set are one entry in palette.ts.
// The worn ids reach this module through `Dress` (cosmetics.ts: a look's variant is its id without its part, `awning-classic` -> `classic`); S5 adds the other three sets here.
import { LOOKS, lookOf, type Part } from '../../content/catalog';
import type { FacadeKind } from './identity';
import type { Layout } from './layout';
import { flipRect, plainOf } from './layout-space';
import { GENERIC, SET_CLASSIC, SET_DINER, SET_DOCKSIDE } from './palette';
import { P } from './projection';
import type { Rect } from './stations';

// ---------- the storefront themes (facade-*) ----------

/** The line drawn under the fascia beam: a gold pinstripe, the diner's checker band, or a rope. */
export type TrimKind = 'pinstripe' | 'checker' | 'rope';
/** The shape of the shop's name plate. `board` is the plain one every shop starts with. */
export type SignShape = 'board' | 'cartouche' | 'pill' | 'rope' | 'plank';

export interface FacadeTheme {
  /** The pilaster pattern the theme paints (absent: the neighbourhood's own). */
  facade?: FacadeKind;
  pilaster: string;
  seam: string;
  plinth: string;
  fascia: string;
  /** The tile pilaster's cap (the gold of the Uptown tile, here a chrome edge). */
  cap?: string;
  trim: TrimKind;
  trimColor: string;
  trimAlt: string;
  sign: SignShape;
}

export const FACADE_THEMES: Readonly<Record<string, FacadeTheme>> = {
  classic: {
    pilaster: SET_CLASSIC.plaster,
    seam: SET_CLASSIC.plasterSeam,
    plinth: SET_CLASSIC.green,
    fascia: SET_CLASSIC.greenDark,
    trim: 'pinstripe',
    trimColor: SET_CLASSIC.gold,
    trimAlt: SET_CLASSIC.cream,
    sign: 'cartouche',
  },
  diner: {
    facade: 'tile',
    pilaster: SET_DINER.tile,
    seam: SET_DINER.tileSeam,
    plinth: SET_DINER.chrome,
    fascia: SET_DINER.redDark,
    cap: SET_DINER.chrome,
    trim: 'checker',
    trimColor: SET_DINER.black,
    trimAlt: '#FFFFFF',
    sign: 'pill',
  },
  dockside: {
    facade: 'planks',
    pilaster: SET_DOCKSIDE.plank,
    seam: SET_DOCKSIDE.plankSeam,
    plinth: SET_DOCKSIDE.ropeDark,
    fascia: SET_DOCKSIDE.deep,
    trim: 'rope',
    trimColor: SET_DOCKSIDE.rope,
    trimAlt: SET_DOCKSIDE.ropeDark,
    sign: 'rope',
  },
};

/** The plate's colours by shape, for a shop whose sign is the plain painted board (signage tier 0); the neon and marquee tiers keep their own. */
export const SIGN_BOARDS: Readonly<Record<Exclude<SignShape, 'board'>, { board: string; text: string; edge: string }>> = {
  cartouche: { board: SET_CLASSIC.greenDark, text: SET_CLASSIC.cream, edge: SET_CLASSIC.gold },
  pill: { board: SET_DINER.red, text: SET_DINER.cream, edge: SET_DINER.chrome },
  rope: { board: SET_DOCKSIDE.deep, text: SET_DOCKSIDE.white, edge: SET_DOCKSIDE.rope },
  plank: { board: '#6E5236', text: '#FFF4E0', edge: SET_DOCKSIDE.rope },
};

/** The plate a shop wears: the Dockside sign look is a plank whatever the storefront; else the storefront theme's shape; else the plain board. */
export function signShapeOf(facadeSet: string, signSet: string): SignShape {
  if (signSet === 'dockside') return 'plank';
  return FACADE_THEMES[facadeSet]?.sign ?? 'board';
}

// ---------- awnings (awning-*) ----------

export interface AwningLook {
  main: string;
  alt: string;
  piping: string;
}
export const AWNING_LOOKS: Readonly<Record<string, AwningLook>> = {
  classic: { main: SET_CLASSIC.green, alt: SET_CLASSIC.cream, piping: SET_CLASSIC.gold },
  candy: { main: GENERIC.candy, alt: GENERIC.candyAlt, piping: '#E8432E' },
};

// ---------- the crew's aprons (apron-*) ----------

export type ApronPattern = 'plain' | 'check' | 'stripe';
export interface ApronLook {
  bib: string;
  /** The hem band of a plain apron, the squares of a check, the stripes of a stripe. */
  alt: string;
  pattern: ApronPattern;
  strap: string;
}
export const APRONS: Readonly<Record<string, ApronLook>> = {
  classic: { bib: SET_CLASSIC.cream, alt: SET_CLASSIC.green, pattern: 'plain', strap: SET_CLASSIC.gold },
  checkered: { bib: '#FFFFFF', alt: GENERIC.gingham, pattern: 'check', strap: GENERIC.gingham },
  striped: { bib: '#FFFFFF', alt: GENERIC.denim, pattern: 'stripe', strap: GENERIC.denim },
};

// ---------- table cloths (tablecloth-*) ----------

export interface ClothLook {
  cloth: string;
  /** The hem and the squares. */
  alt: string;
  pattern: 'plain' | 'check';
}
export const CLOTHS: Readonly<Record<string, ClothLook>> = {
  diner: { cloth: '#FFFFFF', alt: SET_DINER.tile, pattern: 'check' },
  gingham: { cloth: '#FFFFFF', alt: GENERIC.gingham, pattern: 'check' },
  linen: { cloth: GENERIC.linen, alt: GENERIC.linenEdge, pattern: 'plain' },
};

// ---------- tip jars (tipjar-*) ----------

export type JarShape = 'jar' | 'pot' | 'shake' | 'bottle';
export interface JarLook {
  shape: JarShape;
  body: string;
  lid: string;
  accent: string;
}
export const JARS: Readonly<Record<string, JarLook>> = {
  glass: { shape: 'jar', body: GENERIC.glass, lid: GENERIC.brass, accent: '#E8432E' },
  brass: { shape: 'pot', body: GENERIC.brass, lid: '#8A6A1F', accent: '#F6D47A' },
  diner: { shape: 'shake', body: '#FFFFFF', lid: SET_DINER.chrome, accent: SET_DINER.red },
  dockside: { shape: 'bottle', body: '#9ED3C1', lid: SET_DOCKSIDE.ropeDark, accent: SET_DOCKSIDE.rope },
};

// ---------- door chimes (chime-*) ----------

export type ChimeShape = 'bell' | 'tubes' | 'ship';
export interface ChimeLook {
  shape: ChimeShape;
  metal: string;
  cord: string;
}
export const CHIMES: Readonly<Record<string, ChimeLook>> = {
  bell: { shape: 'bell', metal: GENERIC.brass, cord: GENERIC.wood },
  wind: { shape: 'tubes', metal: '#B9C4CC', cord: GENERIC.wood },
  dockside: { shape: 'ship', metal: SET_DOCKSIDE.brass, cord: SET_DOCKSIDE.rope },
};

// ---------- the menu board (menu-*) ----------

export interface MenuLook {
  board: string;
  frame: string;
  /** The colour of the header line and its underline. */
  head: string;
  headText: string;
  /** The pizza names; the price column; the slice bullets. */
  text: string;
  price: string;
  slice: string;
}
/** The menu board every shop starts with (room.tsx drew these colours before the looks). */
export const PLAIN_MENU: MenuLook = {
  board: '#2F3B33',
  frame: '#8E5A3C',
  head: '#FFC531',
  headText: 'MENU',
  text: '#FFF4E0',
  price: '#FFC531',
  slice: '#FFC531',
};
export const MENUS: Readonly<Record<string, MenuLook>> = {
  classic: {
    board: SET_CLASSIC.cream,
    frame: SET_CLASSIC.gold,
    head: SET_CLASSIC.wine,
    headText: 'Menu',
    text: '#3B1F14',
    price: SET_CLASSIC.green,
    slice: SET_CLASSIC.gold,
  },
  chalkboard: {
    board: GENERIC.chalkBoard,
    frame: GENERIC.wood,
    head: GENERIC.chalk,
    headText: 'MENU',
    text: GENERIC.chalk,
    price: '#FFE08A',
    slice: '#FFE08A',
  },
};

// ---------- the counter (counter-diner) and the sign (sign-dockside) ----------

export interface CounterLook {
  front: string;
  top: string;
  trim: string;
  /** A checker band along the front panel's foot. */
  checker: boolean;
}
export const PLAIN_COUNTER: CounterLook = { front: '#B0653A', top: '#E9DCC8', trim: '#8C4A26', checker: false };
export const COUNTERS: Readonly<Record<string, CounterLook>> = {
  diner: { front: SET_DINER.red, top: SET_DINER.chrome, trim: SET_DINER.chromeDark, checker: true },
};

// ---------- the scooter's paint (scooter-red; the mint one is cosmetics.ts `MINT`) ----------

export interface ScooterPaint {
  body: string;
  dark: string;
}
export const RED_SCOOTER: ScooterPaint = { body: GENERIC.scooterRed, dark: GENERIC.scooterRedDark };

// ---------- the boxes the new props stand in ----------

/** The tip jar's shelf and jar: 16 wide, 17 tall (screen units). */
export const JAR_W = 16;
export const JAR_H = 17;
/** The jar's shelf stands on the counter's front panel, at the counter's far end from the door, 26 up (below the counter top, above most of the pickup bags' shelf). */
export const JAR_SHELF_Z = 26;
const JAR_DEPTH = 64;
/** How far along the panel from its far end the jar stands (room units): between the order spot at that end and the pickup bags' places, where nobody stands. */
const JAR_AT = 27;

/**
 * Where the tip jar stands: on a small bracket shelf on the counter's front panel, at the end of the counter away from the door (the plain plan's left end, the mirrored
 * plan's right). The counter's top is full by design (the register, the second register, the boxes and the piles), the panel's far end is not. `x` is the screen x of the
 * jar's centre, `y` the screen y of the shelf's top; `rect` the whole box.
 */
export function tipJarSpot(lay: Pick<Layout, 'counter' | 'mirrored' | 'frame'>): { x: number; y: number; rect: Rect } {
  const rx = lay.mirrored ? lay.counter.x1 - JAR_AT : lay.counter.x0 + JAR_AT;
  const [x, y] = P(rx, JAR_DEPTH, JAR_SHELF_Z, lay.frame);
  return { x, y, rect: { x0: x - JAR_W / 2, x1: x + JAR_W / 2, y0: y - JAR_H, y1: y + 2 } };
}
export const tipJarRect = (lay: Pick<Layout, 'counter' | 'mirrored' | 'frame'>): Rect => tipJarSpot(lay).rect;

/** The door chime's box: 14 wide, 22 hung under the lintel (header drawn 108 up), left of the doorway's middle. The art is drawn 24 tall and is shown at CHIME_SCALE. */
export const CHIME_W = 14;
export const CHIME_H = 22;
export const CHIME_SCALE = 0.9;
/** The depth it is drawn at: behind everyone in the room (the cast and the furniture are sorted by depth, deepest first), over the room's walls. */
export const CHIME_SORT = 100;
export const CHIME_Z = 108;

/**
 * Where the door chime hangs: from the lintel at the left end of the doorway, above head height (the glazed door leaf folds against the right wall and the OPEN plate is
 * centred). The chime is its own piece of the furniture, sorted behind the cast (the front wall is drawn over the people behind it, and a driver walks through the doorway's
 * height: a chime on the wall would cover heads). `x` is the screen x of its centre in the plan the shop shows (mirrored included), `y` the screen y of its hook.
 */
export function chimeSpot(lay: Layout): { x: number; y: number; rect: Rect } {
  const p = plainOf(lay);
  const [x, y] = P(p.door.x0 + 17, 0, CHIME_Z, p.frame);
  const plain = { x0: x - CHIME_W / 2, x1: x + CHIME_W / 2, y0: y, y1: y + CHIME_H };
  const a = 2 * lay.frame.vanishX;
  return { x: lay.mirrored ? a - x : x, y, rect: lay.mirrored ? flipRect(plain, a) : plain };
}
export const chimeRect = (lay: Layout): Rect => chimeSpot(lay).rect;

// ---------- which looks have art ----------

/** The variants each part draws, by key (a look's variant is its id without the part). The sign and the scooter have one each. S5 adds its sets' rows to these tables. */
const DRAWN: Partial<Record<Part, readonly string[]>> = {
  facade: Object.keys(FACADE_THEMES),
  awning: Object.keys(AWNING_LOOKS),
  apron: Object.keys(APRONS),
  tablecloth: Object.keys(CLOTHS),
  tipjar: Object.keys(JARS),
  chime: Object.keys(CHIMES),
  menu: Object.keys(MENUS),
  counter: Object.keys(COUNTERS),
  sign: ['dockside'],
  scooter: ['red'],
};

/** The variant a catalog look is worn as (`awning-classic` -> 'classic'), or '' for an id that is not a row. */
export function variantOfLook(id: string): string {
  const l = lookOf(id);
  return l && id.startsWith(`${l.part}-`) ? id.slice(l.part.length + 1) : '';
}

/** Does the scene draw this look (as a set piece or a generic look of the v5.24 catalog)? The thumbnails use it to tell a drawn look from one waiting for its art. */
export function hasArt(id: string): boolean {
  const l = lookOf(id);
  return !!l && (DRAWN[l.part] ?? []).includes(variantOfLook(id));
}

/** The catalog rows this module draws: the Downtown, Suburbs and Waterfront sets and every generic look the tables above cover. */
export const S4_LOOKS: readonly string[] = LOOKS.filter((l) => hasArt(l.id) && (l.set === null || ['classic', 'diner', 'dockside'].includes(l.set))).map(
  (l) => l.id,
);
