// Boston's map on the City screen (D507): not Port Marinara with new names. The Charles runs across it under the bridges, the harbour bites the other
// corner, the Common sits where the piazza was and Fenway's ballpark fills the open lot. Plain data in the map's 100 by 84 units; it starts from the home
// map's streets and trees (so a road and a tree still stand where the home map put them) and changes what the river and the harbour need.
import type { MapArt } from '../types';

export const BOSTON_MAP = (home: MapArt): MapArt => ({
  ground: '#C7D9B2',
  // no street along the river's line: the two avenues and the cross streets run over it as bridges
  roads: home.roads.filter((r) => r[1] !== 28),
  water: { d: 'M104 50 Q92 54 90 66 Q90 80 92 94 L150 126 L150 50 Z', rim: 'M104 50 Q92 54 90 66 Q90 80 92 94', color: '#6FA9CF' },
  river: { d: 'M-5 30 Q18 35 40 29.5 Q62 24 80 30 Q94 33.5 105 28', color: '#6FA9CF' },
  trees: home.trees.filter(([x, y]) => !(y >= 30 && y <= 36 && x < 70)),
  centre: 'common',
  landmark: 'ballpark',
});
