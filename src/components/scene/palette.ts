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
    walkShirt: (i, lap) => pickAvoid(shirtBase + i * 3 + lap * 5, nShirts, near(i).flatMap((j) => [shirt(j), companionShirt(j)])),
    walkHair: (i, lap) => pickAvoid(hairBase + i * 2 + lap * 5, nHair, near(i).flatMap((j) => [hair(j), companionHair(j)])),
  };
}
