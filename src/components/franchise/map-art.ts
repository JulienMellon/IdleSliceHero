// The City screen's map, one drawing per city (D507): the ground tint, the roads, the water, the trees, the middle of town and one landmark. Home's is here;
// every other city's is its pack's own (cities/<id>/map.ts, read through cities/data.ts). Plain data in the map's 100 by 84 units; pure, so it is
// unit-tested in node. `city-map.tsx` draws it.
import { C } from '../../theme';
import { CITY_DATA } from '../cities/data';
import type { MapArt, MapRoad } from '../cities/types';

export type { MapArt, MapRoad };

const HOME_ROADS: readonly MapRoad[] = [
  [-5, 28, 105, 28],
  [-5, 56.5, 105, 56.5],
  [34, -5, 34, 56.5],
  [66, -5, 66, 56.5],
  [51, 56.5, 51, 90],
];
// kept clear of every label card
const HOME_TREES = [
  [2, 40],
  [42, 34],
  [60, 33],
  [44, 48],
  [58, 48],
  [93, 36],
  [96, 44],
  [3, 70],
  [9, 82],
  [48, 72],
  [57, 80],
  [38, 4],
  [6, 60],
] as const;

const HOME_ART: MapArt = {
  ground: C.map,
  roads: HOME_ROADS,
  water: { d: 'M100 38 Q86 44 90 57 Q94 72 84 86 L150 126 L150 38 Z', rim: 'M100 38 Q86 44 90 57 Q94 72 84 86', color: C.water },
  river: null,
  trees: HOME_TREES,
  centre: 'piazza',
  landmark: 'none',
};

/** Home's drawing, then each registered city's (cities/<id>/map.ts), which starts from home's streets. */
const ARTS: Readonly<Record<string, MapArt>> = {
  home: HOME_ART,
  ...Object.fromEntries(Object.entries(CITY_DATA).map(([id, c]) => [id, c.map(HOME_ART)])),
};

/** The map drawing for a city id (the home city's when a pack has none of its own). */
export const mapArtFor = (cityId: string): MapArt => ARTS[cityId] ?? HOME_ART;

/** The open lot between the avenues, clear of the centre and the water: the franchise lot stands here, and a city's landmark. */
export const OPEN_LOT = { x: 77, y: 40 } as const;
