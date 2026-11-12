// What each worn cosmetic changes in the scene, and how (v5.15, S1). Pure (no React): id -> palette or small shape variant, plus the
// one place that decides where the neon sign goes. The rules for owning and wearing are in engine/rewards.ts (`grantCosmetic`, `wear`).
// A cosmetic is city-wide: every shop wears the same ones.
//
//   id                      part       changes                                  how
//   oven-gold               oven       every oven                               gold grade paint and a brass band (D417's trim)
//   oven-woodfired          oven       every oven                               wood-fired grade paint, a log pile and a wisp of smoke
//   storefront-skin-{n}     storefront the facade: pilasters, plinth, fascia    SKINS[(n - 1) % SKINS.length]; the sign, OPEN and mat stay
//   scooter-mint            scooter    the drivers' vehicles                    a mint body, whichever fleet tier is parked
//   neon-counter            counter    a neon sign over the counter             `neonSpot`: the back wall's neon slot, none if it does not fit
//   awning-gold             awning     the awning                               gold and cream stripes; the brand's red stays as the piping
//   plaque-master           plaque     a gold plaque by the door                on the right pilaster
import type { NeighborhoodId } from '../../content/types';
import type { ShopLook } from './identity';
import { candidates } from './ladder';
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

/**
 * Where the neon sign hangs: the back wall's neon slot over the counter's right end (ladder.ts places the Lv 100 "ORDER HERE" sign
 * there; the wall above the counter has no other room). The slot is checked by the ladder budget at every footprint, so the sign
 * inherits its clearances: badge band, doorway, menu, window, oven column and every other prop. Worn, the sign takes the slot's
 * place at any level and the Lv 100 sign is not drawn twice. Null when the slot does not fit (the sign is then not drawn).
 */
export function neonSpot(lay: Layout, id: NeighborhoodId): { ax: number; ay: number; k: number; rect: Rect } | null {
  const c = candidates(lay, { id, pins: 12, outside: true }).find((p) => p.id === 'neon');
  return c && c.ok ? { ax: c.ax, ay: c.ay, k: c.k, rect: c.rect } : null;
}

// ---------- the plaque ----------

export const PLAQUE_W = 11;
export const PLAQUE_H = 15;
/** The master's plaque on the right pilaster, 70 up: its screen rect. */
export function plaqueRect(lay: Pick<Layout, 'R'>): Rect {
  const [cx, cy] = P(lay.R - 1, 0, 70);
  return { x0: cx - PLAQUE_W / 2, x1: cx + PLAQUE_W / 2, y0: cy - PLAQUE_H / 2, y1: cy + PLAQUE_H / 2 };
}
