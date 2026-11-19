// Boston's shop art as data, in one place: how its six pizzerias are painted on the street (D508), the sky and ground behind each, the cut-scene exteriors
// (card T2), the tall pieces the layout tests measure, and the shop-interior rooms. Pure (no drawing) so the tests can import it; the registry (../data.ts)
// hands each part to the shared file that reads it (scene/identity.ts, scene/background.tsx, cutscene/backdrop-art.ts), and skyline.tsx draws the street.
import { shade } from '../../scene/projection';
import type { ShopLook } from '../../scene/identity';
import type { Box, ShopLook as RoomLook } from '../../cutscene/backdrop-art';
import type { CityShopArt } from '../types';

const RED = '#D9443A';

// Boston's six pizzerias (D508): each its own awning, from the neighbourhood's colour (content/cities/boston/data.ts; scene.test.ts checks they agree), not the
// home city's art. Shapes and facades follow the place: North End's brick and scallops, Southie's clapboard, Back Bay's brownstone and dome, Fenway's green wall.
const PAINT = {
  'north-end': {
    facade: 'brick',
    pilaster: '#B4573F',
    seam: '#7A3520',
    plinth: '#7A3520',
    awning: ['#C0504D', '#FFF4E0'],
    piping: null,
    shape: 'scallop',
    band: 'subway',
    floor: '#E7D7BE',
    street: 'newsbox',
  },
  southie: {
    facade: 'clapboard',
    pilaster: '#6F8FB5',
    seam: '#4F6F95',
    plinth: '#3E4A58',
    awning: ['#4F81BD', '#FFF4E0'],
    piping: RED,
    shape: 'straight',
    band: 'shiplap',
    floor: '#CFC6B8',
    street: 'bollard',
  },
  'back-bay': {
    facade: 'brick',
    pilaster: '#7A4A3A',
    seam: '#4F2C22',
    plinth: '#2A1D1A',
    awning: ['#8C6A4A', '#FFF4E0'],
    piping: '#D4A84A',
    shape: 'dome',
    band: 'panelling',
    floor: '#E2D6C4',
    street: 'topiary',
  },
  fenway: {
    facade: 'planks',
    pilaster: '#2F7A4A',
    seam: '#1F4A30',
    plinth: '#1F4A30',
    awning: ['#3E9B62', '#FFF4E0'],
    piping: RED,
    shape: 'box',
    band: 'beadboard',
    floor: '#E8CFA6',
    street: 'bikerack',
  },
  cambridge: {
    facade: 'collegiate',
    pilaster: '#9C5A45',
    seam: '#6E3A2C',
    plinth: '#E8E0CC',
    awning: ['#8E5BB5', '#FFC531'],
    piping: RED,
    shape: 'straight',
    band: 'panelling',
    floor: '#C8A27A',
    street: 'bikerack',
  },
  dorchester: {
    facade: 'clapboard',
    pilaster: '#E8B84A',
    seam: '#B58A2A',
    plinth: '#B9AE9C',
    awning: ['#E0A030', '#FFF4E0'],
    piping: RED,
    shape: 'scallop',
    band: 'beadboard',
    floor: '#E8CFA6',
    street: 'picket',
  },
} satisfies Record<string, ShopLook>;

/**
 * Boston's tall or lettered pieces, art units, for the layout tests: each stays under the caption zone and inside the panel's side insets
 * (x 104 to 296, like the shop signs) so no phone crops or covers it.
 */
export const BOSTON_SIGNS = {
  'north-end-steeple': { x0: 240, y0: -46, x1: 284, y1: 20 },
  'southie-bar-sign': { x0: 112, y0: -46, x1: 196, y1: -12 },
  'fenway-tower-left': { x0: 112, y0: -46, x1: 144, y1: 20 },
  'fenway-tower-right': { x0: 256, y0: -46, x1: 288, y1: 20 },
  'cambridge-lab': { x0: 128, y0: -46, x1: 272, y1: 0 },
} as const satisfies Record<string, Box>;

/**
 * Boston's exteriors, one per neighbourhood: sky, light, a far skyline tint and the near row of buildings ([x0, x1, top, colour]), plus the
 * one signature object each has (a steeple, a bar sign, brownstone stoops, light towers, lab windows, triple-decker porches).
 */
export interface BostonLook {
  sky: [string, string];
  glow: string;
  far: string;
  trim: string;
  glass: string;
  buildings: [number, number, number, string][];
  sig: 'steeple' | 'bar' | 'brownstones' | 'towers' | 'lab' | 'deckers';
}
export const BOSTON_LOOKS: Readonly<Record<string, BostonLook>> = {
  'north-end': {
    sky: ['#B5C8E4', '#F4E2D0'],
    glow: '#FFE6B0',
    far: '#C3B5B0',
    trim: '#5A3426',
    glass: '#F4D58A',
    sig: 'steeple',
    buildings: [
      [-20, 70, 6, '#B4573F'],
      [70, 150, -24, '#C26E4F'],
      [150, 232, -4, '#A94E3A'],
      [232, 336, 16, '#E4D3B8'],
      [336, 420, -8, '#B8644A'],
    ],
  },
  southie: {
    sky: ['#9FB8D0', '#E5EAF0'],
    glow: '#FFDCA0',
    far: '#A7B6C6',
    trim: '#3E4A58',
    glass: '#F4D58A',
    sig: 'bar',
    buildings: [
      [-20, 92, -6, '#6F8FB5'],
      [92, 204, 6, '#8B2F2F'],
      [204, 308, -16, '#D7C7A5'],
      [308, 420, -8, '#7C9C7C'],
    ],
  },
  'back-bay': {
    sky: ['#C9B7D9', '#F6E7DA'],
    glow: '#FFD98A',
    far: '#B9A8B8',
    trim: '#2A1D1A',
    glass: '#F4D58A',
    sig: 'brownstones',
    buildings: [
      [-20, 64, -16, '#7A4A3A'],
      [64, 148, -34, '#8A5642'],
      [148, 232, -20, '#6F4034'],
      [232, 316, -38, '#935E48'],
      [316, 420, -14, '#7A4A3A'],
    ],
  },
  fenway: {
    sky: ['#7EC8E3', '#E9F6E0'],
    glow: '#FFF3B0',
    far: '#9DBFC0',
    trim: '#1F4A30',
    glass: '#F7E08A',
    sig: 'towers',
    buildings: [
      [-20, 100, -10, '#B0593F'],
      [100, 300, 20, '#2F7A4A'],
      [300, 420, -10, '#B0593F'],
    ],
  },
  cambridge: {
    sky: ['#B5C7E0', '#EEF0F5'],
    glow: '#FFF1C2',
    far: '#AEB9C8',
    trim: '#4A2A22',
    glass: '#9FE3E8',
    sig: 'lab',
    buildings: [
      [-20, 110, -30, '#9C5A45'],
      [110, 290, -44, '#B26A52'],
      [290, 420, -20, '#8E5444'],
    ],
  },
  dorchester: {
    sky: ['#F5C98C', '#FCEBD0'],
    glow: '#FFD27A',
    far: '#D2B79A',
    trim: '#4A3426',
    glass: '#BFE3F2',
    sig: 'deckers',
    buildings: [
      [-20, 100, -24, '#E8B84A'],
      [100, 200, -34, '#7BA7C9'],
      [200, 300, -28, '#D78C8C'],
      [300, 420, -22, '#8DB27E'],
    ],
  },
};

/** The street behind each shop: the cut-scenes' palettes (BOSTON_LOOKS), so the shop and its story share a sky. */
const STREET = Object.fromEntries(
  Object.entries(BOSTON_LOOKS).map(([id, l]) => [
    id,
    { sky: [l.sky[0], shade(l.sky[0], 0.5), l.sky[1]] as [string, string, string], ground: '#9CC48A', ground2: '#86B374' },
  ]),
);

/** Shop interiors, one room per neighbourhood. */
const ROOMS: Readonly<Record<string, RoomLook>> = {
  // Boston (card T2). North End: cream plaster, an oxblood band, dark parish oak
  'north-end': {
    wall: ['#E9D2B0', '#F4E4C8'],
    stripe: '#C9A872',
    tile: '#F8F1E4',
    grout: '#DCCDB0',
    band: '#8C2F2F',
    rail: '#6B3A22',
    baseboard: '#4A2A18',
    floor: '#9C6B3E',
    floorLine: '#744A28',
    floorGrain: '#C0905C',
  },
  // Southie: harbour blue clapboard, a pub-green band, dark bar wood
  southie: {
    wall: ['#8FA9C4', '#CBD8E5'],
    stripe: '#6E8CAE',
    tile: '#EEF2F5',
    grout: '#BCC8D3',
    band: '#2E5D3A',
    rail: '#4A3426',
    baseboard: '#33241A',
    floor: '#7B5B3E',
    floorLine: '#563C26',
    floorGrain: '#9D7A58',
  },
  // Back Bay: brownstone walls, a navy band, brass rail, a mahogany floor
  'back-bay': {
    wall: ['#A97C5E', '#D9BFA2'],
    stripe: '#8A5A40',
    tile: '#F3EADB',
    grout: '#D6C5AA',
    band: '#2C3E5C',
    rail: '#CDA64B',
    baseboard: '#3A2A20',
    floor: '#5E3F2A',
    floorLine: '#3F2A1B',
    floorGrain: '#8A6446',
  },
  // Fenway: ballpark green, a red band, a pale ash rail
  fenway: {
    wall: ['#5FA77A', '#CFE8D5'],
    stripe: '#3E8A5C',
    tile: '#F2F7F1',
    grout: '#B9D2BF',
    band: '#C03A2B',
    rail: '#E8E1CC',
    baseboard: '#2F5A3E',
    floor: '#A8845A',
    floorLine: '#7D5E3A',
    floorGrain: '#C9A57A',
  },
  // Cambridge: lab white-blue, a teal band, steel rail, a grey epoxy floor
  cambridge: {
    wall: ['#D8E3E6', '#F2F6F7'],
    stripe: '#A9C0C6',
    tile: '#FFFFFF',
    grout: '#C5D3D6',
    band: '#2A8F9C',
    rail: '#8E9AA3',
    baseboard: '#5C6870',
    floor: '#B9BDBF',
    floorLine: '#8E9396',
    floorGrain: '#D5D8DA',
  },
  // Dorchester: church-hall butter yellow, a spruce band, honey boards
  dorchester: {
    wall: ['#F2D78C', '#FAEBC0'],
    stripe: '#DDB75A',
    tile: '#FFF9EA',
    grout: '#E6D5A8',
    band: '#4F8A6B',
    rail: '#9A6A3A',
    baseboard: '#6A4526',
    floor: '#C79B5F',
    floorLine: '#966E3A',
    floorGrain: '#E3BE82',
  },
};

export const BOSTON_SHOP: CityShopArt = { looks: PAINT, street: STREET, signs: BOSTON_SIGNS, rooms: ROOMS };
