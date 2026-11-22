// The home city, Port Marinara, as one CityDef (card K1). A second city is a second folder like this one, added to CITIES in ../index.ts.
import type { CityDef } from '../types';
import { HOME_CAST, HOME_NAMES } from './cast';
import { HOME_CHAPTERS } from './chapters';
import { CITY_NAME, HEADS, HOME_BID, HOME_LAYERS, MANAGERS, NEIGHBORHOODS, PERKS } from './data';
import { HOME_FIT } from './fit';
import { HOME_SCENES } from './scenes';
import { HOME_BARKS, HOME_FOUNDER, HOME_MANAGER_BARKS, HOME_NIGHT_OVEN_LINES, HOME_ORDER_CAST } from './voice';

export const HOME_CITY: CityDef = {
  id: 'home',
  name: CITY_NAME,
  cast: HOME_CAST,
  names: HOME_NAMES,
  neighbourhoods: NEIGHBORHOODS,
  scenes: HOME_SCENES,
  chapters: HOME_CHAPTERS,
  perks: PERKS,
  layers: HOME_LAYERS,
  heads: HEADS,
  managers: MANAGERS,
  // Todd (the megaslice-rep bust and its three variants) is the local lieutenant; Victor Crust is the CEO of all of them.
  lieutenant: { id: 'megaslice-rep', name: 'Todd' },
  bid: HOME_BID,
  barks: HOME_BARKS,
  managerBarks: HOME_MANAGER_BARKS,
  orderCast: HOME_ORDER_CAST,
  nightOvenLines: HOME_NIGHT_OVEN_LINES,
  founder: HOME_FOUNDER,
  theme: 'city_theme',
  fit: HOME_FIT,
};
