// Boston, city 2 (card T2): a second folder like ../home, added to CITIES in ../index.ts. Story: docs/story/BOSTON-SCRIPT.md.
import type { CityDef } from '../types';
import { BOSTON_FIT, BOSTON_LAYERS, CITY_NAME, HEADS, MANAGERS, NEIGHBORHOODS, PERKS } from './data';
import { BOSTON_SCENES } from './scenes';

export const BOSTON_CITY: CityDef = {
  id: 'boston',
  name: CITY_NAME,
  neighbourhoods: NEIGHBORHOODS,
  scenes: BOSTON_SCENES,
  perks: PERKS,
  layers: BOSTON_LAYERS,
  heads: HEADS,
  managers: MANAGERS,
  // Trish Vance, MegaSlice regional VP: she loses by telling the truth, not by being caught (the Dorchester finale). Victor Crust is still the CEO.
  lieutenant: { id: 'trish-vance', name: 'Trish' },
  // no bid: Boston's finale is a challenge win like the other five, there is no Pier 9
  theme: 'city_theme',
  fit: BOSTON_FIT,
};
