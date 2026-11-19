// Card R6: moving Boston's looks, names and aged rows into cities/boston/ changes nobody's look: the merged tables equal the ones portrait.tsx had before the split.
// The golden values below were taken from the old portrait.tsx (LOOKS, DISPLAY_NAMES, lookFor(id, 'boston') for every CharacterId).
import { BOSTON_LOOKS_DATA } from '../cities/boston/looks';
import { HOME_LOOKS, HOME_NAMES, mergeLooks } from '../portrait/look-data';

const GOLDEN_ORDER = [
  'nonna-rosa',
  'dale',
  'marisol',
  'priya',
  'big-sal',
  'genevieve',
  'victor-crust',
  'megaslice-rep',
  'mr-smith',
  'todd-coat',
  'slicey',
  'deb',
  'skip',
  'noor',
  'dee',
  'anton',
  'father-dom',
  'kayla-dunn',
  'preston',
  'manny',
  'lena-ko',
  'grandma-bea',
  'trish-vance',
];
const GOLDEN_LOOKS = {
  'nonna-rosa': { skin: '#F2C9A0', hair: '#E8E4E0', shirt: '#B23A48', eye: '#6B4A2E', hairStyle: 'bun', extra: 'apron' },
  dale: { skin: '#F5D0B0', hair: '#7A4A26', shirt: '#2F80ED', eye: '#3E7CB1', hairStyle: 'short', hat: 'cap', extra: 'whistle' },
  marisol: { skin: '#C98F63', hair: '#F4F1EC', hairShade: '#d9d4cc', shirt: '#1F4E79', eye: '#4A2C1A', hairStyle: 'long', hat: 'captain' },
  priya: { skin: '#B07A52', hair: '#1E1414', shirt: '#9B51E0', eye: '#3A2416', hairStyle: 'long', extra: 'glasses' },
  'big-sal': { skin: '#E8B88E', hair: '#4A3A33', shirt: '#E67E22', eye: '#5A3A22', hairStyle: 'bald', hat: 'hardhat', extra: 'mustache' },
  genevieve: { skin: '#F6DCC8', hair: '#222222', shirt: '#111111', eye: '#2F7A5A', hairStyle: 'bob', hat: 'beret', extra: 'pearls' },
  'victor-crust': { skin: '#E9C4A6', hair: '#1A1A1A', shirt: '#2C2C3A', eye: '#5F87A3', hairStyle: 'slick', extra: 'tie' },
  'megaslice-rep': { skin: '#F0C8A8', hair: '#C2A15A', shirt: '#7B2CBF', eye: '#5A3A80', hairStyle: 'slick', extra: 'tie' },
  'mr-smith': { skin: '#F0C8A8', hair: '#3B2B22', shirt: '#C8A878', eye: '#4A3B2A', hairStyle: 'slick', hat: 'fedora', coat: 'trench', marker: true },
  'todd-coat': { skin: '#F0C8A8', hair: '#3B2B22', shirt: '#C8A878', eye: '#4A3B2A', hairStyle: 'slick', hat: 'fedora', coat: 'trench' },
  slicey: { skin: '#F0C8A8', hair: '#C2A15A', shirt: '#7B2CBF', eye: '#5A3A80', hairStyle: 'bald', foam: true },
  deb: { skin: '#EDC4A1', hair: '#EBD79A', shirt: '#2A9D8F', eye: '#4F7F8C', hairStyle: 'perm', gear: 'whistle' },
  skip: { skin: '#D2996E', hair: '#F4F1EC', shirt: '#56687C', eye: '#3F5E7A', hairStyle: 'crew', hat: 'purser', gear: 'purser-cap' },
  noor: { skin: '#9C6644', hair: '#1B1414', shirt: '#E3A72F', eye: '#3A2416', hairStyle: 'bun', gear: 'stopwatch' },
  dee: { skin: '#F0C7A4', hair: '#C8442B', shirt: '#D5E04A', eye: '#3F6B3A', hairStyle: 'crop', gear: 'armband' },
  anton: { skin: '#E6C2A4', hair: '#C9CED6', shirt: '#F4F1EC', eye: '#5F87A3', hairStyle: 'slick', gear: 'napkin' },
  'father-dom': { skin: '#EBC09A', hair: '#D9D9D9', shirt: '#1B1B22', eye: '#5A4630', hairStyle: 'bald', extra: 'glasses' },
  'kayla-dunn': { skin: '#F3D2B8', hair: '#B5502A', shirt: '#2F6B4A', eye: '#3F7A52', hairStyle: 'crop' },
  preston: { skin: '#F6DCC8', hair: '#D8C28A', shirt: '#1F2A44', eye: '#4F7DB5', hairStyle: 'slick', extra: 'tie' },
  manny: { skin: '#C98F63', hair: '#2A1A12', shirt: '#2E6B3E', eye: '#4A2C1A', hairStyle: 'short', hat: 'cap', extra: 'mustache' },
  'lena-ko': { skin: '#EBC9A0', hair: '#161616', shirt: '#F2F4F6', eye: '#2A1A12', hairStyle: 'bob', extra: 'glasses' },
  'grandma-bea': { skin: '#F0C8A6', hair: '#C9CED6', shirt: '#4F7FA8', eye: '#4A5F7A', hairStyle: 'bun', extra: 'pearls' },
  'trish-vance': { skin: '#F0C8A8', hair: '#8A3B2A', shirt: '#7B2CBF', eye: '#3F5E3A', hairStyle: 'bob', extra: 'tie' },
};
const GOLDEN_NAMES = {
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
  'father-dom': 'Father Dom',
  'kayla-dunn': 'Kayla Dunn',
  preston: 'Preston',
  manny: 'Manny',
  'lena-ko': 'Dr. Ko',
  'grandma-bea': 'Grandma Bea',
  'trish-vance': 'Trish Vance',
};
const GOLDEN_BOSTON = {
  'nonna-rosa': { skin: '#F2C9A0', hair: '#E8E4E0', shirt: '#B23A48', eye: '#6B4A2E', hairStyle: 'bun', extra: 'glasses' },
  dale: { skin: '#F5D0B0', hair: '#7A4A26', shirt: '#2F80ED', eye: '#3E7CB1', hairStyle: 'short', hat: 'cap', extra: 'whistle' },
  marisol: { skin: '#C98F63', hair: '#F4F1EC', hairShade: '#d9d4cc', shirt: '#1F4E79', eye: '#4A2C1A', hairStyle: 'long', hat: 'captain' },
  priya: { skin: '#B07A52', hair: '#1E1414', shirt: '#7A3FC0', eye: '#3A2416', hairStyle: 'bun', extra: 'glasses' },
  'big-sal': { skin: '#E8B88E', hair: '#4A3A33', shirt: '#E67E22', eye: '#5A3A22', hairStyle: 'bald', hat: 'hardhat', extra: 'mustache' },
  genevieve: { skin: '#F6DCC8', hair: '#222222', shirt: '#111111', eye: '#2F7A5A', hairStyle: 'bob', hat: 'beret', extra: 'pearls' },
  'victor-crust': { skin: '#E9C4A6', hair: '#1A1A1A', shirt: '#2C2C3A', eye: '#5F87A3', hairStyle: 'slick', extra: 'tie' },
  'megaslice-rep': { skin: '#F0C8A8', hair: '#C2A15A', shirt: '#7B2CBF', eye: '#5A3A80', hairStyle: 'slick', extra: 'tie' },
  'mr-smith': { skin: '#F0C8A8', hair: '#3B2B22', shirt: '#C8A878', eye: '#4A3B2A', hairStyle: 'slick', hat: 'fedora', coat: 'trench', marker: true },
  'todd-coat': { skin: '#F0C8A8', hair: '#3B2B22', shirt: '#C8A878', eye: '#4A3B2A', hairStyle: 'slick', hat: 'fedora', coat: 'trench' },
  slicey: { skin: '#F0C8A8', hair: '#C2A15A', shirt: '#7B2CBF', eye: '#5A3A80', hairStyle: 'bald', foam: true },
  deb: { skin: '#EDC4A1', hair: '#EBD79A', shirt: '#2A9D8F', eye: '#4F7F8C', hairStyle: 'perm', gear: 'whistle' },
  skip: { skin: '#D2996E', hair: '#F4F1EC', shirt: '#56687C', eye: '#3F5E7A', hairStyle: 'crew', hat: 'purser', gear: 'purser-cap' },
  noor: { skin: '#9C6644', hair: '#1B1414', shirt: '#E3A72F', eye: '#3A2416', hairStyle: 'bun', gear: 'stopwatch' },
  dee: { skin: '#F0C7A4', hair: '#C8442B', shirt: '#D5E04A', eye: '#3F6B3A', hairStyle: 'crop', gear: 'armband' },
  anton: { skin: '#E6C2A4', hair: '#C9CED6', shirt: '#F4F1EC', eye: '#5F87A3', hairStyle: 'slick', gear: 'napkin' },
  'father-dom': { skin: '#EBC09A', hair: '#D9D9D9', shirt: '#1B1B22', eye: '#5A4630', hairStyle: 'bald', extra: 'glasses' },
  'kayla-dunn': { skin: '#F3D2B8', hair: '#B5502A', shirt: '#2F6B4A', eye: '#3F7A52', hairStyle: 'crop' },
  preston: { skin: '#F6DCC8', hair: '#D8C28A', shirt: '#1F2A44', eye: '#4F7DB5', hairStyle: 'slick', extra: 'tie' },
  manny: { skin: '#C98F63', hair: '#2A1A12', shirt: '#2E6B3E', eye: '#4A2C1A', hairStyle: 'short', hat: 'cap', extra: 'mustache' },
  'lena-ko': { skin: '#EBC9A0', hair: '#161616', shirt: '#F2F4F6', eye: '#2A1A12', hairStyle: 'bob', extra: 'glasses' },
  'grandma-bea': { skin: '#F0C8A6', hair: '#C9CED6', shirt: '#4F7FA8', eye: '#4A5F7A', hairStyle: 'bun', extra: 'pearls' },
  'trish-vance': { skin: '#F0C8A8', hair: '#8A3B2A', shirt: '#7B2CBF', eye: '#3F5E3A', hairStyle: 'bob', extra: 'tie' },
};

const merged = mergeLooks([{ looks: HOME_LOOKS, names: HOME_NAMES }, BOSTON_LOOKS_DATA]);

describe('portrait tables after the per-city split', () => {
  it('lists every character in the same order', () => {
    expect(Object.keys(merged.looks)).toEqual(GOLDEN_ORDER);
    expect(Object.keys(merged.names)).toEqual(GOLDEN_ORDER);
  });

  it('gives every CharacterId the look and display name it had before', () => {
    expect(merged.looks).toEqual(GOLDEN_LOOKS);
    expect(merged.names).toEqual(GOLDEN_NAMES);
  });

  it("gives every CharacterId the same look in Boston's scenes (the aged row)", () => {
    for (const id of GOLDEN_ORDER as (keyof typeof GOLDEN_BOSTON)[]) {
      expect({ ...merged.looks[id], ...BOSTON_LOOKS_DATA.aged[id] }).toEqual(GOLDEN_BOSTON[id]);
    }
  });

  it('keeps Boston out of the home tables', () => {
    for (const id of Object.keys(BOSTON_LOOKS_DATA.looks)) {
      expect(HOME_LOOKS).not.toHaveProperty(id);
      expect(HOME_NAMES).not.toHaveProperty(id);
    }
  });
});
