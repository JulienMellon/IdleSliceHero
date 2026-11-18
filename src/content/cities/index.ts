// Every city the game has (card K1). The engine never imports a city's tables directly: it asks `cityOf(game)`.
import type { NeighborhoodId } from '../types';
import type { CityDef, LayerKind } from './types';
import { HOME_CITY } from './home';
import { BOSTON_CITY } from './boston';

export type { CityDef, CityFit, LayerKind } from './types';

/** The id of the city a new game starts in, and the one an old save (from before cities) belongs to. */
export const HOME_ID = 'home';

export const CITIES: Record<string, CityDef> = { [HOME_CITY.id]: HOME_CITY, [BOSTON_CITY.id]: BOSTON_CITY };

/** The city a game is in: `GameState.city`, falling back to the home city for an id this build does not know. */
export const cityOf = (g: { city?: string }): CityDef => CITIES[g.city ?? HOME_ID] ?? HOME_CITY;

const IDS = new WeakMap<CityDef, readonly NeighborhoodId[]>();
/** The city's neighbourhood ids, in build order (one array per city, so a per-frame loop allocates nothing). */
export function hoodIds(city: CityDef): readonly NeighborhoodId[] {
  let ids = IDS.get(city);
  if (!ids) IDS.set(city, (ids = city.neighbourhoods.map((n) => n.id)));
  return ids;
}

/** The neighbourhood that plays a layer in this city, or null when none does. */
export function layerHood(city: CityDef, kind: LayerKind): NeighborhoodId | null {
  for (const n of city.neighbourhoods) if (city.layers[n.id] === kind) return n.id;
  return null;
}

/** The layer a neighbourhood plays in this city, or null. */
export const layerOf = (city: CityDef, id: NeighborhoodId): LayerKind | null => city.layers[id] ?? null;

/**
 * The home neighbourhood whose shop art (sky, front, room, street prop) draws a shop in `city`: the home city's own for itself, and for another
 * city the home neighbourhood at the same build position, until that city has shop art of its own. Only paint reads it; the game state keeps the real id.
 */
export function sceneHood(city: CityDef, id: NeighborhoodId): NeighborhoodId {
  if (city === HOME_CITY) return id;
  const home = hoodIds(HOME_CITY);
  const at = hoodIds(city).indexOf(id);
  return home[at < 0 ? 0 : Math.min(at, home.length - 1)];
}
