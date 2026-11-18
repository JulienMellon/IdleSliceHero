// The pure half of the city art registry: what the shared art files read as data (shop paint, sky, interiors, signs, the map). No drawing, so the node
// tests can import it (cities/index.ts holds the drawn half and imports React Native's SVG). A city's art is its folder in cities/ plus one line here
// and one in index.ts (docs/PLAN-refactor.md P6).
import { BOSTON_MAP } from './boston/map';
import { BOSTON_SHOP } from './boston/shop';
import type { CityData } from './types';

/** Every registered city's pure art, by its pack id (the id the scenes pass as `city`). */
export const CITY_DATA: Readonly<Record<string, CityData>> = {
  boston: { shop: BOSTON_SHOP, map: BOSTON_MAP },
};
