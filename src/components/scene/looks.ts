// Pure character data: roles, seeded looks, palettes and the props a figure takes. No React, so the
// cast builder and its tests can use it in node.

export type Kind = 'cook' | 'baker' | 'staff' | 'driver' | 'guest' | 'sit';

// ---------- characters ----------
// Light comes from the upper left: every figure has a shadow side on the right, a highlight on the left,
// and the same 1.1 ink outline as the furniture. Figures face +x (flip mirrors them).
export const SKINS = ['#F6D3B3', '#EDB98A', '#D69A6A', '#B07446', '#7E4F30'];
export const HAIR_COLORS = ['#2B1A12', '#4A2C1D', '#8E5A3C', '#E3C16F', '#B5462E', '#8F8A86'];
export const PANTS = ['#3B4A6B', '#5C4033', '#2F3140', '#6B7A8F', '#7A5C8E'];
export const GUEST_SHIRTS = ['#F2994A', '#56CCF2', '#BB6BD9', '#6FCF97', '#F2C94C', '#EB6F92', '#3D9970', '#5C6BC0'];

export interface Look { skin: string; hair: string; style: number; trait: number; wide: number; pants: string; shirt: string; tall: number; outfit: number }
/** Integer hash (mulberry32 step) so every look field is independent of the others. */
export function hash32(n: number) {
  let t = (n + 0x6d2b79f5) | 0;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return (t ^ (t >>> 14)) >>> 0;
}
/** Traits: 0 none · 1 glasses · 2 moustache · 3 freckles · 4 hair tuft. Workers always get one. */
export function lookFor(seed: number, worker = false): Look {
  const n = Math.abs(Math.floor(seed));
  const pick = (field: number, m: number) => hash32(n * 131 + field * 7919) % m;
  return {
    skin: SKINS[pick(1, SKINS.length)],
    hair: HAIR_COLORS[pick(2, HAIR_COLORS.length)],
    style: pick(3, 6),
    trait: worker ? 1 + pick(4, 4) : [0, 0, 1, 2, 3][pick(4, 5)],
    wide: pick(5, 3) - 1,
    pants: PANTS[pick(6, PANTS.length)],
    shirt: GUEST_SHIRTS[pick(7, GUEST_SHIRTS.length)],
    tall: pick(8, 5) - 2,
    outfit: pick(9, 6),
  };
}

export type Mood = 'smile' | 'focus' | 'happy' | 'o' | 'chew';
/** What a worker's hands are doing: cooks roll / toss / ladle; bakers hold an empty peel, a pizza, or slide one in. */
export type Act = 'none' | 'pin' | 'toss' | 'ladle' | 'peel' | 'pizza' | 'slide' | 'slice' | 'cup' | 'lean';

/** Props for one chibi figure. Role (`kind`) picks the uniform; look comes from `seed` unless overridden. */
export interface PersonProps {
  x: number;
  y: number;
  kind: Kind;
  seed?: number;
  // look overrides
  shirt?: string;
  hair?: string;
  cap?: string;
  dot?: string;
  gold?: boolean;
  alt?: boolean;
  /** Which cook in the kitchen (0–2): neckerchief colour, and the second wears a skull cap (D306). */
  variant?: number;
  // pose
  act?: Act;
  mood?: Mood;
  arm?: number;
  step?: number;
  flip?: boolean;
  front?: boolean;
  blink?: boolean;
  talk?: boolean;
  /** holding a pizza box; `carryWalk` holds it centred in both hands while walking */
  carry?: boolean;
  carryWalk?: boolean;
  peelK?: number;
  o?: number;
}
