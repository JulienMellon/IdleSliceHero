// The city art registry: a city's art is its folder here plus one line below (docs/PLAN-refactor.md P6).
// The shared files (cutscene/backdrops, portrait) read cities only through this file and name none of them.
import type { ReactElement } from 'react';

import { BOSTON_BACKDROPS } from './boston/backdrops';
import { BOSTON_PORTRAITS } from './boston/portraits';
import type { CityArt } from './types';

/** Every registered city, by its pack id (the id the scenes pass as `city`). */
export const CITIES: Readonly<Record<string, CityArt>> = {
  boston: { backdrops: BOSTON_BACKDROPS, portraits: BOSTON_PORTRAITS },
};

/** The registered cities in registry order. */
export const CITY_ART: readonly CityArt[] = Object.values(CITIES);

/** The shop-interior window for a neighbourhood a registered city owns, or null. */
export function cityShopWindow(hood: string): ReactElement | null {
  for (const c of CITY_ART) {
    const art = c.backdrops.shopWindow(hood);
    if (art) return art;
  }
  return null;
}

/** The shop-interior shelf object for a neighbourhood a registered city owns, or null. */
export function cityShopObject(hood: string): ReactElement | null {
  for (const c of CITY_ART) {
    const art = c.backdrops.shopObject(hood);
    if (art) return art;
  }
  return null;
}
