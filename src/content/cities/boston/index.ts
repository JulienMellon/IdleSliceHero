// Boston, city 2 (card T2): a second folder like ../home, added to CITIES in ../index.ts. Story: docs/story/BOSTON-SCRIPT.md.
import type { CityDef } from '../types';
import { BOSTON_FIT, BOSTON_LAYERS, CITY_NAME, HEADS, MANAGERS, NEIGHBORHOODS, PERKS } from './data';
import { BOSTON_SCENES } from './scenes';
import { HOME_CITY } from '../home';
import { HEADS as HOME_HEADS } from '../home/data';
import { HOME_NIGHT_OVEN_LINES } from '../home/voice';

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
  // v5.18 behaviour kept while the engine went city-generic (card R1 changes no behaviour). Each line below is a known bug, reported under Needs: in the R1
  // card report with its fix; a later version replaces these with Boston's own values and deletes the CityDef fields.
  // BUG: the rewards read the home takeover scene, which a Boston game never sees, so they never unlock (fix: delete `rewardsScene`; `fit.takeover` is north-end-2).
  rewardsScene: 'downtown-4',
  // BUG: the first shop (North End) gets the hire stack and not the founder's stations on the sidewalk (fix: delete `founderHood`).
  founderHood: null,
  // BUG: the tutorial's last step names the home prep head (fix: delete `tutorialHead`).
  tutorialHead: HOME_HEADS[HOME_CITY.neighbourhoods[0].id].prep,
  // BUG: the night oven speaks of Nonna (fix: write Boston's `nightOvenLines`).
  nightOvenLines: HOME_NIGHT_OVEN_LINES,
  // BUG: the shop-service slice starts with the home city's rows (fix: delete `serviceRows`).
  serviceRows: HOME_CITY.neighbourhoods.map((n) => n.id),
};
