// Who looks like what: the Look shape and the home cast's table. Pure data (no drawing), so the tests can import it; look.ts merges the cities' casts over it.
import type { CharacterId } from '../../content/types';
import type { HairStyle } from '../cutscene/figure-art';
import { MANAGER_LOOKS, type ManagerId, type ManagerItem } from '../scene/looks';

export interface Look {
  skin: string;
  hair: string;
  shirt: string;
  /** Iris colour (stage figures). */
  eye: string;
  hairStyle: HairStyle;
  /** The shade on the side of the back hair away from the light (stage figures); defaults to the hair darkened a little. */
  hairShade?: string;
  hat?: 'captain' | 'hardhat' | 'cap' | 'beret' | 'fedora' | 'purser';
  extra?: 'glasses' | 'mustache' | 'apron' | 'beard' | 'pearls' | 'whistle' | 'tie';
  /** A manager's signature item (scene/looks.ts MANAGER_LOOKS, so the shop badge draws the same one). */
  gear?: ManagerItem;
  /** Todd's trench coat over the shirt. */
  coat?: 'trench';
  /** A mustache drawn on in marker (Mr. Smith). */
  marker?: boolean;
  /** Slicey's foam cheese wedge around the face. */
  foam?: boolean;
}

/** A manager's look: the fixed table's skin, hair, shirt and signature item, plus the eye colour and the hat the table doesn't carry. */
export function managerLook(id: ManagerId, eye: string, hat?: Look['hat']): Look {
  const m = MANAGER_LOOKS[id];
  return { skin: m.skin, hair: m.hair, shirt: m.shirt, eye, hairStyle: m.hairStyle, hat, gear: m.item };
}

/** The Todd family are variants of the MegaSlice rep's bust (same face and build): Mr. Smith in a trench coat and fedora with a marker mustache, Todd in the coat without it. */
const REP: Look = { skin: '#F0C8A8', hair: '#C2A15A', shirt: '#7B2CBF', eye: '#5A3A80', hairStyle: 'slick', extra: 'tie' };
const TRENCH: Look = { ...REP, hair: '#3B2B22', shirt: '#C8A878', eye: '#4A3B2A', extra: undefined, hat: 'fedora', coat: 'trench' };

/** The home cast's looks (the cities add theirs, see cities/). */
export const HOME_LOOKS: Partial<Record<CharacterId, Look>> = {
  'nonna-rosa': { skin: '#F2C9A0', hair: '#E8E4E0', shirt: '#B23A48', eye: '#6B4A2E', hairStyle: 'bun', extra: 'apron' },
  dale: { skin: '#F5D0B0', hair: '#7A4A26', shirt: '#2F80ED', eye: '#3E7CB1', hairStyle: 'short', hat: 'cap', extra: 'whistle' },
  marisol: { skin: '#C98F63', hair: '#F4F1EC', hairShade: '#d9d4cc', shirt: '#1F4E79', eye: '#4A2C1A', hairStyle: 'long', hat: 'captain' },
  priya: { skin: '#B07A52', hair: '#1E1414', shirt: '#9B51E0', eye: '#3A2416', hairStyle: 'long', extra: 'glasses' },
  'big-sal': { skin: '#E8B88E', hair: '#4A3A33', shirt: '#E67E22', eye: '#5A3A22', hairStyle: 'bald', hat: 'hardhat', extra: 'mustache' },
  genevieve: { skin: '#F6DCC8', hair: '#222222', shirt: '#111111', eye: '#2F7A5A', hairStyle: 'bob', hat: 'beret', extra: 'pearls' },
  'victor-crust': { skin: '#E9C4A6', hair: '#1A1A1A', shirt: '#2C2C3A', eye: '#5F87A3', hairStyle: 'slick', extra: 'tie' },
  'megaslice-rep': { skin: '#F0C8A8', hair: '#C2A15A', shirt: '#7B2CBF', eye: '#5A3A80', hairStyle: 'slick', extra: 'tie' },
  // v5.16 (card T1b): Todd's three looks (variants of the rep's bust) and the five General Managers (their look lines, COPY section 6)
  'mr-smith': { ...TRENCH, marker: true },
  'todd-coat': TRENCH,
  slicey: { ...REP, extra: undefined, hairStyle: 'bald', foam: true },
  deb: managerLook('deb', '#4F7F8C'),
  skip: managerLook('skip', '#3F5E7A', 'purser'),
  noor: managerLook('noor', '#3A2416'),
  dee: managerLook('dee', '#3F6B3A'),
  anton: managerLook('anton', '#5F87A3'),
  // Preston is the rep's slick hair in navy, Bea is Nonna's bun in grey, Trish is a bob in MegaSlice purple.
};

/** The home cast's display names (the cities add theirs). */
export const HOME_NAMES: Partial<Record<CharacterId, string>> = {
  'nonna-rosa': 'Nonna Rosa',
  dale: 'Coach Dale',
  marisol: 'Captain Marisol',
  priya: 'Priya',
  'big-sal': 'Big Sal',
  genevieve: 'Genevieve',
  'victor-crust': 'Victor Crust',
  'megaslice-rep': 'MegaSlice Rep',
  'mr-smith': 'Mr. Smith',
  'todd-coat': 'Todd',
  slicey: 'Slicey',
  deb: 'Deb',
  skip: 'Skip',
  noor: 'Noor',
  dee: 'Dee',
  anton: 'Anton',
};

/** Several casts' looks and names as one table each, in the order given (a later cast overrides an earlier one). */
export function mergeLooks(parts: readonly { looks: Partial<Record<CharacterId, Look>>; names: Partial<Record<CharacterId, string>> }[]) {
  const looks: Partial<Record<CharacterId, Look>> = {};
  const names: Partial<Record<CharacterId, string>> = {};
  for (const p of parts) {
    Object.assign(looks, p.looks);
    Object.assign(names, p.names);
  }
  return { looks: looks as Record<CharacterId, Look>, names: names as Record<CharacterId, string> };
}
