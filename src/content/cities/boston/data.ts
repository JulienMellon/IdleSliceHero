// Boston, city 2: its neighbourhoods, perks, heads and managers, and the layer each neighbourhood plays (docs/story/BOSTON-SCRIPT.md, card W3).
// The prices and values come from BOSTON_NUMBERS (./fit.ts: the scaling rule is src/content/franchise.ts, card E3), shop for shop in build order (North End = Downtown ... Dorchester = Uptown).
import type { HeadKind } from '../../tuning';
import type { LayerKind, NeighborhoodDef, PerkDef } from '../types';
import type { NeighborhoodId } from '../../types';
import { BOSTON_NUMBERS } from './fit';

export const CITY_NAME = 'Boston';

/** The six ids, in build order. */
export const BOSTON_IDS = ['north-end', 'southie', 'back-bay', 'fenway', 'cambridge', 'dorchester'] as const;
export type BostonHoodId = (typeof BOSTON_IDS)[number];

const LOOK: Record<BostonHoodId, { name: string; color: string; wall: string }> = {
  'north-end': { name: 'North End', color: '#C0504D', wall: '#EBCFC0' },
  southie: { name: 'Southie', color: '#4F81BD', wall: '#D2E1F1' },
  'back-bay': { name: 'Back Bay', color: '#8C6A4A', wall: '#E8D9C6' },
  fenway: { name: 'Fenway', color: '#3E9B62', wall: '#D0EBD8' },
  cambridge: { name: 'Cambridge', color: '#8E5BB5', wall: '#E7DAF0' },
  dorchester: { name: 'Dorchester', color: '#E0A030', wall: '#F6E4BA' },
};

/** Map positions are the home city's (the same 100x76 layout); every price and the pizza value is the fit's. */
const POSITIONS = [
  [22, 39],
  [30, 67],
  [76, 67],
  [18, 9],
  [50, 9],
  [82, 9],
] as const;
export const NEIGHBORHOODS: NeighborhoodDef[] = BOSTON_IDS.map((id, i) => ({
  ...BOSTON_NUMBERS.hoods[i],
  id,
  x: POSITIONS[i][0],
  y: POSITIONS[i][1],
  ...LOOK[id],
}));

/** The three finale perks (docs/story/BOSTON-SCRIPT.md names them), each for its own shop only and sized like the home city's. */
export const PERKS: Partial<Record<NeighborhoodId, PerkDef>> = {
  'north-end': { who: 'Father Dom', text: 'North End earns 25% more while you’re away (Blessed Ovens)', offlineMult: 1.25 },
  southie: { who: 'Kayla Dunn', text: 'Southie walk-ins pay 15% extra (Kayla’s Regulars)', walkInShare: 1.15 },
  'back-bay': { who: 'Preston', text: 'Each Back Bay decor tier adds 6% to prices (was 4%) (The Whitmore Name)', decorBoost: 0.06 },
  fenway: { who: 'Manny', text: 'Fenway pizzas sell for 10% more (Ballpark Contract)', priceMult: 1.1 },
  cambridge: { who: 'Dr. Ko', text: 'Cambridge driver upgrades cost 10% less (The Perfect Oven)', driversCostMult: 0.9 },
  dorchester: { who: 'Grandma Bea', text: 'Dorchester earns 25% more while you’re away (Sunday Supper)', offlineMult: 1.25 },
};

/** The station heads (docs/story/BOSTON-SCRIPT.md "Station heads"). */
export const HEADS: Record<NeighborhoodId, Record<HeadKind, string>> = {
  'north-end': { prep: 'Sister Agnes', oven: 'Carmine', counter: 'Teresa' },
  southie: { prep: 'Declan', oven: 'Moira', counter: 'Sully' },
  'back-bay': { prep: 'Hollis', oven: 'Juniper', counter: 'Bitsy' },
  fenway: { prep: 'Tito', oven: 'Dot', counter: 'Rocco' },
  cambridge: { prep: 'Dmitri', oven: 'Wren', counter: 'Felix' },
  dorchester: { prep: 'Mrs. Okafor', oven: 'Tommy', counter: 'Bridget' },
};

/** The General Manager of each neighbourhood. The script names none, so each shop's is the neighbourhood's own character (placeholder: a story decision). */
export const MANAGERS: Record<NeighborhoodId, { id: string; name: string; title: 'General Manager' }> = {
  'north-end': { id: 'father-dom', name: 'Father Dom', title: 'General Manager' },
  southie: { id: 'kayla-dunn', name: 'Kayla Dunn', title: 'General Manager' },
  'back-bay': { id: 'preston', name: 'Preston', title: 'General Manager' },
  fenway: { id: 'manny', name: 'Manny', title: 'General Manager' },
  cambridge: { id: 'lena-ko', name: 'Dr. Ko', title: 'General Manager' },
  dorchester: { id: 'grandma-bea', name: 'Grandma Bea', title: 'General Manager' },
};

/** The layer each neighbourhood plays (the table on card W3): the first shop plays none, like Downtown. */
export const BOSTON_LAYERS: Record<BostonHoodId, LayerKind | null> = {
  'north-end': null,
  southie: 'stars',
  'back-bay': 'menu',
  fenway: 'gameDay',
  cambridge: 'shifts',
  dorchester: 'boats',
};
