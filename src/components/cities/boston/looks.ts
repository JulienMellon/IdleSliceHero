// Boston's cast as data: the looks and names it adds and who ages there. Pure (no drawing) so the tests can import it; portraits.tsx adds the drawing.
import type { CityLooks } from '../types';

export const BOSTON_LOOKS_DATA: CityLooks = {
  looks: {
    'father-dom': { skin: '#EBC09A', hair: '#D9D9D9', shirt: '#1B1B22', eye: '#5A4630', hairStyle: 'bald', extra: 'glasses' },
    'kayla-dunn': { skin: '#F3D2B8', hair: '#B5502A', shirt: '#2F6B4A', eye: '#3F7A52', hairStyle: 'crop' },
    preston: { skin: '#F6DCC8', hair: '#D8C28A', shirt: '#1F2A44', eye: '#4F7DB5', hairStyle: 'slick', extra: 'tie' },
    manny: { skin: '#C98F63', hair: '#2A1A12', shirt: '#2E6B3E', eye: '#4A2C1A', hairStyle: 'short', hat: 'cap', extra: 'mustache' },
    'lena-ko': { skin: '#EBC9A0', hair: '#161616', shirt: '#F2F4F6', eye: '#2A1A12', hairStyle: 'bob', extra: 'glasses' },
    'grandma-bea': { skin: '#F0C8A6', hair: '#C9CED6', shirt: '#4F7FA8', eye: '#4A5F7A', hairStyle: 'bun', extra: 'pearls' },
    'trish-vance': { skin: '#F0C8A8', hair: '#8A3B2A', shirt: '#7B2CBF', eye: '#3F5E3A', hairStyle: 'bob', extra: 'tie' },
  },
  names: {
    'father-dom': 'Father Dom',
    'kayla-dunn': 'Kayla Dunn',
    preston: 'Preston',
    manny: 'Manny',
    'lena-ko': 'Dr. Ko',
    'grandma-bea': 'Grandma Bea',
    'trish-vance': 'Trish Vance',
  },
  /** Time has passed in Boston: Priya leads a team now (her hair up, a deeper purple cardigan) and Nonna has taken to reading glasses. One changed detail each, only in the Boston pack's scenes. */
  aged: { priya: { hairStyle: 'bun', shirt: '#7A3FC0' }, 'nonna-rosa': { extra: 'glasses' } },
};
