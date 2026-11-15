// The room layout of a shop, from its levels: the same arguments the storefront gives `layout()` (storefront.tsx), so an overlay that draws
// in the room (the seat highlights, the warming rack) stands on the same floor. Cached by arguments, so a frame does not re-plan the room.
import { FOOTPRINTS } from '../../content/tuning';
import { tablesShown, type Shop } from '../../engine/game';
import { layout, type Layout } from '../scene/layout';

const DRIVER_SLOTS = [2, 2, 3, 3, 4] as const;
const cache = new Map<string, Layout>();

export function layoutOfShop(shop: Pick<Shop, 'footprint' | 'ovens' | 'prep' | 'counter' | 'tables' | 'decor' | 'drivers'>): Layout {
  const fp = shop.footprint;
  const ovenCount = Math.min(FOOTPRINTS[fp].ovenSlots, 1 + Math.floor((shop.ovens - 1) / 8));
  const cookCount = Math.min(3, 1 + Math.floor((shop.prep - 1) / 15));
  const staffCount = Math.min(2, 1 + Math.floor((shop.counter - 1) / 15));
  const tables = tablesShown(shop as Shop);
  const plants = shop.decor.plants;
  const key = `${fp}|${ovenCount}|${cookCount}|${staffCount}|${tables}|${plants}`;
  let hit = cache.get(key);
  if (!hit) {
    hit = layout(fp, ovenCount, cookCount, staffCount, tables, DRIVER_SLOTS[fp], plants);
    if (cache.size >= 64) cache.clear();
    cache.set(key, hit);
  }
  return hit;
}
