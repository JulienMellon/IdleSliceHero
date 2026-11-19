// Every character's look and display name: the home cast's tables with each registered city's cast merged over them (cities/index.ts).
import { CITIES, CITY_ART } from '../cities';
import { HOME_LOOKS, HOME_NAMES, managerLook, mergeLooks, type Look } from './look-data';
import type { CharacterId } from '../../content/types';

export { managerLook, type Look };

const merged = mergeLooks([{ looks: HOME_LOOKS, names: HOME_NAMES }, ...CITY_ART.map((c) => c.portraits)]);

export const LOOKS: Record<CharacterId, Look> = merged.looks;

export const DISPLAY_NAMES: Record<CharacterId, string> = merged.names;

/** Time passes in a city: each city's pack says which characters change and how (one changed detail each, only in that city's scenes), keyed by the city's id. */
export const AGED: Readonly<Record<string, Partial<Record<CharacterId, Partial<Look>>>>> = Object.fromEntries(
  Object.entries(CITIES).map(([id, c]) => [id, c.portraits.aged]),
);

/** A character's look in a city (the home look unless the city's pack ages them). */
export const lookFor = (id: CharacterId, city?: string): Look => {
  const patch = city ? AGED[city]?.[id] : undefined;
  return patch ? { ...LOOKS[id], ...patch } : LOOKS[id];
};
