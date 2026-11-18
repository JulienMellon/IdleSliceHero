// The City screen's map, one drawing per city (D507): the ground tint, the roads, the water, the trees, the middle of town and one landmark. Boston is not
// Port Marinara with new names: the Charles runs across it under the bridges, the harbour bites the other corner, the Common sits where the piazza was and
// Fenway's ballpark fills the open lot. Plain data in the map's 100 by 84 units; pure, so it is unit-tested in node. `city-map.tsx` draws it.
import { C } from '../../theme';

export type MapRoad = readonly [x0: number, y0: number, x1: number, y1: number];

export interface MapArt {
  /** The ground under everything (the map's panel behind it uses the same colour). */
  ground: string;
  roads: readonly MapRoad[];
  /** The sea or bay: a closed shape off the right edge. */
  water: { d: string; rim: string; color: string };
  /** A river drawn before the roads, so a road over it is a bridge; null when the city has none. */
  river: { d: string; color: string } | null;
  trees: readonly (readonly [number, number])[];
  /** What stands in the middle of town. */
  centre: 'piazza' | 'common';
  /** A landmark in the open lot (it gives way to the franchise lot when one is offered). */
  landmark: 'none' | 'ballpark';
}

const HOME_ROADS: readonly MapRoad[] = [
  [-5, 28, 105, 28],
  [-5, 56.5, 105, 56.5],
  [34, -5, 34, 56.5],
  [66, -5, 66, 56.5],
  [51, 56.5, 51, 90],
];
// kept clear of every label card
const HOME_TREES = [
  [2, 40], [42, 34], [60, 33], [44, 48], [58, 48], [93, 36], [96, 44], [3, 70], [9, 82], [48, 72], [57, 80], [38, 4], [6, 60],
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

const BOSTON_ART: MapArt = {
  ground: '#C7D9B2',
  // no street along the river's line: the two avenues and the cross streets run over it as bridges
  roads: HOME_ROADS.filter((r) => r[1] !== 28),
  water: { d: 'M104 50 Q92 54 90 66 Q90 80 92 94 L150 126 L150 50 Z', rim: 'M104 50 Q92 54 90 66 Q90 80 92 94', color: '#6FA9CF' },
  river: { d: 'M-5 30 Q18 35 40 29.5 Q62 24 80 30 Q94 33.5 105 28', color: '#6FA9CF' },
  trees: HOME_TREES.filter(([x, y]) => !(y >= 30 && y <= 36 && x < 70)),
  centre: 'common',
  landmark: 'ballpark',
};

const ARTS: Readonly<Record<string, MapArt>> = { home: HOME_ART, boston: BOSTON_ART };

/** The map drawing for a city id (the home city's when a pack has none of its own). */
export const mapArtFor = (cityId: string): MapArt => ARTS[cityId] ?? HOME_ART;

/** The open lot between the avenues, clear of the centre and the water: the franchise lot stands here, and Boston's ballpark. */
export const OPEN_LOT = { x: 77, y: 40 } as const;
