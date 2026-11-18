// Boston's numbers (card R7a: they were BOSTON_NUMBERS in content/franchise.ts, which now keeps only the scaling rule) and its fit.
import type { CityFit } from '../types';
import { HOME_FIT } from '../home/fit';
import { cityIndex, cityNumbers, type CityNumbers } from '../../franchise';

/** Boston's prices and values: the home city's, scaled by the franchise rule (its place in CITY_ORDER) and moved by `PRICE_FIT`. data.ts builds the neighbourhoods from them. */
export const BOSTON_NUMBERS: CityNumbers = cityNumbers(cityIndex('boston'));

/**
 * Boston's fit: oven grades and footprints are the home city's (they are priced as multiples of the shop's cost multiplier, so they scale by
 * themselves); the fleet and the first shop's heads are the fit's. The takeover scene must be one of Boston's own, so the second shop opens
 * after North End's second beat, at the count that beat plays at.
 */
export const BOSTON_FIT: CityFit = {
  ...HOME_FIT,
  vehicles: HOME_FIT.vehicles.map((v, i) => (i === 0 ? v : { ...v, cost: BOSTON_NUMBERS.vehicleCosts[i - 1] })),
  headCostFirst: BOSTON_NUMBERS.headCostFirst,
  takeover: { sceneId: 'north-end-2', pizzas: 424 },
};
