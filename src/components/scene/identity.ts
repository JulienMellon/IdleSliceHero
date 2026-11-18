// Each neighbourhood's pizzeria look (v5.0, owner request: "make each neighborhood's pizzeria feel a little more
// different"; critic proposal accepted 2026-10-30). Pure data: geometry never changes (layout.ts), only paint.
// Shared brand rules: the "Rosa's" plank, ROSA'S case, OPEN sign, WELCOME mat, PIZZA blade, van and driver
// uniform never change; red #D9443A is the awning's first stripe or its piping everywhere.
import type { NeighborhoodId } from '../../content/types';

export type FacadeKind = 'brick' | 'clapboard' | 'planks' | 'collegiate' | 'steel' | 'tile';
export type AwningShape = 'scallop' | 'straight' | 'box' | 'dome';
export type WallBand = 'subway' | 'beadboard' | 'shiplap' | 'panelling' | 'ducts' | 'none';

export interface ShopLook {
  facade: FacadeKind;
  /** Pilaster base colour, its mortar/seam colour, and the base plinth. */
  pilaster: string;
  seam: string;
  plinth: string;
  /** Awning stripes: main (first) and alternate; piping (a red edge when main isn't red). */
  awning: [string, string];
  piping: string | null;
  shape: AwningShape;
  band: WallBand;
  /** Tier-0 floor (tiers 1–3 stay universal). */
  floor: string;
  /** Sidewalk signature prop by the left pilaster. */
  street: 'newsbox' | 'picket' | 'bollard' | 'bikerack' | 'barrel' | 'topiary';
}

const RED = '#D9443A';
export const LOOKS: Record<NeighborhoodId, ShopLook> = {
  downtown: { facade: 'brick', pilaster: '#A24B2C', seam: '#7A3520', plinth: '#7A3520', awning: [RED, '#FFF4E0'], piping: null, shape: 'scallop', band: 'subway', floor: '#E7D7BE', street: 'newsbox' },
  suburbs: { facade: 'clapboard', pilaster: '#F7F3EA', seam: '#D8CFC0', plinth: '#B9AE9C', awning: [RED, '#BFE8CF'], piping: null, shape: 'straight', band: 'beadboard', floor: '#E8CFA6', street: 'picket' },
  waterfront: { facade: 'planks', pilaster: '#5E8FA8', seam: '#3F6F88', plinth: '#3F6F88', awning: ['#2E5C8A', '#FFF4E0'], piping: RED, shape: 'scallop', band: 'shiplap', floor: '#C99A6B', street: 'bollard' },
  university: { facade: 'collegiate', pilaster: '#9C3B2E', seam: '#6E2A20', plinth: '#E8E0CC', awning: ['#6A2C9A', '#FFC531'], piping: RED, shape: 'straight', band: 'panelling', floor: '#C8A27A', street: 'bikerack' },
  industrial: { facade: 'steel', pilaster: '#5E6670', seam: '#454C55', plinth: '#4A4F54', awning: ['#E8742A', '#3A3A3A'], piping: RED, shape: 'box', band: 'ducts', floor: '#CFC6B8', street: 'barrel' },
  uptown: { facade: 'tile', pilaster: '#1F4D3A', seam: '#163A2B', plinth: '#D4A84A', awning: ['#7B1E3A', '#FFF4E0'], piping: '#D4A84A', shape: 'dome', band: 'none', floor: '#F4F1EC', street: 'topiary' },
};

// Boston's six pizzerias (D508): each its own awning, from the neighbourhood's colour (content/cities/boston/data.ts; scene.test.ts checks they agree), not the
// home city's art. Shapes and facades follow the place: North End's brick and scallops, Southie's clapboard, Back Bay's brownstone and dome, Fenway's green wall.
Object.assign(LOOKS, {
  'north-end': { facade: 'brick', pilaster: '#B4573F', seam: '#7A3520', plinth: '#7A3520', awning: ['#C0504D', '#FFF4E0'], piping: null, shape: 'scallop', band: 'subway', floor: '#E7D7BE', street: 'newsbox' },
  southie: { facade: 'clapboard', pilaster: '#6F8FB5', seam: '#4F6F95', plinth: '#3E4A58', awning: ['#4F81BD', '#FFF4E0'], piping: RED, shape: 'straight', band: 'shiplap', floor: '#CFC6B8', street: 'bollard' },
  'back-bay': { facade: 'brick', pilaster: '#7A4A3A', seam: '#4F2C22', plinth: '#2A1D1A', awning: ['#8C6A4A', '#FFF4E0'], piping: '#D4A84A', shape: 'dome', band: 'panelling', floor: '#E2D6C4', street: 'topiary' },
  fenway: { facade: 'planks', pilaster: '#2F7A4A', seam: '#1F4A30', plinth: '#1F4A30', awning: ['#3E9B62', '#FFF4E0'], piping: RED, shape: 'box', band: 'beadboard', floor: '#E8CFA6', street: 'bikerack' },
  cambridge: { facade: 'collegiate', pilaster: '#9C5A45', seam: '#6E3A2C', plinth: '#E8E0CC', awning: ['#8E5BB5', '#FFC531'], piping: RED, shape: 'straight', band: 'panelling', floor: '#C8A27A', street: 'bikerack' },
  dorchester: { facade: 'clapboard', pilaster: '#E8B84A', seam: '#B58A2A', plinth: '#B9AE9C', awning: ['#E0A030', '#FFF4E0'], piping: RED, shape: 'scallop', band: 'beadboard', floor: '#E8CFA6', street: 'picket' },
} satisfies Record<string, ShopLook>);
