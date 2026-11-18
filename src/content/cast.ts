// Every character a scene can put on stage, as data (the schema test checks a city's scenes against its `cast`) and as a type (card R7a).
// Each city pack lists its own characters in cities/<id>/cast.ts; a new city adds one import and one line here. The order is each pack's, in
// registry order (the home cast first: those are the returning characters every city may use).
import { BOSTON_CAST } from './cities/boston/cast';
import { HOME_CAST } from './cities/home/cast';

export const CHARACTER_IDS = [...HOME_CAST, ...BOSTON_CAST] as const;
export type CharacterId = (typeof CHARACTER_IDS)[number];
