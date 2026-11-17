import type { Scene } from '../../../types';
import { NORTH_END_SCENES } from './north-end';
import { SOUTHIE_SCENES } from './southie';
import { BACK_BAY_SCENES } from './back-bay';
import { FENWAY_SCENES } from './fenway';
import { CAMBRIDGE_SCENES } from './cambridge';
import { DORCHESTER_SCENES } from './dorchester';

// City 2 story: Boston. The bridge ("boston-0"), 6 x 4 main beats and 7 interludes (docs/story/BOSTON-SCRIPT.md), one file per neighbourhood, in play order.
export const BOSTON_SCENES: Scene[] = [...NORTH_END_SCENES, ...SOUTHIE_SCENES, ...BACK_BAY_SCENES, ...FENWAY_SCENES, ...CAMBRIDGE_SCENES, ...DORCHESTER_SCENES];
