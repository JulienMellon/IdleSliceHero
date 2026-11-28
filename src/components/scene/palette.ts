// Clothing colour allocation for the dining room: concurrent people never share a shirt or hair colour
// with anyone at their own or a neighbouring table. Pure so it is unit-tested.

/** Seat i's regular: shirt base+i, hair base+i; the companion opposite is offset (+4 / +3). */
export interface SeatPalette {
  shirt: (i: number) => number;
  hair: (i: number) => number;
  companionShirt: (i: number) => number;
  companionHair: (i: number) => number;
  /** A walk-in heading for table i on lap `lap`, avoiding the colours at tables i−1..i+1. */
  walkShirt: (i: number, lap: number) => number;
  walkHair: (i: number, lap: number) => number;
}

export const COMPANION_SHIRT_STEP = 4;
export const COMPANION_HAIR_STEP = 3;

/** The first index from `start` (mod m) not in `used`, or `start` if every colour is taken. */
export function pickAvoid(start: number, m: number, used: readonly number[]) {
  for (let k = 0; k < m; k++) {
    const c = (start + k) % m;
    if (!used.includes(c)) return c;
  }
  return start % m;
}

export function seatPalette(shirtBase: number, hairBase: number, nShirts: number, nHair: number, tableCount: number): SeatPalette {
  const shirt = (i: number) => (shirtBase + i) % nShirts;
  const hair = (i: number) => (hairBase + i) % nHair;
  const companionShirt = (i: number) => (shirt(i) + COMPANION_SHIRT_STEP) % nShirts;
  const companionHair = (i: number) => (hair(i) + COMPANION_HAIR_STEP) % nHair;
  const near = (i: number) => [i - 1, i, i + 1].filter((j) => j >= 0 && j < tableCount);
  return {
    shirt,
    hair,
    companionShirt,
    companionHair,
    walkShirt: (i, lap) =>
      pickAvoid(
        shirtBase + i * 3 + lap * 5,
        nShirts,
        near(i).flatMap((j) => [shirt(j), companionShirt(j)]),
      ),
    walkHair: (i, lap) =>
      pickAvoid(
        hairBase + i * 2 + lap * 5,
        nHair,
        near(i).flatMap((j) => [hair(j), companionHair(j)]),
      ),
  };
}

/** The ice the cold line's waiting guests are tinted with (D514). */
export const FROST = '#BFE3F7';
/** `hex` mixed `k` of the way to FROST: a waiting guest's shirt, hair or cap while the line is cold (cast.ts). The same colour back for k = 0. */
export function frostTint(hex: string, k = 0.6): string {
  const a = parseInt(hex.slice(1), 16);
  const b = parseInt(FROST.slice(1), 16);
  const mix = (sh: number) => Math.round(((a >> sh) & 255) * (1 - k) + ((b >> sh) & 255) * k);
  return '#' + [16, 8, 0].map((sh) => mix(sh).toString(16).padStart(2, '0')).join('');
}

// ---------- the looks' colours (v5.24, card S4) ----------
// One entry per set, so a set reads as one family in the shop and on its thumbnails (look-art.ts takes every look's colours from here). The University, Industrial and Uptown sets are the last three (card S5).

/** Downtown's "Classic": cream plaster, deep green and gold, like an old trattoria. */
export const SET_CLASSIC = {
  plaster: '#F1E6CF',
  plasterSeam: '#D2C4A3',
  green: '#2E6B4A',
  greenDark: '#1F4D36',
  cream: '#FFF4E0',
  gold: '#D4A84A',
  wine: '#8E2F3B',
} as const;

/** The Suburbs' "Diner": mint tile, chrome, cherry red and a checker band. */
export const SET_DINER = {
  tile: '#8EE0D3',
  tileSeam: '#5DB9AB',
  chrome: '#C9D1D6',
  chromeDark: '#8F9AA2',
  red: '#D63C3C',
  redDark: '#A82828',
  cream: '#FFF8EC',
  black: '#2A2A33',
} as const;

/** The Waterfront's "Dockside": navy planks, rope, brass and a buoy red. */
export const SET_DOCKSIDE = {
  plank: '#2F5D7C',
  plankSeam: '#1E3F57',
  deep: '#1B3A52',
  rope: '#C9A66B',
  ropeDark: '#8A6A4A',
  white: '#F4F7F8',
  brass: '#D6A93C',
  buoy: '#E8432E',
} as const;

/** The University's "Dorm": ivy-green brick, navy and a pennant gold, like a college hall. */
export const SET_DORM = {
  brick: '#9A4A38',
  brickSeam: '#6E2F26',
  ivy: '#3F7A4E',
  navy: '#26365E',
  navyDark: '#1A2542',
  gold: '#F2C94C',
  cream: '#FFF1D2',
  cork: '#C9975B',
  corkDark: '#8F6A38',
  scooter: '#5B4BA8',
  scooterDark: '#3C2F78',
} as const;

/** The Industrial district's "Brick": soot brick, riveted steel and hazard orange. */
export const SET_BRICK = {
  brick: '#7C3F30',
  brickSeam: '#4F2418',
  steel: '#59626B',
  steelDark: '#343A41',
  steelLight: '#A9B3BB',
  rivet: '#D2D8DC',
  hazard: '#F2A91E',
  leather: '#A9733F',
  leatherDark: '#5E3A1E',
  oven: '#8A3E2C',
} as const;

/** Uptown's "Marble": white stone, black lacquer and gilt. */
export const SET_MARBLE = {
  stone: '#EFEBE3',
  stoneSeam: '#B7B1A6',
  vein: '#6F6B78',
  black: '#26262E',
  gilt: '#D9B24C',
  giltDark: '#8F6F1E',
  ivory: '#F7F2E6',
  wine: '#6E1F3A',
  urn: '#E9E2D3',
} as const;

/** The generic looks: the aprons, cloths and jars every shop can wear. */
export const GENERIC = {
  gingham: '#D9443A',
  denim: '#3F6FB5',
  linen: '#EFE6D2',
  linenEdge: '#C9B993',
  chalk: '#F4F1E6',
  chalkBoard: '#26302B',
  candy: '#F78FB3',
  candyAlt: '#FFFFFF',
  scooterRed: '#E02F2F',
  scooterRedDark: '#8E1B1B',
  glass: '#CFEFF7',
  brass: '#C9962E',
  wood: '#8E5A3C',
} as const;
