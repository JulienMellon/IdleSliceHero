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
