// The one place a shop's room is planned from its levels (v5.19, card R1L). The storefront and every overlay drawn on the room (the jam wrench, the warming rack, the
// night tint, the Game Day seats, the critic at the door) call `shopLayout`, so they stand on the same floor: the same counts from the city's fit, the same floor plan
// (`NeighborhoodDef.plan`, so a mirrored shop is mirrored for all of them), and the same draw space. Pure: unit-tested in node.
import { findHood, type CityDef } from '../../content/cities';
import { mirroredIn } from '../../content/shop-layout';
import { tablesShown, type Shop } from '../../engine/game';
import { layout, type Layout } from './layout';
import { toDrawSpace } from './layout-space';

/** Driver slots drawn at the counter by footprint. */
const DRIVER_SLOTS = [2, 2, 3, 3, 4] as const;

/** What a shop's room needs of its levels. */
export type ShopLevels = Pick<Shop, 'footprint' | 'ovens' | 'prep' | 'counter' | 'tables' | 'decor'>;

export interface ShopLayout {
  /** The room in the frame's own space (the drawing's width: wider than a screen for the two big tiers), already mirrored when the shop's plan is: what the backdrop and the scroll view are laid out from. */
  room: Layout;
  /** The same room in the draw space the drawing code's default `P` expects (`toDrawSpace`): add `drawShift(room.frame)` to a projected x to get the frame's own space. */
  draw: Layout;
}

const cache = new Map<string, ShopLayout>();

/**
 * The room of shop `id` in `city` at these levels. One object per distinct room, so a caller that keys memos on it (the storefront) re-renders only when the room
 * changes, and a frame never re-plans.
 */
export function shopLayout(id: string, shop: ShopLevels, city: CityDef): ShopLayout {
  const fp = shop.footprint;
  const ovenCount = Math.min(city.fit.footprints[fp].ovenSlots, 1 + Math.floor((shop.ovens - 1) / 8));
  const cookCount = Math.min(3, 1 + Math.floor((shop.prep - 1) / 15));
  const staffCount = Math.min(2, 1 + Math.floor((shop.counter - 1) / 15));
  const driverSlots = DRIVER_SLOTS[fp];
  const tables = tablesShown(shop as Shop, city.fit);
  const plants = shop.decor.plants;
  const mirrored = mirroredIn(findHood(id, city));
  const key = `${fp}|${ovenCount}|${cookCount}|${staffCount}|${tables}|${driverSlots}|${plants}|${mirrored ? 'm' : 's'}`;
  let hit = cache.get(key);
  if (!hit) {
    const room = layout(fp, ovenCount, cookCount, staffCount, tables, driverSlots, plants, undefined, mirrored);
    hit = { room, draw: toDrawSpace(room) };
    if (cache.size >= 64) cache.clear();
    cache.set(key, hit);
  }
  return hit;
}
