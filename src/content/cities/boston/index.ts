// Boston, city 2 (card T2): a second folder like ../home, added to CITIES in ../index.ts. Story: docs/story/BOSTON-SCRIPT.md.
import type { CityDef } from '../types';
import { BOSTON_CAST, BOSTON_NAMES } from './cast';
import { BOSTON_COPY, BOSTON_TEASER } from './copy';
import { BOSTON_LAYERS, CITY_NAME, HEADS, MANAGERS, NEIGHBORHOODS, PERKS } from './data';
import { BOSTON_FIT } from './fit';
import { BOSTON_SCENES } from './scenes';

export const BOSTON_CITY: CityDef = {
  id: 'boston',
  name: CITY_NAME,
  cast: BOSTON_CAST,
  names: BOSTON_NAMES,
  neighbourhoods: NEIGHBORHOODS,
  scenes: BOSTON_SCENES,
  perks: PERKS,
  layers: BOSTON_LAYERS,
  heads: HEADS,
  managers: MANAGERS,
  // Trish Vance, MegaSlice regional VP: she loses by telling the truth, not by being caught (the Dorchester finale). Victor Crust is still the CEO.
  lieutenant: { id: 'trish-vance', name: 'Trish' },
  teaser: BOSTON_TEASER,
  // no bid: Boston's finale is a challenge win like the other five, there is no Pier 9
  theme: 'city_theme',
  // the lines Boston says in place of the home city's, by the same keys (card R5c; content/copy/index.ts `t` reads them first)
  copy: BOSTON_COPY,
  fit: BOSTON_FIT,
  // Decision (C152): the rewards stay unlocked in a franchised Boston. Franchising keeps `seenScenes`, so the home takeover scene is already seen on tick 1
  // (it is not a bug that they never unlock). Delete this line to gate them on Boston's own takeover (north-end-2) instead; the owner decides.
  rewardsScene: 'downtown-4',
};
