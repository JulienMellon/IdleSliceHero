// What each worn cosmetic changes in the scene, and how (v5.15, S1). Pure (no React): id -> palette or small shape variant, plus the
// one place that decides where the neon sign goes. The rules for owning and wearing are in engine/rewards.ts (`grantCosmetic`, `wear`).
// A cosmetic is city-wide: every shop wears the same ones.
//
//   id                      part       changes                                  how
//   oven-gold               oven       every oven                               gold grade paint and a brass band (D417's trim)
//   oven-woodfired          oven       every oven                               wood-fired grade paint, a log pile and a wisp of smoke
//   storefront-skin-{n}     storefront the facade: pilasters, plinth, fascia    SKINS[(n - 1) % SKINS.length]; the sign, OPEN and mat stay
//   scooter-mint            scooter    the drivers' vehicles                    a mint body, whichever fleet tier is parked
//   neon-counter            counter    a neon sign over the register            `neonSpot`: in front of the wall, 44 x 15
//   awning-gold             awning     the awning                               gold and cream stripes; the brand's red stays as the piping
//   plaque-master           plaque     a gold plaque by the door                on the brick header over the door
import type { ShopLook } from './identity';
import type { Layout } from './layout';
import { P } from './projection';
import type { Rect } from './stations';

export type OvenSkin = 0 | 1 | 2;

/** What is worn, as primitives: the furniture memo keys on these (furniture-inputs.ts spreads them into `FurnitureInputs`). */
export interface Dress {
  /** 0 none, 1 oven-gold, 2 oven-woodfired. */
  ovenSkin: OvenSkin;
  awningGold: boolean;
  /** 0 none, else the 1-based index into SKINS. */
  facadeSkin: number;
  scooterMint: boolean;
  neon: boolean;
  plaque: boolean;
}

export const NO_DRESS: Dress = { ovenSkin: 0, awningGold: false, facadeSkin: 0, scooterMint: false, neon: false, plaque: false };

export interface FacadeSkin {
  name: string;
  pilaster: string;
  seam: string;
  plinth: string;
  /** The fascia beam under the sign. */
  fascia: string;
}

/** One skin per cycle number: cycle 1 wears the first, 2 the second, 3 the third, 4 the first again. */
export const SKINS: readonly FacadeSkin[] = [
  { name: 'Harbour teal', pilaster: '#CFE3DD', seam: '#9FBFB6', plinth: '#2F7F78', fascia: '#1F5C57' },
  { name: 'Midnight blue', pilaster: '#34466B', seam: '#222F4C', plinth: '#D4A84A', fascia: '#1B2540' },
  { name: 'Terracotta', pilaster: '#D98A5F', seam: '#B0643C', plinth: '#F2E3C8', fascia: '#7A3B22' },
];

export const AWNING_GOLD = { main: '#E3B52E', alt: '#FFF4E0', piping: '#D9443A' } as const;
export const MINT = { body: '#6FD8B8', dark: '#2FA58A', light: '#C9F5E6' } as const;
export const GOLD_PLAQUE = { face: '#F2C94C', rim: '#9A6B00', text: '#7A5200' } as const;

const SKIN_ID = /^storefront-skin-(\d+)$/;

/** The 1-based skin number a `storefront-skin-N` id wears (0 for any other id). */
export const skinNumber = (id: string): number => {
  const m = SKIN_ID.exec(id);
  return m ? ((Math.max(1, Number(m[1])) - 1) % SKINS.length) + 1 : 0;
};

/** Which things the worn ids dress. Unknown ids dress nothing. */
export function dressOf(worn: readonly string[]): Dress {
  const d: Dress = { ...NO_DRESS };
  for (const id of worn) {
    if (id === 'oven-gold') d.ovenSkin = 1;
    else if (id === 'oven-woodfired') d.ovenSkin = 2;
    else if (id === 'awning-gold') d.awningGold = true;
    else if (id === 'scooter-mint') d.scooterMint = true;
    else if (id === 'neon-counter') d.neon = true;
    else if (id === 'plaque-master') d.plaque = true;
    else if (skinNumber(id)) d.facadeSkin = skinNumber(id);
  }
  return d;
}

/** Whether anything at all is worn (the "nothing worn" shop is the plain one). */
export const isDressed = (d: Dress): boolean => d.ovenSkin !== 0 || d.awningGold || d.facadeSkin !== 0 || d.scooterMint || d.neon || d.plaque;

/** OVEN_GRADES index an oven is painted with: a skin overrides the grade bought (gold = Golden, 4; wood-fired = 2). */
export const ovenPaint = (grade: number, skin: OvenSkin): number => (skin === 1 ? 4 : skin === 2 ? 2 : grade);
/** The gold skin always carries D417's brass trim. */
export const ovenTrim = (tier: 0 | 1 | 2, skin: OvenSkin): 0 | 1 | 2 => (skin === 1 && tier < 1 ? 1 : tier);

/** A neighbourhood's look with the worn skin and awning painted over it (the brand's OPEN sign, WELCOME mat and plank are not in `ShopLook`). */
export function dressedLook(look: ShopLook, d: Pick<Dress, 'facadeSkin' | 'awningGold'>): ShopLook & { fascia: string } {
  const skin = d.facadeSkin ? SKINS[d.facadeSkin - 1] : null;
  return {
    ...look,
    ...(skin ? { pilaster: skin.pilaster, seam: skin.seam, plinth: skin.plinth } : {}),
    ...(d.awningGold ? { awning: [AWNING_GOLD.main, AWNING_GOLD.alt] as [string, string], piping: AWNING_GOLD.piping } : {}),
    fascia: skin ? skin.fascia : '#5E3A26',
  };
}

// ---------- the neon sign ----------

/** The neon sign's size on screen (G99: at least 40 x 14 to read). */
export const NEON_W = 44;
export const NEON_H = 15;
/** Its top edge: under the awning and the badge band (which end at 186), over the cashiers' faces (which start at 297) and the Lv 120 pass belt (287). */
export const NEON_TOP = 270;

/**
 * Where the neon sign hangs: over the register, drawn in FRONT of the wall (the menu board, the window and the wall gear are behind it; G99: it used
 * to sit in the ladder's neon slot and the menu board hid it). Centred on the register, kept inside the walls. `cx` is the screen x of its centre,
 * `rect` its box. It clears the badge band, the doorway and the cashiers' faces (the budget in __tests__/cosmetics.test.ts).
 */
export function neonSpot(lay: Pick<Layout, 'staff' | 'L' | 'R'>): { cx: number; rect: Rect } {
  const lo = P(lay.L + 8, 0)[0] + NEON_W / 2;
  const hi = P(lay.R - 8, 0)[0] - NEON_W / 2;
  const cx = Math.min(hi, Math.max(lo, P(lay.staff[0] + 12, 70)[0]));
  return { cx, rect: { x0: cx - NEON_W / 2, x1: cx + NEON_W / 2, y0: NEON_TOP, y1: NEON_TOP + NEON_H } };
}

// ---------- the plaque ----------

export const PLAQUE_W = 34;
export const PLAQUE_H = 22;
/**
 * The master's plaque by the door (D458): 34 x 22, on the brick header over the doorway's glass, at its left end, 8 over the glass
 * (facade.tsx draws the header from jax = P(door.x0 - 8, 0) to the right pilaster). Under the awning and the badge band, over the PIZZA blade
 * (which hangs at mid-height) and off the glass.
 */
export function plaqueRect(lay: Pick<Layout, 'door'>): Rect {
  const x0 = P(lay.door.x0 - 8, 0)[0] + 3;
  const y1 = P(0, 0, 196)[1] - 8;
  return { x0, x1: x0 + PLAQUE_W, y0: y1 - PLAQUE_H, y1 };
}
